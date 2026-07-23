import React from 'react';
import { Moon, ClipboardList, Calendar, BookOpen, MoreHorizontal } from 'lucide-react';

const TABS = [
  { id: 'themes',   Icon: Moon,           label: 'Themes' },
  { id: 'tasks',    Icon: ClipboardList,  label: 'Tasks' },
  { id: 'calendar', Icon: Calendar,       label: 'Calendar' },
  { id: 'study',    Icon: BookOpen,       label: 'Study' },
  { id: 'more',     Icon: MoreHorizontal, label: 'More' },
];

export default function MobileBottomNav({ activeTab, onTabChange }) {
  return (
    <nav className="mob-bottom-nav">
      {TABS.map(({ id, Icon, label }) => {
        return (
          <button
            key={id}
            className="mob-tab-btn"
            onClick={() => onTabChange(id)}
          >
            <span className="mob-tab-icon">
              <Icon size={20} strokeWidth={1.6} />
            </span>
            <span className="mob-tab-label">{label}</span>
          </button>
        );
      })}

      <style>{`
        .mob-bottom-nav {
          position: fixed;
          bottom: calc(16px + env(safe-area-inset-bottom, 0px));
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 48px);
          max-width: 420px;
          height: 60px;
          display: flex;
          align-items: stretch;
          padding: 0 10px;
          background: rgba(10, 14, 30, 0.82);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 24px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06);
          z-index: 9000;
          overflow: hidden;
        }
        .mob-tab-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.35);
          transition: color 0.2s ease;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          position: relative;
          min-height: 60px;
        }
        .mob-tab-icon {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mob-tab-label {
          font-family: 'Outfit', sans-serif;
          font-size: 0.6rem;
          font-weight: 500;
          letter-spacing: 0.03em;
        }
      `}</style>
    </nav>
  );
}
