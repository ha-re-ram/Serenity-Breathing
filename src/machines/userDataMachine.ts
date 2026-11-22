import { useReducer, useCallback } from 'react';
import { UserProfile, SessionRecord } from '../types';

export interface UserDataState {
  profile: UserProfile;
  sessions: SessionRecord[];
  showOnboarding: boolean;
}

export type UserDataEvent =
  | { type: 'UPDATE_PROFILE'; updater: (prev: UserProfile) => UserProfile }
  | { type: 'RECORD_SESSION'; session: SessionRecord }
  | { type: 'SET_SHOW_ONBOARDING'; show: boolean }
  | { type: 'RESET_DATA' };

export const DEFAULT_USER_PROFILE: UserProfile = {
  uid: 'serenity-user',
  displayName: 'Mindful Friend',
  totalSessions: 0,
  currentStreak: 0,
  lastSessionDate: new Date().toISOString(),
  onboardingCompleted: true,
  habits: [
    { id: 'h-1', name: 'Morning Deep Breath', streak: 0, createdAt: new Date().toISOString() },
    { id: 'h-2', name: 'Evening Coherence', streak: 0, createdAt: new Date().toISOString() },
  ],
  customBreathingConfig: { inhale: 4, hold: 4, exhale: 4, holdPost: 4 },
};

const USER_PROFILE_KEY = 'serenity_user_profile';
const USER_SESSIONS_KEY = 'serenity_user_sessions';

export function loadStoredProfile(): UserProfile {
  if (typeof window === 'undefined') return DEFAULT_USER_PROFILE;
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (raw) return { ...DEFAULT_USER_PROFILE, ...JSON.parse(raw) };
    // Backwards compatibility with previous storage keys
    const legacyGuest = localStorage.getItem('serenity_guest_profile');
    if (legacyGuest) return { ...DEFAULT_USER_PROFILE, ...JSON.parse(legacyGuest) };
    return DEFAULT_USER_PROFILE;
  } catch {
    return DEFAULT_USER_PROFILE;
  }
}

export function saveStoredProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch {}
}

export function loadStoredSessions(): SessionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(USER_SESSIONS_KEY);
    if (raw) return JSON.parse(raw);
    const legacyGuest = localStorage.getItem('serenity_guest_sessions');
    if (legacyGuest) return JSON.parse(legacyGuest);
    return [];
  } catch {
    return [];
  }
}

export function saveStoredSessions(sessions: SessionRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_SESSIONS_KEY, JSON.stringify(sessions));
  } catch {}
}

export function userDataReducer(state: UserDataState, event: UserDataEvent): UserDataState {
  switch (event.type) {
    case 'UPDATE_PROFILE': {
      const nextProfile = event.updater(state.profile);
      saveStoredProfile(nextProfile);
      return {
        ...state,
        profile: nextProfile,
      };
    }

    case 'RECORD_SESSION': {
      const nextSessions = [event.session, ...state.sessions];
      saveStoredSessions(nextSessions);
      return {
        ...state,
        sessions: nextSessions,
      };
    }

    case 'SET_SHOW_ONBOARDING': {
      return {
        ...state,
        showOnboarding: event.show,
      };
    }

    case 'RESET_DATA': {
      saveStoredProfile(DEFAULT_USER_PROFILE);
      saveStoredSessions([]);
      return {
        profile: DEFAULT_USER_PROFILE,
        sessions: [],
        showOnboarding: false,
      };
    }

    default:
      return state;
  }
}

export function useUserDataMachine() {
  const [state, dispatch] = useReducer(userDataReducer, {
    profile: typeof window !== 'undefined' ? loadStoredProfile() : DEFAULT_USER_PROFILE,
    sessions: typeof window !== 'undefined' ? loadStoredSessions() : [],
    showOnboarding: false,
  });

  const updateProfile = useCallback((updater: (prev: UserProfile) => UserProfile) => {
    dispatch({ type: 'UPDATE_PROFILE', updater });
  }, []);

  const recordSession = useCallback((session: SessionRecord) => {
    dispatch({ type: 'RECORD_SESSION', session });
  }, []);

  const dismissOnboarding = useCallback(() => {
    dispatch({ type: 'SET_SHOW_ONBOARDING', show: false });
  }, []);

  const resetData = useCallback(() => {
    dispatch({ type: 'RESET_DATA' });
  }, []);

  return {
    state,
    profile: state.profile,
    sessions: state.sessions,
    showOnboarding: state.showOnboarding,
    updateProfile,
    recordSession,
    dismissOnboarding,
    resetData,
  };
}
