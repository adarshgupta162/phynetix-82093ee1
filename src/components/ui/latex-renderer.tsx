import { useMemo } from 'react';
import 'katex/dist/katex.min.css';
import katex from 'katex';
// Import mhchem extension for chemistry notation support
import 'katex/dist/contrib/mhchem.mjs';

interface LatexRendererProps {
  content: string;
  className?: string;
  displayMode?: boolean;
}

/**
 * Renders text with LaTeX math expressions and chemistry notation
 * Supports:
 * - Inline math: $...$, \(...\)
 * - Display math: $$...$$, \[...\]
 * - Chemistry notation: \ce{...} for chemical formulas and equations
 * - Physical units: \pu{...} for units with proper formatting
 * - Array environments: for creating tables
 * - Regular text mixed with math
 */
export function LatexRenderer({ content, className = '', displayMode = false }: LatexRendererProps) {
  const renderedContent = useMemo(() => {
    if (!content) return '';
    
    try {
      // Pattern to match display math and inline math with all standard LaTeX delimiters
      // Regex breakdown:
      //   \\\[([\s\S]*?)\\\]  - Matches \[...\] (LaTeX display math, capture group 1)
      //   \$\$([\s\S]*?)\$\$  - Matches $$...$$ (display math, capture group 2)
      //   \\\(([\s\S]*?)\\\)  - Matches \(...\) (LaTeX inline math, capture group 3)
      //   \$((?:[^$\\]|\\.)+?)\$ - Matches $...$ (inline math, capture group 4)
      // Order matters: \[ and \( must be checked before $$, and $$ before $ to prevent mismatches
      const mathPattern = /\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$|\\\(([\s\S]*?)\\\)|\$((?:[^$\\]|\\.)+?)\$/g;
      
      let lastIndex = 0;
      const parts: string[] = [];
      let match;
      
      while ((match = mathPattern.exec(content)) !== null) {
        // Add text before the math expression
        if (match.index > lastIndex) {
          parts.push(escapeHtml(content.slice(lastIndex, match.index)));
        }
        
        // Determine if it's display or inline math
        // match[1] = \[...\], match[2] = $$...$$, match[3] = \(...\), match[4] = $...$
        const isDisplayMath = match[1] !== undefined || match[2] !== undefined;
        const mathContent = match[1] || match[2] || match[3] || match[4];
        
        try {
          const rendered = katex.renderToString(mathContent.trim(), {
            throwOnError: false,
            displayMode: isDisplayMath || displayMode,
            trust: true,
            strict: false,
            // Enable additional macros for better LaTeX support
            macros: {
              "\\ce": "\\ce",  // Chemistry notation (provided by mhchem)
              "\\pu": "\\pu",  // Physical units (provided by mhchem)
            },
          });
          parts.push(rendered);
        } catch (e) {
          // If KaTeX fails, show the original expression
          parts.push(`<span class="text-red-500">${escapeHtml(match[0])}</span>`);
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
