import React from 'react';
import { BarChart2, Settings, Moon, Music, Timer, Smile } from 'lucide-react';

const ITEMS = [
  { id: 'stats',     Icon: BarChart2, label: 'Stats' },
  { id: 'settings',  Icon: Settings,  label: 'Settings' },
  { id: 'themes',    Icon: Moon,      label: 'Themes' },
  { id: 'music',     Icon: Music,     label: 'Music' },
  { id: 'pomodoro',  Icon: Timer,     label: 'Pomodoro' },
  { id: 'mood',      Icon: Smile,     label: 'Mood' },
];

export default function MobileMorePopup({ onSelect, onClose }) {
  return (
    <>
      <div
        className="mmp-backdrop"
        onPointerDown={onClose}
        style={{ touchAction: 'none' }}
      />

      <div className="mmp-card">
        <div className="mmp-grid">
          {ITEMS.map(({ id, Icon, label }) => (
            <button
              key={id}
              className="mmp-tile"
              onClick={() => { onSelect(id); onClose(); }}
            >
              <span className="mmp-tile-icon"><Icon size={20} strokeWidth={1.8} /></span>
              <span className="mmp-tile-label">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .mmp-backdrop {
          position: fixed; inset: 0;
          z-index: 8900;
        }

        .mmp-card {
          position: fixed;
          bottom: calc(84px + env(safe-area-inset-bottom, 0px));
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 64px);
          max-width: 280px;
          background: rgba(10, 14, 30, 0.94);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 20px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07);
          z-index: 8950;
          overflow: hidden;
          animation: mmpSlideUp 0.2s cubic-bezier(0.34,1.56,0.64,1);
          padding: 10px;
        }
        @keyframes mmpSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(14px) scale(0.95); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }

        .mmp-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .mmp-tile {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 7px;
          padding: 14px 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          color: rgba(255,255,255,0.75);
          font-family: 'Outfit', sans-serif;
          font-size: 0.78rem; font-weight: 500;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          transition: background 0.12s, color 0.12s;
          min-height: 72px;
        }
        .mmp-tile:active {
          background: rgba(168,85,247,0.18);
          border-color: rgba(168,85,247,0.4);
          color: var(--primary, #a855f7);
        }

        .mmp-tile-icon {
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          color: rgba(255,255,255,0.5);
        }
        .mmp-tile:active .mmp-tile-icon {
          background: rgba(168,85,247,0.2);
          border-color: rgba(168,85,247,0.4);
          color: var(--primary, #a855f7);
        }

        .mmp-tile-label { line-height: 1; }
      `}</style>
    </>
  );
}

