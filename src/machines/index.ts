/**
 * Serenity Breathwork - Enterprise Formal State Machines Suite
 *
 * All state machines in this directory are pure, deterministic reducers and custom hooks
 * designed to maximize UX (smooth feedback), DX (strict type-safety & unit testing),
 * and AX (declarative inspection & deterministic orchestration).
 *
 * 1. breathingSessionMachine: Phase transitions ('inhale' | 'hold' | 'exhale' | 'holdPost'), warmup countdown, pause/resume, and post-session reflection.
 * 2. authFormMachine: Sign-in, sign-up, forgot-password modes, field validation, and submission states.
 * 3. onboardingMachine: 3-step setup wizard ('reminder' -> 'rhythm' -> 'summary') with preset selection.
 * 4. habitMachine: Pure daily habit evaluation with streak calculation, untoggle undo, and invalid date resilience.
 * 5. debouncedSyncMachine: Optimistic local UI updates with debounced background remote sync and status tracking.
 * 6. sessionStreakMachine: Daily practice streak evaluation, at-risk warnings, and same-day deduplication.
 * 7. healthMetricMachine: Mindful BMI calculation and holistic wellness status categorization.
 * 8. authSyncMachine: Firebase Auth lifecycle, Guest (localStorage) vs. Authenticated (Firestore) dual-mode sync.
 * 9. appNavigationMachine: Top-level view switching ('home' | 'progress' | 'settings'), modal sessions, and duration clamping.
 * 10. quoteMachine: Daily inspiration quote fetching, 'loading' | 'ready' | 'refreshing' states with spin feedback.
 * 11. soundMachine: Web Audio ambient synthesis (Zen bowl 432Hz, ocean, rain), singing bowl chimes, and voice cues.
 */

export * from './breathingSessionMachine';
export * from './authFormMachine';
export * from './onboardingMachine';
export * from './habitMachine';
export * from './debouncedSyncMachine';
export * from './sessionStreakMachine';
export * from './healthMetricMachine';
export * from './authSyncMachine';
export * from './appNavigationMachine';
export * from './quoteMachine';
export * from './soundMachine';

