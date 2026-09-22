import { Moon, ClipboardList, Calendar, BookOpen, BarChart2, Image as ImageIcon, Settings, Music, Timer, Smile, Users } from 'lucide-react';

// Single source of truth for every destination reachable from the mobile
// bottom nav / "More" popup. `kind` tells MobileLayout how to open it:
// 'tray' (slide-up tray), 'sheet' (activeSheet overlay), or 'study' (full Study Desk).
export const MOBILE_NAV_ITEMS = [
  { id: 'themes',    Icon: Moon,          label: 'Themes',     kind: 'sheet' },
  { id: 'tasks',     Icon: ClipboardList, label: 'Tasks',      kind: 'tray'  },
  { id: 'calendar',  Icon: Calendar,      label: 'Calendar',   kind: 'tray'  },
  { id: 'study',     Icon: BookOpen,      label: 'Study',      kind: 'study' },
  { id: 'stats',     Icon: BarChart2,     label: 'Stats',      kind: 'sheet' },
  { id: 'settings',  Icon: ImageIcon,     label: 'Wallpapers', kind: 'sheet' },
  { id: 'sync',      Icon: Settings,      label: 'Settings',   kind: 'sheet' },
  { id: 'music',     Icon: Music,         label: 'Music',      kind: 'sheet' },
  { id: 'pomodoro',  Icon: Timer,         label: 'Pomodoro',   kind: 'sheet' },
  { id: 'mood',      Icon: Smile,         label: 'Mood',       kind: 'sheet' },
  { id: 'community', Icon: Users,         label: 'Wall',       kind: 'sheet' },
];

// "More" is always a fixed 5th slot, so the bottom bar holds 4 user-picked items.
export const MAX_PRIMARY_NAV_ITEMS = 4;
export const DEFAULT_PRIMARY_NAV_IDS = ['themes', 'tasks', 'calendar', 'study'];

export function getNavItem(id) {
  return MOBILE_NAV_ITEMS.find(i => i.id === id);
}
