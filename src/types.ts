export type BreathingMode = 'calm' | 'focus' | 'sleep' | 'morning' | 'power' | 'box' | 'custom';

export interface BreathingConfig {
  inhale: number;
  hold?: number;
  exhale: number;
  holdPost?: number;
  label: string;
  description: string;
  color: string;
}

export const BREATHING_MODES: Record<BreathingMode, BreathingConfig> = {
  calm: {
    inhale: 4,
    exhale: 4,
    label: 'Calm',
    description: 'Simple 4-4 rhythm to relax',
    color: 'bg-emerald-600',
  },
  focus: {
    inhale: 4,
    hold: 4,
    exhale: 4,
    holdPost: 4,
    label: 'Focus',
    description: 'Box breathing for mental clarity',
    color: 'bg-accent-green',
  },
  sleep: {
    inhale: 4,
    hold: 7,
    exhale: 8,
    label: 'Sleep',
    description: '4-7-8 technique to drift off',
    color: 'bg-indigo-900',
  },
  morning: {
    inhale: 3,
    exhale: 3,
    label: 'Morning',
    description: 'Energizing 3-3 rhythm',
    color: 'bg-amber-500',
  },
  power: {
    inhale: 1,
    exhale: 1,
    label: 'Power',
    description: 'Rapid breaths for energy',
    color: 'bg-rose-500',
  },
  box: {
    inhale: 4,
    hold: 4,
    exhale: 4,
    holdPost: 4,
    label: 'Box',
    description: 'Navy SEAL focus technique',
    color: 'bg-sky-600',
  },
  custom: {
    inhale: 4,
    hold: 4,
    exhale: 4,
    holdPost: 4,
    label: 'Personal Rhythm',
    description: 'Your custom breathing cycle',
    color: 'bg-teal-600',
  },
};

export interface UserProfile {
  uid: string;
  displayName?: string;
  totalSessions: number;
  currentStreak: number;
  lastSessionDate?: string;
  reminderTime?: string;
  onboardingCompleted?: boolean;
  habits?: Habit[];
  healthDetails?: {
    age?: string;
    gender?: string;
    weight?: string;
    height?: string;
    notes?: string;
  };
  customBreathingConfig?: {
    inhale: number;
    hold: number;
    exhale: number;
    holdPost: number;
  };
}

export interface Habit {
  id: string;
  name: string;
  streak: number;
  lastCompletedDate?: string;
  createdAt: string;
}

export interface SessionRecord {
  id?: string;
  uid: string;
  mode: BreathingMode;
  duration: number;
  timestamp: string;
  moodBefore?: string;
  moodAfter?: string;
}
