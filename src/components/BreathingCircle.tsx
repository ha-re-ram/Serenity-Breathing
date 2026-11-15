import { motion, AnimatePresence } from 'motion/react';
import { BreathingConfig } from '../types';

interface BreathingCircleProps {
  config: BreathingConfig;
  isActive: boolean;
  phase: 'inhale' | 'hold' | 'exhale' | 'holdPost';
  isPaused?: boolean;
}

export default function BreathingCircle({ config, isActive, phase, isPaused = false }: BreathingCircleProps) {
  const getScale = () => {
    if (!isActive) return 1.1; // Gentle resting state during warmup
    if (phase === 'inhale' || phase === 'hold') return 1.5;
    return 1;
  };

  const currentDuration = (() => {
    if (!isActive) return 1.5;
    if (phase === 'inhale') return config.inhale;
    if (phase === 'hold') return config.hold || 0;
    if (phase === 'exhale') return config.exhale;
    if (phase === 'holdPost') return config.holdPost || 0;
    return 0;
  })();

  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Outer Dashed Border */}
      <motion.div
        animate={{
          scale: getScale() * 1.2,
          opacity: isPaused ? 0.15 : 0.3,
        }}
        transition={{ duration: currentDuration, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full border border-dashed border-soft-sage"
      />

      {/* Main Circle */}
      <motion.div
        animate={{
          scale: getScale(),
          opacity: isPaused ? 0.75 : 1,
        }}
        transition={{ duration: currentDuration, ease: "easeInOut" }}
        className={`w-48 h-48 rounded-full shadow-2xl flex items-center justify-center ${config.color} text-white relative overflow-hidden transition-colors duration-700`}
      >
        <div className={`absolute inset-0 bg-white/10 ${isPaused ? '' : 'animate-pulse'}`} />
        <AnimatePresence mode="wait">
          <motion.span
            key={!isActive ? 'warmup' : phase}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="font-serif italic text-2xl capitalize z-10 select-none"
          >
            {!isActive ? 'Center' : phase === 'holdPost' ? 'Hold' : phase}
          </motion.span>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
