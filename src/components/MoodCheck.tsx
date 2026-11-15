import { motion } from 'motion/react';
import { Smile, Frown, Meh, Heart, Zap } from 'lucide-react';

const MOODS = [
  { id: 'anxious', label: 'Anxious', icon: Frown, color: 'text-deep-forest' },
  { id: 'stressed', label: 'Stressed', icon: Meh, color: 'text-deep-forest' },
  { id: 'calm', label: 'Calm', icon: Smile, color: 'text-deep-forest' },
  { id: 'happy', label: 'Happy', icon: Heart, color: 'text-deep-forest' },
  { id: 'tired', label: 'Tired', icon: Zap, color: 'text-deep-forest' },
];

interface MoodCheckProps {
  onSelect: (moodId: string) => void;
  selectedMood?: string;
}

export default function MoodCheck({ onSelect, selectedMood }: MoodCheckProps) {
  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-3 py-3 w-full max-w-md mx-auto">
      {MOODS.map((mood) => {
        const Icon = mood.icon;
        const isSelected = selectedMood === mood.id;
        
        return (
          <motion.button
            key={mood.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(mood.id)}
            className={`flex flex-col items-center justify-center gap-1.5 p-2 sm:p-2.5 rounded-2xl min-w-0 w-full transition-all ${
              isSelected
                ? 'bg-accent-green text-white dark:text-zinc-950 shadow-md scale-105'
                : 'bg-card hover:bg-muted border border-cream/70'
            }`}
          >
            <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isSelected ? 'text-white dark:text-zinc-950' : mood.color}`} />
            <span
              className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-tight sm:tracking-[1px] truncate max-w-full ${
                isSelected ? 'text-white dark:text-zinc-950' : 'text-accent-green/80'
              }`}
            >
              {mood.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
