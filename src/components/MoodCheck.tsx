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
    <div className="flex flex-wrap justify-center gap-4 py-4">
      {MOODS.map((mood) => {
        const Icon = mood.icon;
        const isSelected = selectedMood === mood.id;
        
        return (
          <motion.button
            key={mood.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(mood.id)}
            className={`flex flex-col items-center justify-center gap-2 p-2 rounded-2xl min-w-[70px] transition-all ${
              isSelected ? 'bg-soft-sage shadow-md' : 'bg-card/50 hover:bg-card border border-cream/30'
            }`}
          >
            <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : mood.color}`} />
            <span className={`text-[10px] font-bold uppercase tracking-[1px] ${isSelected ? 'text-white' : 'text-accent-green opacity-60'}`}>
              {mood.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
