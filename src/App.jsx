import React, { useState, useEffect } from 'react';
import { useTheme } from './context/ThemeContext';
import MoodSelector from './components/mood/MoodSelector';
import TaskList from './components/tasks/TaskList';
import Timer from './components/pomodoro/Timer';
import StickyNoteBoard from './components/notes/StickyNoteBoard';
import Player from './components/music/Player';
import LoadingScreen from './components/LoadingScreen';
import WelcomeModal from './components/WelcomeModal';
import AchievementManager from './components/stats/AchievementManager';
import StreakCounter from './components/stats/StreakCounter';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useIsMobile } from './hooks/useIsMobile';
import MobileLayout from './components/mobile/MobileLayout';

import { Moon, CloudRain, Wind, Zap, ChevronRight, ChevronLeft } from 'lucide-react';

const THEMES = [
  { id: 'night',      label: 'Night',      Icon: Moon,      color: '#a855f7' }, // Purple
  { id: 'rainy',      label: 'Rain',       Icon: CloudRain, color: '#38bdf8' }, // Sky Blue
  { id: 'chill',      label: 'Chill',      Icon: Wind,      color: '#fb923c' }, // Sunset Orange
  { id: 'productive', label: 'Focus',      Icon: Zap,       color: '#22c55e' }, // Emerald Green
];

function BackgroundManager({ bgImage }) {
  const [layers, setLayers] = useState([{ id: Date.now(), src: bgImage }]);

  useEffect(() => {
    // When bgImage changes, add it as a new layer
    setLayers(prev => {
      if (prev[prev.length - 1].src === bgImage) return prev;
      return [...prev, { id: Date.now(), src: bgImage }];
    });

    // Cleanup old layers after transition (1.5s)
    const timer = setTimeout(() => {
      setLayers(prev => prev.slice(-1));
    }, 1500);
    return () => clearTimeout(timer);
  }, [bgImage]);

  return (
    <div className="bg-manager">
      {layers.map((layer, i) => (
        <div
          key={layer.id}
          className="bg-layer"
          style={{
            backgroundImage: `url('${layer.src}')`,
            opacity: i === layers.length - 1 ? 1 : 0, // fade out old layers
          }}
        />
      ))}
    </div>
  );
}

function App() {
  const { theme, bgImage, changeTheme } = useTheme();
  const isMobile = useIsMobile();
  const [minimized, setMinimized] = React.useState({});
  const [sidebarHidden, setSidebarHidden] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasSeenAppWelcome, setHasSeenAppWelcome] = useLocalStorage('moodbyte_welcome_main', false);
  const [showAbout, setShowAbout] = React.useState(false);

  const toggle = (key) => setMinimized(prev => ({ ...prev, [key]: !prev[key] }));

  // Render mobile layout on small screens
  if (isMobile) return <MobileLayout />;

  return (
    <div className="app-container" style={{ '--sidebar-offset': sidebarHidden ? '40px' : '360px' }}>
      <AchievementManager />
      <StreakCounter />
      {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      {!isLoading && !hasSeenAppWelcome && (
        <WelcomeModal 
          title="Welcome to MoodByte!" 
          message="<p>Hi there! MoodByte is your personal aesthetic space to relax, focus, and get things done.</p><p>You can <strong>pin notes</strong> to the board, change the <strong>dynamic background themes</strong>, listen to <strong>Spotify playlists or local music</strong>, and track your tasks.</p><p>Everything is designed to help you stay in the zone. Enjoy your stay!</p>" 
          onGotIt={() => setHasSeenAppWelcome(true)} 
        />
      )}
      <BackgroundManager bgImage={bgImage} />
      
      {/* Main Content Area (Notes Wall) */}
      <main className="main-content">
        <div className="wall-content">
          <StickyNoteBoard />
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className={`glass-panel sidebar ${sidebarHidden ? 'hidden' : ''}`}>
        
        {/* Toggle Button */}
        <button 
          className="sidebar-toggle-btn"
          onClick={() => setSidebarHidden(!sidebarHidden)}
          title={sidebarHidden ? "Show Sidebar" : "Hide Sidebar"}
        >
          {sidebarHidden ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>

        <div className="sidebar-content">
          
          {/* Themes Section */}
          <div className="tool-section">
            <div className="section-header" onClick={() => toggle('themes')}>
              <h3 className="font-pixel">Themes</h3>
              <span className="minimize-icon">{minimized.themes ? '+' : '−'}</span>
            </div>
            <div className={`section-body ${minimized.themes ? 'collapsed' : ''}`}>
              <div className="theme-options inner-glass">
                {THEMES.map(({ id, label, Icon, color }) => (
                  <button 
                    key={id}
                    className={`theme-btn ${theme === id ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); changeTheme(id); }}
                    title={label}
                    style={{ '--theme-color': color }}
                  >
                    <Icon size={20} strokeWidth={1.8} />
                    <span className="theme-label">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Music Section */}
          <div className="tool-section">
            <div className="section-header" onClick={() => toggle('music')}>
              <h3 className="font-pixel">Music</h3>
              <span className="minimize-icon">{minimized.music ? '+' : '−'}</span>
            </div>
            <div className={`section-body ${minimized.music ? 'collapsed' : ''}`}>
              <Player />
            </div>
          </div>

          {/* Pomodoro Section */}
          <div className="tool-section">
            <div className="section-header" onClick={() => toggle('pomodoro')}>
              <h3 className="font-pixel">Pomodoro</h3>
              <span className="minimize-icon">{minimized.pomodoro ? '+' : '−'}</span>
            </div>
            <div className={`section-body ${minimized.pomodoro ? 'collapsed' : ''}`}>
              <div className="inner-glass">
                <Timer />
              </div>
            </div>
          </div>

          {/* Tasks Section */}
          <div className="tool-section">
            <div className="section-header" onClick={() => toggle('tasks')}>
              <h3 className="font-pixel">Tasks</h3>
              <span className="minimize-icon">{minimized.tasks ? '+' : '−'}</span>
            </div>
            <div className={`section-body ${minimized.tasks ? 'collapsed' : ''}`}>
              <div className="inner-glass">
                <TaskList />
              </div>
            </div>
          </div>

          {/* Mood Section */}
          <div className="tool-section">
            <div className="section-header" onClick={() => toggle('mood')}>
              <h3 className="font-pixel">Mood</h3>
              <span className="minimize-icon">{minimized.mood ? '+' : '−'}</span>
            </div>
            <div className={`section-body ${minimized.mood ? 'collapsed' : ''}`}>
              <div className="inner-glass">
                <MoodSelector />
              </div>
            </div>
          </div>

          {/* About Button */}
          <button className="about-btn" onClick={() => setShowAbout(true)}>About</button>

        </div>
      </aside>

      {/* About Modal */}
      {showAbout && (
        <div className="about-overlay" onClick={() => setShowAbout(false)}>
          <div className="about-modal" onClick={e => e.stopPropagation()}>
            <h2 className="about-modal-title">About MoodByte</h2>
            <p className="about-modal-text">
              MoodByte started as a random thought in 2025 — what if a sticky note board had themes, a Pomodoro timer, and a music player? It grew into something more: a safe space for your thoughts, whether it's schoolwork or personal stuff. No hard productivity pressure, just a cozy home for whatever's on your mind.
            </p>
            <p className="about-modal-text">
              This is a full rebuild of the original MoodByte, shelved for a while because I hit the limits of what I knew at the time. Now, it's back and better than ever, built during late nights in a dorm room, driven by a love for pixel art and retro aesthetics.
            </p>
            <p className="about-modal-footer">Made with <span style={{ color: '#ef4444', animation: 'pulse 2s ease-in-out infinite' }}>❤</span>. Hope ya'll like it.</p>
            <button className="about-close-btn" onClick={() => setShowAbout(false)}>Close</button>
          </div>
        </div>
      )}

      <style jsx="true">{`
        .app-container {
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          position: relative;
        }

        .bg-manager {
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
        }

        .bg-layer {
          position: absolute;
          inset: -20px; /* Slight bleed to avoid edge seams */
          background-size: cover;
          background-position: center;
          transition: opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @media (max-width: 768px) {
          .app-container {
            overflow: auto;
          }
          .sidebar {
            position: relative;
            top: auto; right: auto; bottom: auto;
            width: 100%;
            height: auto;
            max-height: 50vh;
            margin: 1rem;
            width: calc(100% - 2rem);
          }
          .main-content {
            position: relative;
            height: 50vh;
          }
        }

        .main-content {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .sidebar {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          bottom: 1.5rem;
          width: 340px;
          display: flex;
          flex-direction: column;
          z-index: 100;
          border-radius: var(--card-radius);
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease;
        }

        .sidebar.hidden {
          transform: translateX(calc(100% + 1.5rem));
        }
        .sidebar.hidden .sidebar-content {
          pointer-events: none;
          opacity: 0.3;
        }

        .sidebar-toggle-btn {
          position: absolute;
          left: -14px;
          top: 2rem;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--bg-color);
          border: 1px solid rgba(255,255,255,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          cursor: pointer;
          z-index: 110;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        }
        .sidebar-toggle-btn:hover {
          color: var(--text-color);
          background: rgba(255,255,255,0.1);
          transform: scale(1.1);
        }

        .sidebar-content {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          -webkit-mask-image: linear-gradient(
            to bottom,
            transparent 0px,
            black 40px,
            black calc(100% - 40px),
            transparent 100%
          );
          mask-image: linear-gradient(
            to bottom,
            transparent 0px,
            black 40px,
            black calc(100% - 40px),
            transparent 100%
          );
        }

        /* Tool Sections */
        .tool-section {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 0.5rem;
          cursor: pointer;
          user-select: none;
          transition: background 0.2s ease;
          border-radius: 8px;
        }
        .section-header:hover {
          background: rgba(255, 255, 255, 0.03);
        }
        .section-header h3 {
          margin: 0;
        }
        .section-header:hover .minimize-icon {
          color: var(--text-color);
        }

        .section-body {
          display: block;
          max-height: 800px;
          width: 100%;
          transition:
            max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1),
            opacity 0.25s ease,
            padding-top 0.3s ease,
            padding-bottom 0.3s ease;
          opacity: 1;
          overflow: hidden;
          padding-top: 1.2rem;
          padding-bottom: 2.5rem;
        }
        .section-body.collapsed {
          max-height: 0;
          opacity: 0;
          padding-top: 0;
          padding-bottom: 0;
        }

        .section-header h3 {
          font-size: 1rem;
          color: var(--text-color);
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        .minimize-icon {
          color: var(--text-muted);
          font-weight: bold;
          cursor: pointer;
        }

        .theme-options {
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 1rem 0.8rem;
          gap: 0.5rem;
        }

        .theme-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
          padding: 0.7rem 0.6rem;
          border-radius: 14px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          color: var(--text-muted);
          background: transparent;
          border: 1px solid transparent;
          flex: 1;
        }

        .theme-label {
          font-family: 'Outfit', sans-serif;
          font-size: 0.6rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          opacity: 0.8;
        }

        .theme-btn:hover {
          color: var(--theme-color);
          background: color-mix(in srgb, var(--theme-color) 8%, transparent);
          transform: translateY(-2px);
        }

        .theme-btn.active {
          color: var(--theme-color);
          background: color-mix(in srgb, var(--theme-color) 15%, transparent);
          border-color: color-mix(in srgb, var(--theme-color) 40%, transparent);
        }

        /* About Button */
        .about-btn {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--text-muted);
          font-family: 'Outfit', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          letter-spacing: 0.5px;
        }

        .about-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-color);
          border-color: rgba(255, 255, 255, 0.15);
        }

        /* About Modal */
        .about-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(6px);
          z-index: 9000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease;
        }

        .about-modal {
          background: rgba(10, 15, 30, 0.97);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 2.5rem;
          max-width: 480px;
          width: 90%;
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
          box-shadow: 0 30px 60px rgba(0,0,0,0.5);
          animation: slideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .about-modal-title {
          font-family: 'Press Start 2P', monospace;
          font-size: 0.75rem;
          letter-spacing: 1.5px;
          color: var(--primary);
          line-height: 1.6;
        }

        .about-modal-text {
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
          color: #94a3b8;
          line-height: 1.8;
        }

        .about-modal-footer {
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
          color: var(--primary);
          opacity: 0.8;
          font-style: italic;
        }

        .about-close-btn {
          align-self: flex-end;
          padding: 0.5rem 1.4rem;
          border-radius: 10px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--text-color);
          font-family: 'Outfit', sans-serif;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .about-close-btn:hover {
          background: var(--primary);
          border-color: var(--primary);
          color: #fff;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

      `}</style>
    </div>
  );
}

export default App;
