import { Moon, CloudRain, Wind, Zap, Palette, Music2, Timer as TimerIcon, CheckSquare, Smile } from 'lucide-react';

export const THEMES = [
  { id: 'night',      label: 'Night',      Icon: Moon,      color: '#a855f7' }, // Purple
  { id: 'rainy',      label: 'Rain',       Icon: CloudRain, color: '#38bdf8' }, // Sky Blue
  { id: 'chill',      label: 'Chill',      Icon: Wind,      color: '#fb923c' }, // Sunset Orange
  { id: 'productive', label: 'Focus',      Icon: Zap,       color: '#22c55e' }, // Emerald Green
];

export const SIDEBAR_SECTIONS = [
  { id: 'themes',   Icon: Palette,     label: 'Themes'   },
  { id: 'music',    Icon: Music2,      label: 'Music'    },
  { id: 'pomodoro', Icon: TimerIcon,   label: 'Pomodoro' },
  { id: 'tasks',    Icon: CheckSquare, label: 'Tasks'    },
  { id: 'mood',     Icon: Smile,       label: 'Mood'     },
];

export const DEFAULT_BACKGROUNDS = [
  '/bg/night1.gif', '/bg/night2.gif', '/bg/night3.gif',
  '/bg/rain1.gif', '/bg/rain2.gif', '/bg/rain3.gif',
  '/bg/chill1.gif', '/bg/chill2.gif', '/bg/chill3.gif',
  '/bg/focus1.gif', '/bg/focus2.gif', '/bg/focus3.gif',
];
