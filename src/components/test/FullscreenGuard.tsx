import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FullscreenGuardProps {
  children: React.ReactNode;
  maxExits?: number;
  onMaxExitsReached: () => void;
  onExitCountChange?: (count: number) => void;
  initialExitCount?: number;
}

export default function FullscreenGuard({
  children,
  maxExits = 7,
  onMaxExitsReached,
  onExitCountChange,
  initialExitCount = 0
}: FullscreenGuardProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exitCount, setExitCount] = useState(initialExitCount);
  const [showWarning, setShowWarning] = useState(false);

  const enterFullscreen = useCallback(async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).mozRequestFullScreen) {
        await (elem as any).mozRequestFullScreen();
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
      setShowWarning(false);
    } catch (err) {
      console.error('Failed to enter fullscreen:', err);
    }
  }, []);

  const handleFullscreenChange = useCallback(() => {
    const isCurrentlyFullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );

    setIsFullscreen(isCurrentlyFullscreen);

    if (!isCurrentlyFullscreen) {
      const newCount = exitCount + 1;
      setExitCount(newCount);
      onExitCountChange?.(newCount);
      
      if (newCount >= maxExits) {
        onMaxExitsReached();
      } else {
        setShowWarning(true);
      }
    }
  }, [exitCount, maxExits, onMaxExitsReached, onExitCountChange]);

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [handleFullscreenChange]);

  // Auto-enter fullscreen on mount
  useEffect(() => {
    // Small delay to ensure component is mounted
    const timer = setTimeout(() => {
      enterFullscreen();
    }, 500);
    return () => clearTimeout(timer);
  }, [enterFullscreen]);

  return (
    <>
      <div className={`relative ${showWarning ? 'blur-lg pointer-events-none' : ''}`}>
        {children}
      </div>

      {/* Fullscreen Warning Modal */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/95 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 max-w-md w-full text-center"
            >
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>

              <h2 className="text-2xl font-bold font-display mb-2">
                Fullscreen Exit Detected
              </h2>
              <p className="text-muted-foreground mb-4">
                You have exited fullscreen mode. Please return to fullscreen to continue the test.
              </p>

              <div className={`p-4 rounded-lg mb-6 ${
                exitCount >= maxExits - 2 
                  ? 'bg-destructive/20 text-destructive' 
                  : 'bg-[hsl(45,93%,47%)]/20 text-[hsl(45,93%,47%)]'
              }`}>
                <p className="font-semibold">
                  Warning: {exitCount} of {maxExits} exits used
                </p>
                <p className="text-sm mt-1">
                  {maxExits - exitCount} exit{maxExits - exitCount !== 1 ? 's' : ''} remaining before auto-submit
                </p>
              </div>

              <Button
                variant="gradient"
                size="lg"
                className="w-full"
                onClick={enterFullscreen}
              >
                <Maximize className="w-5 h-5 mr-2" />
                Continue in Full Screen
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
