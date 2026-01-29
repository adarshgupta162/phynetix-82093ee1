import { useMemo } from 'react';
import 'katex/dist/katex.min.css';
import katex from 'katex';

interface LatexRendererProps {
  content: string;
  className?: string;
  displayMode?: boolean;
}

/**
 * Renders text with LaTeX math expressions
 * Supports:
 * - Inline math: $...$
 * - Display math: $$...$$
 * - Regular text mixed with math
 */
export function LatexRenderer({ content, className = '', displayMode = false }: LatexRendererProps) {
  const renderedContent = useMemo(() => {
    if (!content) return '';
    
    try {
      // Pattern to match display math ($$...$$) and inline math ($...$)
      const mathPattern = /\$\$([\s\S]*?)\$\$|\$((?:[^$\\]|\\.)+?)\$/g;
      
      let lastIndex = 0;
      const parts: string[] = [];
      let match;
      
      while ((match = mathPattern.exec(content)) !== null) {
        // Add text before the math expression
        if (match.index > lastIndex) {
          parts.push(escapeHtml(content.slice(lastIndex, match.index)));
        }
        
        // Determine if it's display or inline math
        const isDisplayMath = match[1] !== undefined;
        const mathContent = isDisplayMath ? match[1] : match[2];
        
        try {
          const rendered = katex.renderToString(mathContent.trim(), {
            throwOnError: false,
            displayMode: isDisplayMath || displayMode,
            trust: true,
            strict: false,
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
