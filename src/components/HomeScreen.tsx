import { motion } from 'motion/react';
import { Play, Flame, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { BreathingMode, BREATHING_MODES, UserProfile } from '../types';
import MoodCheck from './MoodCheck';
import { useQuoteMachine } from '../machines/quoteMachine';
import { evaluateSessionStreak } from '../machines/sessionStreakMachine';
import { audioEngine } from '../services/audioEngine';

interface HomeScreenProps {
  userProfile: UserProfile | null;
  onStart: (mode: BreathingMode) => void;
  onMoodSelect: (mood: string) => void;
  selectedMood?: string;
  onDurationChange: (duration: number) => void;
  selectedDuration: number;
}

export default function HomeScreen({
  userProfile,
  onStart,
  onMoodSelect,
  selectedMood,
  onDurationChange,
  selectedDuration,
}: HomeScreenProps) {
  const { quote, isLoading: loadingQuote, refreshQuote } = useQuoteMachine();
  const streakEvaluation = evaluateSessionStreak(userProfile);

  return (
    <div className="flex flex-col gap-6 pb-20">
      {/* Header / Stats */}
      <div className="flex justify-between items-center px-2">
        <div>
          <h1 className="text-3xl font-light text-deep-forest">Hello,</h1>
          <p className="text-accent-green font-medium">Ready for a breath?</p>
        </div>
        <div className="flex gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full shadow-sm text-white transition-all ${
              streakEvaluation.isCompletedToday
                ? 'bg-accent-green'
                : streakEvaluation.streakAtRisk
                ? 'bg-amber-600'
                : 'bg-soft-sage'
            }`}
            title={streakEvaluation.message}
          >
            {streakEvaluation.isCompletedToday ? (
              <CheckCircle2 className="w-4 h-4 text-white" />
            ) : (
              <Flame className="w-4 h-4 text-white" />
            )}
            <span className="text-xs font-bold">{userProfile?.currentStreak || 0} Days</span>
          </div>
        </div>
      </div>

      {/* Daily Inspiration */}
      <Card className="border border-cream/70 shadow-sm rounded-[20px] bg-card backdrop-blur-sm overflow-hidden">
        <CardContent className="p-4 flex gap-3 items-start justify-between">
          <div className="flex gap-3 items-start flex-1">
            <div className="p-2 bg-soft-sage/15 rounded-xl text-soft-sage mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-accent-green/80 uppercase tracking-[1px] mb-1">
                Daily Inspiration
              </p>
              {loadingQuote ? (
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              ) : (
                <p className="text-sm font-serif italic text-deep-forest leading-relaxed">
                  "{quote}"
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={refreshQuote}
            className="p-1.5 text-accent-green/70 hover:text-accent-green hover:bg-muted rounded-lg transition-all"
            title="Inspire me again"
            aria-label="Get another inspiration quote"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </CardContent>
      </Card>

      {/* Mood Check */}
      <section>
        <h2 className="text-xs font-bold text-accent-green/80 uppercase tracking-[2px] mb-2 px-2">
          How do you feel?
        </h2>
        <MoodCheck onSelect={onMoodSelect} selectedMood={selectedMood} />
      </section>

      {/* Quick Start Button */}
      <div className="flex flex-col items-center justify-center py-8 gap-6">
        <div className="flex gap-2 bg-muted p-1 rounded-full border border-cream/50">
          {[1, 3, 5, 10].map((d) => (
            <button
              key={d}
              onClick={() => onDurationChange(d)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[1px] transition-all ${
                selectedDuration === d
                  ? 'bg-accent-green text-white dark:text-zinc-950 shadow-md'
                  : 'text-accent-green/80 hover:text-accent-green'
              }`}
            >
              {d}m
            </button>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            audioEngine.unlock();
            onStart('calm');
          }}
          className="w-48 h-48 rounded-full bg-accent-green shadow-2xl shadow-accent-green/25 flex flex-col items-center justify-center text-white dark:text-zinc-950 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Play className="w-8 h-8 mb-2 fill-current" />
          <span className="text-lg font-bold mb-1">Start Session</span>
          <span className="text-white/85 dark:text-zinc-900 text-xs uppercase tracking-widest">{selectedDuration} Minutes</span>
        </motion.button>
      </div>

      {/* Breathing Modes */}
      <section>
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-xs font-bold text-accent-green/80 uppercase tracking-[2px]">
            Breathing Modes
          </h2>
          <Sparkles className="w-4 h-4 text-soft-sage" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(Object.entries(BREATHING_MODES).filter(([k]) => k !== 'custom') as [BreathingMode, typeof BREATHING_MODES['calm']][]).map(([key, mode]) => (
            <Card
              key={key}
              className="border border-cream shadow-none rounded-[24px] hover:shadow-md hover:border-soft-sage/40 transition-all cursor-pointer overflow-hidden group bg-card"
              onClick={() => {
                audioEngine.unlock();
                onStart(key);
              }}
            >
              <CardContent className="p-5 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="font-bold text-deep-forest group-hover:text-accent-green transition-colors">
                    {mode.label}
                  </span>
                  <small className="text-xs text-accent-green/75 leading-tight mt-1">
                    {mode.description}
                  </small>
                </div>
                <div className={`w-3.5 h-3.5 rounded-full ${mode.color} shadow-sm`} />
              </CardContent>
            </Card>
          ))}
          {userProfile?.customBreathingConfig && (
            <Card
              className="border border-soft-sage/40 shadow-none rounded-[24px] hover:shadow-md hover:border-soft-sage transition-all cursor-pointer overflow-hidden group bg-soft-sage/5"
              onClick={() => {
                audioEngine.unlock();
                onStart('custom');
              }}
            >
              <CardContent className="p-5 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="font-bold text-accent-green">Personal Rhythm</span>
                  <small className="text-xs text-accent-green/75 leading-tight mt-1">
                    {userProfile.customBreathingConfig.inhale}-{userProfile.customBreathingConfig.hold}-{userProfile.customBreathingConfig.exhale}-{userProfile.customBreathingConfig.holdPost}s cycle
                  </small>
                </div>
                <div className="w-3.5 h-3.5 rounded-full bg-accent-green shadow-sm" />
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Footer Credits */}
      <footer className="mt-12 pt-8 border-t border-cream/50 text-center">
        <p className="text-[10px] font-bold text-accent-green/60 uppercase tracking-[2px]">
          Find your calm, anywhere.
        </p>
      </footer>
    </div>
  );
}
