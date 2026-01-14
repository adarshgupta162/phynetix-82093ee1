import { useEffect, useState, useRef } from 'react';
import { LatexRenderer } from '@/components/ui/latex-renderer';
import { AlertCircle } from 'lucide-react';

interface LaTeXPreviewProps {
  content: string;
  className?: string;
  debounceMs?: number;
}

/**
 * LaTeX preview component with debounced rendering
 * Prevents excessive re-renders while typing
 */
export function LaTeXPreview({ content, className = '', debounceMs = 400 }: LaTeXPreviewProps) {
  const [debouncedContent, setDebouncedContent] = useState(content);
  const [hasError, setHasError] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedContent(content);
      setHasError(false);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, debounceMs]);

  if (!debouncedContent) {
    return (
      <div className={`flex items-center justify-center p-8 text-muted-foreground ${className}`}>
        <p className="text-sm">Preview will appear here as you type...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`flex items-center gap-2 p-4 text-destructive ${className}`}>
        <AlertCircle className="w-5 h-5" />
        <div>
          <p className="font-medium">LaTeX Rendering Error</p>
          <p className="text-sm">Please check your LaTeX syntax</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert ${className}`}>
      <LatexRenderer content={debouncedContent} />
    </div>
  );
}
