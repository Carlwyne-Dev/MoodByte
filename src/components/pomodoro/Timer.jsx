import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Play, Pause, RotateCcw, Clock, Infinity as InfinityIcon } from 'lucide-react';

export default function Timer() {
  const [stats, setStats] = useLocalStorage('pomodoroStats', { sessions: 0 });
  const [mode, setMode] = useState('work'); // work, fastStudy, shortBreak, custom
  const [customMins, setCustomMins] = useLocalStorage('pomodoroCustom', 45);
  
  const modes = {
    work: { label: 'Focus', minutes: 25 },
    fastStudy: { label: 'Sprint', minutes: 15 },
    shortBreak: { label: 'Break', minutes: 5 },
    free: { label: 'Free Track', minutes: 0 },
    custom: { label: 'Custom', minutes: customMins }
  };

  const [timeElapsed, setTimeElapsed] = useState(0); // we will track elapsed time always, and compute display
  const [isRunning, setIsRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(customMins.toString());
  const [isRinging, setIsRinging] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    let interval;
    const targetSeconds = mode === 'free' ? Infinity : modes[mode].minutes * 60;
    
    if (isRunning && timeElapsed < targetSeconds) {
      interval = setInterval(() => setTimeElapsed(t => t + 1), 1000);
    } else if (isRunning && timeElapsed >= targetSeconds && mode !== 'free') {
      setIsRunning(false);
      audioRef.current = new Audio('/alarm.mp3');
      audioRef.current.loop = true;
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
      setIsRinging(true);
      
      if (mode === 'work') {
        setStats({ sessions: stats.sessions + 1 });
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeElapsed, mode, stats, setStats, customMins]);

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const dismissAlarm = () => {
    setIsRinging(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const resetTimer = () => { 
    setIsRunning(false); 
    setTimeElapsed(0); 
  };
  
  const switchMode = (newMode) => { 
    setMode(newMode); 
    setIsRunning(false); 
    setIsEditing(false);
    setTimeElapsed(0); 
  };

  const handleCustomChange = (e) => {
    // Only allow numeric characters
    const val = e.target.value.replace(/[^0-9]/g, '');
    setInputValue(val);
  };

  const handleCustomKeyDown = (e) => {
    // Whitelist: allow digits, control keys only. Block everything else.
    const controlKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (controlKeys.includes(e.key)) return;
    if (e.key === 'Enter') { saveCustomMins(); return; }
    // Block any key that isn't a single digit 0-9
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const saveCustomMins = () => {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setCustomMins(parsed);
      setTimeElapsed(0);
      setMode('custom');
    } else {
      setInputValue(customMins.toString()); // revert
    }
    setIsEditing(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const displayTime = mode !== 'free'
    ? Math.max(0, (modes[mode].minutes * 60) - timeElapsed)
    : timeElapsed;

  return (
    <div className="pomodoro-container">
      {/* Mode Selector */}
      <div className="mode-selector">
        {Object.entries(modes).filter(([k]) => k !== 'custom' && k !== 'free').map(([key, val]) => (
          <button 
            key={key} 
            className={`mode-btn ${mode === key ? 'active' : ''}`} 
            onClick={() => switchMode(key)}
          >
            {val.label}
          </button>
        ))}
      </div>

      {/* Timer Display (Minimized, No Ring) */}
      <div className={`timer-display ${isRunning ? 'running' : ''}`}>
        {isEditing ? (
          <div className="custom-input-wrap">
            <input 
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputValue} 
              onChange={handleCustomChange}
              onKeyDown={handleCustomKeyDown}
              onBlur={saveCustomMins}
              autoFocus
              className="custom-input font-pixel"
              maxLength={3}
              placeholder="00"
            />
            <span className="min-label">min</span>
          </div>
        ) : (
          <div className="time-text font-pixel" onClick={() => !isRunning && setIsEditing(true)}>
            {formatTime(displayTime)}
          </div>
        )}
      </div>

      {/* Play/Pause Main Button */}
      <div className="main-play-ctrl">
        <button className={`control-btn play-btn ${isRunning ? 'active' : ''}`} onClick={toggleTimer}>
          {isRunning ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" style={{ marginLeft: '4px' }} />}
        </button>
      </div>

      {/* Secondary Controls (Reset & Custom & Free) */}
      <div className="secondary-controls">
        <button className="sec-btn" onClick={resetTimer} title="Reset">
          <RotateCcw size={14} /> Reset
        </button>
        <button className={`sec-btn ${mode === 'custom' && !isEditing ? 'active' : ''}`} onClick={() => setIsEditing(true)}>
          <Clock size={14} /> Custom
        </button>
        <button className={`sec-btn icon-only ${mode === 'free' ? 'active' : ''}`} onClick={() => switchMode('free')} title="Free tracking mode">
          <InfinityIcon size={16} />
        </button>
      </div>

      {isRinging && createPortal(
        <div className="alarm-modal-overlay" onClick={dismissAlarm}>
          <div className="alarm-modal" onClick={e => e.stopPropagation()}>
            <h3 className="font-pixel">Time's Up!</h3>
            <p>{mode === 'work' ? 'Great focus session! Take a break.' : 'Break is over. Ready to focus?'}</p>
            <button className="dismiss-btn" onClick={dismissAlarm}>Dismiss Alarm</button>
          </div>
        </div>,
        document.body
      )}

      <style jsx="true">{`
        .pomodoro-container { 
          display: flex; flex-direction: column; align-items: center; gap: 1.2rem; 
          padding: 0.5rem; width: 100%;
        }

        /* Pills Selector */
        .mode-selector { 
          display: flex; background: rgba(0,0,0,0.25); border-radius: 24px; 
          padding: 4px; border: 1px solid rgba(255,255,255,0.08); width: 100%;
          max-width: 280px;
        }
        .mode-btn { 
          flex: 1; padding: 0.4rem; border-radius: 20px; font-weight: 500; 
          font-size: 0.75rem; color: var(--text-muted); font-family: 'Outfit', sans-serif;
          transition: all 0.3s ease; text-align: center;
        }
        .mode-btn.active { 
          background: rgba(255,255,255,0.1); color: var(--text-color); 
          box-shadow: 0 4px 12px rgba(0,0,0,0.1); font-weight: 600;
        }

        /* Timer Text */
        .timer-display { 
          display: flex; align-items: center; justify-content: center;
          height: 80px; margin: 0.5rem 0;
        }
        .time-text { 
          font-size: 3rem; color: var(--text-color); cursor: pointer;
          text-shadow: 0 4px 20px rgba(0,0,0,0.5); letter-spacing: -1px;
          transition: color 0.3s, transform 0.2s;
        }
        .time-text:hover {
          transform: scale(1.05);
        }
        .timer-display.running .time-text { 
          color: var(--primary); 
          text-shadow: 0 0 20px rgba(168,85,247,0.4);
        }

        /* Custom Input */
        .custom-input-wrap { 
          display: flex; flex-direction: column; align-items: center; 
          position: relative;
        }
        .custom-input {
          width: 120px; background: transparent; border: none;
          border-bottom: 3px dashed var(--primary); border-radius: 0;
          color: var(--primary); font-size: 3rem; text-align: center;
          padding: 0 0.5rem; outline: none; box-shadow: none;
          transition: all 0.2s;
        }
        .custom-input:focus {
          border-bottom-color: var(--primary-hover);
          text-shadow: 0 0 15px rgba(168,85,247,0.4);
        }
        .custom-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .min-label { 
          font-size: 0.8rem; color: var(--primary); margin-top: 0.5rem; 
          font-family: 'Outfit', sans-serif; font-weight: 600; letter-spacing: 1px;
          text-transform: uppercase;
        }

        /* Play/Pause Button */
        .main-play-ctrl {
          display: flex; justify-content: center;
        }
        .play-btn { 
          width: 64px; height: 64px; border-radius: 50%; display: flex; 
          align-items: center; justify-content: center;
          background: rgba(0,0,0,0.3); color: var(--text-color); 
          border: 1px solid rgba(255,255,255,0.15);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
        }
        .play-btn.active {
          background: rgba(168,85,247,0.15); border-color: var(--primary);
          color: var(--primary); box-shadow: inset 0 0 15px rgba(168,85,247,0.2), 0 4px 20px rgba(168,85,247,0.2);
        }
        .play-btn:hover { 
          transform: scale(1.05); background: var(--primary); border-color: var(--primary); 
          color: white; box-shadow: 0 4px 20px rgba(168,85,247,0.4); 
        }
        .play-btn:active { transform: scale(0.95); }

        /* Secondary Controls */
        .secondary-controls { 
          display: flex; align-items: center; justify-content: center; gap: 0.8rem; 
          margin-top: 0.5rem;
        }
        .sec-btn {
          display: flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.8rem;
          border-radius: 16px; background: rgba(255,255,255,0.05); 
          border: 1px solid rgba(255,255,255,0.08); color: var(--text-muted);
          font-size: 0.7rem; font-weight: 500; transition: all 0.2s;
        }
        .sec-btn.icon-only { padding: 0.4rem; justify-content: center; }
        .sec-btn:hover { background: rgba(255,255,255,0.1); color: var(--text-color); }
        .sec-btn.active { background: rgba(168,85,247,0.15); color: var(--primary); border-color: rgba(168,85,247,0.3); }
        .input-row .control-btn.active {
          background: rgba(56, 189, 248, 0.2);
          border-color: rgba(56, 189, 248, 0.4);
          color: #38bdf8;
        }

        /* Alarm Modal */
        .alarm-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 10005;
          display: flex; align-items: center; justify-content: center;
        }
        .alarm-modal {
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px; width: 320px; text-align: center;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
          animation: popIn 0.2s ease-out forwards;
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .alarm-modal h3 {
          margin: 0 0 12px 0; color: #38bdf8; font-size: 1.5rem;
          animation: pulseText 1.5s infinite;
        }
        @keyframes pulseText {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .alarm-modal p {
          margin: 0 0 24px 0; color: #94a3b8; font-size: 1rem;
        }
        .dismiss-btn {
          width: 100%; padding: 12px; border-radius: 8px;
          background: var(--primary); border: none; color: #fff;
          font-family: 'Outfit', sans-serif; font-weight: 600; font-size: 1rem;
          cursor: pointer; transition: background 0.2s;
        }
        .dismiss-btn:hover {
          background: #0ea5e9;
        }
      `}</style>
    </div>
  );
}
