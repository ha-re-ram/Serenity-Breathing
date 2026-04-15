import { motion } from 'motion/react';
import { TrendingUp, Award, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UserProfile, SessionRecord } from '../types';
import { format, subDays, isSameDay } from 'date-fns';

interface ProgressScreenProps {
  userProfile: UserProfile | null;
  sessions: SessionRecord[];
}

export default function ProgressScreen({ userProfile, sessions }: ProgressScreenProps) {
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
  
  const getSessionsForDay = (date: Date) => {
    return sessions.filter(s => isSameDay(new Date(s.timestamp), date)).length;
  };

  const totalMinutes = Math.round(sessions.reduce((acc, s) => acc + s.duration, 0) / 60);

  const hasHealthDetails = userProfile?.healthDetails && 
    Object.values(userProfile.healthDetails).some(v => v !== '');

  return (
    <div className="flex flex-col gap-6 pb-20">
      <h1 className="text-3xl font-light text-deep-forest px-2">Your Progress</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border border-cream shadow-none bg-card rounded-[20px]">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Clock className="w-6 h-6 text-soft-sage mb-2" />
            <span className="text-2xl font-bold text-deep-forest">{totalMinutes}</span>
            <span className="text-[10px] font-bold text-accent-green uppercase tracking-[1px] opacity-50">Minutes</span>
          </CardContent>
        </Card>
        <Card className="border border-cream shadow-none bg-card rounded-[20px]">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <TrendingUp className="w-6 h-6 text-soft-sage mb-2" />
            <span className="text-2xl font-bold text-deep-forest">{userProfile?.currentStreak || 0}</span>
            <span className="text-[10px] font-bold text-accent-green uppercase tracking-[1px] opacity-50">Day Streak</span>
          </CardContent>
        </Card>
      </div>

      {/* Health Summary */}
      {hasHealthDetails && (
        <section>
          <h2 className="text-[10px] font-bold text-accent-green uppercase tracking-[2px] mb-4 px-2 opacity-50">Health Summary</h2>
          <Card className="border border-cream shadow-none bg-card rounded-[20px]">
            <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {userProfile?.healthDetails?.age && (
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase opacity-50">Age</span>
                  <span className="font-bold text-deep-forest">{userProfile.healthDetails.age}</span>
                </div>
              )}
              {userProfile?.healthDetails?.gender && (
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase opacity-50">Gender</span>
                  <span className="font-bold text-deep-forest">{userProfile.healthDetails.gender}</span>
                </div>
              )}
              {userProfile?.healthDetails?.weight && (
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase opacity-50">Weight</span>
                  <span className="font-bold text-deep-forest">{userProfile.healthDetails.weight}</span>
                </div>
              )}
              {userProfile?.healthDetails?.height && (
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase opacity-50">Height</span>
                  <span className="font-bold text-deep-forest">{userProfile.healthDetails.height}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Weekly Summary */}
      <Card className="border border-cream shadow-none bg-card rounded-[20px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-[10px] font-bold text-accent-green uppercase tracking-[2px] opacity-50 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
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
                  <span className="text-[10px] font-bold text-accent-green opacity-40">{format(day, 'EEE')}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Mood Insights */}
      <section>
        <h2 className="text-[10px] font-bold text-accent-green uppercase tracking-[2px] mb-4 px-2 opacity-50">Mood Insights</h2>
        <Card className="border border-cream shadow-none bg-card rounded-[20px]">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-deep-forest">Emotional Balance</span>
                  <span className="text-[10px] text-accent-green opacity-60">Your most frequent post-session moods</span>
                </div>
                <div className="flex -space-x-2">
                  {['😌', '🌿', '🎯'].map((emoji, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-white border border-cream flex items-center justify-center text-sm shadow-sm">
                      {emoji}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { mood: 'calm', label: 'Calm', emoji: '😌', color: 'bg-blue-400' },
                  { mood: 'relaxed', label: 'Relaxed', emoji: '🌿', color: 'bg-green-400' },
                  { mood: 'focused', label: 'Focused', emoji: '🎯', color: 'bg-purple-400' },
                ].map((item) => {
                  const count = sessions.filter(s => s.moodAfter === item.mood).length;
                  const totalWithMood = sessions.filter(s => s.moodAfter).length || 1;
                  const percentage = Math.round((count / totalWithMood) * 100);
                  
                  return (
                    <div key={item.mood} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-deep-forest flex items-center gap-1.5">
                          <span>{item.emoji}</span> {item.label}
                        </span>
                        <span className="text-accent-green opacity-60">{percentage}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-bg-page rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          className={`h-full ${item.color} opacity-60`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Achievements */}
      <section>
        <h2 className="text-[10px] font-bold text-accent-green uppercase tracking-[2px] mb-4 px-2 opacity-50">Achievements</h2>
        <div className="flex flex-col gap-3">
          {[
            { label: 'First Breath', desc: 'Complete your first session', done: (userProfile?.totalSessions || 0) >= 1 },
            { label: 'Consistency King', desc: 'Reach a 3-day streak', done: (userProfile?.currentStreak || 0) >= 3 },
            { label: 'Zen Master', desc: 'Complete 10 sessions', done: (userProfile?.totalSessions || 0) >= 10 },
          ].map((ach, i) => (
            <div key={i} className={`flex items-center gap-4 p-4 rounded-[20px] border ${ach.done ? 'bg-card border-cream' : 'bg-bg-page border-transparent opacity-40'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${ach.done ? 'bg-soft-sage text-white' : 'bg-cream text-white'}`}>
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-deep-forest">{ach.label}</h4>
                <p className="text-xs text-accent-green opacity-60">{ach.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Session History */}
      <section>
        <h2 className="text-[10px] font-bold text-accent-green uppercase tracking-[2px] mb-4 px-2 opacity-50">Recent History</h2>
        <div className="flex flex-col gap-3">
          {sessions.length === 0 ? (
            <p className="text-center py-8 text-accent-green opacity-50 text-sm italic">No sessions yet. Start your journey today!</p>
          ) : (
            sessions.slice(0, 10).map((session, i) => (
              <Card key={session.id || i} className="border border-cream shadow-none bg-card rounded-[20px] overflow-hidden">
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-bg-page flex items-center justify-center text-soft-sage">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-deep-forest capitalize">{session.mode} Session</h4>
                      <p className="text-[10px] text-accent-green opacity-60">
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
