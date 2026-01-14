import { useEffect, useRef, useCallback } from 'react';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  interval?: number; // milliseconds, default 7000 (7 seconds)
  enabled?: boolean;
}

/**
 * Hook for automatic saving with debouncing
 * Saves data at regular intervals if changes are detected
 */
export function useAutoSave<T>({ data, onSave, interval = 7000, enabled = true }: UseAutoSaveOptions<T>) {
  const previousDataRef = useRef<T>(data);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRenderRef = useRef(true);

  const scheduleSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      if (!enabled) return;
      
      // Deep comparison using JSON.stringify is acceptable here because:
      // 1. It only runs once per interval (7 seconds by default)
      // 2. Question objects are relatively small
      // 3. We need to detect nested changes in options/arrays
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
}
