import { useEffect, useRef, useCallback } from 'react';

interface UseAutoSaveOptions {
  data: any;
  onSave: (data: any) => Promise<void>;
  interval?: number; // milliseconds, default 7000 (7 seconds)
  enabled?: boolean;
}

/**
 * Hook for automatic saving with debouncing
 * Saves data at regular intervals if changes are detected
 */
export function useAutoSave({ data, onSave, interval = 7000, enabled = true }: UseAutoSaveOptions) {
  const previousDataRef = useRef<any>(data);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRenderRef = useRef(true);

  const scheduleSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      if (!enabled) return;
      
      // Check if data has actually changed
      const currentData = JSON.stringify(data);
      const previousData = JSON.stringify(previousDataRef.current);
      
      if (currentData !== previousData && !isFirstRenderRef.current) {
        try {
          await onSave(data);
          previousDataRef.current = data;
        } catch (error) {
          console.error('Autosave failed:', error);
        }
      }
    }, interval);
  }, [data, onSave, interval, enabled]);

  useEffect(() => {
    // Skip autosave on first render
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      previousDataRef.current = data;
      return;
    }

    if (enabled) {
      scheduleSave();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, scheduleSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
}
