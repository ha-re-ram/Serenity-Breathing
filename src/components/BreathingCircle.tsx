import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { BreathingConfig } from '../types';

interface BreathingCircleProps {
  config: BreathingConfig;
  isActive: boolean;
  phase: 'inhale' | 'hold' | 'exhale' | 'holdPost';
}

export default function BreathingCircle({ config, isActive, phase }: BreathingCircleProps) {
  useEffect(() => {
    if (!isActive) return;

    // Vibration feedback on phase start
    if (phase === 'inhale' || phase === 'exhale') {
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
  }, [isActive, phase]);

  const getScale = () => {
    if (phase === 'inhale') return 1.5;
    if (phase === 'hold') return 1.5;
    if (phase === 'exhale') return 1;
    return 1;
  };

  const currentDuration = (() => {
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
        }}
        transition={{ duration: currentDuration, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full border border-dashed border-soft-sage opacity-30"
      />
      
      {/* Main Circle */}
      <motion.div
        animate={{
          scale: getScale(),
        }}
        transition={{ duration: currentDuration, ease: "easeInOut" }}
        className={`w-48 h-48 rounded-full shadow-2xl flex items-center justify-center ${config.color} ${config.color === 'bg-cream' ? 'text-deep-forest' : 'text-white'} relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-white/10 animate-pulse" />
        <AnimatePresence mode="wait">
          <motion.span
            key={phase}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="font-serif italic text-2xl capitalize z-10"
          >
            {phase === 'holdPost' ? 'Hold' : phase}
          </motion.span>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
