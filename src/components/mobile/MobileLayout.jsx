import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import MobileBottomNav from './MobileBottomNav';
import MobileCalendar from './MobileCalendar';
import MobileFloatingTray from './MobileFloatingTray';
import MobileMorePopup from './MobileMorePopup';
import MobileSheet from './MobileSheet';

import TaskList from '../tasks/TaskList';
import StickyNoteBoard from '../notes/StickyNoteBoard';
import StudyDesk from '../study/StudyDesk';
import BgmPlayer from '../bgm/BgmPlayer';
import StatsModal from '../stats/StatsModal';
import SettingsModal from '../settings/SettingsModal';
import SyncModal from '../settings/SyncModal';
import Player from '../music/Player';
import Timer from '../pomodoro/Timer';
import MoodSelector from '../mood/MoodSelector';
import { useTheme as useThemeCtx } from '../../context/ThemeContext';
import AchievementManager from '../stats/AchievementManager';
import StreakCounter from '../stats/StreakCounter';
import LoadingScreen from '../LoadingScreen';
import WelcomeModal from '../WelcomeModal';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Moon, CloudRain, Wind, Zap } from 'lucide-react';

const THEMES = [
  { id: 'night',      label: 'Night',  Icon: Moon,      color: '#a855f7' },
  { id: 'rainy',      label: 'Rain',   Icon: CloudRain, color: '#38bdf8' },
  { id: 'chill',      label: 'Chill',  Icon: Wind,      color: '#fb923c' },
  { id: 'productive', label: 'Focus',  Icon: Zap,       color: '#22c55e' },
];

function BackgroundLayer({ bgImage }) {
  const [layers, setLayers] = useState([{ id: Date.now() + Math.random().toString(36).substring(7), src: bgImage }]);

  useEffect(() => {
    setLayers(prev => {
      if (prev[prev.length - 1].src === bgImage) return prev;
      return [...prev, { id: Date.now() + Math.random().toString(36).substring(7), src: bgImage }];
    });
    const timer = setTimeout(() => {
      setLayers(prev => prev.slice(-1));
    }, 1500);
    return () => clearTimeout(timer);
  }, [bgImage]);

  return (
    <>
      {layers.map((layer, i) => (
        <div
          key={layer.id}
          style={{
            position: 'fixed', inset: 0, zIndex: 0,
            backgroundImage: `url('${layer.src}')`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: i === layers.length - 1 ? 1 : 0,
            transition: 'opacity 1.5s ease',
          }}
        />
      ))}
    </>
  );
}

export default function MobileLayout() {
  const { bgImage, theme, changeTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('home');
  const [showStudy, setShowStudy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenWelcome, setHasSeenWelcome] = useLocalStorage('moodbyte_welcome_main', false);
  const [showMorePopup, setShowMorePopup] = useState(false);
  const [activeTray, setActiveTray] = useState(null); // 'tasks' | 'calendar'
  const [activeSheet, setActiveSheet] = useState(null);

  const handleTabChange = (tabId) => {
    // If we are clicking 'more', toggle it, but maybe close trays/sheets? 
    // Usually more popup just overlays. We'll just toggle it.
    if (tabId === 'more') {
      setShowMorePopup(!showMorePopup);
      return;
    }
    
    // For any other tab, close the More popup
    setShowMorePopup(false);
    
    // If the user clicks the currently active tab/tray/sheet, close it (toggle behavior)
    if (tabId === 'study') {
      setShowStudy(true);
      setActiveTab('study');
      setActiveTray(null);
      setActiveSheet(null);
      return;
    }

    if (tabId === 'themes') {
      if (activeSheet === 'themes') {
        setActiveSheet(null);
      } else {
        setActiveSheet('themes');
        setActiveTray(null);
      }
      return;
    }

    if (tabId === 'tasks' || tabId === 'calendar') {
      if (activeTray === tabId) {
        setActiveTray(null); // toggle close
      } else {
        setActiveTab(tabId);
        setActiveTray(tabId);
        setActiveSheet(null); // Close any open sheets
      }
    } else {
      setActiveTab(tabId);
      setActiveTray(null);
      setActiveSheet(null);
    }
  };

  const handleMoreSelect = (id) => {
    setActiveSheet(id);
    setShowMorePopup(false);
  };

  return (
    <div className="mob-layout">
      <AchievementManager />
      <StreakCounter />
      {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      {!isLoading && !hasSeenWelcome && (
        <WelcomeModal
          title="Welcome to MoodByte!"
          message="<p>Hi there! MoodByte is your personal aesthetic space to relax, focus, and get things done.</p><p>Everything is designed to help you stay in the zone. Enjoy your stay!</p>"
          onGotIt={() => setHasSeenWelcome(true)}
        />
      )}

      <BackgroundLayer bgImage={bgImage} />

      {/* Floating BGM button (top-right) */}
      <div className="mob-bgm-float">
        <BgmPlayer />
      </div>

      {/* Board is ALWAYS visible */}
      <div className="mob-content">
        <div className="mob-board-canvas">
          <StickyNoteBoard />
        </div>
      </div>

      {/* Tasks tray */}
      {activeTray === 'tasks' && (
        <MobileFloatingTray title="Tasks" onClose={() => setActiveTray(null)} heightVh={58}>
          <TaskList />
        </MobileFloatingTray>
      )}

      {/* Calendar tray */}
      {activeTray === 'calendar' && (
        <MobileFloatingTray title="Calendar" onClose={() => setActiveTray(null)} heightVh={70}>
          <MobileCalendar />
        </MobileFloatingTray>
      )}

      {/* Study Desk Overlay */}
      {showStudy && <StudyDesk onClose={() => setShowStudy(false)} />}

      {/* More popup */}
      {showMorePopup && (
        <MobileMorePopup
          onSelect={handleMoreSelect}
          onClose={() => setShowMorePopup(false)}
        />
      )}

      {/* Sheets opened from More popup */}
      {activeSheet === 'stats' && (
        <StatsModal onClose={() => setActiveSheet(null)} />
      )}
      {activeSheet === 'settings' && (
        <SettingsModal onClose={() => setActiveSheet(null)} />
      )}
      {activeSheet === 'sync' && (
        <SyncModal onClose={() => setActiveSheet(null)} />
      )}
      {activeSheet === 'themes' && (
        <>
          <div
            style={{ position:'fixed', inset:0, zIndex: 8900, touchAction: 'none' }}
            onPointerDown={() => setActiveSheet(null)}
          />
          <div style={{
            position: 'fixed',
            bottom: 'calc(84px + env(safe-area-inset-bottom, 0px))',
            left: 16, right: 16, margin: '0 auto',
            width: 'calc(100% - 32px)', maxWidth: 380,
            background: 'rgba(10,14,30,0.94)',
            backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 20,
            boxShadow: '0 8px 40px rgba(0,0,0,0.55)',
            zIndex: 8950,
            padding: 12,
            display: 'flex', gap: 8,
            animation: 'mobSheetSlideUp 0.2s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            {THEMES.map(({ id, label, Icon, color }) => (
              <button
                key={id}
                onClick={() => { changeTheme(id); }}
                style={{
                  flex: 1,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 6,
                  padding: '12px 4px',
                  borderRadius: 14,
                  background: theme === id
                    ? `color-mix(in srgb, ${color} 20%, transparent)`
                    : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${theme === id ? color + '80' : 'rgba(255,255,255,0.08)'}`,
                  color: theme === id ? color : 'rgba(255,255,255,0.6)',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '0.68rem', fontWeight: 500,
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={22} strokeWidth={1.7} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Single always-mounted Player — keeps audio alive and shared with Study Desk pill */}
      <div style={{ display: activeSheet === 'music' ? 'block' : 'none',
        position: 'fixed', inset: 0, zIndex: 8900, pointerEvents: activeSheet === 'music' ? 'auto' : 'none'
      }}>
        {/* Backdrop dismiss */}
        {activeSheet === 'music' && (
          <div style={{ position:'absolute', inset:0, zIndex:0 }}
            onPointerDown={() => setActiveSheet(null)} />
        )}
        <div className="mobile-player-wrapper" style={{
          position: 'fixed',
          bottom: 'calc(84px + env(safe-area-inset-bottom, 0px))',
          left: 16, right: 16,
          margin: '0 auto', maxWidth: 420,
          zIndex: 8950,
          animation: activeSheet === 'music' ? 'mobSheetSlideUp 0.2s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
        }}>
          <Player isMobile={true} />
        </div>
      </div>
      {activeSheet === 'pomodoro' && (
        <MobileSheet title="Pomodoro" onClose={() => setActiveSheet(null)}>
          <div style={{ padding: '0 16px' }}><Timer /></div>
        </MobileSheet>
      )}
      {activeSheet === 'mood' && (
        <MobileSheet title="Mood" onClose={() => setActiveSheet(null)}>
          <div style={{ padding: '0 16px' }}><MoodSelector /></div>
        </MobileSheet>
      )}

      <MobileBottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      <style>{`
        @keyframes mobSheetSlideUp {
          from { transform: translateY(15px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        .mob-layout {
          width: 100vw;
          height: 100vh;
          height: 100dvh;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        /* Hide desktop-only elements inside StickyNoteBoard */
        .mob-layout .top-left-controls { display: none !important; }
        .mob-layout .daily-quote-widget { display: none !important; }

        /* Floating BGM */
        .mob-bgm-float {
          position: fixed;
          top: 14px; right: 14px;
          z-index: 8500;
        }
        /* Make BGM button compact on mobile */
        .mob-bgm-float .bgm-label { display: none; }
        .mob-bgm-float .bgm-player-wrapper {
          background: rgba(8,12,26,0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 50%;
          padding: 0;
        }
        .mob-bgm-float .bgm-toggle-btn {
          width: 40px; height: 40px;
          border-radius: 50%;
          padding: 0;
          display: flex; align-items: center; justify-content: center;
        }

        /* Content area */
        .mob-content {
          flex: 1;
          position: relative;
          overflow: hidden;
          z-index: 1;
        }

        .mob-tab-pane {
          position: absolute;
          inset: 0;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.22s ease;
        }
        .mob-tab-pane.visible {
          opacity: 1;
          pointer-events: all;
        }

        /* Home board — pannable canvas */
        .mob-board-canvas {
          width: 100%;
          height: 100%;
          overflow: auto;
          -webkit-overflow-scrolling: touch;
        }
        .mob-board-canvas .sticky-board {
          width: 200vw;
          min-height: 180vh;
          pointer-events: auto !important;
        }

        /* Regular scrollable pages */
        .mob-scroll-page {
          width: 100%;
          height: 100%;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 16px 14px calc(96px + env(safe-area-inset-bottom)) 14px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .mob-page-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.5rem;
          margin: 0;
          padding-top: 4px;
        }

        .mob-inner-glass {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          padding: 16px;
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
