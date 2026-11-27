/**
 * Professional Notification & Daily Reminder Manager for Serenity Breathing.
 * Handles permission requests, Service Worker push/local notifications, audio chimes,
 * and background interval checking with duplicate suppression.
 */
import { audioEngine } from '../services/audioEngine';

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

const LAST_REMINDER_DATE_KEY = 'serenity_last_reminder_notified_date';

/**
 * Checks current notification permission without prompting.
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionState;
}

/**
 * Requests browser notification permission. Must be called from a user gesture.
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermissionState;
  } catch (err) {
    console.warn('[ReminderManager] Permission request error:', err);
    return Notification.permission as NotificationPermissionState;
  }
}

export interface SendNotificationOptions {
  body: string;
  tag?: string;
  requireInteraction?: boolean;
}

/**
 * Sends a notification using Service Worker registration if available, or native Notification API.
 */
export async function sendNotification(title: string, options: SendNotificationOptions): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  const notificationOptions: NotificationOptions = {
    body: options.body,
    icon: '/icon.png',
    badge: '/icon.png',
    tag: options.tag || 'serenity-daily-reminder',
    renotify: true,
    requireInteraction: options.requireInteraction ?? true,
    vibrate: [200, 100, 200, 100, 300] as unknown as number[],
  } as NotificationOptions;

  try {
    // Prefer Service Worker registration showNotification for background support and PWA action
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && 'showNotification' in registration) {
        await registration.showNotification(title, notificationOptions);
        return true;
      }
    }

    // Fallback to Window Notification API
    new Notification(title, notificationOptions);
    return true;
  } catch (err) {
    console.warn('[ReminderManager] Failed to show notification:', err);
    return false;
  }
}

/**
 * Triggers a test notification to verify audio and visual alert delivery.
 */
export async function testReminderNotification(): Promise<{
  success: boolean;
  permission: NotificationPermissionState;
  message: string;
}> {
  let permission = getNotificationPermission();

  if (permission === 'unsupported') {
    return {
      success: false,
      permission,
      message: 'Notifications are not supported in this browser.',
    };
  }

  if (permission === 'default') {
    permission = await requestNotificationPermission();
  }

  if (permission !== 'granted') {
    return {
      success: false,
      permission,
      message: 'Notification permission was denied. Please allow notifications in your browser or site settings.',
    };
  }

  // Play gentle harmonic singing bowl chime
  try {
    audioEngine.playSingingBowl(528);
  } catch {
    // Ignore audio errors
  }

  const shown = await sendNotification('🌿 Serenity Daily Reminder', {
    body: 'Your mindful breathing reminder is set up and working perfectly!',
    tag: 'serenity-test-reminder',
    requireInteraction: false,
  });

  return {
    success: shown,
    permission,
    message: shown
      ? 'Test notification sent! 🌿'
      : 'Could not display system notification. Check device Do Not Disturb mode.',
  };
}

/**
 * Starts a recurring background checker comparing local time to the user\'s reminder time.
 * Suppresses multiple notifications on the same calendar day.
 */
export function initReminderScheduler(
  reminderTime: string | undefined,
  onTrigger?: () => void
): () => void {
  if (typeof window === 'undefined' || !reminderTime) {
    return () => {};
  }

  const checkReminder = () => {
    if (!reminderTime) return;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${hours}:${minutes}`;

    if (currentTimeStr !== reminderTime) {
      return;
    }

    // Format YYYY-MM-DD
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const lastNotified = localStorage.getItem(LAST_REMINDER_DATE_KEY);

    if (lastNotified === todayStr) {
      return; // Already triggered today
    }

    // Record that we fired today
    localStorage.setItem(LAST_REMINDER_DATE_KEY, todayStr);

    // Play chime
    try {
      audioEngine.playSingingBowl(432);
    } catch {
      // Audio fallback
    }

    // Trigger system notification
    sendNotification('🌿 Time for your Mindful Breathing', {
      body: 'Take 3 to 5 minutes to pause, breathe, and center yourself.',
      tag: 'serenity-daily-reminder',
      requireInteraction: true,
    });

    onTrigger?.();
  };

  // Run initial check and set interval every 15 seconds for precision
  checkReminder();
  const intervalId = window.setInterval(checkReminder, 15000);

  return () => {
    window.clearInterval(intervalId);
  };
}
