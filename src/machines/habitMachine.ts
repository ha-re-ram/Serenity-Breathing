import { isSameDay, subDays } from 'date-fns';
import { Habit } from '../types';

export type HabitDailyStatus = 'completed_today' | 'due' | 'missed';

export interface HabitEvaluation {
  status: HabitDailyStatus;
  isCompletedToday: boolean;
  canExtendStreak: boolean;
  nextStreakOnCompletion: number;
}

/**
 * Pure evaluation function for a habit's daily state.
 */
export function evaluateHabit(habit: Habit, referenceDate: Date = new Date()): HabitEvaluation {
  const lastDate = habit.lastCompletedDate ? new Date(habit.lastCompletedDate) : null;

  if (lastDate && isSameDay(lastDate, referenceDate)) {
    return {
      status: 'completed_today',
      isCompletedToday: true,
      canExtendStreak: false,
      nextStreakOnCompletion: habit.streak,
    };
  }

  const completedYesterday = lastDate ? isSameDay(lastDate, subDays(referenceDate, 1)) : false;

  if (completedYesterday || habit.streak === 0 || !lastDate) {
    return {
      status: 'due',
      isCompletedToday: false,
      canExtendStreak: completedYesterday,
      nextStreakOnCompletion: completedYesterday ? habit.streak + 1 : 1,
    };
  }

  // More than 1 day has passed without completion
  return {
    status: 'missed',
    isCompletedToday: false,
    canExtendStreak: false,
    nextStreakOnCompletion: 1,
  };
}

/**
 * Transitions habit state when toggling completion for today.
 * If already completed today, returns unchanged habit.
 */
export function toggleHabitCompletion(habit: Habit, referenceDate: Date = new Date()): Habit {
  const evaluation = evaluateHabit(habit, referenceDate);

  if (evaluation.isCompletedToday) {
    return habit;
  }

  return {
    ...habit,
    streak: evaluation.nextStreakOnCompletion,
    lastCompletedDate: referenceDate.toISOString(),
  };
}

