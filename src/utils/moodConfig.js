import { Smile, Meh, Frown, Coffee, Zap, Moon, CloudRain, Flame } from 'lucide-react';

export const MOODS = [
  { id: 'great', label: 'Great', icon: Smile, themeHint: 'chill', color: '#facc15' }, // Yellow
  { id: 'good', label: 'Good', icon: Coffee, themeHint: 'productive', color: '#22c55e' }, // Green
  { id: 'okay', label: 'Okay', icon: Meh, themeHint: 'chill', color: '#38bdf8' }, // Light Blue
  { id: 'meh', label: 'Meh', icon: CloudRain, themeHint: 'rainy', color: '#94a3b8' }, // Slate Gray
  { id: 'bad', label: 'Bad', icon: Frown, themeHint: 'night', color: '#a855f7' }, // Purple
  { id: 'angry', label: 'Angry', icon: Flame, themeHint: 'night', color: '#ef4444' }, // Red
  { id: 'tired', label: 'Tired', icon: Moon, themeHint: 'night', color: '#6366f1' }, // Indigo
  { id: 'energetic', label: 'Energetic', icon: Zap, themeHint: 'productive', color: '#f97316' } // Orange
];

export const getMoodConfig = (id) => MOODS.find(m => m.id === id) || MOODS[2];
