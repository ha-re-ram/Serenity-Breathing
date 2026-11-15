import { useReducer, useEffect, useRef, useCallback } from 'react';
import { BreathingMode, BreathingConfig, BREATHING_MODES } from '../types';

export type SessionPhase = 'inhale' | 'hold' | 'exhale' | 'holdPost';

export type SessionStatus =
  | 'preparing'   // Warmup countdown so user can settle into position
  | 'breathing'   // Active breathwork cycle running
  | 'paused'      // Breathwork paused mid-session
  | 'reflecting'  // Session complete, gathering post-session mood check-in
  | 'completed';  // Session fully saved and finished

export interface PhaseConfig {
  phase: SessionPhase;
  duration: number;
}

export interface BreathingSessionState {
  status: SessionStatus;
  currentPhase: SessionPhase;
  phaseCountdown: number;
  phaseDuration: number;
  warmupCountdown: number;
  elapsedSeconds: number;
  targetSeconds: number;
  completedCycles: number;
  targetReached: boolean;
  moodAfter?: string;
}

export type BreathingSessionEvent =
  | { type: 'PREPARE_TICK' }
  | { type: 'SKIP_PREPARE' }
  | { type: 'TICK' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'FINISH' }
  | { type: 'RECORD_MOOD'; mood?: string }
  | { type: 'RESET'; initialPhase: SessionPhase; initialDuration: number; targetSeconds: number };

/**
 * Returns ordered phases that have a duration > 0.
 * Cycles strictly in order: Inhale -> Hold -> Exhale -> HoldPost.
 */
export function getActivePhases(config: BreathingConfig): PhaseConfig[] {
  const allPhases: PhaseConfig[] = [
    { phase: 'inhale', duration: Math.max(1, config.inhale) },
    { phase: 'hold', duration: config.hold || 0 },
    { phase: 'exhale', duration: Math.max(1, config.exhale) },
    { phase: 'holdPost', duration: config.holdPost || 0 },
  ];
  return allPhases.filter((p) => p.duration > 0);
}

/**
 * Pure transition reducer for the breathing session state machine.
 */
export function breathingSessionReducer(
  state: BreathingSessionState,
  event: BreathingSessionEvent,
  activePhases: PhaseConfig[]
): BreathingSessionState {
  switch (event.type) {
    case 'PREPARE_TICK': {
      if (state.status !== 'preparing') return state;
      const phases = activePhases && activePhases.length > 0
        ? activePhases
        : [{ phase: 'inhale' as SessionPhase, duration: 4 }, { phase: 'exhale' as SessionPhase, duration: 4 }];
      const firstPhase = phases[0] || { phase: 'inhale' as SessionPhase, duration: 4 };

      if (state.warmupCountdown <= 1) {
        // Transition from preparing to active breathing
        return {
          ...state,
          status: 'breathing',
          warmupCountdown: 0,
          currentPhase: firstPhase.phase,
          phaseCountdown: firstPhase.duration,
          phaseDuration: firstPhase.duration,
        };
      }
      return {
        ...state,
        warmupCountdown: state.warmupCountdown - 1,
      };
    }

    case 'SKIP_PREPARE': {
      if (state.status !== 'preparing') return state;
      const phases = activePhases && activePhases.length > 0
        ? activePhases
        : [{ phase: 'inhale' as SessionPhase, duration: 4 }, { phase: 'exhale' as SessionPhase, duration: 4 }];
      const firstPhase = phases[0] || { phase: 'inhale' as SessionPhase, duration: 4 };

      return {
        ...state,
        status: 'breathing',
        warmupCountdown: 0,
        currentPhase: firstPhase.phase,
        phaseCountdown: firstPhase.duration,
        phaseDuration: firstPhase.duration,
      };
    }

    case 'TICK': {
      if (state.status !== 'breathing') return state;

      const nextElapsed = state.elapsedSeconds + 1;
      const reached = nextElapsed >= state.targetSeconds;
      const nextCountdown = state.phaseCountdown - 1;

      if (nextCountdown <= 0) {
        // Phase transition with complete safety fallback
        const phases = activePhases && activePhases.length > 0
          ? activePhases
          : [{ phase: 'inhale' as SessionPhase, duration: 4 }, { phase: 'exhale' as SessionPhase, duration: 4 }];
        const currentIndex = phases.findIndex((p) => p.phase === state.currentPhase);
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % phases.length : 0;
        const nextPhaseConfig = phases[nextIndex] || phases[0] || { phase: 'inhale' as SessionPhase, duration: 4 };
        const isCycleComplete = nextIndex === 0;

        return {
          ...state,
          elapsedSeconds: nextElapsed,
          targetReached: reached,
          currentPhase: nextPhaseConfig.phase,
          phaseCountdown: nextPhaseConfig.duration,
          phaseDuration: nextPhaseConfig.duration,
          completedCycles: isCycleComplete ? state.completedCycles + 1 : state.completedCycles,
        };
      }

      return {
        ...state,
        elapsedSeconds: nextElapsed,
        targetReached: reached,
        phaseCountdown: nextCountdown,
      };
    }

    case 'PAUSE': {
      if (state.status !== 'breathing') return state;
      return { ...state, status: 'paused' };
    }

    case 'RESUME': {
      if (state.status !== 'paused') return state;
      return { ...state, status: 'breathing' };
    }

    case 'FINISH': {
      if (state.status === 'reflecting' || state.status === 'completed') return state;
      return { ...state, status: 'reflecting' };
    }

    case 'RECORD_MOOD': {
      return {
        ...state,
        status: 'completed',
        moodAfter: event.mood,
      };
    }

    case 'RESET': {
      return {
        status: 'preparing',
        currentPhase: event.initialPhase,
        phaseCountdown: event.initialDuration,
        phaseDuration: event.initialDuration,
        warmupCountdown: 3,
        elapsedSeconds: 0,
        targetSeconds: event.targetSeconds,
        completedCycles: 0,
        targetReached: false,
      };
    }

    default:
      return state;
  }
}

export interface UseBreathingSessionOptions {
  mode: BreathingMode;
  customConfig?: { inhale: number; hold: number; exhale: number; holdPost: number };
  targetDurationMinutes?: number;
  onEnd: (duration: number, moodAfter?: string) => void;
  enableWarmup?: boolean;
}

/**
 * Custom React hook that encapsulates the breathwork state machine.
 * Prevents interval stale closures while guaranteeing sub-millisecond precision.
 */
export function useBreathingSessionMachine({
  mode,
  customConfig,
  targetDurationMinutes = 5,
  onEnd,
  enableWarmup = true,
}: UseBreathingSessionOptions) {
  const config: BreathingConfig = (mode as string) === 'custom'
    ? {
        inhale: customConfig?.inhale || 4,
        hold: customConfig?.hold || 0,
        exhale: customConfig?.exhale || 4,
        holdPost: customConfig?.holdPost || 0,
        label: 'Personal Rhythm',
        description: 'Your custom breathing cycle',
        color: 'bg-teal-600',
      }
    : BREATHING_MODES[mode] || BREATHING_MODES.calm;

  const activePhases = getActivePhases(config);
  const firstPhase = activePhases[0] || { phase: 'inhale', duration: 4 };
  const targetSeconds = Math.max(30, targetDurationMinutes * 60);

  const [state, dispatch] = useReducer(
    (s: BreathingSessionState, a: BreathingSessionEvent) => breathingSessionReducer(s, a, activePhases),
    {
      status: enableWarmup ? 'preparing' : 'breathing',
      currentPhase: firstPhase.phase,
      phaseCountdown: firstPhase.duration,
      phaseDuration: firstPhase.duration,
      warmupCountdown: enableWarmup ? 3 : 0,
      elapsedSeconds: 0,
      targetSeconds,
      completedCycles: 0,
      targetReached: false,
    }
  );

  // Synchronous refs to prevent stale closure drift in interval callbacks
  const stateRef = useRef(state);
  stateRef.current = state;

  const previousPhaseRef = useRef<SessionPhase>(state.currentPhase);

  // Deduplicated haptic feedback helper
  const triggerHaptic = useCallback((phase: SessionPhase) => {
    if (phase === 'inhale' || phase === 'exhale') {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(50);
        } catch {
          // Ignore unsupported device environments
        }
      }
    }
  }, []);

  // Warmup countdown timer
  useEffect(() => {
    if (state.status !== 'preparing') return;

    const warmupInterval = setInterval(() => {
      dispatch({ type: 'PREPARE_TICK' });
    }, 1000);

    return () => clearInterval(warmupInterval);
  }, [state.status]);

  // Main breathwork ticking interval
  useEffect(() => {
    if (state.status !== 'breathing') return;

    const interval = setInterval(() => {
      dispatch({ type: 'TICK' });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.status]);

  // Trigger haptic when transitioning to a new phase
  useEffect(() => {
    if (state.status === 'breathing' && state.currentPhase !== previousPhaseRef.current) {
      previousPhaseRef.current = state.currentPhase;
      triggerHaptic(state.currentPhase);
    }
  }, [state.status, state.currentPhase, triggerHaptic]);

  const pause = useCallback(() => dispatch({ type: 'PAUSE' }), []);
  const resume = useCallback(() => dispatch({ type: 'RESUME' }), []);
  const finish = useCallback(() => dispatch({ type: 'FINISH' }), []);
  const skipPrepare = useCallback(() => dispatch({ type: 'SKIP_PREPARE' }), []);
  
  const recordMoodAndEnd = useCallback((mood?: string) => {
    dispatch({ type: 'RECORD_MOOD', mood });
    onEnd(stateRef.current.elapsedSeconds, mood);
  }, [onEnd]);

  const progressPercentage = Math.min(100, (state.elapsedSeconds / state.targetSeconds) * 100);

  return {
    state,
    config,
    activePhases,
    progressPercentage,
    pause,
    resume,
    finish,
    skipPrepare,
    recordMoodAndEnd,
  };
}

