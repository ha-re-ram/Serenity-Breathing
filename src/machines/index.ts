/**
 * Serenity Breathwork - State Machines Suite
 *
 * All state machines are pure, deterministic reducers and custom hooks
 * designed to maximize UX (smooth feedback), DX (strict type-safety & unit testing),
 * and AX (declarative inspection & deterministic orchestration).
 *
 * 1. breathingSessionMachine: Phase transitions ('inhale' | 'hold' | 'exhale' | 'holdPost'), warmup countdown, pause/resume, and post-session reflection.
 * 2. onboardingMachine: 3-step setup wizard ('reminder' -> 'rhythm' -> 'summary') with preset selection.
 * 3. habitMachine: Pure daily habit evaluation with streak calculation, untoggle undo, and invalid date resilience.
 * 4. debouncedSyncMachine: Optimistic local UI updates with debounced background persistence and status tracking.
 * 5. sessionStreakMachine: Daily practice streak evaluation, at-risk warnings, and same-day deduplication.
 * 6. healthMetricMachine: Mindful BMI calculation and holistic wellness status categorization.
 * 7. userDataMachine: Fast, private, 100% offline local profile and session persistence.
 * 8. appNavigationMachine: Top-level view switching ('home' | 'progress' | 'settings'), modal sessions, and duration clamping.
 * 9. quoteMachine: Daily inspiration quote fetching, 'loading' | 'ready' | 'refreshing' states with spin feedback.
 * 10. soundMachine: Web Audio ambient synthesis (Zen bowl 432Hz, ocean, rain), singing bowl chimes, and voice cues.
 */

export * from './breathingSessionMachine';
export * from './onboardingMachine';
export * from './habitMachine';
export * from './debouncedSyncMachine';
export * from './sessionStreakMachine';
export * from './healthMetricMachine';
export * from './userDataMachine';
export * from './appNavigationMachine';
export * from './quoteMachine';
export * from './soundMachine';
