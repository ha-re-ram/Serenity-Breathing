import { isSameDay, subDays } from 'date-fns';

export type SessionStreakStatus = 'completed_today' | 'due' | 'missed';

export interface SessionStreakEvaluation {
  status: SessionStreakStatus;
  isCompletedToday: boolean;
  canExtendStreak: boolean;
  nextStreakOnCompletion: number;
  streakAtRisk: boolean;
  message: string;
}

export interface SessionStreakProfile {
  currentStreak: number;
  lastSessionDate?: string;
  totalSessions: number;
}

/**
 * Pure evaluation function for a user's session streak and daily practice status.
 * Replaces ad-hoc inline date math with an explicit, deterministic state machine.
 */
export function evaluateSessionStreak(
  profile: SessionStreakProfile | null | undefined,
  referenceDate: Date = new Date()
): SessionStreakEvaluation {
  if (!profile) {
    return {
      status: 'due',
      isCompletedToday: false,
      canExtendStreak: false,
      nextStreakOnCompletion: 1,
      streakAtRisk: false,
      message: 'Start your mindfulness journey today 🌿',
    };
  }

  const { currentStreak = 0, lastSessionDate } = profile;
  const lastDate = lastSessionDate ? new Date(lastSessionDate) : null;

  if (lastDate && !isNaN(lastDate.getTime()) && isSameDay(lastDate, referenceDate)) {
    return {
      status: 'completed_today',
      isCompletedToday: true,
      canExtendStreak: false,
      nextStreakOnCompletion: currentStreak,
      streakAtRisk: false,
      message: 'Mindful practice complete for today 🌿',
    };
  }

  const completedYesterday = lastDate && !isNaN(lastDate.getTime())
    ? isSameDay(lastDate, subDays(referenceDate, 1))
    : false;

  if (completedYesterday || currentStreak === 0 || !lastDate) {
    return {
      status: 'due',
      isCompletedToday: false,
      canExtendStreak: completedYesterday,
      nextStreakOnCompletion: completedYesterday ? currentStreak + 1 : 1,
      streakAtRisk: completedYesterday && currentStreak > 0,
      message: completedYesterday && currentStreak > 0
        ? `Keep your ${currentStreak}-day streak alive with a session today!`
        : 'Take a moment to center yourself today 🌿',
    };
  }

  // More than 1 day has passed without a session
  return {
    status: 'missed',
    isCompletedToday: false,
    canExtendStreak: false,
    nextStreakOnCompletion: 1,
    streakAtRisk: false,
    message: 'Welcome back! Take a breath to begin a fresh streak 🌿',
  };
}

/**
 * Calculates updated streak and metadata upon completing a session.
 * Pure transition function for recording a completed session.
 */
export function calculateNextSessionStreak(
  currentStreak: number,
  lastSessionDate?: string,
  referenceDate: Date = new Date()
): { newStreak: number; isConsecutiveDay: boolean; isSameDaySession: boolean } {
  const lastDate = lastSessionDate ? new Date(lastSessionDate) : null;
  const now = referenceDate;

  if (lastDate && !isNaN(lastDate.getTime()) && isSameDay(lastDate, now)) {
    // Second or subsequent session today: streak remains unchanged
    return {
      newStreak: currentStreak,
      isConsecutiveDay: false,
      isSameDaySession: true,
    };
  }

  const isConsecutive = lastDate && !isNaN(lastDate.getTime())
    ? isSameDay(lastDate, subDays(now, 1))
    : false;

  return {
    newStreak: isConsecutive ? currentStreak + 1 : 1,
    isConsecutiveDay: isConsecutive,
    isSameDaySession: false,
  };
}
