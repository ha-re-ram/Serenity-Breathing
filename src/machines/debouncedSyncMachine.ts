import { useReducer, useRef, useCallback, useEffect } from 'react';

export type SyncStatus = 'idle' | 'debouncing' | 'saving' | 'error';

export interface DebouncedSyncState<T> {
  value: T;
  status: SyncStatus;
  errorMessage: string | null;
}

export type DebouncedSyncEvent<T> =
  | { type: 'CHANGE'; value: T }
  | { type: 'SAVE_START' }
  | { type: 'SAVE_SUCCESS'; value: T }
  | { type: 'SAVE_ERROR'; error: string }
  | { type: 'RESET'; value: T };

export function debouncedSyncReducer<T>(
  state: DebouncedSyncState<T>,
  event: DebouncedSyncEvent<T>
): DebouncedSyncState<T> {
  switch (event.type) {
    case 'CHANGE':
      return {
        ...state,
        value: event.value,
        status: 'debouncing',
        errorMessage: null,
      };
    case 'SAVE_START':
      return {
        ...state,
        status: 'saving',
        errorMessage: null,
      };
    case 'SAVE_SUCCESS':
      return {
        ...state,
        value: event.value,
        status: 'idle',
        errorMessage: null,
      };
    case 'SAVE_ERROR':
      return {
        ...state,
        status: 'error',
        errorMessage: event.error,
      };
    case 'RESET':
      return {
        value: event.value,
        status: 'idle',
        errorMessage: null,
      };
    default:
      return state;
  }
}

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

  const [state, dispatch] = useReducer(debouncedSyncReducer<T>, {
    value: initialValue,
    status: 'idle',
    errorMessage: null,
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestValueRef = useRef<T>(initialValue);
  latestValueRef.current = state.value;

  // Sync external changes when initialValue changes externally and not dirty
  useEffect(() => {
    if (state.status === 'idle') {
      dispatch({ type: 'RESET', value: initialValue });
      latestValueRef.current = initialValue;
    }
  }, [initialValue, state.status]);

  const updateValue = useCallback(
    (updater: T | ((prev: T) => T)) => {
      const nextValue = typeof updater === 'function' ? (updater as (prev: T) => T)(latestValueRef.current) : updater;
      latestValueRef.current = nextValue;
      dispatch({ type: 'CHANGE', value: nextValue });

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(async () => {
        dispatch({ type: 'SAVE_START' });
        try {
          await onSave(latestValueRef.current);
          dispatch({ type: 'SAVE_SUCCESS', value: latestValueRef.current });
          onSuccess?.();
        } catch (err: any) {
          const errMsg = err?.message || 'Failed to save changes';
          dispatch({ type: 'SAVE_ERROR', error: errMsg });
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
    if (state.status === 'debouncing') {
      dispatch({ type: 'SAVE_START' });
      try {
        await onSave(latestValueRef.current);
        dispatch({ type: 'SAVE_SUCCESS', value: latestValueRef.current });
        onSuccess?.();
      } catch (err: any) {
        const errMsg = err?.message || 'Failed to save changes';
        dispatch({ type: 'SAVE_ERROR', error: errMsg });
        onError?.(err);
      }
    }
  }, [state.status, onSave, onError, onSuccess]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    value: state.value,
    status: state.status,
    errorMessage: state.errorMessage,
    isIdle: state.status === 'idle',
    isDebouncing: state.status === 'debouncing',
    isSaving: state.status === 'saving',
    isError: state.status === 'error',
    isDirty: state.status === 'debouncing' || state.status === 'saving',
    updateValue,
    flush,
  };
}
