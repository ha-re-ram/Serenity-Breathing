import test from 'node:test';
import assert from 'node:assert/strict';
import {
  breathingSessionReducer,
  getActivePhases,
  BreathingSessionState,
} from './breathingSessionMachine';
import { authFormReducer, initialAuthFormState } from './authFormMachine';
import { onboardingReducer, initialOnboardingState } from './onboardingMachine';
import { evaluateHabit, toggleHabitCompletion } from './habitMachine';
import { Habit } from '../types';
import { subDays } from 'date-fns';

test('Breathing Session Machine: Warmup and Phase Cycling', () => {
  const activePhases = getActivePhases({
    inhale: 4,
    hold: 2,
    exhale: 4,
    holdPost: 0,
    label: 'Test',
    description: 'Test mode',
    color: 'bg-green-500',
  });

  assert.equal(activePhases.length, 3, 'Should filter out 0 duration phases');

  let state: BreathingSessionState = {
    status: 'preparing',
    currentPhase: 'inhale',
    phaseCountdown: 4,
    phaseDuration: 4,
    warmupCountdown: 3,
    elapsedSeconds: 0,
    targetSeconds: 60,
    completedCycles: 0,
    targetReached: false,
  };

  // Tick 1
  state = breathingSessionReducer(state, { type: 'PREPARE_TICK' }, activePhases);
  assert.equal(state.status, 'preparing');
  assert.equal(state.warmupCountdown, 2);

  // Tick 2
  state = breathingSessionReducer(state, { type: 'PREPARE_TICK' }, activePhases);
  assert.equal(state.status, 'preparing');
  assert.equal(state.warmupCountdown, 1);

  // Tick 3: Reaches 0 -> transitions to breathing
  state = breathingSessionReducer(state, { type: 'PREPARE_TICK' }, activePhases);
  assert.equal(state.status, 'breathing');
  assert.equal(state.warmupCountdown, 0);
  assert.equal(state.currentPhase, 'inhale');
  assert.equal(state.phaseCountdown, 4);

  // Tick 4 active seconds: Inhale (countdown: 4 -> 3 -> 2 -> 1 -> transition to hold)
  state = breathingSessionReducer(state, { type: 'TICK' }, activePhases); // 3
  state = breathingSessionReducer(state, { type: 'TICK' }, activePhases); // 2
  state = breathingSessionReducer(state, { type: 'TICK' }, activePhases); // 1
  assert.equal(state.phaseCountdown, 1);
  assert.equal(state.currentPhase, 'inhale');

  // Next tick transitions to 'hold' (duration 2)
  state = breathingSessionReducer(state, { type: 'TICK' }, activePhases);
  assert.equal(state.currentPhase, 'hold');
  assert.equal(state.phaseCountdown, 2);

  // Pause and resume
  state = breathingSessionReducer(state, { type: 'PAUSE' }, activePhases);
  assert.equal(state.status, 'paused');
  // While paused, TICK should do nothing
  state = breathingSessionReducer(state, { type: 'TICK' }, activePhases);
  assert.equal(state.phaseCountdown, 2);

  state = breathingSessionReducer(state, { type: 'RESUME' }, activePhases);
  assert.equal(state.status, 'breathing');

  // Finish -> reflecting
  state = breathingSessionReducer(state, { type: 'FINISH' }, activePhases);
  assert.equal(state.status, 'reflecting');

  // Record mood -> completed
  state = breathingSessionReducer(state, { type: 'RECORD_MOOD', mood: 'calm' }, activePhases);
  assert.equal(state.status, 'completed');
  assert.equal(state.moodAfter, 'calm');
});

test('Auth Form Machine: Mode Transitions and Error Clearing', () => {
  let state = initialAuthFormState;
  assert.equal(state.mode, 'signIn');
  assert.equal(state.status, 'idle');

  // Switch to sign up
  state = authFormReducer(state, { type: 'SWITCH_MODE', mode: 'signUp' });
  assert.equal(state.mode, 'signUp');

  // Set field
  state = authFormReducer(state, { type: 'SET_FIELD', field: 'email', value: 'mindful@test.com' });
  assert.equal(state.email, 'mindful@test.com');

  // Start submit
  state = authFormReducer(state, { type: 'SUBMIT_START' });
  assert.equal(state.status, 'submitting');

  // Fail submit
  state = authFormReducer(state, { type: 'SUBMIT_ERROR', error: 'Network error' });
  assert.equal(state.status, 'error');
  assert.equal(state.errorMessage, 'Network error');

  // Typing in a field clears error
  state = authFormReducer(state, { type: 'SET_FIELD', field: 'password', value: 'secret' });
  assert.equal(state.errorMessage, null);

  // Switch to forgot password
  state = authFormReducer(state, { type: 'SWITCH_MODE', mode: 'forgotPassword' });
  assert.equal(state.mode, 'forgotPassword');
  assert.equal(state.status, 'idle');
});

test('Onboarding Machine: Navigation and Presets', () => {
  let state = initialOnboardingState;
  assert.equal(state.currentStep, 'reminder');
  assert.equal(state.stepIndex, 1);

  // Move forward to rhythm
  state = onboardingReducer(state, { type: 'NEXT_STEP' });
  assert.equal(state.currentStep, 'rhythm');
  assert.equal(state.stepIndex, 2);

  // Move backward to reminder
  state = onboardingReducer(state, { type: 'PREV_STEP' });
  assert.equal(state.currentStep, 'reminder');
  assert.equal(state.stepIndex, 1);

  // Cannot go before step 1
  state = onboardingReducer(state, { type: 'PREV_STEP' });
  assert.equal(state.stepIndex, 1);

  // Move to rhythm and apply 4-7-8 preset
  state = onboardingReducer(state, { type: 'NEXT_STEP' });
  state = onboardingReducer(state, {
    type: 'APPLY_PRESET',
    cycle: { inhale: 4, hold: 7, exhale: 8, holdPost: 0 },
  });
  assert.deepEqual(state.customBreathing, { inhale: 4, hold: 7, exhale: 8, holdPost: 0 });

  // Move to summary
  state = onboardingReducer(state, { type: 'NEXT_STEP' });
  assert.equal(state.currentStep, 'summary');
  assert.equal(state.stepIndex, 3);

  // Cannot go beyond step 3
  state = onboardingReducer(state, { type: 'NEXT_STEP' });
  assert.equal(state.stepIndex, 3);
});

test('Habit Machine: State Evaluations and Streak Transitions', () => {
  const now = new Date();
  const yesterday = subDays(now, 1);
  const threeDaysAgo = subDays(now, 3);

  const newHabit: Habit = {
    id: '1',
    name: 'Morning Breath',
    streak: 0,
    createdAt: now.toISOString(),
  };

  // Due today (first time)
  const evalNew = evaluateHabit(newHabit, now);
  assert.equal(evalNew.status, 'due');
  assert.equal(evalNew.isCompletedToday, false);
  assert.equal(evalNew.nextStreakOnCompletion, 1);

  const toggledNew = toggleHabitCompletion(newHabit, now);
  assert.equal(toggledNew.streak, 1);

  // Already completed today
  const evalDone = evaluateHabit(toggledNew, now);
  assert.equal(evalDone.status, 'completed_today');
  assert.equal(evalDone.isCompletedToday, true);

  // Completed yesterday -> can extend streak
  const streakHabit: Habit = {
    id: '2',
    name: 'Evening Coherence',
    streak: 5,
    lastCompletedDate: yesterday.toISOString(),
    createdAt: subDays(now, 10).toISOString(),
  };

  const evalStreak = evaluateHabit(streakHabit, now);
  assert.equal(evalStreak.status, 'due');
  assert.equal(evalStreak.canExtendStreak, true);
  assert.equal(evalStreak.nextStreakOnCompletion, 6);

  const toggledStreak = toggleHabitCompletion(streakHabit, now);
  assert.equal(toggledStreak.streak, 6);

  // Missed habit (streak broken)
  const brokenHabit: Habit = {
    id: '3',
    name: 'Walk',
    streak: 10,
    lastCompletedDate: threeDaysAgo.toISOString(),
    createdAt: subDays(now, 20).toISOString(),
  };

  const evalBroken = evaluateHabit(brokenHabit, now);
  assert.equal(evalBroken.status, 'missed');
  assert.equal(evalBroken.canExtendStreak, false);
  assert.equal(evalBroken.nextStreakOnCompletion, 1);

  const toggledBroken = toggleHabitCompletion(brokenHabit, now);
  assert.equal(toggledBroken.streak, 1);
});

