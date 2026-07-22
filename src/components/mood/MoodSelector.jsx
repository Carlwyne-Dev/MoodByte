import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MOODS } from '../../utils/moodConfig';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useTheme } from '../../context/ThemeContext';
import { Palette, ArrowRight, History, X, Upload } from 'lucide-react';
import MoodHistory from './MoodHistory';
import { useIsMobile } from '../../hooks/useIsMobile';

export default function MoodSelector() {
  const isMobile = useIsMobile();
  const [selectedMood, setSelectedMood] = useState(null);
  const [reflection, setReflection] = useState('');
  const [history, setHistory] = useLocalStorage('moodHistory', []);
  const [showThemePrompt, setShowThemePrompt] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [closingHistory, setClosingHistory] = useState(false);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const [pendingTheme, setPendingTheme] = useState(null);
  const [logged, setLogged] = useState(false);
  const { theme, changeTheme, uploadCustomBg } = useTheme();
  
  const containerRef = useRef(null);
  const popupRef = useRef(null);

  const closeHistory = () => {
    setClosingHistory(true);
    setTimeout(() => {
      setShowHistory(false);
      setClosingHistory(false);
    }, 180);
  };

  // Active position sync
  useEffect(() => {
    if (!showHistory) return;
    const sidebarContent = document.querySelector('.sidebar-content');
    const sidebar = document.querySelector('.sidebar');
    if (!sidebarContent || !sidebar || !containerRef.current) return;

    const updatePosition = () => {
      const moodRect = containerRef.current.getBoundingClientRect();
      const sidebarRect = sidebar.getBoundingClientRect();
      const contentRect = sidebarContent.getBoundingClientRect();
      
      // If the mood container is scrolled completely out of view, close popup
      if (moodRect.bottom < contentRect.top || moodRect.top > contentRect.bottom) {
        closeHistory();
        return;
      }

      setPopupPos({
        top: moodRect.top + (moodRect.height / 2),
        left: sidebarRect ? sidebarRect.left - 260 : moodRect.left - 280
      });
    };

    sidebarContent.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition);
    updatePosition(); // Initial calculation

    return () => {
      sidebarContent.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showHistory]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showHistory && !closingHistory && popupRef.current && !popupRef.current.contains(e.target) && containerRef.current && !containerRef.current.contains(e.target)) {
        closeHistory();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHistory, closingHistory]);

  const toggleHistory = (e) => {
    e.stopPropagation();
    if (showHistory) closeHistory();
    else setShowHistory(true);
  };

  const handleSave = () => {
    if (!selectedMood) return;

    const newEntry = {
      id: Date.now().toString(),
      mood: selectedMood,
      reflection,
      timestamp: new Date().toISOString()
    };

    const updatedHistory = [newEntry, ...history].slice(0, 20);
    setHistory(updatedHistory);

    const moodConfig = MOODS.find(m => m.id === selectedMood);

    if (moodConfig && moodConfig.themeHint !== theme) {
      setPendingTheme(moodConfig.themeHint);
      setShowThemePrompt(true);
    } else {
      finishLog();
    }
  };

  const finishLog = () => {
    setShowThemePrompt(false);
    setLogged(true);
    setTimeout(() => {
      setSelectedMood(null);
      setReflection('');
      setLogged(false);
    }, 2000);
  };

  const handleUploadBg = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadCustomBg(file);
      e.target.value = null; // reset input
    }
  };

  const selectedConfig = MOODS.find(m => m.id === selectedMood);

  const acceptTheme = () => {
    if (pendingTheme) changeTheme(pendingTheme);
    finishLog();
  };

  return (
    <div className="mood-selector-container" ref={containerRef}>

      <>
        <div className="mood-header-row">
          <span className="mood-subtitle">How are you feeling?</span>
        </div>

        {/* Mood grid */}
      <div className="mood-grid">
        {MOODS.map(m => {
          const Icon = m.icon;
          const isSelected = selectedMood === m.id;
          return (
            <button
              key={m.id}
              className={`mood-btn ${isSelected ? 'selected' : ''}`}
              onClick={() => { setSelectedMood(m.id); setLogged(false); setShowThemePrompt(false); }}
              style={{ '--mood-color': m.color }}
            >
              <div className="mood-icon-wrap">
                <Icon size={22} />
              </div>
              <span className="mood-label">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Reflection + Log area */}
      {selectedMood && !showThemePrompt && !logged && (
        <div className="reflection-area">
          <textarea
            className="reflection-input"
            placeholder={`Why ${selectedConfig?.label.toLowerCase()}? (optional)`}
            value={reflection}
            onChange={e => setReflection(e.target.value)}
            rows={2}
          />
          <button
            className="log-btn"
            onClick={handleSave}
            style={{ '--mood-color': selectedConfig?.color }}
          >
            Log mood <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Theme switch prompt (inline, no alert) */}
      {showThemePrompt && !logged && (
        <div className="theme-prompt">
          <Palette size={15} />
          <span>Switch to <strong>{pendingTheme}</strong> theme to match your vibe?</span>
          <div className="theme-prompt-btns">
            <button className="tp-yes" onClick={acceptTheme}>Yes</button>
            <button className="tp-no" onClick={finishLog}>No</button>
          </div>
        </div>
      )}

      {/* Success state */}
      {logged && (
        <div className="log-success">
          <span>✓ Mood logged</span>
        </div>
      )}
      </>

      <div className="mood-tabs">
        <button 
          className={`mode-tab ${showHistory ? 'active' : ''}`}
          onClick={toggleHistory}
        >
          <History size={12} /> View History
        </button>
      </div>

      {/* History Portal Popup */}
      {(showHistory || closingHistory) && createPortal(
        <div ref={popupRef} className={`mood-portal-popup ${closingHistory ? 'closing' : ''}`} style={{ 
          top: isMobile ? '50%' : `${popupPos.top}px`, 
          left: isMobile ? '50%' : `${popupPos.left}px`,
          ...(isMobile ? {
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: '350px'
          } : {})
        }}>
          <div className="mood-popup-content">
            <div className="popup-header">
              <span className="popup-label">Mood Log</span>
            </div>
            <div className="history-scroll-area">
              <MoodHistory />
            </div>
          </div>
          <div className="mood-popup-tail" />
        </div>,
        document.body
      )}

      <style jsx="true">{`
        .mood-selector-container {
          display: flex; flex-direction: column; gap: 1rem; position: relative;
        }

        .mood-header-row {
          display: flex; justify-content: space-between; align-items: center;
        }
        .mood-subtitle {
          font-size: 0.8rem; color: var(--text-muted); font-weight: 500;
        }

        /* Mood grid */
        .mood-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
        }

        .mood-btn {
          display: flex; flex-direction: column;
          align-items: center; gap: 0.35rem;
          padding: 0.6rem 0.3rem 0.5rem;
          border-radius: 14px;
          border: 1.5px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.03);
          transition: all 0.2s cubic-bezier(0.34,1.2,0.64,1);
          cursor: pointer;
        }
        .mood-btn:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.12);
          transform: translateY(-3px);
        }
        .mood-btn.selected {
          background: color-mix(in srgb, var(--mood-color) 12%, transparent);
          border-color: var(--mood-color);
          transform: translateY(-3px) scale(1.04);
          box-shadow: 0 4px 16px color-mix(in srgb, var(--mood-color) 25%, transparent);
        }

        .mood-icon-wrap {
          width: 38px; height: 38px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.05);
          color: var(--text-muted);
          transition: all 0.2s;
        }
        .mood-btn:hover .mood-icon-wrap { color: var(--text-color); }
        .mood-btn.selected .mood-icon-wrap {
          background: color-mix(in srgb, var(--mood-color) 15%, transparent);
          color: var(--mood-color);
        }

        .mood-label {
          font-size: 0.7rem; font-weight: 500;
          color: var(--text-muted);
          font-family: 'Outfit', sans-serif;
          transition: color 0.2s;
        }
        .mood-btn.selected .mood-label { color: var(--mood-color); font-weight: 600; }

        /* Reflection */
        .reflection-area {
          display: flex; flex-direction: column; gap: 0.6rem;
          animation: slideDown 0.22s cubic-bezier(0.34,1.2,0.64,1);
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .reflection-input {
          width: 100%; resize: none;
          background: rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; padding: 0.7rem 0.9rem;
          color: var(--text-color); font-size: 0.82rem;
          font-family: 'Outfit', sans-serif;
          outline: none; transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .reflection-input::placeholder { color: rgba(255,255,255,0.25); }
        .reflection-input:focus { border-color: var(--mood-color, rgba(168,85,247,0.4)); }

        /* Log button */
        .log-btn {
          align-self: flex-end;
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.4rem 1rem; border-radius: 10px;
          background: var(--mood-color, var(--primary));
          color: white; font-size: 0.8rem; font-weight: 600;
          font-family: 'Outfit', sans-serif;
          border: none; cursor: pointer;
          opacity: 0.9;
          transition: opacity 0.2s, transform 0.2s;
        }
        .log-btn:hover { opacity: 1; transform: scale(1.04); }

        /* Theme prompt */
        .theme-prompt {
          display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem;
          padding: 0.7rem 0.9rem; border-radius: 12px;
          background: rgba(168,85,247,0.08);
          border: 1px solid rgba(168,85,247,0.2);
          font-size: 0.8rem; color: var(--text-color);
          animation: slideDown 0.22s ease;
        }
        .theme-prompt strong { color: var(--primary-hover); }
        .theme-prompt-btns { display: flex; gap: 0.4rem; margin-left: auto; }
        .tp-yes, .tp-no {
          padding: 0.25rem 0.7rem; border-radius: 7px;
          font-size: 0.75rem; font-weight: 600; cursor: pointer;
          font-family: 'Outfit', sans-serif; border: none;
        }
        .tp-yes { background: var(--primary); color: white; }
        .tp-no { background: rgba(255,255,255,0.08); color: var(--text-muted); }
        .tp-yes:hover { opacity: 0.88; }
        .tp-no:hover { color: var(--text-color); }

        /* Success flash */
        .log-success {
          display: flex; align-items: center; justify-content: center;
          padding: 0.6rem; border-radius: 12px;
          background: rgba(74,222,128,0.1);
          border: 1px solid rgba(74,222,128,0.25);
          color: #4ade80; font-size: 0.82rem; font-weight: 600;
          animation: fadeInOut 1.4s ease forwards;
        }
        @keyframes fadeInOut {
          0% { opacity: 0; transform: scale(0.95); }
          20% { opacity: 1; transform: scale(1); }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
        /* Mood tabs */
        .mood-tabs {
          display: flex; gap: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .mode-tab {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 0.4rem; padding: 0.5rem; border-radius: 10px;
          background: transparent; border: none;
          color: var(--text-muted); font-size: 0.75rem; font-weight: 600;
          font-family: 'Outfit', sans-serif; cursor: pointer;
          transition: all 0.2s;
        }
        .mode-tab:hover { background: rgba(255,255,255,0.05); color: var(--text-color); }
        .mode-tab.active { background: rgba(255,255,255,0.1); color: white; }

        /* Portal Popups */
        .mood-portal-popup {
          position: fixed;
          transform: translateY(-50%);
          width: 260px;
          background: rgba(30, 30, 35, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 1.2rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          animation: popInLeft 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 99999;
        }

        .mood-popup-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .popup-header {
          margin-bottom: -0.5rem;
        }
        .popup-label {
          font-size: 0.75rem; font-weight: 700; letter-spacing: 0.5px;
          color: var(--text-muted); text-transform: uppercase;
        }

        .history-scroll-area {
          max-height: 400px;
          overflow-y: auto;
          padding-right: 0.4rem;
          margin-right: -0.4rem;
        }
        .history-scroll-area::-webkit-scrollbar { width: 4px; }
        .history-scroll-area::-webkit-scrollbar-track { background: transparent; }
        .history-scroll-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }

        .mood-popup-tail {
          position: absolute;
          right: -6px;
          top: 50%;
          margin-top: -6px;
          width: 12px; height: 12px;
          background: rgba(45, 45, 55, 0.65);
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          border-right: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(16px);
          transform: rotate(45deg);
          border-radius: 2px;
          z-index: -1;
        }

        @keyframes popInLeft {
          from { opacity: 0; transform: translate(10px, -50%) scale(0.95); }
          to { opacity: 1; transform: translate(0, -50%) scale(1); }
        }
        @keyframes popOutLeft {
          from { opacity: 1; transform: translate(0, -50%) scale(1); }
          to { opacity: 0; transform: translate(10px, -50%) scale(0.95); }
        }
        .mood-portal-popup.closing {
          animation: popOutLeft 0.18s cubic-bezier(0.4, 0, 1, 1) forwards;
        }
      `}</style>
    </div>
  );
}
