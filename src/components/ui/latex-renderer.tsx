import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LatexRendererProps {
  content: string;
  className?: string;
  displayMode?: boolean;
}

/**
 * Component to render LaTeX math expressions using KaTeX
 * Supports both inline ($...$) and display ($$...$$) math
 */
export function LatexRenderer({ content, className = '', displayMode = false }: LatexRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    try {
      // Parse and render LaTeX in the content
      const rendered = renderLatexInText(content);
      containerRef.current.innerHTML = rendered;
    } catch (error) {
      console.error('LaTeX rendering error:', error);
      // Fallback to plain text if rendering fails
      containerRef.current.textContent = content;
    }
  }, [content]);

  return <div ref={containerRef} className={className} />;
}

/**
 * Process text to find and render LaTeX expressions
 * Supports:
 * - Display math: $$...$$
 * - Inline math: $...$
 */
function renderLatexInText(text: string): string {
  if (!text) return '';

  let result = text;
  
  // First, handle display math ($$...$$)
  result = result.replace(/\$\$([^\$]+)\$\$/g, (match, latex) => {
    try {
      return katex.renderToString(latex.trim(), {
        displayMode: true,
        throwOnError: false,
        trust: true,
        strict: false,
      });
    } catch (e) {
      console.error('Display math rendering error:', e);
      return match;
    }
  });

  // Then, handle inline math ($...$)
  result = result.replace(/\$([^\$]+)\$/g, (match, latex) => {
    try {
      return katex.renderToString(latex.trim(), {
        displayMode: false,
        throwOnError: false,
        trust: true,
        strict: false,
      });
    } catch (e) {
      console.error('Inline math rendering error:', e);
      return match;
    }
  });

  return result;
}

/**
 * Utility function to render LaTeX string directly (for use in other components)
 */
export function renderLatex(latex: string, displayMode = false): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      trust: true,
      strict: false,
    });
  } catch (e) {
    console.error('LaTeX rendering error:', e);
    return latex;
  }
}
