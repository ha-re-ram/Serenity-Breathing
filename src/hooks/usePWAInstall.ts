import { useState, useEffect, useCallback } from 'react';

export type PWAPlatform =
  | 'ios_safari'
  | 'ios_chrome'
  | 'android_chrome'
  | 'desktop_chrome'
  | 'other';

export interface PWAInstallState {
  isInstalled: boolean;
  canInstall: boolean;
  isIOS: boolean;
  platform: PWAPlatform;
  install: () => Promise<'accepted' | 'dismissed' | 'manual'>;
}

/**
 * Enterprise PWA Installation Hook.
 * Supports early captured beforeinstallprompt events, detects standalone display mode,
 * and identifies exact platform & browser capabilities (iOS Safari, iOS Chrome, Android Chrome, Desktop Chrome).
 */
export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(() => {
    if (typeof window !== 'undefined' && (window as any).__deferredPWAInstallPrompt) {
      return (window as any).__deferredPWAInstallPrompt;
    }
    return null;
  });

  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const isAndroidApp = document.referrer.includes('android-app://');
    return isStandaloneMedia || isIOSStandalone || isAndroidApp;
  });

  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [platform, setPlatform] = useState<PWAPlatform>('other');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect OS & Browser Environment
    const ua = window.navigator.userAgent || '';
    const isAppleDevice =
      /iPad|iPhone|iPod/.test(ua) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);

    setIsIOS(isAppleDevice);

    if (isAppleDevice) {
      if (/CriOS/i.test(ua)) {
        setPlatform('ios_chrome');
      } else {
        setPlatform('ios_safari');
      }
    } else if (/Android/i.test(ua)) {
      setPlatform('android_chrome');
    } else if (/Chrome|Chromium/i.test(ua) && !/Edg/i.test(ua)) {
      setPlatform('desktop_chrome');
    } else {
      setPlatform('other');
    }

    // Check pre-existing prompt captured in index.html head
    if ((window as any).__deferredPWAInstallPrompt && !deferredPrompt) {
      setDeferredPrompt((window as any).__deferredPWAInstallPrompt);
    }

    // Media query change listener for standalone mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setDeferredPrompt(null);
        (window as any).__deferredPWAInstallPrompt = null;
      }
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    // Listen for beforeinstallprompt (Chrome, Edge, Android Chrome, Samsung Internet)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).__deferredPWAInstallPrompt = e;
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      (window as any).__deferredPWAInstallPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredPrompt]);

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'manual'> => {
    // If browser provided the native install prompt, invoke it directly
    const promptEvent = deferredPrompt || (typeof window !== 'undefined' ? (window as any).__deferredPWAInstallPrompt : null);

    if (promptEvent && typeof promptEvent.prompt === 'function') {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          (window as any).__deferredPWAInstallPrompt = null;
          return 'accepted';
        }
        return 'dismissed';
      } catch (err) {
        console.warn('[PWA] Prompt trigger error:', err);
      }
    }

    // Fallback to manual step-by-step instructions modal
    return 'manual';
  }, [deferredPrompt]);

  return {
    isInstalled,
    canInstall: !isInstalled,
    isIOS,
    platform,
    install,
  };
}
