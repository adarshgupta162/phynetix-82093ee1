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
        throw error;
      }
    })();
  }
  
  await mjInitPromise;
  return mjModule;
}

/**
 * Render with MathJax
 */
async function renderWithMathJax(mathExpression: string, displayMode: boolean): Promise<string> {
  const mj = await ensureMathJaxLoaded();
  const node = mj.document.convert(mathExpression, { display: displayMode });
  return mj.adaptor.innerHTML(node);
}

/**
 * Renders text with LaTeX math expressions
 * Uses KaTeX as primary renderer with MathJax as fallback
 * Supports:
 * - Inline math: $...$, \(...\)
 * - Display math: $$...$$, \[...\]
 * - Regular text mixed with math
 * - Chemistry expressions (mhchem)
 * - Common TeX extensions (physics, cancel, etc.)
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
        const failedExpressions: Array<{ content: string; display: boolean; index: number }> = [];
        
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
          let rendered: string;
          let katexFailed = false;
          
          try {
            rendered = katex.renderToString(mathContent.trim(), {
              throwOnError: false, // Don't throw on errors
              displayMode: isDisplayMath || displayMode,
              trust: true, // Allow \url, \href, etc.
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
            const placeholderIndex = parts.length;
            parts.push(`<!--MATHJAX_PLACEHOLDER_${failedExpressions.length}-->`);
            failedExpressions.push({
              content: mathContent.trim(),
              display: isDisplayMath || displayMode,
              index: placeholderIndex,
            });
          }
          
          lastIndex = match.index + match[0].length;
        }
        
        // Add remaining text
        if (lastIndex < content.length) {
          parts.push(escapeHtml(content.slice(lastIndex)));
        }
        
        let result = parts.join('');
        
        // Process failed expressions with MathJax
        if (failedExpressions.length > 0) {
          try {
            for (let i = 0; i < failedExpressions.length; i++) {
              const expr = failedExpressions[i];
              try {
                const mathjaxSvg = await renderWithMathJax(expr.content, expr.display);
                result = result.replace(
                  `<!--MATHJAX_PLACEHOLDER_${i}-->`,
                  mathjaxSvg
                );
              } catch (mathjaxError) {
                // If MathJax also fails, show error
                console.error('Both KaTeX and MathJax failed:', mathjaxError);
                result = result.replace(
                  `<!--MATHJAX_PLACEHOLDER_${i}-->`,
                  `<span class="text-red-500">${escapeHtml(expr.content)}</span>`
                );
              }
            }
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br/>');
}

export default LatexRenderer;
