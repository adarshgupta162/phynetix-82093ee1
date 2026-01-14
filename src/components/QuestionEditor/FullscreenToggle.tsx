import { useEffect } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FullscreenToggleProps {
  isFullscreen: boolean;
  onToggle: (fullscreen: boolean) => void;
}

/**
 * Fullscreen toggle button with ESC key support
 */
export function FullscreenToggle({ isFullscreen, onToggle }: FullscreenToggleProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        onToggle(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onToggle]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onToggle(!isFullscreen)}
      title={isFullscreen ? 'Exit Fullscreen (ESC)' : 'Enter Fullscreen'}
    >
      {isFullscreen ? (
        <>
          <Minimize className="w-4 h-4 mr-1" />
          Exit Fullscreen
        </>
      ) : (
        <>
          <Maximize className="w-4 h-4 mr-1" />
          Fullscreen
        </>
      )}
    </Button>
  );
}
