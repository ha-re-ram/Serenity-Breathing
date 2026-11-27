/**
 * Screen Wake Lock API hook.
 * Keeps the screen awake during active breathwork sessions on mobile devices and laptops,
 * preventing screen timeout, audio interruption, and sleep mode.
 */
import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseWakeLockReturn {
  isLocked: boolean;
  isSupported: boolean;
  requestLock: () => Promise<boolean>;
  releaseLock: () => Promise<void>;
}

export function useWakeLock(enabled: boolean = false): UseWakeLockReturn {
  const [isLocked, setIsLocked] = useState(false);
  const wakeLockRef = useRef<any>(null);

  const isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

  const releaseLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch (err) {
        console.warn('[WakeLock] Release error:', err);
      } finally {
        wakeLockRef.current = null;
        setIsLocked(false);
      }
    }
  }, []);

  const requestLock = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      return false;
    }

    // Do not request if document is hidden
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      return false;
    }

    try {
      if (!wakeLockRef.current) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        setIsLocked(true);

        wakeLockRef.current.addEventListener('release', () => {
          setIsLocked(false);
          wakeLockRef.current = null;
        });
      }
      return true;
    } catch (err: any) {
      // Wake lock can fail if battery saver is on or device policy prohibits it
      console.warn('[WakeLock] Request failed:', err?.message || err);
      setIsLocked(false);
      return false;
    }
  }, [isSupported]);

  useEffect(() => {
    if (!enabled) {
      releaseLock();
      return;
    }

    requestLock();

    // Re-acquire wake lock if tab visibility changes (e.g. app switcher or unlock)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseLock();
    };
  }, [enabled, requestLock, releaseLock]);

  return {
    isLocked,
    isSupported,
    requestLock,
    releaseLock,
  };
}
