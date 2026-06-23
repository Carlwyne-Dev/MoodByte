import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, FileText, Trash2, ArrowLeft, Maximize2, Minimize2, Play, Pause, RotateCcw, Download, Infinity as InfinityIcon, Cat } from 'lucide-react';
import { useFileLibrary } from '../../hooks/useFileLibrary';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useTheme } from '../../context/ThemeContext';
import ZenMiniPlayer from './ZenMiniPlayer';
import Player from '../music/Player';
import StudyPet from './StudyPet';
import WelcomeModal from '../WelcomeModal';

function ZenTimer() {
  const [mode, setMode] = useState('focus'); // 'focus' or 'infinite'
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customInput, setCustomInput] = useState('25');
  const [isRinging, setIsRinging] = useState(false);
  const audioRef = React.useRef(null);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        if (mode === 'focus') {
          setTimeLeft(t => Math.max(0, t - 1));
        } else {
          setTimeElapsed(t => t + 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, mode]);

  useEffect(() => {
    if (mode === 'focus' && timeLeft === 0 && isRunning) {
      setIsRunning(false);
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      const alarm = new Audio('/alarm.mp3');
      alarm.loop = true;
      alarm.play().catch(e => console.log('Audio play failed:', e));
      audioRef.current = alarm;
      setIsRinging(true);
    }
  }, [timeLeft, isRunning, mode]);

  const toggleTimer = () => {
    const nextState = !isRunning;
    setIsRunning(nextState);
    if (nextState) window.dispatchEvent(new CustomEvent('zenTimerStart'));
    else window.dispatchEvent(new CustomEvent('zenTimerStop'));
  };
  
  const dismissAlarm = () => {
    setIsRinging(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const val = parseInt(customInput, 10);
    const duration = val > 0 ? val : 25;
    window.dispatchEvent(new CustomEvent('zenTimerFinish', { detail: { duration } }));
  };

  const resetTimer = () => {
    setIsRunning(false);
    if (mode === 'focus') {
      const val = parseInt(customInput, 10);
      setTimeLeft((val > 0 ? val : 25) * 60);
    } else {
      setTimeElapsed(0);
    }
  };

  const setInfinite = () => {
    setMode('infinite');
    setIsRunning(false);
    setTimeElapsed(0);
  };

  const handleCustomSubmit = (e) => {
    if (e.key === 'Enter' || e.type === 'blur') {
      setIsEditing(false);
      const val = parseInt(customInput, 10);
      if (val > 0) {
        setMode('focus');
        setTimeLeft(val * 60);
        setIsRunning(false);
      }
    }
  };

  const displayTime = mode === 'focus' ? timeLeft : timeElapsed;
  const m = Math.floor(displayTime / 60).toString().padStart(2, '0');
  const s = (displayTime % 60).toString().padStart(2, '0');

  return (
    <div className={`zen-timer-container ${isRunning ? 'running' : ''}`}>
      {isEditing ? (
        <input
          className="zen-time-input font-pixel"
          autoFocus
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onBlur={handleCustomSubmit}
          onKeyDown={handleCustomSubmit}
        />
      ) : (
        <div 
          className="zen-time-display font-pixel" 
          onClick={() => setIsEditing(true)}
          title="Click to set custom minutes"
        >
          {m}:{s}
        </div>
      )}
      <div className="zen-timer-controls">
        <button onClick={toggleTimer} className="zen-icon-btn">
          {isRunning ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button onClick={resetTimer} className="zen-icon-btn">
          <RotateCcw size={16} />
        </button>
        <button onClick={setInfinite} className={`zen-icon-btn ${mode === 'infinite' ? 'active' : ''}`} title="Infinite Mode">
          <InfinityIcon size={16} />
        </button>
      </div>
      {/* Alarm Modal via Portal so it doesn't get trapped by any layout */}
      {isRinging && createPortal(
        <div className="alarm-modal-overlay" onClick={dismissAlarm}>
          <div className="alarm-modal" onClick={e => e.stopPropagation()}>
            <h3 className="font-pixel">Zen Time's Up!</h3>
            <p>Your focus session is complete. Great job!</p>
            <button className="dismiss-btn" onClick={dismissAlarm}>Dismiss Alarm</button>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

export default function StudyDesk({ onClose }) {
  const { theme, bgImage } = useTheme();
  const { files, saveFile, getFileBlob, deleteFile } = useFileLibrary();
  const [studyNotes, setStudyNotes] = useLocalStorage('zenStudyNotes', '');
  const [showPetSettings, setShowPetSettings] = useState(false);
  
  const [activeFile, setActiveFile] = useState(null);
  const [activeFileUrl, setActiveFileUrl] = useState(null);
  const [activeTextContent, setActiveTextContent] = useState('');
  
  const [isFullscreenViewer, setIsFullscreenViewer] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

  const [isDeskLoading, setIsDeskLoading] = useState(true);
  const [loadingWord, setLoadingWord] = useState('Preparing your desk...');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [hasSeenDeskWelcome, setHasSeenDeskWelcome] = useLocalStorage('moodbyte_welcome_desk', false);

  useEffect(() => {
    const words = [
      'Preparing your desk...',
      'Clearing the mind...',
      'Gathering focus...',
      'Entering the zone...',
      'Setting up your tools...',
      'Taking a deep breath...'
    ];
    setLoadingWord(words[Math.floor(Math.random() * words.length)]);
    
    const timer = setTimeout(() => {
      setIsDeskLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Clean up object URLs when changing files or unmounting
  useEffect(() => {
    return () => {
      if (activeFileUrl) URL.revokeObjectURL(activeFileUrl);
    };
  }, [activeFileUrl]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) saveFile(file);
  };

  const openFile = async (fileMeta) => {
    const blob = await getFileBlob(fileMeta.id);
    if (!blob) return;

    setActiveFile(fileMeta);

    if (fileMeta.type === 'application/pdf') {
      const url = URL.createObjectURL(blob);
      setActiveFileUrl(url);
    } else if (fileMeta.type.startsWith('text/') || fileMeta.name.endsWith('.md')) {
      const text = await blob.text();
      setActiveTextContent(text);
    } else {
      // Fallback for other file types if browser can display them (images, etc)
      const url = URL.createObjectURL(blob);
      setActiveFileUrl(url);
    }
  };

  const closeViewer = () => {
    setActiveFile(null);
    if (activeFileUrl) URL.revokeObjectURL(activeFileUrl);
    setActiveFileUrl(null);
    setActiveTextContent('');
    setIsFullscreenViewer(false);
  };

  const exportNotes = () => {
    if (!studyNotes) return;
    const blob = new Blob([studyNotes], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StudyNotes_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    window.dispatchEvent(new CustomEvent('zenNotesExported'));
  };

  if (isDeskLoading) {
    return createPortal(
      <div className="study-desk-loading-screen">
        <img src="/study_desk_loading.gif" alt="Loading Study Desk" className="sd-loading-gif" />
        <p className="sd-loading-text font-pixel">{loadingWord}</p>
        <style>{`
          .study-desk-loading-screen {
            position: fixed;
            inset: 0;
            background: #0b1120;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #fff;
          }
          .sd-loading-gif {
            width: 150px;
            height: auto;
            margin-bottom: 24px;
            border-radius: 12px;
          }
          .sd-loading-text {
            font-size: 1.2rem;
            color: #38bdf8;
            animation: pulse 1.5s infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="study-desk-overlay fade-in">
      {/* Blurred immersive background */}
      <div 
        className="study-desk-bg" 
        style={{ backgroundImage: `url('${bgImage}')` }}
      />
      <div className="study-desk-bg-overlay" />
      
      {/* Ambient Particles */}
      <div className="study-particles">
        <div className="particle p1" />
        <div className="particle p2" />
        <div className="particle p3" />
      </div>
      
      {/* Top Header */}
      <header className="study-desk-header">
        <div className="study-header-left">
          <button className="exit-study-btn" onClick={() => setShowExitConfirm(true)}>
            <X size={18} /> Exit Study Desk
          </button>
        </div>
        
        <div className="study-header-center">
          <ZenTimer />
        </div>

        <div className="study-header-right" style={{ gap: '12px' }}>
          <button 
            className="pet-toggle-btn" 
            onClick={() => setShowPetSettings(!showPetSettings)}
            title="Pet Settings"
          >
            <Cat size={18} />
          </button>
          <ZenMiniPlayer />
        </div>
      </header>

      {/* Main Workspace */}
      <div className="study-workspace">
        
        {!isDeskLoading && !hasSeenDeskWelcome && (
          <WelcomeModal 
            title="Welcome to the Study Desk!" 
            message="<p>This is your ultimate distraction-free zone.</p><p>You have a <strong>Study Pet</strong> at the bottom of your screen to keep you company. Set the Pomodoro timer, focus hard, and you'll earn <strong>treats</strong> to feed them!</p><p>You can also upload <strong>PDFs and text files</strong> into your library to read them directly inside MoodByte.</p>" 
            onGotIt={() => setHasSeenDeskWelcome(true)} 
          />
        )}

        {/* Left Side: Library / Viewer */}
        <div className={`study-pane viewer-pane ${isFullscreenViewer ? 'fullscreen' : ''}`}>
          
          {!activeFile ? (
            <div className="library-view">
              <div className="library-header">
                <h2>File Library</h2>
                <label className="upload-btn">
                  <Upload size={18} /> Upload PDF / Text
                  <input type="file" accept=".pdf,.txt,.md" hidden onChange={handleFileUpload} />
                </label>
              </div>
              
              <div className="file-grid">
                {files.length === 0 ? (
                  <div className="empty-library">
                    <FileText size={48} opacity={0.5} />
                    <p>No files uploaded yet.</p>
                  </div>
                ) : (
                  files.map(f => (
                    <div key={f.id} className="file-card" onClick={() => openFile(f)}>
                      <FileText size={32} className="file-icon" />
                      <div className="file-details">
                        <h4>{f.name}</h4>
                        <span>{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <button 
                        className="del-file-btn" 
                        onClick={(e) => { e.stopPropagation(); setFileToDelete(f); }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="document-viewer">
              <div className="viewer-header">
                <button className="icon-btn" onClick={closeViewer} title="Back to Library">
                  <ArrowLeft size={18} />
                </button>
                <h3 className="doc-title">{activeFile.name}</h3>
                <button 
                  className="icon-btn" 
                  onClick={() => setIsFullscreenViewer(!isFullscreenViewer)}
                  title="Toggle Fullscreen"
                >
                  {isFullscreenViewer ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
              </div>
              
              <div className="viewer-content">
                {activeFile.type === 'application/pdf' && activeFileUrl ? (
                  <iframe src={`${activeFileUrl}#toolbar=0`} className="pdf-frame" title="PDF Viewer" />
                ) : activeTextContent ? (
                  <pre className="text-viewer-frame">{activeTextContent}</pre>
                ) : activeFileUrl ? (
                  <iframe src={activeFileUrl} className="generic-frame" title="Document Viewer" />
                ) : (
                  <div className="loading-doc">Loading document...</div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Notepad & Player */}
        {!isFullscreenViewer && (
          <div className="study-pane right-pane">
            <div className="notepad-pane-container">
              <div className="notepad-header">
                <h2>Study Notes</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="save-status">Auto-saved</span>
                  <button className="icon-btn export-btn" onClick={exportNotes} title="Export Notes as TXT">
                    <Download size={16} />
                    <span>Export</span>
                  </button>
                </div>
              </div>
              <textarea
                className="zen-notepad"
                placeholder="Take notes here while you study... (Markdown supported mentally)"
                value={studyNotes}
                onChange={(e) => setStudyNotes(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {fileToDelete && (
          <div className="delete-modal-overlay" onClick={() => setFileToDelete(null)}>
            <div className="delete-modal" onClick={e => e.stopPropagation()}>
              <h3 className="font-pixel">Delete File</h3>
              <p>Are you sure you want to delete "{fileToDelete.name}"?</p>
              <div className="delete-modal-actions">
                <button className="cancel-btn" onClick={() => setFileToDelete(null)}>Cancel</button>
                <button className="confirm-btn" onClick={() => { deleteFile(fileToDelete.id); setFileToDelete(null); }}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Exit Confirmation Modal */}
        {showExitConfirm && (
          <div className="delete-modal-overlay" onClick={() => setShowExitConfirm(false)}>
            <div className="delete-modal" onClick={e => e.stopPropagation()}>
              <h3 className="font-pixel">Exit Study Desk?</h3>
              <p>Are you sure you want to leave the zone?</p>
              <div className="delete-modal-actions">
                <button className="cancel-btn" onClick={() => setShowExitConfirm(false)}>Stay</button>
                <button className="confirm-btn" onClick={onClose}>Exit</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Render Study Pet */}
      <StudyPet 
        showSettings={showPetSettings} 
        onCloseSettings={() => setShowPetSettings(false)} 
      />

      <style>{`
        .study-desk-overlay {
          position: fixed;
          inset: 0;
          background: transparent;
          z-index: 10000;
          display: flex;
          flex-direction: column;
        }

        .study-desk-bg {
          position: absolute;
          inset: -20px;
          background-size: cover;
          background-position: center;
          filter: blur(12px);
          z-index: -2;
        }

        .study-desk-bg-overlay {
          position: absolute;
          inset: 0;
          background: rgba(11, 17, 32, 0.75);
          z-index: -1;
        }

        .study-particles {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 0;
          pointer-events: none;
        }
        .particle {
          position: absolute;
          width: 3px; height: 3px;
          background: rgba(255,255,255,0.4);
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(255,255,255,0.8);
          animation: floatParticle 15s linear infinite;
        }
        .particle.p1 { top: 20%; left: 10%; animation-duration: 20s; }
        .particle.p2 { top: 70%; left: 80%; animation-duration: 25s; animation-delay: -5s; }
        .particle.p3 { top: 40%; left: 60%; animation-duration: 18s; animation-delay: -10s; }
        
        @keyframes floatParticle {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-100px) translateX(20px) scale(1.5); opacity: 0; }
        }

        .study-desk-header {
          height: 60px;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
          position: relative;
          z-index: 10;
        }

        .study-header-left, .study-header-right {
          flex: 1;
        }
        
        .study-header-right {
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }

        .pet-toggle-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .pet-toggle-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.05);
        }

        .study-header-center {
          flex: 2;
          display: flex;
          justify-content: center;
        }

        .zen-timer-container {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 6px 16px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          transition: all 0.3s ease;
        }
        
        .zen-timer-container.running {
          box-shadow: 0 0 10px rgba(var(--primary-rgb, 56, 189, 248), 0.3);
          border-color: rgba(var(--primary-rgb, 56, 189, 248), 0.4);
          animation: breathe 3s ease-in-out infinite;
        }
        
        @keyframes breathe {
          0%, 100% { box-shadow: 0 0 8px rgba(var(--primary-rgb, 56, 189, 248), 0.2); }
          50% { box-shadow: 0 0 15px rgba(var(--primary-rgb, 56, 189, 248), 0.4); }
        }

        .zen-time-display {
          font-size: 1.2rem;
          color: #fff;
          letter-spacing: 2px;
          min-width: 65px;
          text-align: center;
        }

        .zen-timer-controls {
          display: flex;
          gap: 8px;
        }

        .zen-icon-btn {
          background: none;
          border: none;
          color: #a8b2d1;
          cursor: pointer;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .zen-icon-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        .zen-icon-btn.active {
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.15);
        }
        
        .zen-time-input {
          background: rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          font-size: 1.2rem;
          width: 50px;
          text-align: center;
          border-radius: 6px;
          outline: none;
          letter-spacing: 2px;
        }

        .zen-title {
          color: #00d4ff;
          letter-spacing: 2px;
          font-size: 0.9rem;
          opacity: 0.8;
          margin-right: 12px;
        }
        
        .zen-theme-label {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.75rem;
          text-transform: uppercase;
          background: rgba(0,0,0,0.3);
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.05);
        }

        .exit-study-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(239, 68, 68, 0.15);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          font-weight: 500;
          transition: all 0.2s;
        }
        .exit-study-btn:hover {
          background: rgba(239, 68, 68, 0.25);
          color: #f87171;
        }

        .study-workspace {
          flex: 1;
          display: flex;
          overflow: hidden;
          padding: 1.5rem;
          gap: 1.5rem;
        }

        .study-pane {
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 10px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .viewer-pane {
          flex: 1;
        }
        .viewer-pane.fullscreen {
          flex: 3;
        }

        .right-pane {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: transparent;
          border: none;
          gap: 1.5rem;
        }

        .notepad-pane-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .zen-player-wrapper {
          border-radius: 20px;
          overflow: hidden;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08);
        }

        /* Library View */
        .library-view {
          padding: 2rem;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .library-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .library-header h2 {
          margin: 0;
          color: #fff;
          font-family: 'Outfit', sans-serif;
        }

        .upload-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--primary);
          color: #fff;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: transform 0.2s;
        }
        .upload-btn:hover {
          transform: translateY(-2px);
        }

        .empty-library {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          min-height: 300px;
          width: 100%;
          color: #a8b2d1;
          gap: 1rem;
          text-align: center;
        }

        .file-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .file-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 1.5rem;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: all 0.2s;
          position: relative;
        }
        .file-card:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-4px);
        }

        .file-icon {
          color: var(--primary);
          margin-bottom: 12px;
        }

        .file-details h4 {
          margin: 0 0 4px 0;
          color: #e2e8f0;
          font-size: 0.95rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 160px;
        }
        .file-details span {
          color: #8892b0;
          font-size: 0.8rem;
        }

        .del-file-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background: none;
          border: none;
          color: #ef4444;
          opacity: 0;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .file-card:hover .del-file-btn {
          opacity: 1;
        }

        /* Document Viewer */
        .document-viewer {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .viewer-header {
          display: flex;
          align-items: center;
          padding: 1rem 1.5rem;
          background: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .icon-btn {
          background: rgba(255, 255, 255, 0.05);
          border: none;
          color: #a8b2d1;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .icon-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .doc-title {
          flex: 1;
          margin: 0 1.5rem;
          font-family: 'Outfit', sans-serif;
          font-size: 1rem;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .viewer-content {
          flex: 1;
          position: relative;
        }

        .pdf-frame, .generic-frame {
          width: 100%;
          height: 100%;
          border: none;
          background: #fff; /* PDF viewer needs white bg */
        }

        .text-viewer-frame {
          margin: 0;
          padding: 2rem;
          width: 100%;
          height: 100%;
          overflow: auto;
          color: #e2e8f0;
          font-family: monospace;
          white-space: pre-wrap;
          font-size: 0.95rem;
          line-height: 1.6;
        }

        /* Notepad Pane */
        .notepad-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .notepad-header h2 {
          margin: 0;
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 1.2rem;
        }
        .save-status {
          color: #10b981;
          font-size: 0.8rem;
          background: rgba(16, 185, 129, 0.1);
          padding: 4px 10px;
          border-radius: 20px;
        }
        
        .export-btn {
          width: auto;
          padding: 0 12px;
          gap: 6px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.85rem;
          background: rgba(56, 189, 248, 0.15);
          color: #38bdf8;
          border: 1px solid rgba(56, 189, 248, 0.2);
        }
        .export-btn:hover {
          background: rgba(56, 189, 248, 0.25);
          color: #7dd3fc;
        }

        .zen-notepad {
          flex: 1;
          background: transparent;
          border: none;
          padding: 1.5rem;
          color: #e2e8f0;
          font-family: 'Outfit', sans-serif;
          font-size: 1.05rem;
          line-height: 1.6;
          resize: none;
          outline: none;
        }
        .zen-notepad::placeholder {
          color: rgba(255, 255, 255, 0.2);
        }

        /* Delete Modal */
        .delete-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 10002;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .delete-modal {
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          width: 340px;
          text-align: center;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
          animation: popIn 0.2s ease-out forwards;
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .delete-modal h3 {
          margin: 0 0 12px 0;
          color: #ef4444;
          font-size: 1.2rem;
        }
        .delete-modal p {
          margin: 0 0 24px 0;
          color: #94a3b8;
          font-size: 0.95rem;
          line-height: 1.4;
        }
        .delete-modal-actions {
          display: flex;
          gap: 12px;
        }
        .delete-modal-actions button {
          flex: 1;
          padding: 10px;
          border-radius: 8px;
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cancel-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
        }
        .cancel-btn:hover {
          background: rgba(255,255,255,0.1);
        }
        .confirm-btn {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #ef4444;
        }
        .confirm-btn:hover {
          background: rgba(239, 68, 68, 0.3);
        }
      `}</style>
    </div>,
    document.body
  );
}
