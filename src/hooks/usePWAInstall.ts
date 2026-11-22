import { useState, useEffect, useCallback } from 'react';

export interface PWAInstallState {
  isInstalled: boolean;
  canInstall: boolean;
  isIOS: boolean;
  install: () => Promise<'accepted' | 'dismissed' | 'manual'>;
}

/**
 * Enterprise PWA Installation Hook.
 * Listens for the browser `beforeinstallprompt` event and detects standalone mode.
 * Automatically hides when the app is installed or running in standalone mode.
 */
export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const isAndroidApp = document.referrer.includes('android-app://');
    return isStandaloneMedia || isIOSStandalone || isAndroidApp;
  });

  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect iOS
    const userAgent = window.navigator.userAgent || '';
    const isAppleDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isAppleDevice);

    // Check standalone display-mode media query changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    // Listen for beforeinstallprompt (Chrome, Edge, Android Chrome, Samsung Internet)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'manual'> => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice && choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return 'accepted';
      }
      return 'dismissed';
    }

    // Manual install (e.g. iOS Safari)
    return 'manual';
  }, [deferredPrompt]);

  return {
    isInstalled,
    canInstall: !isInstalled && (!!deferredPrompt || isIOS),
    isIOS,
    install,
  };
}
