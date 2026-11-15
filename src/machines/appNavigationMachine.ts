import { useReducer, useCallback } from 'react';
import { BreathingMode } from '../types';

export type AppTab = 'home' | 'progress' | 'settings';

export interface AppNavigationState {
  activeTab: AppTab;
  activeSession: BreathingMode | null;
  selectedMood?: string;
  selectedDuration: number;
}

export type AppNavigationEvent =
  | { type: 'SWITCH_TAB'; tab: AppTab }
  | { type: 'START_SESSION'; mode: BreathingMode }
  | { type: 'DISMISS_SESSION' }
  | { type: 'SELECT_MOOD'; mood?: string }
  | { type: 'SET_DURATION'; duration: number };

export const initialAppNavigationState: AppNavigationState = {
  activeTab: 'home',
  activeSession: null,
  selectedMood: undefined,
  selectedDuration: 5,
};

/**
 * Pure state machine reducer for App Viewport navigation, modal sessions, and preferences.
 */
export function appNavigationReducer(
  state: AppNavigationState,
  event: AppNavigationEvent
): AppNavigationState {
  switch (event.type) {
    case 'SWITCH_TAB':
      return {
        ...state,
        activeTab: event.tab,
      };

    case 'START_SESSION':
      return {
        ...state,
        activeSession: event.mode,
      };

    case 'DISMISS_SESSION':
      return {
        ...state,
        activeSession: null,
      };

    case 'SELECT_MOOD':
      return {
        ...state,
        selectedMood: event.mood,
      };

    case 'SET_DURATION':
      return {
        ...state,
        selectedDuration: Math.max(1, Math.min(60, Number(event.duration) || 5)),
      };

    default:
      return state;
  }
}

export function useAppNavigationMachine(initialState: AppNavigationState = initialAppNavigationState) {
  const [state, dispatch] = useReducer(appNavigationReducer, initialState);

  const switchTab = useCallback((tab: AppTab) => {
    dispatch({ type: 'SWITCH_TAB', tab });
  }, []);

  const startSession = useCallback((mode: BreathingMode) => {
    dispatch({ type: 'START_SESSION', mode });
  }, []);

  const dismissSession = useCallback(() => {
    dispatch({ type: 'DISMISS_SESSION' });
  }, []);

  const selectMood = useCallback((mood?: string) => {
    dispatch({ type: 'SELECT_MOOD', mood });
  }, []);

  const setDuration = useCallback((duration: number) => {
    dispatch({ type: 'SET_DURATION', duration });
  }, []);

  return {
    state,
    dispatch,
    activeTab: state.activeTab,
    activeSession: state.activeSession,
    selectedMood: state.selectedMood,
    selectedDuration: state.selectedDuration,
    switchTab,
    startSession,
    dismissSession,
    selectMood,
    setDuration,
  };
}
