import { useState, useEffect, useRef, useCallback } from 'react';
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

type Phase = 'inhale' | 'hold' | 'exhale' | 'holdPost';

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
  const [phase, setPhase] = useState<Phase>('inhale');
  const [phaseCountdown, setPhaseCountdown] = useState(config.inhale);
  const [showMoodAfter, setShowMoodAfter] = useState(false);
  const [moodAfter, setMoodAfter] = useState<string | undefined>();

  // Use refs to avoid stale closures in the interval
  const phaseRef = useRef<Phase>('inhale');
  const phaseCountdownRef = useRef(config.inhale);

  // Sync refs with state
  phaseRef.current = phase;
  phaseCountdownRef.current = phaseCountdown;

  // Get active phases in order (skip phases with 0 duration)
  const getOrderedPhases = useCallback((): Array<{ phase: Phase; duration: number }> => {
    const all: Array<{ phase: Phase; duration: number }> = [
      { phase: 'inhale', duration: config.inhale },
      { phase: 'hold', duration: config.hold || 0 },
      { phase: 'exhale', duration: config.exhale },
      { phase: 'holdPost', duration: config.holdPost || 0 },
    ];
    return all.filter(p => p.duration > 0);
  }, [config.inhale, config.hold, config.exhale, config.holdPost]);

  const getNextPhase = useCallback((current: Phase): { phase: Phase; duration: number } => {
    const ordered = getOrderedPhases();
    const idx = ordered.findIndex(p => p.phase === current);
    const next = ordered[(idx + 1) % ordered.length];
    return next;
  }, [getOrderedPhases]);

  // Start with a 1-second warmup delay
  useEffect(() => {
    const timer = setTimeout(() => setIsActive(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      // Increment total session time
      setSeconds(s => s + 1);

      // Tick down the phase countdown using ref to avoid stale closure
      const newCountdown = phaseCountdownRef.current - 1;

      if (newCountdown <= 0) {
        // Advance to next phase
        const { phase: nextPhase, duration: nextDuration } = getNextPhase(phaseRef.current);
        setPhase(nextPhase);
        setPhaseCountdown(nextDuration);
      } else {
        setPhaseCountdown(newCountdown);
      }
    }, 1000);

    return () => clearInterval(interval);
    // Only depends on isActive and getNextPhase — NOT on phase/phaseCountdown
    // to avoid restarting the interval every tick (the stale closure bug)
  }, [isActive, getNextPhase]);

  // Vibration feedback on phase change
  useEffect(() => {
    if (!isActive) return;
    if (phase === 'inhale' || phase === 'exhale') {
      if ('vibrate' in navigator) navigator.vibrate(50);
    }
  }, [isActive, phase]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinish = () => {
    setIsActive(false);
    setShowMoodAfter(true);
  };

  const handleMoodAfterSelect = (mood: string) => {
    setMoodAfter(mood);
    onEnd(seconds, mood);
  };

  const handleSkip = () => {
    onEnd(seconds);
  };

  if (showMoodAfter) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-page overflow-y-auto">
        <div className="flex flex-col items-center justify-center min-h-full p-8 text-center w-full max-w-sm mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full flex flex-col items-center gap-6"
          >
            <div>
              <h2 className="text-3xl font-serif text-deep-forest mb-2">Session Complete</h2>
              <p className="text-accent-green opacity-70">How do you feel now?</p>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-cream shadow-sm w-full">
              <MoodCheck onSelect={handleMoodAfterSelect} selectedMood={moodAfter} />
            </div>
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-accent-green opacity-50 hover:opacity-100"
            >
              Skip
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-8 bg-bg-page overflow-hidden">
      {/* Top Bar */}
      <div className="w-full flex justify-between items-center flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full bg-cream/20 hover:bg-cream/40 text-accent-green">
          <X className="w-6 h-6" />
        </Button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold text-accent-green uppercase tracking-[2px] opacity-50">Mode</span>
          <h2 className="text-xl font-serif text-deep-forest">{config.label}</h2>
        </div>
        <div className="w-10" />
      </div>

      {/* Center Animation */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full max-w-lg mx-auto overflow-hidden">
        <div className="relative flex-shrink-0">
          <BreathingCircle
            config={config}
            isActive={isActive}
            phase={phase}
          />
          <div className={`absolute inset-0 -z-10 blur-[100px] opacity-20 rounded-full transition-colors duration-1000 ${config.color}`} />
        </div>

        <div className="text-center w-full flex flex-col items-center gap-6">
          {/* Phase indicators */}
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

          {/* Current phase display */}
          <div className="relative h-28 flex flex-col items-center justify-center">
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
      <div className="w-full max-w-lg mx-auto flex flex-col gap-4 items-center pb-4 flex-shrink-0">
        <div className="w-full h-1.5 bg-cream/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent-green shadow-[0_0_10px_rgba(90,90,64,0.3)]"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 300, ease: 'linear' }}
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
