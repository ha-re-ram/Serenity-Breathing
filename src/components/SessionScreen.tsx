import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Pause,
  Play,
  Sparkles,
  CheckCircle2,
  Volume2,
  VolumeX,
  Music,
  Sliders,
  Check,
} from 'lucide-react';
import { BreathingMode } from '../types';
import BreathingCircle from './BreathingCircle';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import MoodCheck from './MoodCheck';
import { useBreathingSessionMachine, SessionPhase } from '../machines/breathingSessionMachine';
import { useSoundMachine } from '../machines/soundMachine';
import { AmbientSoundType } from '../services/audioEngine';

export interface SessionScreenProps {
  mode: BreathingMode;
  customConfig?: { inhale: number; hold: number; exhale: number; holdPost: number };
  targetDurationMinutes?: number;
  onEnd: (duration: number, moodAfter?: string) => void;
  onCancel: () => void;
}

export default function SessionScreen({
  mode,
  customConfig,
  targetDurationMinutes = 5,
  onEnd,
  onCancel,
}: SessionScreenProps) {
  const [showSoundModal, setShowSoundModal] = useState(false);

  const {
    state,
    config,
    activePhases,
    progressPercentage,
    pause,
    resume,
    finish,
    skipPrepare,
    recordMoodAndEnd,
  } = useBreathingSessionMachine({
    mode,
    customConfig,
    targetDurationMinutes,
    onEnd,
    enableWarmup: true,
  });

  const {
    isMuted,
    voiceEnabled,
    bellEnabled,
    ambientSound,
    ambientVolume,
    toggleMute,
    setVoiceEnabled,
    setBellEnabled,
    setAmbientSound,
    setAmbientVolume,
    startAmbient,
    stopAmbient,
    triggerPhaseCue,
  } = useSoundMachine();

  const prevPhaseRef = useRef<SessionPhase | null>(null);

  // Manage ambient soundscape based on session lifecycle
  useEffect(() => {
    if (state.status === 'breathing') {
      startAmbient();
    } else {
      stopAmbient();
    }

    return () => {
      stopAmbient();
    };
  }, [state.status, startAmbient, stopAmbient]);

  // Trigger audio cues (voice + singing bowl chime) when breathing phase transitions
  useEffect(() => {
    if (state.status === 'breathing') {
      if (prevPhaseRef.current !== state.currentPhase) {
        triggerPhaseCue(state.currentPhase);
        prevPhaseRef.current = state.currentPhase;
      }
    }
  }, [state.status, state.currentPhase, triggerPhaseCue]);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCancel = () => {
    stopAmbient();
    onCancel();
  };

  // State: Reflecting (Mood after check-in)
  if (state.status === 'reflecting' || state.status === 'completed') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-page overflow-y-auto pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-col items-center justify-center min-h-full p-4 sm:p-8 text-center w-full max-w-sm mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full flex flex-col items-center gap-6"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-soft-sage/20 text-accent-green mx-auto flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-serif text-deep-forest mb-2">Session Complete</h2>
              <p className="text-accent-green/80 text-sm">
                {formatTime(state.elapsedSeconds)} of mindful breathing. How do you feel now?
              </p>
            </div>
            <div className="bg-card p-4 sm:p-6 rounded-[32px] border border-cream shadow-sm w-full">
              <MoodCheck onSelect={(mood) => recordMoodAndEnd(mood)} selectedMood={state.moodAfter} />
            </div>
            <Button
              variant="ghost"
              onClick={() => recordMoodAndEnd(undefined)}
              className="text-accent-green/70 hover:text-accent-green"
            >
              Skip
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-4 sm:p-8 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] bg-bg-page overflow-y-auto select-none min-h-[100dvh]">
      {/* Top Navigation Bar */}
      <div className="w-full flex justify-between items-center flex-shrink-0 max-w-2xl mx-auto mb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          className="rounded-full bg-cream/20 hover:bg-cream/40 text-accent-green"
          aria-label="Cancel session"
        >
          <X className="w-6 h-6" />
        </Button>

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold text-accent-green/70 uppercase tracking-[2px]">
            Mode
          </span>
          <h2 className="text-lg sm:text-xl font-serif text-deep-forest">{config.label}</h2>
        </div>

        {/* Audio & Playback Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className={`rounded-full transition-colors ${
              isMuted ? 'bg-rose-50 text-rose-500 hover:bg-rose-100' : 'bg-cream/20 hover:bg-cream/40 text-accent-green'
            }`}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            title={isMuted ? 'Unmute audio' : 'Mute audio'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSoundModal(true)}
            className="rounded-full bg-cream/20 hover:bg-cream/40 text-accent-green"
            aria-label="Sound settings"
            title="Sound settings"
          >
            <Music className="w-5 h-5" />
          </Button>

          {state.status === 'breathing' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={pause}
              className="rounded-full bg-cream/20 hover:bg-cream/40 text-accent-green"
              aria-label="Pause session"
            >
              <Pause className="w-5 h-5" />
            </Button>
          )}

          {state.status === 'paused' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={resume}
              className="rounded-full bg-accent-green text-white hover:bg-deep-forest"
              aria-label="Resume session"
            >
              <Play className="w-5 h-5 fill-current" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Focus / Circle Animation */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 sm:gap-6 w-full max-w-lg mx-auto py-2">
        <div className="relative flex-shrink-0">
          <BreathingCircle
            config={config}
            isActive={state.status === 'breathing'}
            phase={state.currentPhase}
            isPaused={state.status === 'paused'}
          />
          <div
            className={`absolute inset-0 -z-10 blur-[100px] opacity-20 rounded-full transition-colors duration-1000 ${config.color}`}
          />
        </div>

        <div className="text-center w-full flex flex-col items-center gap-3 sm:gap-4">
          {/* Phase Indicators */}
          {state.status !== 'preparing' && (
            <div className="flex justify-center gap-2 sm:gap-4 w-full px-4 sm:px-12">
              {activePhases.map((p) => {
                const isCurrent = state.currentPhase === p.phase;
                const label = p.phase === 'holdPost' ? 'Hold' : p.phase;
                return (
                  <div key={p.phase} className="flex flex-col items-center gap-1.5 flex-1">
                    <div
                      className={`h-1.5 w-full rounded-full transition-all duration-500 ${
                        isCurrent
                          ? 'bg-accent-green shadow-[0_0_10px_rgba(36,92,66,0.3)]'
                          : 'bg-cream/40'
                      }`}
                    />
                    <span
                      className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-opacity capitalize ${
                        isCurrent ? 'opacity-100 text-accent-green' : 'opacity-40 text-deep-forest'
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Current Phase or Warmup Display */}
          <div className="relative h-20 sm:h-24 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {state.status === 'preparing' ? (
                <motion.div
                  key={`warmup-${state.warmupCountdown}`}
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.1, y: -10 }}
                  className="flex flex-col items-center"
                >
                  <span className="text-xs font-bold text-accent-green/80 uppercase tracking-[3px] mb-1">
                    Prepare Yourself
                  </span>
                  <h2 className="text-4xl sm:text-5xl font-serif italic text-accent-green tracking-tight">
                    {state.warmupCountdown}
                  </h2>
                  <button
                    onClick={skipPrepare}
                    className="mt-1 text-[10px] font-bold uppercase tracking-wider text-accent-green/60 hover:text-accent-green transition-opacity"
                  >
                    Start Now
                  </button>
                </motion.div>
              ) : state.status === 'paused' ? (
                <motion.div
                  key="paused"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="flex flex-col items-center"
                >
                  <h2 className="text-3xl sm:text-4xl font-serif italic text-accent-green mb-2">Paused</h2>
                  <Button
                    onClick={resume}
                    size="sm"
                    className="rounded-full bg-accent-green text-white dark:text-zinc-950 hover:bg-deep-forest px-6 text-xs font-bold uppercase tracking-wider"
                  >
                    <Play className="w-3.5 h-3.5 mr-1.5 fill-current" /> Resume
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key={state.currentPhase}
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.1, y: -10 }}
                  className="flex flex-col items-center"
                >
                  <h2 className="text-4xl sm:text-5xl font-serif italic text-accent-green capitalize mb-1 tracking-tight">
                    {state.currentPhase === 'holdPost' ? 'Hold' : state.currentPhase}
                  </h2>
                  <div className="text-xl sm:text-2xl font-mono text-deep-forest font-bold">
                    {state.phaseCountdown}s
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Time Tracking */}
          <div className="flex items-center gap-3 text-xs sm:text-sm font-mono text-deep-forest/60 tracking-[2px] font-light">
            <span>{formatTime(state.elapsedSeconds)}</span>
            <span>/</span>
            <span>{formatTime(state.targetSeconds)}</span>
            {state.targetReached && (
              <span className="flex items-center gap-1 text-[10px] font-sans font-bold text-accent-green bg-soft-sage/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-soft-sage" /> Goal Met
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Actions and Progress Bar */}
      <div className="w-full max-w-lg mx-auto flex flex-col gap-3 items-center pb-2 flex-shrink-0">
        <div className="w-full h-1.5 bg-cream/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent-green shadow-[0_0_12px_rgba(36,92,66,0.3)] dark:shadow-[0_0_12px_rgba(82,183,136,0.4)] transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="flex items-center gap-3">
          {state.status === 'paused' ? (
            <Button
              variant="outline"
              onClick={resume}
              className="text-xs font-bold text-accent-green border-cream uppercase tracking-[2px] rounded-full px-6 py-2.5"
            >
              Resume
            </Button>
          ) : null}

          <Button
            variant="ghost"
            onClick={finish}
            className="text-xs font-bold text-accent-green uppercase tracking-[2px] opacity-80 hover:opacity-100 transition-all hover:bg-muted rounded-full px-6 sm:px-8 py-2.5"
          >
            Finish Session
          </Button>
        </div>
      </div>

      {/* Audio & Ambience Settings Modal */}
      <AnimatePresence>
        {showSoundModal && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card text-card-foreground rounded-[32px] p-5 sm:p-8 max-w-sm w-full border border-cream shadow-2xl flex flex-col gap-5 max-h-[90dvh] overflow-y-auto"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-soft-sage" />
                  <h3 className="text-lg font-serif text-deep-forest dark:text-foreground">Sound & Ambience</h3>
                </div>
                <button
                  onClick={() => setShowSoundModal(false)}
                  className="p-1 rounded-full text-accent-green opacity-50 hover:opacity-100 hover:bg-cream/20"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Toggles */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-deep-forest">Voice Guidance</p>
                    <p className="text-[10px] text-accent-green opacity-60">"Breathe in", "Hold", "Breathe out"</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    className={`w-12 h-7 rounded-full p-1 transition-colors ${
                      voiceEnabled ? 'bg-accent-green' : 'bg-cream/40'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        voiceEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-deep-forest">Singing Bowl Chime</p>
                    <p className="text-[10px] text-accent-green opacity-60">Tibetan 432Hz bell on phase transition</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBellEnabled(!bellEnabled)}
                    className={`w-12 h-7 rounded-full p-1 transition-colors ${
                      bellEnabled ? 'bg-accent-green' : 'bg-cream/40'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        bellEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Ambient Sound Selection */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-accent-green/80 uppercase tracking-wider">
                  Background Ambience
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'bowl' as AmbientSoundType, label: 'Zen Bowl (432Hz)' },
                    { id: 'ocean' as AmbientSoundType, label: 'Ocean Waves' },
                    { id: 'rain' as AmbientSoundType, label: 'Gentle Rain' },
                    { id: 'none' as AmbientSoundType, label: 'Silence' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setAmbientSound(s.id)}
                      className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all flex items-center justify-between ${
                        ambientSound === s.id
                          ? 'border-accent-green bg-accent-green/10 text-accent-green'
                          : 'border-cream bg-bg-page/40 text-deep-forest hover:border-soft-sage/40'
                      }`}
                    >
                      <span>{s.label}</span>
                      {ambientSound === s.id && <Check className="w-3.5 h-3.5 text-accent-green" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ambient Volume Slider */}
              {ambientSound !== 'none' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-accent-green opacity-60 uppercase tracking-wider">
                      Ambience Volume
                    </span>
                    <span className="font-mono text-accent-green">{Math.round(ambientVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={ambientVolume}
                    onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                    className="w-full accent-accent-green cursor-pointer"
                  />
                </div>
              )}

              <Button
                onClick={() => setShowSoundModal(false)}
                className="w-full h-11 rounded-2xl bg-accent-green hover:bg-deep-forest text-white dark:text-zinc-950 font-bold"
              >
                Done
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
