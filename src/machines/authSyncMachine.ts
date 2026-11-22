import { useReducer, useEffect, useCallback, useRef } from 'react';
import type { User as FirebaseUser, Auth } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import { UserProfile, SessionRecord } from '../types';

export type AuthSyncStatus =
  | 'initializing'     // Booting Firebase Auth listener
  | 'syncing_profile'  // Authenticated user detected, resolving Firestore profile document
  | 'ready'            // Ready to use (either as Guest with local storage or Authenticated with cloud sync)
  | 'sync_error';      // Failed to load user profile from Firestore

export interface AuthSyncState {
  status: AuthSyncStatus;
  isGuest: boolean;
  user: FirebaseUser | null;
  profile: UserProfile | null;
  sessions: SessionRecord[];
  errorMessage: string | null;
  showOnboarding: boolean;
}

export type AuthSyncEvent =
  | { type: 'AUTH_RESOLVED'; user: FirebaseUser | null; guestProfile?: UserProfile; guestSessions?: SessionRecord[] }
  | { type: 'PROFILE_LOADED'; profile: UserProfile }
  | { type: 'PROFILE_CREATED'; profile: UserProfile }
  | { type: 'SESSIONS_LOADED'; sessions: SessionRecord[] }
  | { type: 'UPDATE_LOCAL_PROFILE'; updater: (prev: UserProfile | null) => UserProfile | null }
  | { type: 'RECORD_GUEST_SESSION'; session: SessionRecord }
  | { type: 'SET_SHOW_ONBOARDING'; show: boolean }
  | { type: 'SYNC_ERROR'; error: string }
  | { type: 'SIGNOUT'; defaultGuestProfile?: UserProfile }
  | { type: 'RETRY' };

export const DEFAULT_GUEST_PROFILE: UserProfile = {
  uid: 'guest',
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

const GUEST_PROFILE_KEY = 'serenity_guest_profile';
const GUEST_SESSIONS_KEY = 'serenity_guest_sessions';

export function loadGuestProfile(): UserProfile {
  if (typeof window === 'undefined') return DEFAULT_GUEST_PROFILE;
  try {
    const raw = localStorage.getItem(GUEST_PROFILE_KEY);
    if (!raw) return DEFAULT_GUEST_PROFILE;
    return { ...DEFAULT_GUEST_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_GUEST_PROFILE;
  }
}

export function saveGuestProfile(profile: UserProfile) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage errors
  }
}

export function loadGuestSessions(): SessionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_SESSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveGuestSessions(sessions: SessionRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GUEST_SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    // Ignore storage errors
  }
}

export const initialAuthSyncState: AuthSyncState = {
  status: 'initializing',
  isGuest: true,
  user: null,
  profile: null,
  sessions: [],
  errorMessage: null,
  showOnboarding: false,
};

/**
 * Pure state machine reducer for Authentication & Profile synchronization.
 * Supports public Guest mode (local storage) and Cloud Sync mode (Firebase Firestore).
 */
export function authSyncReducer(state: AuthSyncState, event: AuthSyncEvent): AuthSyncState {
  switch (event.type) {
    case 'AUTH_RESOLVED': {
      if (!event.user) {
        // Guest mode: instant ready state using local profile and sessions
        const guestProfile = event.guestProfile || state.profile || DEFAULT_GUEST_PROFILE;
        const guestSessions = event.guestSessions || state.sessions || [];
        return {
          status: 'ready',
          isGuest: true,
          user: null,
          profile: guestProfile,
          sessions: guestSessions,
          errorMessage: null,
          showOnboarding: false,
        };
      }
      return {
        ...state,
        isGuest: false,
        user: event.user,
        // If we already have a profile for this user, keep ready; otherwise enter syncing_profile
        status: state.profile && state.profile.uid === event.user.uid ? 'ready' : 'syncing_profile',
        errorMessage: null,
      };
    }

    case 'PROFILE_LOADED': {
      return {
        ...state,
        status: 'ready',
        isGuest: false,
        profile: event.profile,
        showOnboarding: !event.profile.onboardingCompleted,
        errorMessage: null,
      };
    }

    case 'PROFILE_CREATED': {
      return {
        ...state,
        status: 'ready',
        isGuest: false,
        profile: event.profile,
        showOnboarding: true,
        errorMessage: null,
      };
    }

    case 'SESSIONS_LOADED': {
      return {
        ...state,
        sessions: event.sessions,
      };
    }

    case 'UPDATE_LOCAL_PROFILE': {
      const nextProfile = event.updater(state.profile);
      return {
        ...state,
        profile: nextProfile,
      };
    }

    case 'RECORD_GUEST_SESSION': {
      return {
        ...state,
        sessions: [event.session, ...state.sessions],
      };
    }

    case 'SET_SHOW_ONBOARDING': {
      return {
        ...state,
        showOnboarding: event.show,
      };
    }

    case 'SYNC_ERROR': {
      // If we already have a profile (or guest fallback), keep UI functional
      return {
        ...state,
        status: state.profile ? 'ready' : 'sync_error',
        errorMessage: event.error,
      };
    }

    case 'SIGNOUT': {
      const fallbackGuest = event.defaultGuestProfile || DEFAULT_GUEST_PROFILE;
      return {
        status: 'ready',
        isGuest: true,
        user: null,
        profile: fallbackGuest,
        sessions: [],
        errorMessage: null,
        showOnboarding: false,
      };
    }

    case 'RETRY': {
      return {
        ...state,
        status: state.user ? 'syncing_profile' : 'ready',
        errorMessage: null,
      };
    }

    default:
      return state;
  }
}

export interface UseAuthSyncOptions {
  authInstance: Auth | null;
  dbInstance: Firestore | null;
  onError?: (error: unknown) => void;
}

/**
 * React hook binding for the Auth and Profile Synchronization Machine.
 */
export function useAuthSyncMachine({ authInstance, dbInstance, onError }: UseAuthSyncOptions) {
  const [state, dispatch] = useReducer(authSyncReducer, {
    ...initialAuthSyncState,
    profile: typeof window !== 'undefined' ? loadGuestProfile() : DEFAULT_GUEST_PROFILE,
    sessions: typeof window !== 'undefined' ? loadGuestSessions() : [],
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  // 1. Firebase Auth listener
  useEffect(() => {
    if (!authInstance) {
      dispatch({
        type: 'AUTH_RESOLVED',
        user: null,
        guestProfile: loadGuestProfile(),
        guestSessions: loadGuestSessions(),
      });
      return;
    }

    // If Firebase Auth already resolved currentUser in memory, resolve immediately
    if (authInstance.currentUser) {
      dispatch({ type: 'AUTH_RESOLVED', user: authInstance.currentUser });
    }

    const unsubscribe = onAuthStateChanged(authInstance, (firebaseUser) => {
      if (firebaseUser) {
        dispatch({ type: 'AUTH_RESOLVED', user: firebaseUser });
      } else {
        dispatch({
          type: 'AUTH_RESOLVED',
          user: null,
          guestProfile: loadGuestProfile(),
          guestSessions: loadGuestSessions(),
        });
      }
    });

    // 800ms safety fallback in case Firebase Auth connection hangs
    const safetyTimer = setTimeout(() => {
      if (stateRef.current.status === 'initializing') {
        const u = authInstance.currentUser || null;
        if (u) {
          dispatch({ type: 'AUTH_RESOLVED', user: u });
        } else {
          dispatch({
            type: 'AUTH_RESOLVED',
            user: null,
            guestProfile: loadGuestProfile(),
            guestSessions: loadGuestSessions(),
          });
        }
      }
    }, 800);

    return () => {
      unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, [authInstance]);

  // 2. Profile and Sessions listeners when authenticated with Firebase
  useEffect(() => {
    const currentUser = state.user;
    if (!currentUser || !dbInstance) return;

    const profileRef = doc(dbInstance, 'users', currentUser.uid);
    const sessionsQuery = query(collection(dbInstance, 'sessions'), where('uid', '==', currentUser.uid));

    const unsubProfile = onSnapshot(
      profileRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          dispatch({ type: 'PROFILE_LOADED', profile: data });
        } else {
          // Initialize new user profile document
          const guest = loadGuestProfile();
          const initialProfile: UserProfile = {
            uid: currentUser.uid,
            displayName: currentUser.displayName || guest.displayName || 'Mindful Friend',
            totalSessions: guest.totalSessions || 0,
            currentStreak: guest.currentStreak || 0,
            lastSessionDate: guest.lastSessionDate || new Date().toISOString(),
            reminderTime: guest.reminderTime || '08:00',
            habits: guest.habits || DEFAULT_GUEST_PROFILE.habits,
            customBreathingConfig: guest.customBreathingConfig || DEFAULT_GUEST_PROFILE.customBreathingConfig,
            onboardingCompleted: true,
          };
          setDoc(profileRef, initialProfile, { merge: true })
            .then(() => {
              dispatch({ type: 'PROFILE_CREATED', profile: initialProfile });
            })
            .catch((err) => {
              dispatch({ type: 'SYNC_ERROR', error: 'Failed to create user profile' });
              try { onError?.(err); } catch {}
            });
        }
      },
      (err) => {
        dispatch({ type: 'SYNC_ERROR', error: err.message || 'Profile sync failed' });
        try { onError?.(err); } catch {}
      }
    );

    const unsubSessions = onSnapshot(
      sessionsQuery,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SessionRecord));
        const sorted = docs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        dispatch({ type: 'SESSIONS_LOADED', sessions: sorted });
      },
      (err) => {
        try { onError?.(err); } catch {}
      }
    );

    return () => {
      unsubProfile();
      unsubSessions();
    };
  }, [state.user?.uid, dbInstance, onError]);

  const updateLocalProfile = useCallback((updater: (prev: UserProfile | null) => UserProfile | null) => {
    dispatch({ type: 'UPDATE_LOCAL_PROFILE', updater });
    if (stateRef.current.isGuest) {
      const next = updater(stateRef.current.profile);
      if (next) saveGuestProfile(next);
    }
  }, []);

  const recordGuestSession = useCallback((session: SessionRecord) => {
    dispatch({ type: 'RECORD_GUEST_SESSION', session });
    const currentSessions = loadGuestSessions();
    saveGuestSessions([session, ...currentSessions]);
  }, []);

  const dismissOnboarding = useCallback(() => {
    dispatch({ type: 'SET_SHOW_ONBOARDING', show: false });
  }, []);

  const handleSignOut = useCallback(async () => {
    if (authInstance) {
      await firebaseSignOut(authInstance);
    }
    const guestProfile = loadGuestProfile();
    dispatch({ type: 'SIGNOUT', defaultGuestProfile: guestProfile });
  }, [authInstance]);

  const retry = useCallback(() => {
    dispatch({ type: 'RETRY' });
  }, []);

  return {
    state,
    dispatch,
    isGuest: state.isGuest,
    isInitializing: state.status === 'initializing',
    isSyncingProfile: state.status === 'syncing_profile',
    isReady: state.status === 'ready',
    isSyncError: state.status === 'sync_error',
    updateLocalProfile,
    recordGuestSession,
    dismissOnboarding,
    handleSignOut,
    retry,
  };
}
