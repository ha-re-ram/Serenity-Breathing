import { useState, useRef, useCallback, useEffect } from 'react';

export type SyncStatus = 'idle' | 'debouncing' | 'saving' | 'error';

export interface UseDebouncedSyncOptions<T> {
  delayMs?: number;
  onSave: (value: T) => Promise<void>;
  onError?: (error: unknown) => void;
  onSuccess?: () => void;
}

/**
 * State machine hook for optimistic local changes with debounced remote persistence.
 * Elevates DX & AX with explicit synchronization states ('idle' | 'debouncing' | 'saving' | 'error').
 */
export function useDebouncedSync<T>(initialValue: T, options: UseDebouncedSyncOptions<T>) {
  const { delayMs = 800, onSave, onError, onSuccess } = options;

  const [value, setValueState] = useState<T>(initialValue);
  const [status, setStatus] = useState<SyncStatus>('idle');

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestValueRef = useRef<T>(initialValue);
  latestValueRef.current = value;

  // Sync external changes when initialValue changes externally and not dirty
  useEffect(() => {
    if (status === 'idle') {
      setValueState(initialValue);
      latestValueRef.current = initialValue;
    }
  }, [initialValue, status]);

  const updateValue = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setValueState((prev) => {
        const nextValue = typeof updater === 'function' ? (updater as (prev: T) => T)(prev) : updater;
        latestValueRef.current = nextValue;
        return nextValue;
      });

      setStatus('debouncing');

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(async () => {
        setStatus('saving');
        try {
          await onSave(latestValueRef.current);
          setStatus('idle');
          onSuccess?.();
        } catch (err) {
          setStatus('error');
          onError?.(err);
        }
      }, delayMs);
    },
    [delayMs, onSave, onError, onSuccess]
  );

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (status === 'debouncing') {
      setStatus('saving');
      try {
        await onSave(latestValueRef.current);
        setStatus('idle');
        onSuccess?.();
      } catch (err) {
        setStatus('error');
        onError?.(err);
      }
    }
  }, [status, onSave, onError, onSuccess]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    value,
    status,
    isDirty: status === 'debouncing' || status === 'saving',
    updateValue,
    flush,
  };
}

