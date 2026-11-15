import { motion } from 'motion/react';
import { TrendingUp, Award, Clock, Calendar as CalendarIcon, Plus, Check, Trash2, Flame, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserProfile, SessionRecord } from '../types';
import { format, subDays, isSameDay } from 'date-fns';
import { useState } from 'react';
import { evaluateHabit } from '../machines/habitMachine';
import { evaluateHealthMetrics } from '../machines/healthMetricMachine';
import { evaluateSessionStreak } from '../machines/sessionStreakMachine';

interface ProgressScreenProps {
  userProfile: UserProfile | null;
  sessions: SessionRecord[];
  onAddHabit: (name: string) => void;
  onToggleHabit: (id: string) => void;
  onDeleteHabit: (id: string) => void;
}

export default function ProgressScreen({
  userProfile,
  sessions,
  onAddHabit,
  onToggleHabit,
  onDeleteHabit,
}: ProgressScreenProps) {
  const [newHabitName, setNewHabitName] = useState('');
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));

  const getSessionsForDay = (date: Date) => {
    return sessions.filter((s) => isSameDay(new Date(s.timestamp), date)).length;
  };

  const totalMinutes = Math.round(sessions.reduce((acc, s) => acc + s.duration, 0) / 60);

  const hasHealthDetails =
    userProfile?.healthDetails && Object.values(userProfile.healthDetails).some((v) => v !== '');

  const healthMetric = evaluateHealthMetrics(userProfile?.healthDetails);
  const streakEvaluation = evaluateSessionStreak(userProfile);

  return (
    <div className="flex flex-col gap-6 pb-20">
      <h1 className="text-3xl font-light text-deep-forest px-2">Your Progress</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border border-cream shadow-none bg-card rounded-[20px]">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Clock className="w-6 h-6 text-soft-sage mb-2" />
            <span className="text-2xl font-bold text-deep-forest">{totalMinutes}</span>
            <span className="text-[10px] font-bold text-accent-green/80 uppercase tracking-[1px]">
              Minutes
            </span>
          </CardContent>
        </Card>
        <Card className="border border-cream shadow-none bg-card rounded-[20px]">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <TrendingUp className="w-6 h-6 text-soft-sage mb-2" />
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-bold text-deep-forest">{userProfile?.currentStreak || 0}</span>
              {streakEvaluation.isCompletedToday && (
                <CheckCircle2 className="w-4 h-4 text-accent-green" title="Streak active today" />
              )}
            </div>
            <span className="text-[10px] font-bold text-accent-green/80 uppercase tracking-[1px]">
              {streakEvaluation.isCompletedToday ? 'Days (Active 🌿)' : 'Day Streak'}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Health Summary */}
      {hasHealthDetails && (
        <section>
          <h2 className="text-[10px] font-bold text-accent-green/80 uppercase tracking-[2px] mb-4 px-2">
            Health Summary
          </h2>
          <Card className="border border-cream shadow-none bg-card rounded-[20px]">
            <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {userProfile?.healthDetails?.age && (
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-accent-green/70 uppercase">Age</span>
                  <span className="font-bold text-deep-forest">{userProfile.healthDetails.age}</span>
                </div>
              )}
              {userProfile?.healthDetails?.gender && (
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-accent-green/70 uppercase">Gender</span>
                  <span className="font-bold text-deep-forest">{userProfile.healthDetails.gender}</span>
                </div>
              )}
              {userProfile?.healthDetails?.weight && (
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-accent-green/70 uppercase">Weight</span>
                  <span className="font-bold text-deep-forest">{userProfile.healthDetails.weight} kg</span>
                </div>
              )}
              {userProfile?.healthDetails?.height && (
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-accent-green/70 uppercase">Height</span>
                  <span className="font-bold text-deep-forest">{userProfile.healthDetails.height} cm</span>
                </div>
              )}
              {healthMetric && (
                <div className="flex flex-col col-span-2 mt-2 pt-2 border-t border-cream/50">
                  <span className="text-[10px] font-bold text-accent-green/80 uppercase mb-1">Health Metric (BMI)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-deep-forest">{healthMetric.formattedBmi}</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${healthMetric.badgeBg}`}
                    >
                      {healthMetric.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-accent-green/80 mt-1 italic">
                    {healthMetric.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Weekly Summary */}
      <Card className="border border-cream shadow-none bg-card rounded-[20px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-[10px] font-bold text-accent-green/80 uppercase tracking-[2px] flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-soft-sage" />
            Weekly Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-end h-32 gap-2">
            {last7Days.map((day, i) => {
              const count = getSessionsForDay(day);
              const height = Math.min(100, (count / 5) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-bg-page rounded-t-lg relative h-full overflow-hidden">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      className="absolute bottom-0 left-0 w-full bg-soft-sage rounded-t-lg"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-accent-green/80">
                    {format(day, 'EEE')}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Mood Insights */}
      <section>
        <h2 className="text-[10px] font-bold text-accent-green/80 uppercase tracking-[2px] mb-4 px-2">
          Mood Insights
        </h2>
        <Card className="border border-cream shadow-none bg-card rounded-[20px]">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-deep-forest">Emotional Balance</span>
                  <span className="text-xs text-accent-green/80">
                    Your most frequent post-session moods
                  </span>
                </div>
                <div className="flex -space-x-2">
                  {['😌', '🌿', '🎯'].map((emoji, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-card border border-cream flex items-center justify-center text-sm shadow-sm"
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
              </div>

              {sessions.filter((s) => s.moodAfter).length === 0 ? (
                <div className="py-6 text-center text-accent-green/80 text-xs italic bg-muted/50 rounded-2xl p-4 border border-cream/50">
                  <p className="font-medium text-deep-forest">No post-session reflections logged yet.</p>
                  <p className="text-xs text-accent-green/80 mt-1 font-sans">
                    Log how you feel after your next breathwork session to reveal emotional patterns 🌿
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { mood: 'calm', label: 'Calm', emoji: '😌', color: 'bg-emerald-500' },
                    { mood: 'relaxed', label: 'Relaxed', emoji: '🌿', color: 'bg-teal-500' },
                    { mood: 'focused', label: 'Focused', emoji: '🎯', color: 'bg-cyan-500' },
                  ].map((item) => {
                    const count = sessions.filter((s) => s.moodAfter === item.mood).length;
                    const totalWithMood = sessions.filter((s) => s.moodAfter).length || 1;
                    const percentage = Math.round((count / totalWithMood) * 100);

                    return (
                      <div key={item.mood} className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                          <span className="text-deep-forest flex items-center gap-1.5">
                            <span>{item.emoji}</span> {item.label}
                          </span>
                          <span className="text-accent-green/90">{percentage}%</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            className={`h-full ${item.color}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Habit Tracker */}
      <section>
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-[10px] font-bold text-accent-green/80 uppercase tracking-[2px]">
            Habit Tracker
          </h2>
          <span className="text-[10px] font-bold text-accent-green/70 italic">
            Track your daily rhythm
          </span>
        </div>

        <Card className="border border-cream shadow-none bg-card rounded-[24px] mb-4">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a new habit (e.g. Reading, Gym)"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newHabitName.trim()) {
                    onAddHabit(newHabitName.trim());
                    setNewHabitName('');
                  }
                }}
                className="rounded-xl border-cream bg-bg-page/30 h-10 text-sm"
              />
              <Button
                onClick={() => {
                  if (newHabitName.trim()) {
                    onAddHabit(newHabitName.trim());
                    setNewHabitName('');
                  }
                }}
                className="bg-accent-green hover:bg-deep-forest text-white dark:text-zinc-950 rounded-xl w-10 h-10 p-0"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          {!userProfile?.habits || userProfile.habits.length === 0 ? (
            <p className="text-center py-6 text-accent-green/80 text-xs italic bg-muted/40 rounded-[24px] border border-dashed border-cream">
              No custom habits yet. Add one above to start tracking!
            </p>
          ) : (
            userProfile.habits.map((habit) => {
              const evaluation = evaluateHabit(habit);
              const isCompletedToday = evaluation.isCompletedToday;

              return (
                <motion.div
                  layout
                  key={habit.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group"
                >
                  <Card
                    className={`border shadow-none rounded-[24px] transition-all ${
                      isCompletedToday
                        ? 'bg-soft-sage/10 border-soft-sage/40'
                        : 'bg-card border-cream'
                    }`}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => onToggleHabit(habit.id)}
                          title={isCompletedToday ? "Completed today (tap to undo)" : "Tap to complete today"}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            isCompletedToday
                              ? 'bg-soft-sage text-white shadow-sm'
                              : 'bg-muted text-accent-green hover:bg-cream/50'
                          }`}
                        >
                          <Check
                            className={`w-5 h-5 ${isCompletedToday ? 'opacity-100' : 'opacity-25'}`}
                          />
                        </button>
                        <div>
                          <h4
                            className={`font-bold text-deep-forest transition-all ${
                              isCompletedToday ? 'line-through opacity-50' : ''
                            }`}
                          >
                            {habit.name}
                          </h4>
                          <div className="flex items-center gap-1.5">
                            <Flame
                              className={`w-3.5 h-3.5 ${
                                habit.streak > 0 ? 'text-amber-500' : 'text-accent-green/40'
                              }`}
                            />
                            <span className="text-[10px] font-bold text-accent-green/80">
                              {habit.streak} day streak
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteHabit(habit.id)}
                        className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </section>

      {/* Achievements */}
      <section>
        <h2 className="text-[10px] font-bold text-accent-green/80 uppercase tracking-[2px] mb-4 px-2">
          Achievements
        </h2>
        <div className="flex flex-col gap-3">
          {[
            { label: 'First Breath', desc: 'Complete your first session', done: (userProfile?.totalSessions || 0) >= 1 },
            { label: 'Consistency King', desc: 'Reach a 3-day streak', done: (userProfile?.currentStreak || 0) >= 3 },
            { label: 'Zen Master', desc: 'Complete 10 sessions', done: (userProfile?.totalSessions || 0) >= 10 },
          ].map((ach, i) => (
            <div
              key={i}
              className={`flex items-center gap-4 p-4 rounded-[20px] border ${
                ach.done
                  ? 'bg-card border-cream'
                  : 'bg-muted/40 border-transparent opacity-50'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  ach.done ? 'bg-soft-sage text-white shadow-sm' : 'bg-cream/60 text-deep-forest/50'
                }`}
              >
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-deep-forest">{ach.label}</h4>
                <p className="text-xs text-accent-green/80">{ach.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Session History */}
      <section>
        <h2 className="text-[10px] font-bold text-accent-green/80 uppercase tracking-[2px] mb-4 px-2">
          Recent History
        </h2>
        <div className="flex flex-col gap-3">
          {sessions.length === 0 ? (
            <p className="text-center py-8 text-accent-green/80 text-sm italic">
              No sessions yet. Start your journey today!
            </p>
          ) : (
            sessions.slice(0, 10).map((session, i) => (
              <Card
                key={session.id || i}
                className="border border-cream shadow-none bg-card rounded-[20px] overflow-hidden"
              >
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-soft-sage">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-deep-forest capitalize">{session.mode} Session</h4>
                      <p className="text-xs text-accent-green/80">
                        {format(new Date(session.timestamp), 'MMM d, h:mm a')} • {Math.round(session.duration / 60)} min
                      </p>
                    </div>
                  </div>
                  {session.moodAfter && (
                    <div className="text-xl" title={`Mood after: ${session.moodAfter}`}>
                      {session.moodAfter === 'calm' && '😌'}
                      {session.moodAfter === 'focused' && '🎯'}
                      {session.moodAfter === 'relaxed' && '🌿'}
                      {session.moodAfter === 'energized' && '⚡'}
                      {session.moodAfter === 'sleepy' && '😴'}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
