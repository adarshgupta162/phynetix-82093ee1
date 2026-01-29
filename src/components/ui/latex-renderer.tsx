import { useMemo } from 'react';
import 'katex/dist/katex.min.css';
import katex from 'katex';
import { mathjax } from 'mathjax-full/js/mathjax';
import { TeX } from 'mathjax-full/js/input/tex';
import { SVG } from 'mathjax-full/js/output/svg';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages';

interface LatexRendererProps {
  content: string;
  className?: string;
  displayMode?: boolean;
}

// Initialize MathJax with all extensions including mhchem, physics, cancel, etc.
const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

const tex = new TeX({
  packages: AllPackages, // Includes mhchem, physics, cancel, and all other TeX packages
  inlineMath: [['$', '$'], ['\\(', '\\)']],
  displayMath: [['$$', '$$'], ['\\[', '\\]']],
});

const svg = new SVG({ fontCache: 'none' });

const mjDocument = mathjax.document('', { InputJax: tex, OutputJax: svg });

/**
 * Render math expression with MathJax fallback
 */
function renderWithMathJax(mathExpression: string, displayMode: boolean): string {
  try {
    const node = mjDocument.convert(mathExpression, {
      display: displayMode,
    });
    return adaptor.innerHTML(node);
  } catch (error) {
    console.error('MathJax rendering failed:', error);
    throw error;
  }
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
  const renderedContent = useMemo(() => {
    if (!content) return '';
    
    try {
      // Pattern to match all supported math delimiters
      // Order matters: match longer delimiters first
      const mathPattern = /\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]|\$((?:[^$\\]|\\.)+?)\$|\\\(((?:[^\\]|\\(?!\)))+?)\\\)/g;
      
      let lastIndex = 0;
      const parts: string[] = [];
      let match;
      
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
        
        // Fallback to MathJax if KaTeX failed
        if (katexFailed) {
          try {
            const mathjaxSvg = renderWithMathJax(mathContent.trim(), isDisplayMath || displayMode);
            parts.push(mathjaxSvg);
          } catch (mathjaxError) {
            // If both fail, show the original expression in red
            console.error('Both KaTeX and MathJax failed:', mathjaxError);
            parts.push(`<span class="text-red-500">${escapeHtml(match[0])}</span>`);
          }
        }
        
        lastIndex = match.index + match[0].length;
      }
      
      // Add remaining text
      if (lastIndex < content.length) {
        parts.push(escapeHtml(content.slice(lastIndex)));
      }
      
      return parts.join('');
    } catch (error) {
      console.error('LaTeX rendering error:', error);
      return escapeHtml(content);
    }
  }, [content, displayMode]);

  if (!content) return null;

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
