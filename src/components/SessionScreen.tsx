import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { BreathingMode, BREATHING_MODES } from '../types';
import BreathingCircle from './BreathingCircle';
import { Button } from '@/components/ui/button';

import MoodCheck from './MoodCheck';

interface SessionScreenProps {
  mode: BreathingMode;
  customConfig?: { inhale: number; hold: number; exhale: number; holdPost: number };
  onEnd: (duration: number, moodAfter?: string) => void;
  onCancel: () => void;
}

export default function SessionScreen({ mode, customConfig, onEnd, onCancel }: SessionScreenProps) {
  const config = (mode as string) === 'custom'
    ? { 
        inhale: customConfig?.inhale || 4,
        hold: customConfig?.hold || 0,
        exhale: customConfig?.exhale || 4,
        holdPost: customConfig?.holdPost || 0,
        label: 'Personal Rhythm', 
        description: 'Your custom breathing cycle', 
        color: 'bg-accent-green' 
      } 
    : BREATHING_MODES[mode];

  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'holdPost'>('inhale');
  const [phaseCountdown, setPhaseCountdown] = useState(config.inhale);

  const [showMoodAfter, setShowMoodAfter] = useState(false);
  const [moodAfter, setMoodAfter] = useState<string | undefined>();

  useEffect(() => {
    const timer = setTimeout(() => setIsActive(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
        setPhaseCountdown((prev) => {
          if (prev <= 1) {
            // Transition to next phase
            const getNextPhase = (current: typeof phase): { phase: typeof phase; duration: number } => {
              const phases: (typeof phase)[] = ['inhale', 'hold', 'exhale', 'holdPost'];
              let idx = phases.indexOf(current);
              
              // Loop to find the next phase with duration > 0
              for (let i = 1; i <= 4; i++) {
                const nextIdx = (idx + i) % 4;
                const nextP = phases[nextIdx];
                const dur = nextP === 'inhale' ? config.inhale : 
                            nextP === 'hold' ? (config.hold || 0) : 
                            nextP === 'exhale' ? config.exhale : 
                            (config.holdPost || 0);
                
                if (dur > 0) {
                  return { phase: nextP, duration: dur };
                }
              }
              return { phase: 'inhale', duration: config.inhale }; // Fallback
            };
            
            const { phase: np, duration: nextDuration } = getNextPhase(phase);
            
            setPhase(np);
            return nextDuration;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, phase, config]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinish = () => {
    setIsActive(false);
    // Show mood check immediately
    setShowMoodAfter(true);
  };

  const handleMoodAfterSelect = (mood: string) => {
    setMoodAfter(mood);
    // Close immediately
    onEnd(seconds, mood);
  };

  const handleSkip = () => {
    onEnd(seconds);
  };

  if (showMoodAfter) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8 bg-bg-page text-center">
        <h2 className="text-3xl font-serif text-deep-forest mb-4">Session Complete</h2>
        <p className="text-accent-green mb-8 opacity-70">How do you feel now?</p>
        <div className="bg-white p-6 rounded-[32px] border border-cream shadow-sm w-full max-w-xs">
          <MoodCheck onSelect={handleMoodAfterSelect} selectedMood={moodAfter} />
        </div>
        <Button 
          variant="ghost" 
          onClick={handleSkip}
          className="mt-8 text-accent-green opacity-50"
        >
          Skip
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-8 bg-bg-page">
      {/* Top Bar */}
      <div className="w-full flex justify-between items-center">
        <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full bg-cream/20 hover:bg-cream/40 text-accent-green">
          <X className="w-6 h-6" />
        </Button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold text-accent-green uppercase tracking-[2px] opacity-50">Mode</span>
          <h2 className="text-xl font-serif text-deep-forest">{config.label}</h2>
        </div>
        <div className="w-10" /> {/* Spacer to balance the X button */}
      </div>

      {/* Center Animation */}
      <div className="flex-1 flex flex-col items-center justify-center gap-12 w-full max-w-lg mx-auto">
        <div className="relative">
          <BreathingCircle 
            config={config} 
            isActive={isActive} 
            phase={phase}
          />
          {/* Subtle background glow */}
          <div className={`absolute inset-0 -z-10 blur-[100px] opacity-20 rounded-full transition-colors duration-1000 ${config.color}`} />
        </div>
        
        <div className="text-center w-full flex flex-col items-center gap-8">
          <div className="flex justify-center gap-4 w-full px-12">
            {[
              { id: 'inhale', label: 'Inhale', dur: config.inhale },
              { id: 'hold', label: 'Hold', dur: config.hold },
              { id: 'exhale', label: 'Exhale', dur: config.exhale },
              { id: 'holdPost', label: 'Hold', dur: config.holdPost },
            ].filter(p => p.dur && p.dur > 0).map((p) => (
              <div key={p.id} className="flex flex-col items-center gap-2 flex-1">
                <div className={`h-1.5 w-full rounded-full transition-all duration-500 ${phase === p.id ? 'bg-accent-green shadow-[0_0_10px_rgba(90,90,64,0.3)]' : 'bg-cream/20'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-widest transition-opacity ${phase === p.id ? 'opacity-100 text-accent-green' : 'opacity-30 text-deep-forest'}`}>
                  {p.label}
                </span>
              </div>
            ))}
          </div>

          <div className="relative h-32 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={phase}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.1, y: -10 }}
                className="flex flex-col items-center"
              >
                <h2 className="text-6xl font-serif italic text-accent-green capitalize mb-2 tracking-tight">
                  {phase === 'holdPost' ? 'Hold' : phase}
                </h2>
                <div className="text-2xl font-mono text-deep-forest font-bold">
                  {phaseCountdown}s
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          
          <div className="text-sm font-mono text-deep-forest/40 tracking-[4px] font-light">
            Total: {formatTime(seconds)}
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="w-full max-w-lg mx-auto flex flex-col gap-6 items-center pb-8">
        <div className="w-full h-1.5 bg-cream/30 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-accent-green shadow-[0_0_10px_rgba(90,90,64,0.3)]"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 300, ease: "linear" }}
          />
        </div>
        <Button 
          variant="ghost"
          onClick={handleFinish}
          className="text-xs font-bold text-accent-green uppercase tracking-[2px] opacity-40 hover:opacity-100 transition-all hover:bg-cream/10 rounded-full px-8 py-4"
        >
          Finish Session
        </Button>
      </div>
    </div>
  );
}
