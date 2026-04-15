import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Flame, Trophy, Calendar, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { BreathingMode, BREATHING_MODES, UserProfile } from '../types';
import MoodCheck from './MoodCheck';
import { getRandomQuote } from '../constants/quotes';

interface HomeScreenProps {
  userProfile: UserProfile | null;
  onStart: (mode: BreathingMode) => void;
  onMoodSelect: (mood: string) => void;
  selectedMood?: string;
  onDurationChange: (duration: number) => void;
  selectedDuration: number;
}

export default function HomeScreen({ userProfile, onStart, onMoodSelect, selectedMood, onDurationChange, selectedDuration }: HomeScreenProps) {
  const [quote, setQuote] = useState<string>('');
  const [loadingQuote, setLoadingQuote] = useState(true);

  useEffect(() => {
    setQuote(getRandomQuote());
    setLoadingQuote(false);
  }, []);

  return (
    <div className="flex flex-col gap-6 pb-20">
      {/* Header / Stats */}
      <div className="flex justify-between items-center px-2">
        <div>
          <h1 className="text-3xl font-light text-deep-forest">Hello,</h1>
          <p className="text-accent-green font-medium">Ready for a breath?</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-soft-sage px-3 py-1 rounded-full shadow-sm text-white">
            <Flame className="w-4 h-4" />
            <span className="text-xs font-bold">{userProfile?.currentStreak || 0} Days</span>
          </div>
        </div>
      </div>

      {/* Daily Inspiration */}
      <Card className="border border-cream shadow-none rounded-[20px] bg-white/50 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-4 flex gap-3 items-start">
          <div className="p-2 bg-soft-sage/10 rounded-xl text-soft-sage">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-accent-green uppercase tracking-[1px] opacity-50 mb-1">Daily Inspiration</p>
            {loadingQuote ? (
              <div className="h-4 w-32 bg-cream/30 animate-pulse rounded" />
            ) : (
              <p className="text-sm font-serif italic text-deep-forest opacity-80 leading-relaxed">
                "{quote}"
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mood Check */}
      <section>
        <h2 className="text-xs font-bold text-accent-green uppercase tracking-[2px] mb-2 px-2 opacity-60">How do you feel?</h2>
        <MoodCheck onSelect={onMoodSelect} selectedMood={selectedMood} />
      </section>

      {/* Quick Start Button */}
      <div className="flex flex-col items-center justify-center py-8 gap-6">
        <div className="flex gap-2 bg-cream/20 p-1 rounded-full">
          {[1, 3, 5, 10].map((d) => (
            <button
              key={d}
              onClick={() => onDurationChange(d)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[1px] transition-all ${
                selectedDuration === d ? 'bg-accent-green text-white shadow-md' : 'text-accent-green opacity-50 hover:opacity-100'
              }`}
            >
              {d}m
            </button>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onStart('calm')}
          className="w-48 h-48 rounded-full bg-accent-green shadow-2xl shadow-accent-green/30 flex flex-col items-center justify-center text-white relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Play className="w-8 h-8 mb-2 fill-current" />
          <span className="text-lg font-bold mb-1">Start Session</span>
          <span className="text-white/70 text-xs uppercase tracking-widest">{selectedDuration} Minutes</span>
        </motion.button>
      </div>

      {/* Breathing Modes */}
      <section>
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-xs font-bold text-accent-green uppercase tracking-[2px] opacity-60">Breathing Modes</h2>
          <Sparkles className="w-4 h-4 text-soft-sage opacity-50" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(Object.entries(BREATHING_MODES) as [BreathingMode, typeof BREATHING_MODES['calm']][]).map(([key, mode]) => (
            <Card 
              key={key} 
              className="border border-cream shadow-none rounded-[24px] hover:shadow-md hover:border-soft-sage/30 transition-all cursor-pointer overflow-hidden group bg-card"
              onClick={() => onStart(key)}
            >
              <CardContent className="p-5 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="font-bold text-deep-forest group-hover:text-accent-green transition-colors">{mode.label}</span>
                  <small className="text-xs text-accent-green opacity-60 leading-tight mt-1">{mode.description}</small>
                </div>
                <div className={`w-3 h-3 rounded-full ${mode.color} shadow-sm`} />
              </CardContent>
            </Card>
          ))}
          {userProfile?.customBreathingConfig && (
            <Card 
              className="border border-soft-sage/30 shadow-none rounded-[24px] hover:shadow-md hover:border-soft-sage transition-all cursor-pointer overflow-hidden group bg-soft-sage/5"
              onClick={() => onStart('custom' as any)}
            >
              <CardContent className="p-5 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="font-bold text-accent-green">Personal Rhythm</span>
                  <small className="text-xs text-accent-green opacity-60 leading-tight mt-1">
                    {userProfile.customBreathingConfig.inhale}-{userProfile.customBreathingConfig.hold}-{userProfile.customBreathingConfig.exhale}-{userProfile.customBreathingConfig.holdPost}s cycle
                  </small>
                </div>
                <div className="w-3 h-3 rounded-full bg-accent-green shadow-sm" />
              </CardContent>
            </Card>
          )}
        </div>
      </section>
      {/* Footer Credits */}
      <footer className="mt-12 pt-8 border-t border-cream/30 text-center">
        <p className="text-[10px] font-bold text-accent-green uppercase tracking-[2px] opacity-40">
          Find your calm, anywhere.
        </p>
      </footer>
    </div>
  );
}
