import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Wind, CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface OnboardingModalProps {
  onComplete: (data: { reminderTime: string; customBreathing: { inhale: number; hold: number; exhale: number; holdPost: number } }) => void;
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [inhale, setInhale] = useState(4);
  const [hold, setHold] = useState(4);
  const [exhale, setExhale] = useState(4);
  const [holdPost, setHoldPost] = useState(4);

  const recommendations = [
    { label: 'Box Breathing', inhale: 4, hold: 4, exhale: 4, holdPost: 4, desc: 'For focus and stress relief' },
    { label: 'Relaxing 4-7-8', inhale: 4, hold: 7, exhale: 8, holdPost: 0, desc: 'For better sleep' },
    { label: 'Balanced 5-5', inhale: 5, hold: 0, exhale: 5, holdPost: 0, desc: 'For general coherence' },
  ];

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else {
      onComplete({
        reminderTime,
        customBreathing: { inhale, hold, exhale, holdPost }
      });
    }
  };

  return (
    // Full-screen overlay with scroll support
    <div className="fixed inset-0 z-[100] bg-deep-forest/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-bg-page rounded-[40px] shadow-2xl border border-cream my-auto"
      >
        <div className="p-6 sm:p-8 flex flex-col gap-6">
          {/* Progress indicator */}
          <div className="flex justify-between items-center">
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`h-1 rounded-full transition-all ${step >= i ? 'w-8 bg-accent-green' : 'w-4 bg-cream'}`} />
              ))}
            </div>
            <span className="text-[10px] font-bold text-accent-green uppercase tracking-widest opacity-50">Step {step} of 3</span>
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-5"
              >
                <div className="w-14 h-14 bg-soft-sage/10 rounded-3xl flex items-center justify-center text-soft-sage">
                  <Clock className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif text-deep-forest mb-2">Set a Reminder</h2>
                  <p className="text-accent-green opacity-70 text-sm leading-relaxed">Consistency is key to mindfulness. When would you like to take a moment for yourself?</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reminder">Daily Reminder Time</Label>
                  <Input
                    id="reminder"
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="h-12 rounded-2xl border-cream bg-white text-base font-bold text-deep-forest"
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-5"
              >
                <div className="w-14 h-14 bg-soft-sage/10 rounded-3xl flex items-center justify-center text-soft-sage">
                  <Wind className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif text-deep-forest mb-2">Your Rhythm</h2>
                  <p className="text-accent-green opacity-70 text-sm leading-relaxed">Customize your breathing cycle or pick a recommendation below.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Inhale (s)', val: inhale, set: setInhale },
                    { label: 'Hold (s)', val: hold, set: setHold },
                    { label: 'Exhale (s)', val: exhale, set: setExhale },
                    { label: 'Hold Post (s)', val: holdPost, set: setHoldPost },
                  ].map((item) => (
                    <div key={item.label} className="space-y-1">
                      <Label className="text-[10px] uppercase opacity-50">{item.label}</Label>
                      <Input
                        type="number"
                        min={0}
                        max={30}
                        value={item.val}
                        onChange={(e) => item.set(Number(e.target.value))}
                        className="h-11 rounded-xl border-cream"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-bold text-accent-green uppercase tracking-widest opacity-50">Recommended Presets</p>
                  {recommendations.map((rec, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInhale(rec.inhale);
                        setHold(rec.hold);
                        setExhale(rec.exhale);
                        setHoldPost(rec.holdPost);
                      }}
                      className="w-full p-3 rounded-2xl border border-cream bg-white hover:border-soft-sage transition-all text-left flex justify-between items-center group"
                    >
                      <div>
                        <p className="font-bold text-deep-forest text-sm group-hover:text-accent-green">{rec.label}</p>
                        <p className="text-[10px] text-accent-green opacity-60">{rec.desc}</p>
                      </div>
                      <div className="text-[10px] font-mono text-soft-sage">{rec.inhale}-{rec.hold}-{rec.exhale}-{rec.holdPost}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-5 items-center text-center"
              >
                <div className="w-20 h-20 bg-soft-sage/10 rounded-[40px] flex items-center justify-center text-soft-sage">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-serif text-deep-forest mb-2">All Set!</h2>
                  <p className="text-accent-green opacity-70 text-sm leading-relaxed">Your personalized Serenity experience is ready. You can always change these settings in your profile.</p>
                </div>

                <Card className="border border-cream shadow-none bg-white rounded-3xl p-5 text-left w-full">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-accent-green opacity-60">Daily Reminder</span>
                      <span className="font-bold text-deep-forest">{reminderTime}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-accent-green opacity-60">Custom Cycle</span>
                      <span className="font-bold text-deep-forest">{inhale}-{hold}-{exhale}-{holdPost}s</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA Button */}
          <Button
            onClick={handleNext}
            className="w-full h-13 rounded-full bg-accent-green text-white font-bold shadow-lg shadow-accent-green/20 mt-2"
          >
            {step === 3 ? 'Get Started' : 'Continue'}
            {step < 3 && <ChevronRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
