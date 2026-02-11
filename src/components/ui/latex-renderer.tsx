import { useEffect, useState } from 'react';
import 'katex/dist/katex.min.css';
import katex from 'katex';

interface LatexRendererProps {
  content: string;
  className?: string;
  displayMode?: boolean;
}

// MathJax components (lazy loaded)
let mjModule: any = null;
let mjInitPromise: Promise<void> | null = null;

/**
 * Initialize MathJax lazily
 */
async function ensureMathJaxLoaded() {
  if (mjModule) return mjModule;
  
  if (!mjInitPromise) {
    mjInitPromise = (async () => {
      try {
        const [
          { mathjax },
          { TeX },
          { SVG },
          { liteAdaptor },
          { RegisterHTMLHandler },
          { AllPackages }
        ] = await Promise.all([
          import('mathjax-full/js/mathjax'),
          import('mathjax-full/js/input/tex'),
          import('mathjax-full/js/output/svg'),
          import('mathjax-full/js/adaptors/liteAdaptor'),
          import('mathjax-full/js/handlers/html'),
          import('mathjax-full/js/input/tex/AllPackages'),
        ]);
        
        const adaptor = liteAdaptor();
        RegisterHTMLHandler(adaptor);
        
        const tex = new TeX({
          packages: AllPackages,
        });
        
        const svg = new SVG({ fontCache: 'none' });
        const document = mathjax.document('', { InputJax: tex, OutputJax: svg });
        
        mjModule = { document, adaptor };
      } catch (error) {
        console.error('Failed to load MathJax:', error);
        // Reset the promise so future attempts can retry
        mjInitPromise = null;
        throw error;
      }
    })();
  }
  
  await mjInitPromise;
  return mjModule;
}

/**
 * Render with MathJax (fallback for expressions that KaTeX cannot handle)
 * Note: MathJax is lazy-loaded on first use, which may cause a brief delay
 */
async function renderWithMathJax(mathExpression: string, displayMode: boolean): Promise<string> {
  const mathJaxModule = await ensureMathJaxLoaded();
  const node = mathJaxModule.document.convert(mathExpression, { display: displayMode });
  return mathJaxModule.adaptor.innerHTML(node);
}

/**
 * Renders text with LaTeX math expressions
 * Uses KaTeX as primary renderer with MathJax as fallback for complex expressions
 * 
 * Supports:
 * - Inline math: $...$, \(...\)
 * - Display math: $$...$$, \[...\]
 * - Regular text mixed with math
 * - Chemistry expressions (mhchem) via MathJax fallback
 * - Common TeX extensions (physics, cancel, etc.) via MathJax fallback
 * 
 * Performance Notes:
 * - KaTeX renders synchronously and is very fast
 * - MathJax loads lazily on first KaTeX failure and renders asynchronously
 * - Multiple failed expressions are processed in parallel for better performance
 * - The component may show original content briefly while MathJax is loading/rendering
 * 
 * Security Notes:
 * - KaTeX is configured with `trust: true` to support advanced features
 * - Content should come from trusted sources only
 * - Non-math text is HTML-escaped for security
 * 
 * Limitations:
 * - Escaped delimiters (e.g., \$5) may be incorrectly parsed as math
 * - Nested delimiters are not supported
 * - TikZ diagrams are not supported (as specified in requirements)
 */
export function LatexRenderer({ content, className = '', displayMode = false }: LatexRendererProps) {
  const [renderedContent, setRenderedContent] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    if (!content) {
      setRenderedContent('');
      return;
    }
    
    let cancelled = false;
    setIsProcessing(true);
    
    (async () => {
      try {
        // Pattern to match all supported math delimiters
        // Order matters: match longer delimiters first
        const mathPattern = /\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]|\$((?:[^$\\]|\\.)+?)\$|\\\(((?:[^\\]|\\(?!\)))+?)\\\)/g;
        
        let lastIndex = 0;
        const parts: string[] = [];
        let match;
        const failedExpressions: Array<{ content: string; display: boolean }> = [];
        
        while ((match = mathPattern.exec(content)) !== null) {
          // Add text before the math expression
          if (match.index > lastIndex) {
            parts.push(escapeHtml(content.slice(lastIndex, match.index)));
          }
          
          // Determine the math content and display mode
          // match[1]: $$ ... $$
          // match[2]: \[ ... \]
          // match[3]: $ ... $
          // match[4]: \( ... \)
          const mathContent = match[1] || match[2] || match[3] || match[4];
          const isDisplayMath = match[1] !== undefined || match[2] !== undefined;
          
          // Try KaTeX first with permissive settings
          let katexFailed = false;
          
          try {
            const rendered = katex.renderToString(mathContent.trim(), {
              throwOnError: false, // Don't throw on errors
              displayMode: isDisplayMath || displayMode,
              trust: true, // Allow \url, \href, etc. - ensure content is from trusted sources
              strict: false, // Allow non-strict LaTeX
              output: 'html', // Use HTML output
            });
            
            // Check if KaTeX actually failed (it adds error class when throwOnError is false)
            if (rendered.includes('katex-error')) {
              katexFailed = true;
            } else {
              parts.push(rendered);
            }
          } catch (e) {
            katexFailed = true;
          }
          
          // Track failed expressions for MathJax fallback
          if (katexFailed) {
            parts.push(`<!--MATHJAX_PLACEHOLDER_${failedExpressions.length}-->`);
            failedExpressions.push({
              content: mathContent.trim(),
              display: isDisplayMath || displayMode,
            });
          }
          
          lastIndex = match.index + match[0].length;
        }
        
        // Add remaining text
        if (lastIndex < content.length) {
          parts.push(escapeHtml(content.slice(lastIndex)));
        }
        
        let result = parts.join('');
        
        // Process failed expressions with MathJax in parallel for better performance
        if (failedExpressions.length > 0) {
          try {
            const mathjaxResults = await Promise.all(
              failedExpressions.map(async (expr, i) => {
                try {
                  const mathjaxSvg = await renderWithMathJax(expr.content, expr.display);
                  return { index: i, html: mathjaxSvg, success: true };
                } catch (mathjaxError) {
                  console.error('MathJax rendering failed for expression:', expr.content, mathjaxError);
                  return { 
                    index: i, 
                    html: `<span class="text-red-500">${escapeHtml(expr.content)}</span>`,
                    success: false 
                  };
                }
              })
            );
            
            // Replace all placeholders with rendered content
            mathjaxResults.forEach(({ index, html }) => {
              result = result.replace(`<!--MATHJAX_PLACEHOLDER_${index}-->`, html);
            });
          } catch (error) {
            console.error('MathJax fallback error:', error);
          }
        }
        
        if (!cancelled) {
          setRenderedContent(result);
          setIsProcessing(false);
        }
      } catch (error) {
        console.error('LaTeX rendering error:', error);
        if (!cancelled) {
          setRenderedContent(escapeHtml(content));
          setIsProcessing(false);
        }
      }
    })();
    
    return () => {
      cancelled = true;
    };
  }, [content, displayMode]);

  if (!content) return null;
  
  if (isProcessing && !renderedContent) {
    return <span className={className}>{content}</span>;
  }

  return (
    <span 
      className={className}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
}

/**
 * Process common text-mode LaTeX commands and convert them to HTML
 */
function processTextCommands(text: string): string {
  // Helper function to match balanced braces - returns content inside braces and end position
  function matchBraces(str: string, startIndex: number): { content: string; endPos: number } {
    let depth = 1; // Start at 1 since we're already past the opening brace
    let content = '';
    
    for (let i = startIndex; i < str.length; i++) {
      const char = str[i];
      
      if (char === '\\' && i + 1 < str.length) {
        // Skip escaped characters
        content += char + str[i + 1];
        i++;
      } else if (char === '{') {
        depth++;
        content += char;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          return { content, endPos: i };
        }
        content += char;
      } else {
        content += char;
      }
    }
    
    // If we get here, braces weren't balanced
    return { content, endPos: str.length - 1 };
  }

  // Process \twocolumn{col1}{col2} for side-by-side columns FIRST
  let result = text;
  let twocolIndex = result.indexOf('\\twocolumn{');
  while (twocolIndex !== -1) {
    const col1Start = twocolIndex + '\\twocolumn{'.length;
    const { content: col1Content, endPos: col1End } = matchBraces(result, col1Start);
    
    // After col1's closing brace, we should have another opening brace for col2
    const col2Start = col1End + 2; // +1 for the '}' and +1 for the '{'
    
    if (result[col1End + 1] === '{') {
      const { content: col2Content, endPos: col2End } = matchBraces(result, col2Start);
      
      const columnsHtml = `<div class="grid grid-cols-2 gap-4 my-4"><div class="border-r pr-4">${col1Content}</div><div class="pl-4">${col2Content}</div></div>`;
      
      const beforeTwoCol = result.slice(0, twocolIndex);
      const afterTwoCol = result.slice(col2End + 1);
      result = beforeTwoCol + columnsHtml + afterTwoCol;
    } else {
      // Malformed \twocolumn, skip it
      twocolIndex = result.indexOf('\\twocolumn{', twocolIndex + 1);
      continue;
    }
    
    twocolIndex = result.indexOf('\\twocolumn{');
  }

  // Process \textbf{} and other text formatting commands with proper brace matching
  const commands = [
    { pattern: '\\textbf{', tag: 'strong' },
    { pattern: '\\textit{', tag: 'em' },
    { pattern: '\\underline{', tag: 'u' },
    { pattern: '\\texttt{', tag: 'code' }
  ];

  commands.forEach(({ pattern, tag }) => {
    let newResult = '';
    let lastIndex = 0;
    let index = result.indexOf(pattern);
    
    while (index !== -1) {
      newResult += result.slice(lastIndex, index);
      const contentStart = index + pattern.length;
      const { content, endPos } = matchBraces(result, contentStart);
      newResult += `<${tag}>${content}</${tag}>`;
      lastIndex = endPos + 1; // +1 to move past the closing brace
      index = result.indexOf(pattern, lastIndex);
    }
    
    newResult += result.slice(lastIndex);
    result = newResult;
  });

  // Line breaks and spacing
  result = result
    .replace(/\\bigskip/g, '<br/><br/>')
    .replace(/\\medskip/g, '<br/>')
    .replace(/\\smallskip/g, '<br/>')
    .replace(/\\\\/g, '<br/>')
    .replace(/\\newline/g, '<br/>')
    // Escaped special characters
    .replace(/\\&/g, '&amp;')
    .replace(/\\%/g, '%')
    .replace(/\\#/g, '#')
    .replace(/\\\$/g, '$')
    // Quad spacing (approximate with spaces)
    .replace(/\\quad/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
    .replace(/\\qquad/g, '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
    
  return result;
}

function escapeHtml(text: string): string {
  // First process text-mode LaTeX commands
  const processed = processTextCommands(text);
  
  // Then escape remaining HTML entities, but preserve the HTML tags we created
  return processed
    .replace(/&(?!(amp;|nbsp;|lt;|gt;|quot;|#039;))/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br/>')
    // Restore the HTML tags we want to keep
    .replace(/&lt;strong&gt;/g, '<strong>')
    .replace(/&lt;\/strong&gt;/g, '</strong>')
    .replace(/&lt;em&gt;/g, '<em>')
    .replace(/&lt;\/em&gt;/g, '</em>')
    .replace(/&lt;u&gt;/g, '<u>')
    .replace(/&lt;\/u&gt;/g, '</u>')
    .replace(/&lt;code&gt;/g, '<code>')
    .replace(/&lt;\/code&gt;/g, '</code>')
    .replace(/&lt;br\/&gt;/g, '<br/>')
    // Restore div and grid classes for column layouts
    .replace(/&lt;div class=&quot;grid grid-cols-2 gap-4 my-4&quot;&gt;/g, '<div class="grid grid-cols-2 gap-4 my-4">')
    .replace(/&lt;div class=&quot;border-r pr-4&quot;&gt;/g, '<div class="border-r pr-4">')
    .replace(/&lt;div class=&quot;pl-4&quot;&gt;/g, '<div class="pl-4">')
    .replace(/&lt;\/div&gt;/g, '</div>');
}

export default LatexRenderer;
