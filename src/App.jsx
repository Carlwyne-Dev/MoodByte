import { useState } from 'react';
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
import WhatsNewModal from './components/settings/WhatsNewModal';
import AboutModal from './components/settings/AboutModal';
import BackgroundManager from './components/BackgroundManager';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useIsMobile } from './hooks/useIsMobile';
import { useCloudSync } from './hooks/useCloudSync';
import { useAnalytics } from './hooks/useAnalytics';
import { useSectionNav } from './hooks/useSectionNav';
import { useBackButtonBlock } from './hooks/useBackButtonBlock';
import { useBackgroundPreloader } from './hooks/useBackgroundPreloader';
import SyncToast from './components/settings/SyncToast';
import MobileLayout from './components/mobile/MobileLayout';
import { THEMES, SIDEBAR_SECTIONS, DEFAULT_BACKGROUNDS } from './config/appConfig';

import { ChevronRight, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import './App.css';

function App() {
  useCloudSync(); // Initialize cloud sync
  const { theme, bgImage, changeTheme } = useTheme();
  useAnalytics(theme); // Silent visit tracking
  const isMobile = useIsMobile();
  const [minimized, setMinimized] = useState({});
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [isLoading, setIsLoading] = useState(() => {
    return !sessionStorage.getItem('moodbyte_session_started');
  });

  useBackgroundPreloader(DEFAULT_BACKGROUNDS);
  useBackButtonBlock();

  const [hasSeenAppWelcome, setHasSeenAppWelcome] = useLocalStorage('moodbyte_welcome_main', false);
  const [showAbout, setShowAbout] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [showNavRail] = useLocalStorage('moodbyte_show_nav_rail', true);
  const { sidebarScrollRef, activeSection, scrollToSection } = useSectionNav(SIDEBAR_SECTIONS);

  const toggle = (key) => setMinimized(prev => ({ ...prev, [key]: !prev[key] }));

  // Render mobile layout on small screens
  if (isMobile) return (
    <>
      <MobileLayout />
      <SyncToast />
    </>
  );

  return (
    <div className={`app-container ${zenMode ? 'zen-mode-active' : ''}`} style={{ '--sidebar-offset': sidebarHidden ? '40px' : '360px' }}>
      <SyncToast />
      <AchievementManager />
      <StreakCounter />
      {isLoading && <LoadingScreen bgImage={bgImage} onComplete={() => {
        sessionStorage.setItem('moodbyte_session_started', 'true');
        setIsLoading(false);
      }} />}
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
          onClick={() => {
             setSidebarHidden(!sidebarHidden);
             if (!sidebarHidden) setZenMode(false); // disable zen mode when sidebar is shown
          }}
          title={sidebarHidden ? "Show Sidebar" : "Hide Sidebar"}
        >
          {sidebarHidden ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>

        {/* Section Quick-Nav Rail */}
        {showNavRail && (() => {
          const activeIdx = SIDEBAR_SECTIONS.findIndex(s => s.id === activeSection);
          const aboveSections = SIDEBAR_SECTIONS.slice(0, activeIdx);
          const belowSections = SIDEBAR_SECTIONS.slice(activeIdx + 1);
          return (
            <div className="section-nav-rail">
              <div className="snr-group">
                {aboveSections.map(({ id, Icon, label }) => (
                  <button key={id} className="snr-btn snr-above" onClick={() => scrollToSection(id)} title={label}>
                    <Icon size={14} strokeWidth={1.8} />
                  </button>
                ))}
              </div>
              <div className="snr-group">
                {belowSections.map(({ id, Icon, label }) => (
                  <button key={id} className="snr-btn snr-below" onClick={() => scrollToSection(id)} title={label}>
                    <Icon size={14} strokeWidth={1.8} />
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        <div className="sidebar-content" ref={sidebarScrollRef}>

          {/* Themes Section */}
          <div className="tool-section" id="sec-themes">
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
          <div className="tool-section" id="sec-music">
            <div className="section-header" onClick={() => toggle('music')}>
              <h3 className="font-pixel">Music</h3>
              <span className="minimize-icon">{minimized.music ? '+' : '−'}</span>
            </div>
            <div className={`section-body ${minimized.music ? 'collapsed' : ''}`}>
              <Player />
            </div>
          </div>

          {/* Pomodoro Section */}
          <div className="tool-section" id="sec-pomodoro">
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
          <div className="tool-section" id="sec-tasks">
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
          <div className="tool-section" id="sec-mood">
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

          {/* Footer Buttons */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button className="about-btn" onClick={() => setShowWhatsNew(true)}>What's New</button>
            <button className="about-btn" onClick={() => setShowAbout(true)}>About</button>
          </div>

        </div>
      </aside>

      {/* What's New Modal */}
      {showWhatsNew && <WhatsNewModal onClose={() => setShowWhatsNew(false)} />}

      {/* About Modal */}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}

      {/* Zen Toggle Button */}
      {!isMobile && (
        <button
          className={`zen-toggle-btn ${sidebarHidden ? 'visible' : 'hidden'}`}
          onClick={() => setZenMode(!zenMode)}
          title={zenMode ? "Exit Zen Mode" : "Enter Zen Mode"}
        >
          {zenMode ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
}

export default App;
