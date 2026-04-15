export type BreathingMode = 'calm' | 'focus' | 'sleep' | 'morning' | 'power' | 'box';

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
    color: 'bg-soft-sage',
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
    color: 'bg-deep-forest',
  },
  morning: {
    inhale: 3,
    exhale: 3,
    label: 'Morning',
    description: 'Energizing 3-3 rhythm',
    color: 'bg-cream',
  },
  power: {
    inhale: 1,
    exhale: 1,
    label: 'Power',
    description: 'Rapid breaths for energy',
    color: 'bg-rose-400',
  },
  box: {
    inhale: 4,
    hold: 4,
    exhale: 4,
    holdPost: 4,
    label: 'Box',
    description: 'Navy SEAL focus technique',
    color: 'bg-blue-400',
  },
};

export interface UserProfile {
  uid: string;
  displayName?: string;
  totalSessions: number;
  currentStreak: number;
  lastSessionDate?: string;
  reminderTime?: string;
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

export interface SessionRecord {
  id?: string;
  uid: string;
  mode: BreathingMode;
  duration: number;
  timestamp: string;
  moodBefore?: string;
  moodAfter?: string;
}
