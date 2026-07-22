import React, { useState } from 'react';
import { X, BarChart2, Settings as SettingsIcon, Info, Moon, CloudRain, Wind, Zap } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Player from '../music/Player';
import Timer from '../pomodoro/Timer';
import MoodSelector from '../mood/MoodSelector';
import StatsModal from '../stats/StatsModal';
import SettingsModal from '../settings/SettingsModal';
import MobileSheet from './MobileSheet';

const THEMES = [
  { id: 'night',      label: 'Night',  Icon: Moon,      color: '#a855f7' },
  { id: 'rainy',      label: 'Rain',   Icon: CloudRain, color: '#38bdf8' },
  { id: 'chill',      label: 'Chill',  Icon: Wind,      color: '#fb923c' },
  { id: 'productive', label: 'Focus',  Icon: Zap,       color: '#22c55e' },
];

export default function MobileMoreSheet({ onClose }) {
  const { theme, changeTheme } = useTheme();
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [openSection, setOpenSection] = useState('themes'); // themes | music | pomodoro | mood

  const toggle = (s) => setOpenSection(prev => prev === s ? null : s);

  return (
    <>
      <div className="mob-more-sheet">
        {/* Quick actions */}
        <div className="mob-more-actions">
          <button className="mob-more-action-btn" onClick={() => setShowStats(true)}>
            <BarChart2 size={20} />
            <span>Stats</span>
          </button>
          <button className="mob-more-action-btn" onClick={() => setShowSettings(true)}>
            <SettingsIcon size={20} />
            <span>Settings</span>
          </button>
        </div>

        {/* Themes */}
        <div className="mob-more-section">
          <button className="mob-more-sec-hdr" onClick={() => toggle('themes')}>
            <span className="font-pixel" style={{ fontSize: '0.65rem' }}>Themes</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem' }}>{openSection === 'themes' ? '−' : '+'}</span>
          </button>
          {openSection === 'themes' && (
            <div className="mob-theme-grid">
              {THEMES.map(({ id, label, Icon, color }) => (
                <button
                  key={id}
                  className={`mob-theme-btn ${theme === id ? 'active' : ''}`}
                  style={{ '--tc': color }}
                  onClick={() => changeTheme(id)}
                >
                  <Icon size={22} strokeWidth={1.8} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Music */}
        <div className="mob-more-section">
          <button className="mob-more-sec-hdr" onClick={() => toggle('music')}>
            <span className="font-pixel" style={{ fontSize: '0.65rem' }}>Music</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem' }}>{openSection === 'music' ? '−' : '+'}</span>
          </button>
          {openSection === 'music' && (
            <div className="mob-more-inner">
              <Player />
            </div>
          )}
        </div>

        {/* Pomodoro */}
        <div className="mob-more-section">
          <button className="mob-more-sec-hdr" onClick={() => toggle('pomodoro')}>
            <span className="font-pixel" style={{ fontSize: '0.65rem' }}>Pomodoro</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem' }}>{openSection === 'pomodoro' ? '−' : '+'}</span>
          </button>
          {openSection === 'pomodoro' && (
            <div className="mob-more-inner">
              <Timer />
            </div>
          )}
        </div>

        {/* Mood */}
        <div className="mob-more-section">
          <button className="mob-more-sec-hdr" onClick={() => toggle('mood')}>
            <span className="font-pixel" style={{ fontSize: '0.65rem' }}>Mood</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem' }}>{openSection === 'mood' ? '−' : '+'}</span>
          </button>
          {openSection === 'mood' && (
            <div className="mob-more-inner">
              <MoodSelector />
            </div>
          )}
        </div>
      </div>

      {showStats && (
        <MobileSheet title="Your Stats" onClose={() => setShowStats(false)}>
          <StatsModal onClose={() => setShowStats(false)} />
        </MobileSheet>
      )}
      {showSettings && (
        <MobileSheet title="Settings" onClose={() => setShowSettings(false)}>
          <SettingsModal onClose={() => setShowSettings(false)} />
        </MobileSheet>
      )}

      <style>{`
        .mob-more-sheet {
          padding: 16px 16px 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .mob-more-actions {
          display: flex; gap: 10px; margin-bottom: 4px;
        }
        .mob-more-action-btn {
          flex: 1;
          display: flex; flex-direction: column;
          align-items: center; gap: 6px;
          padding: 14px 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          color: rgba(255,255,255,0.7);
          font-family: 'Outfit', sans-serif;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.18s;
        }
        .mob-more-action-btn:active {
          background: rgba(168,85,247,0.15);
          border-color: rgba(168,85,247,0.4);
          color: var(--primary);
        }
        .mob-more-section {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          overflow: hidden;
        }
        .mob-more-sec-hdr {
          width: 100%;
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px;
          background: none; border: none;
          color: var(--text-color, #fff);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .mob-more-inner {
          padding: 0 12px 14px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .mob-theme-grid {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 8px; padding: 12px;
        }
        .mob-theme-btn {
          display: flex; flex-direction: column;
          align-items: center; gap: 5px;
          padding: 12px 4px;
          border-radius: 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.5);
          font-family: 'Outfit', sans-serif;
          font-size: 0.62rem;
          cursor: pointer;
          transition: all 0.18s;
        }
        .mob-theme-btn.active {
          background: color-mix(in srgb, var(--tc) 18%, transparent);
          border-color: color-mix(in srgb, var(--tc) 50%, transparent);
          color: var(--tc);
        }
        .mob-theme-btn:active {
          transform: scale(0.95);
        }
      `}</style>
    </>
  );
}
