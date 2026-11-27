import test from 'node:test';
import assert from 'node:assert/strict';
import {
  breathingSessionReducer,
  getActivePhases,
  BreathingSessionState,
} from './breathingSessionMachine';
import { userDataReducer, DEFAULT_USER_PROFILE, UserDataState } from './userDataMachine';
import { onboardingReducer, initialOnboardingState } from './onboardingMachine';
import { evaluateHabit, toggleHabitCompletion } from './habitMachine';
import { evaluateSessionStreak, calculateNextSessionStreak } from './sessionStreakMachine';
import { evaluateHealthMetrics } from './healthMetricMachine';
import { appNavigationReducer, initialAppNavigationState } from './appNavigationMachine';
import { quoteReducer, initialQuoteState } from './quoteMachine';
import { debouncedSyncReducer, DebouncedSyncState } from './debouncedSyncMachine';
import { soundReducer, initialSoundState } from './soundMachine';
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

  // Extend target seconds test
  state = breathingSessionReducer(state, { type: 'EXTEND_TARGET', additionalSeconds: 120 }, activePhases);
  assert.equal(state.targetSeconds, 180);
  assert.equal(state.targetReached, false);
  assert.equal(state.status, 'breathing');

  // Finish -> reflecting
  state = breathingSessionReducer(state, { type: 'FINISH' }, activePhases);
  assert.equal(state.status, 'reflecting');

  // Record mood -> completed
  state = breathingSessionReducer(state, { type: 'RECORD_MOOD', mood: 'calm' }, activePhases);
  assert.equal(state.status, 'completed');
  assert.equal(state.moodAfter, 'calm');

  // Resilience: TICK with empty activePhases should safely fall back and never throw
  let emptyPhasesState: BreathingSessionState = {
    status: 'breathing',
    currentPhase: 'inhale',
    phaseCountdown: 1,
    phaseDuration: 4,
    warmupCountdown: 0,
    elapsedSeconds: 5,
    targetSeconds: 60,
    completedCycles: 0,
    targetReached: false,
  };
  assert.doesNotThrow(() => {
    emptyPhasesState = breathingSessionReducer(emptyPhasesState, { type: 'TICK' }, []);
  });
  assert.ok(emptyPhasesState.currentPhase, 'Current phase must stay valid even with empty phases');
});

test('User Data Machine: Profile Updates, Session Records, and Reset Transitions', () => {
  let state: UserDataState = {
    profile: DEFAULT_USER_PROFILE,
    sessions: [],
    showOnboarding: false,
  };
  assert.equal(state.profile.displayName, 'Mindful Friend');
  assert.equal(state.sessions.length, 0);

  // Update profile name
  state = userDataReducer(state, {
    type: 'UPDATE_PROFILE',
    updater: (prev) => ({ ...prev, displayName: 'Peaceful Seeker' }),
  });
  assert.equal(state.profile.displayName, 'Peaceful Seeker');

  // Record session
  state = userDataReducer(state, {
    type: 'RECORD_SESSION',
    session: {
      id: 'session-1',
      uid: 'serenity-user',
      mode: 'calm',
      duration: 300,
      timestamp: new Date().toISOString(),
      moodBefore: 'stressed',
      moodAfter: 'calm',
    },
  });
  assert.equal(state.sessions.length, 1);
  assert.equal(state.sessions[0].mode, 'calm');
  assert.equal(state.sessions[0].moodAfter, 'calm');

  // Show / dismiss onboarding
  state = userDataReducer(state, { type: 'SET_SHOW_ONBOARDING', show: true });
  assert.equal(state.showOnboarding, true);
  state = userDataReducer(state, { type: 'SET_SHOW_ONBOARDING', show: false });
  assert.equal(state.showOnboarding, false);

  // Reset data
  state = userDataReducer(state, { type: 'RESET_DATA' });
  assert.equal(state.profile.displayName, 'Mindful Friend');
  assert.equal(state.sessions.length, 0);
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

  // Untoggle habit (undo today's completion)
  const untoggled = toggleHabitCompletion(toggledNew, now);
  assert.equal(untoggled.streak, 0);
  assert.equal(untoggled.lastCompletedDate, undefined);

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

  // Resilience: Malformed lastCompletedDate should not throw RangeError
  const malformedHabit: Habit = {
    id: '4',
    name: 'Yoga',
    streak: 2,
    lastCompletedDate: 'not-a-valid-date-string',
    createdAt: now.toISOString(),
  };
  assert.doesNotThrow(() => {
    const res = evaluateHabit(malformedHabit, now);
    assert.equal(res.status, 'due');
  });
});

test('Session Streak Machine: Daily Practice Evaluation and Transitions', () => {
  const now = new Date();
  const yesterday = subDays(now, 1);
  const fiveDaysAgo = subDays(now, 5);

  // 1. New user profile with 0 sessions
  const evalNew = evaluateSessionStreak(null, now);
  assert.equal(evalNew.status, 'due');
  assert.equal(evalNew.isCompletedToday, false);
  assert.equal(evalNew.nextStreakOnCompletion, 1);
  assert.equal(evalNew.streakAtRisk, false);

  const firstResult = calculateNextSessionStreak(0, undefined, now);
  assert.equal(firstResult.newStreak, 1);
  assert.equal(firstResult.isSameDaySession, false);

  // 2. Active streak completed yesterday -> due today with streak at risk
  const evalActive = evaluateSessionStreak({
    currentStreak: 4,
    lastSessionDate: yesterday.toISOString(),
    totalSessions: 12,
  }, now);
  assert.equal(evalActive.status, 'due');
  assert.equal(evalActive.isCompletedToday, false);
  assert.equal(evalActive.canExtendStreak, true);
  assert.equal(evalActive.nextStreakOnCompletion, 5);
  assert.equal(evalActive.streakAtRisk, true);

  const nextActive = calculateNextSessionStreak(4, yesterday.toISOString(), now);
  assert.equal(nextActive.newStreak, 5);
  assert.equal(nextActive.isConsecutiveDay, true);

  // 3. User completes a second session today -> streak preserved, not double incremented
  const evalDoneToday = evaluateSessionStreak({
    currentStreak: 5,
    lastSessionDate: now.toISOString(),
    totalSessions: 13,
  }, now);
  assert.equal(evalDoneToday.status, 'completed_today');
  assert.equal(evalDoneToday.isCompletedToday, true);
  assert.equal(evalDoneToday.nextStreakOnCompletion, 5);

  const secondTodayResult = calculateNextSessionStreak(5, now.toISOString(), now);
  assert.equal(secondTodayResult.newStreak, 5);
  assert.equal(secondTodayResult.isSameDaySession, true);

  // 4. Missed streak (5 days inactive) -> resets to 1
  const evalMissed = evaluateSessionStreak({
    currentStreak: 7,
    lastSessionDate: fiveDaysAgo.toISOString(),
    totalSessions: 20,
  }, now);
  assert.equal(evalMissed.status, 'missed');
  assert.equal(evalMissed.isCompletedToday, false);
  assert.equal(evalMissed.nextStreakOnCompletion, 1);

  const resetResult = calculateNextSessionStreak(7, fiveDaysAgo.toISOString(), now);
  assert.equal(resetResult.newStreak, 1);
});

test('Health Metric Machine: Mindful BMI Evaluation and Classifications', () => {
  // Empty or invalid inputs
  assert.equal(evaluateHealthMetrics(null), null);
  assert.equal(evaluateHealthMetrics({ weight: '0', height: '170' }), null);
  assert.equal(evaluateHealthMetrics({ weight: 'invalid', height: '170' }), null);
  assert.equal(evaluateHealthMetrics({ weight: '65', height: '0' }), null);

  // Nourishment Needed (BMI < 18.5) -> e.g. 45kg at 165cm = 16.5
  const under = evaluateHealthMetrics({ weight: '45', height: '165' });
  assert.ok(under);
  assert.equal(under.category, 'nourishment_needed');
  assert.equal(under.status, 'Nourishment Needed');
  assert.equal(under.color, 'text-blue-500');

  // Pure Serenity (18.5 <= BMI < 25) -> e.g. 65kg at 175cm = 21.2
  const normal = evaluateHealthMetrics({ weight: '65', height: '175' });
  assert.ok(normal);
  assert.equal(normal.category, 'pure_serenity');
  assert.equal(normal.status, 'Pure Serenity');
  assert.equal(normal.color, 'text-soft-sage');

  // Self-care Goal (25 <= BMI < 30) -> e.g. 80kg at 172cm = 27.0
  const over = evaluateHealthMetrics({ weight: '80', height: '172' });
  assert.ok(over);
  assert.equal(over.category, 'self_care_goal');
  assert.equal(over.status, 'Self-care Goal');
  assert.equal(over.color, 'text-amber-500');

  // Health Priority (BMI >= 30) -> e.g. 100kg at 170cm = 34.6
  const priority = evaluateHealthMetrics({ weight: '100', height: '170' });
  assert.ok(priority);
  assert.equal(priority.category, 'health_priority');
  assert.equal(priority.status, 'Health Priority');
  assert.equal(priority.color, 'text-rose-500');
});



test('App Navigation Machine: Tabs, Session Overlays, and Duration Clamping', () => {
  let state = initialAppNavigationState;
  assert.equal(state.activeTab, 'home');
  assert.equal(state.activeSession, null);
  assert.equal(state.selectedDuration, 5);

  // Switch tab
  state = appNavigationReducer(state, { type: 'SWITCH_TAB', tab: 'progress' });
  assert.equal(state.activeTab, 'progress');

  // Start session
  state = appNavigationReducer(state, { type: 'START_SESSION', mode: 'box' });
  assert.equal(state.activeSession, 'box');

  // Dismiss session
  state = appNavigationReducer(state, { type: 'DISMISS_SESSION' });
  assert.equal(state.activeSession, null);

  // Select mood
  state = appNavigationReducer(state, { type: 'SELECT_MOOD', mood: 'calm' });
  assert.equal(state.selectedMood, 'calm');

  // Set duration with clamping
  state = appNavigationReducer(state, { type: 'SET_DURATION', duration: 10 });
  assert.equal(state.selectedDuration, 10);

  // Clamp below minimum
  state = appNavigationReducer(state, { type: 'SET_DURATION', duration: -5 });
  assert.equal(state.selectedDuration, 1);

  // Clamp above maximum
  state = appNavigationReducer(state, { type: 'SET_DURATION', duration: 120 });
  assert.equal(state.selectedDuration, 60);
});

test('Quote Machine: Loading and Refresh Cycling', () => {
  let state = initialQuoteState;
  assert.equal(state.status, 'loading');
  assert.equal(state.quote, '');

  state = quoteReducer(state, { type: 'LOAD_QUOTE', quote: 'Peace comes from within.' });
  assert.equal(state.status, 'ready');
  assert.equal(state.quote, 'Peace comes from within.');

  // Test refreshing transitions
  state = quoteReducer(state, { type: 'REFRESH_START' });
  assert.equal(state.status, 'refreshing');
  assert.equal(state.quote, 'Peace comes from within.');

  state = quoteReducer(state, { type: 'REFRESH_SUCCESS', quote: 'Breathe in tranquility.' });
  assert.equal(state.status, 'ready');
  assert.equal(state.quote, 'Breathe in tranquility.');

  state = quoteReducer(state, { type: 'REFRESH_QUOTE' });
  assert.equal(state.status, 'ready');
  assert.ok(state.quote.length > 0);
});

test('Debounced Sync Machine: Pure Reducer Transitions', () => {
  type TestConfig = { inhale: number };
  let state: DebouncedSyncState<TestConfig> = {
    value: { inhale: 4 },
    status: 'idle',
    errorMessage: null,
  };

  // Change triggers debouncing
  state = debouncedSyncReducer(state, { type: 'CHANGE', value: { inhale: 5 } });
  assert.equal(state.status, 'debouncing');
  assert.equal(state.value.inhale, 5);

  // Save start transitions to saving
  state = debouncedSyncReducer(state, { type: 'SAVE_START' });
  assert.equal(state.status, 'saving');

  // Save error
  state = debouncedSyncReducer(state, { type: 'SAVE_ERROR', error: 'Network timeout' });
  assert.equal(state.status, 'error');
  assert.equal(state.errorMessage, 'Network timeout');

  // Change again clears error
  state = debouncedSyncReducer(state, { type: 'CHANGE', value: { inhale: 6 } });
  assert.equal(state.status, 'debouncing');
  assert.equal(state.errorMessage, null);

  // Save success resets to idle
  state = debouncedSyncReducer(state, { type: 'SAVE_START' });
  state = debouncedSyncReducer(state, { type: 'SAVE_SUCCESS', value: { inhale: 6 } });
  assert.equal(state.status, 'idle');
});

test('Sound Machine: Audio Ambience, Mute, and Voice Cue Transitions', () => {
  let state = initialSoundState;
  assert.equal(state.isMuted, false);
  assert.equal(state.voiceEnabled, true);
  assert.equal(state.bellEnabled, true);

  // 1. Toggle Mute
  state = soundReducer(state, { type: 'TOGGLE_MUTE' });
  assert.equal(state.isMuted, true);
  state = soundReducer(state, { type: 'TOGGLE_MUTE' });
  assert.equal(state.isMuted, false);

  // 2. Toggle Voice and Bell
  state = soundReducer(state, { type: 'SET_VOICE_ENABLED', enabled: false });
  assert.equal(state.voiceEnabled, false);
  state = soundReducer(state, { type: 'SET_BELL_ENABLED', enabled: false });
  assert.equal(state.bellEnabled, false);

  // 3. Switch Ambient Soundscape
  state = soundReducer(state, { type: 'SET_AMBIENT_SOUND', sound: 'ocean' });
  assert.equal(state.ambientSound, 'ocean');
  state = soundReducer(state, { type: 'SET_AMBIENT_SOUND', sound: 'rain' });
  assert.equal(state.ambientSound, 'rain');

  // 4. Volume Clamping
  state = soundReducer(state, { type: 'SET_AMBIENT_VOLUME', volume: 0.6 });
  assert.equal(state.ambientVolume, 0.6);
  state = soundReducer(state, { type: 'SET_AMBIENT_VOLUME', volume: 1.5 });
  assert.equal(state.ambientVolume, 1.0);
  state = soundReducer(state, { type: 'SET_AMBIENT_VOLUME', volume: -0.5 });
  assert.equal(state.ambientVolume, 0.0);

  // 5. Ambient Playback State
  state = soundReducer(state, { type: 'START_AMBIENT' });
  assert.equal(state.isPlayingAmbient, true);
  state = soundReducer(state, { type: 'STOP_AMBIENT' });
  assert.equal(state.isPlayingAmbient, false);
});
