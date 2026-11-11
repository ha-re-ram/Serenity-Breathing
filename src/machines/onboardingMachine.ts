import { useReducer, useCallback } from 'react';

export type OnboardingStep = 'reminder' | 'rhythm' | 'summary';

export interface CustomBreathingCycle {
  inhale: number;
  hold: number;
  exhale: number;
  holdPost: number;
}

export interface OnboardingState {
  currentStep: OnboardingStep;
  stepIndex: number; // 1-based (1, 2, 3)
  reminderTime: string;
  customBreathing: CustomBreathingCycle;
}

export type OnboardingEvent =
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_STEP'; step: OnboardingStep }
  | { type: 'SET_REMINDER_TIME'; time: string }
  | { type: 'SET_BREATHING_FIELD'; field: keyof CustomBreathingCycle; value: number }
  | { type: 'APPLY_PRESET'; cycle: CustomBreathingCycle };

export const ONBOARDING_STEPS: OnboardingStep[] = ['reminder', 'rhythm', 'summary'];

export const ONBOARDING_PRESETS: Array<{ label: string; desc: string; cycle: CustomBreathingCycle }> = [
  { label: 'Box Breathing', desc: 'For focus and stress relief', cycle: { inhale: 4, hold: 4, exhale: 4, holdPost: 4 } },
  { label: 'Relaxing 4-7-8', desc: 'For better sleep', cycle: { inhale: 4, hold: 7, exhale: 8, holdPost: 0 } },
  { label: 'Balanced 5-5', desc: 'For general coherence', cycle: { inhale: 5, hold: 0, exhale: 5, holdPost: 0 } },
];

export const initialOnboardingState: OnboardingState = {
  currentStep: 'reminder',
  stepIndex: 1,
  reminderTime: '08:00',
  customBreathing: {
    inhale: 4,
    hold: 4,
    exhale: 4,
    holdPost: 4,
  },
};

export function onboardingReducer(state: OnboardingState, event: OnboardingEvent): OnboardingState {
  switch (event.type) {
    case 'NEXT_STEP': {
      const currentIndex = ONBOARDING_STEPS.indexOf(state.currentStep);
      if (currentIndex < ONBOARDING_STEPS.length - 1) {
        const nextStep = ONBOARDING_STEPS[currentIndex + 1];
        return {
          ...state,
          currentStep: nextStep,
          stepIndex: currentIndex + 2,
        };
      }
      return state;
    }

    case 'PREV_STEP': {
      const currentIndex = ONBOARDING_STEPS.indexOf(state.currentStep);
      if (currentIndex > 0) {
        const prevStep = ONBOARDING_STEPS[currentIndex - 1];
        return {
          ...state,
          currentStep: prevStep,
          stepIndex: currentIndex,
        };
      }
      return state;
    }

    case 'SET_STEP': {
      const targetIndex = ONBOARDING_STEPS.indexOf(event.step);
      if (targetIndex >= 0) {
        return {
          ...state,
          currentStep: event.step,
          stepIndex: targetIndex + 1,
        };
      }
      return state;
    }

    case 'SET_REMINDER_TIME':
      return {
        ...state,
        reminderTime: event.time,
      };

    case 'SET_BREATHING_FIELD': {
      const clampedValue = Math.max(0, Math.min(30, Number(event.value) || 0));
      return {
        ...state,
        customBreathing: {
          ...state.customBreathing,
          [event.field]: clampedValue,
        },
      };
    }

    case 'APPLY_PRESET':
      return {
        ...state,
        customBreathing: { ...event.cycle },
      };

    default:
      return state;
  }
}

export function useOnboardingMachine(initialData?: Partial<OnboardingState>) {
  const [state, dispatch] = useReducer(onboardingReducer, {
    ...initialOnboardingState,
    ...initialData,
  });

  const nextStep = useCallback(() => dispatch({ type: 'NEXT_STEP' }), []);
  const prevStep = useCallback(() => dispatch({ type: 'PREV_STEP' }), []);
  const setStep = useCallback((step: OnboardingStep) => dispatch({ type: 'SET_STEP', step }), []);
  const setReminderTime = useCallback((time: string) => dispatch({ type: 'SET_REMINDER_TIME', time }), []);
  const setBreathingField = useCallback(
    (field: keyof CustomBreathingCycle, value: number) =>
      dispatch({ type: 'SET_BREATHING_FIELD', field, value }),
    []
  );
  const applyPreset = useCallback(
    (cycle: CustomBreathingCycle) => dispatch({ type: 'APPLY_PRESET', cycle }),
    []
  );

  const isFirstStep = state.stepIndex === 1;
  const isLastStep = state.stepIndex === ONBOARDING_STEPS.length;

  return {
    state,
    isFirstStep,
    isLastStep,
    totalSteps: ONBOARDING_STEPS.length,
    nextStep,
    prevStep,
    setStep,
    setReminderTime,
    setBreathingField,
    applyPreset,
  };
}

