import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { 
  Plus, Maximize2, Trash2, Pin, PinOff, Palette, Settings as SettingsIcon,
  Type, Move, BarChart2, BookOpen, Image as ImageIcon, X, Calendar as CalendarIcon, StickyNote, Cloud, CheckCircle2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import BgmPlayer from '../bgm/BgmPlayer';
import LiveRadio from '../bgm/LiveRadio';
import { useTheme } from '../../context/ThemeContext';
import StatsModal from '../stats/StatsModal';
import SettingsModal from '../settings/SettingsModal';
import SyncModal from '../settings/SyncModal';
import StudyDesk from '../study/StudyDesk';
import DailyQuoteWidget from './DailyQuoteWidget';
import CalendarWidget from '../study/CalendarWidget';
import { useIsMobile } from '../../hooks/useIsMobile';
import LiveClock from '../clock/LiveClock';

const COLORS = [
  { name: 'Lemon',      value: '#fef08a' },
  { name: 'Honey',      value: '#fde68a' },
  { name: 'Peach',      value: '#fed7aa' },
  { name: 'Sand',       value: '#fef3c7' },
  { name: 'Cream',      value: '#fef9c3' },
  { name: 'Blush',      value: '#fecdd3' },
  { name: 'Rose',       value: '#fbcfe8' },
  { name: 'Salmon',     value: '#fca5a5' },
  { name: 'Lavender',   value: '#e9d5ff' },
  { name: 'Lilac',      value: '#d8b4fe' },
  { name: 'Periwinkle', value: '#c7d2fe' },
  { name: 'Sky',        value: '#bae6fd' },
  { name: 'Ice',        value: '#bfdbfe' },
  { name: 'Baby Blue',  value: '#dbeafe' },
  { name: 'Mint',       value: '#bbf7d0' },
  { name: 'Sage',       value: '#a7f3d0' },
  { name: 'Pistachio',  value: '#d9f99d' },
  { name: 'White',      value: '#f8fafc' },
  { name: 'Slate',      value: '#e2e8f0' },
  { name: 'Blush White',value: '#fff1f2' },
];

const FONTS = [
  { label: 'Kalam',       value: "'Kalam', cursive" },
  { label: 'Caveat',      value: "'Caveat', cursive" },
  { label: 'Indie Flower',value: "'Indie Flower', cursive" },
  { label: 'Shadow',      value: "'Shadows Into Light', cursive" },
  { label: 'Architect',   value: "'Architects Daughter', cursive" },
  { label: 'Marker',      value: "'Permanent Marker', cursive" },
  { label: 'Pacifico',    value: "'Pacifico', cursive" },
  { label: 'Dancing',     value: "'Dancing Script', cursive" },
  { label: 'Lobster',     value: "'Lobster', cursive" },
  { label: 'Abril',       value: "'Abril Fatface', cursive" },
  { label: 'Rock Salt',   value: "'Rock Salt', cursive" },
  { label: 'Typewriter',  value: "'Special Elite', cursive" },
  { label: 'Courier',     value: "'Courier Prime', monospace" },
  { label: 'Mono',        value: "'DM Mono', monospace" },
  { label: '8-Bit',       value: "'Press Start 2P', cursive" },
  { label: 'Clean',       value: "'Outfit', sans-serif" },
];

let noteZCounter = 20;

export default function StickyNoteBoard() {
  const isMobile = useIsMobile();
  const [notes, setNotes] = useLocalStorage('stickyNotes', []);
  const [tasks, setTasks] = useLocalStorage('tasks', []);
  const [calendarNotes, setCalendarNotes] = useLocalStorage('calendarDayNotes', {});
  const [activePopup, setActivePopup] = useState(null);
  const [closingPopup, setClosingPopup] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showStudyDesk, setShowStudyDesk] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user || null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, []);
  
  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };
  
  const updateCalendarNote = (dateKey, text) => {
    setCalendarNotes(prev => {
      const updated = { ...prev };
      if (!text.trim()) delete updated[dateKey];
      else updated[dateKey] = text;
      return updated;
    });
  };
  
  // Animated close — plays popOut then clears
  const closePopup = React.useCallback(() => {
    if (!activePopup) return;
    setClosingPopup(true);
    setTimeout(() => {
      setActivePopup(null);
      setClosingPopup(false);
    }, 160);
  }, [activePopup]);

  // Close any open popup when clicking anywhere outside a note
  React.useEffect(() => {
    const handleDocClick = (e) => {
      if (!e.target.closest('.sticky-note') && !e.target.closest('.notepad-stack')) {
        closePopup();
      }
    };
    document.addEventListener('pointerdown', handleDocClick);
    return () => document.removeEventListener('pointerdown', handleDocClick);
  }, [closePopup]);
  
  // All drag state lives purely in refs — zero re-renders during drag
  const dragging = useRef(null);
  const noteRefs = useRef({});
  // Keep a live mirror of note positions so drag start coords are always fresh
  const posRef = useRef({});

  const addNote = () => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const isMobileView = window.innerWidth <= 768;
    const boardW = isMobileView ? window.innerWidth : window.innerWidth - 360;
    const boardH = window.innerHeight;
    const noteW = isMobileView ? 160 : 200;
    const noteH = isMobileView ? 160 : 200;
    
    // Ensure it spawns fully within the visible screen
    const maxX = Math.max(20, boardW - noteW - 20);
    const maxY = Math.max(40, boardH - noteH - 120); // leave room for bottom nav
    
    const x = Math.floor(Math.random() * maxX) + 10;
    const y = Math.floor(Math.random() * maxY) + 40; // start slightly below top
    
    const zIdx = ++noteZCounter;
    const newNote = { id, text: '', color: COLORS[0].value, font: FONTS[0].value, isPinned: false, x, y, zIndex: zIdx };
    posRef.current[id] = { x, y };
    setNotes(prev => {
      // Safeguard against strict mode or duplicate glitches
      const cleanPrev = prev.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i);
      return [...cleanPrev, newNote];
    });
  };

  const updateNote = (id, updates) => {
    if (updates.x !== undefined) posRef.current[id] = { x: updates.x, y: updates.y };
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const deleteNote = (id) => {
    delete posRef.current[id];
    delete noteRefs.current[id];
    setNotes(prev => prev.filter(n => n.id !== id));
    setActivePopup(null);
    setClosingPopup(false);
  };

  const deleteAllNotes = () => {
    if (notes.length > 0) {
      setShowDeleteConfirm(true);
    }
  };

  const confirmDeleteAll = () => {
    setNotes([]);
    posRef.current = {};
    setShowDeleteConfirm(false);
  };

  const bringToFront = (id) => {
    const zIdx = ++noteZCounter;
    if (noteRefs.current[id]) noteRefs.current[id].style.zIndex = zIdx;
    setNotes(prev => prev.map(n => n.id === id ? { ...n, zIndex: zIdx } : n));
  };

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const onNotePointerDown = (e, noteId, isPinned) => {
    // Always bring the touched note to front, regardless of what was clicked
    bringToFront(noteId);

    if (isPinned) return;
    // Use closest() so SVG/path children of buttons are also caught
    if (e.target.closest('button') || e.target.closest('.popup-bubble')) return;
    if (e.target.tagName === 'TEXTAREA' || e.target.closest('.task-sync-item')) return;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    // Always read position from posRef (not stale note object)
    const pos = posRef.current[noteId] || { x: 0, y: 0 };
    dragging.current = {
      id: noteId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startNoteX: pos.x,
      startNoteY: pos.y,
      moved: false,
    };

    setActivePopup(null);
  };

  const onNotePointerMove = (e, noteId) => {
    if (!dragging.current || dragging.current.id !== noteId) return;
    e.preventDefault();

    const dx = e.clientX - dragging.current.startMouseX;
    const dy = e.clientY - dragging.current.startMouseY;
    let newX = dragging.current.startNoteX + dx;
    let newY = dragging.current.startNoteY + dy;

    if (isMobile) {
      // Keep notes inside the screen boundaries on mobile
      const noteW = 160; 
      const noteH = 160;
      const navH = 80; // roughly the bottom nav height
      newX = Math.max(0, Math.min(newX, window.innerWidth - noteW));
      newY = Math.max(0, Math.min(newY, window.innerHeight - noteH - navH));
    }

    dragging.current.currentX = newX;
    dragging.current.currentY = newY;
    dragging.current.moved = true;

    // Move via DOM — no React re-render needed
    const el = noteRefs.current[noteId];
    if (el) { el.style.left = `${newX}px`; el.style.top = `${newY}px`; }
  };

  const onNotePointerUp = (e, noteId) => {
    if (!dragging.current || dragging.current.id !== noteId) return;
    e.currentTarget.releasePointerCapture(e.pointerId);

    if (dragging.current.moved) {
      const { currentX, currentY } = dragging.current;
      posRef.current[noteId] = { x: currentX, y: currentY };
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, x: currentX, y: currentY } : n));
    }
    dragging.current = null;
  };

  const togglePopup = (e, id, type) => {
    e.stopPropagation();
    const isSame = activePopup && activePopup.id === id && activePopup.type === type;
    if (isSame) {
      closePopup();
    } else {
      setClosingPopup(false);
      setActivePopup({ id, type });
    }
  };

  // Sync posRef when notes load from localStorage
  notes.forEach(n => {
    if (!posRef.current[n.id]) posRef.current[n.id] = { x: n.x, y: n.y };
  });

  return (
    <div className="sticky-board" onClick={() => setActivePopup(null)}>
      <div className="top-left-wrapper">
        <div className="top-left-controls">
        <BgmPlayer />
        <LiveRadio />
        <div className="nav-separator" />
        <button 
          className="stats-btn" 
          onClick={(e) => { e.stopPropagation(); setShowSyncModal(true); }} 
          title="Settings"
        >
          <SettingsIcon size={18} />
          <span className="stats-label">Settings</span>
        </button>
        <button className="stats-btn" onClick={(e) => { e.stopPropagation(); setShowSettings(true); }} title="Custom Themes">
          <ImageIcon size={18} />
          <span className="stats-label">Themes</span>
        </button>
        <button className="stats-btn" onClick={(e) => { e.stopPropagation(); setShowStats(true); }} title="Your Stats">
          <BarChart2 size={18} />
          <span className="stats-label">Stats</span>
        </button>
        <button className="stats-btn" onClick={(e) => { e.stopPropagation(); setShowCalendar(true); }} title="Calendar">
          <CalendarIcon size={18} />
          <span className="stats-label">Calendar</span>
        </button>
        <button className="stats-btn study-btn" onClick={(e) => { e.stopPropagation(); setShowStudyDesk(true); }} title="Zen Study Mode">
          <BookOpen size={18} />
          <span className="stats-label">Study Desk</span>
        </button>
        </div>
        <div className="live-clock-corner">
          <LiveClock />
        </div>
      </div>

      {showStats && <StatsModal onClose={() => setShowStats(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showSyncModal && <SyncModal onClose={() => setShowSyncModal(false)} />}
      {showStudyDesk && <StudyDesk onClose={() => setShowStudyDesk(false)} />}
      {showCalendar && <CalendarWidget onClose={() => setShowCalendar(false)} />}

      {showDeleteConfirm && createPortal(
        <div className="custom-confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="custom-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon-wrap"><Trash2 size={28} /></div>
            <h3>Clear All Notes?</h3>
            <p>Are you sure you want to delete all notes? This action cannot be undone.</p>
            <div className="confirm-actions">
              <button className="confirm-cancel" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="confirm-danger" onClick={confirmDeleteAll}>Yes, Delete All</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Action Buttons */}
      {isMobile ? (
        <div className="mobile-fab-container">
          <button className="mobile-fab add-fab" onClick={(e) => { e.stopPropagation(); addNote(); }}>
            <StickyNote size={22} />
          </button>
        </div>
      ) : (
        <>
          <div className="notepad-stack" onClick={(e) => { e.stopPropagation(); addNote(); }} title="New Note">
            <div className="pad-layer layer3" />
            <div className="pad-layer layer2" />
            <div className="pad-layer layer1">
              <span className="pad-text">+ Write Note</span>
            </div>
          </div>

          <div className="trash-stack" onClick={(e) => { e.stopPropagation(); deleteAllNotes(); }} title="Clear All Notes">
            <div className="trash-layer">
              <Trash2 size={22} />
            </div>
          </div>
        </>
      )}

      <DailyQuoteWidget />

      {/* Notes */}
      {notes.map(note => {
        // Always ensure posRef is synced
        if (!posRef.current[note.id]) posRef.current[note.id] = { x: note.x, y: note.y };
        return (
        <div
          key={note.id}
          ref={el => { if (el) noteRefs.current[note.id] = el; }}
          className={`sticky-note${note.isPinned ? ' pinned' : ''}`}
          style={{
            left: note.x,
            top: note.y,
            background: note.color,
            zIndex: note.zIndex || 10,
          }}
          onPointerDown={e => onNotePointerDown(e, note.id, note.isPinned)}
          onPointerMove={e => onNotePointerMove(e, note.id)}
          onPointerUp={e => onNotePointerUp(e, note.id)}
          onPointerCancel={e => onNotePointerUp(e, note.id)}
          onClick={e => { e.stopPropagation(); }}   /* don't close popups on note body click */
        >
          {/* Color Popup */}
          {activePopup?.id === note.id && activePopup.type === 'color' && (
            <div className={`popup-bubble${closingPopup ? ' closing' : ''}`} onClick={e => e.stopPropagation()}>
              <div className="popup-label">Color</div>
              <div className="color-grid">
                {COLORS.map(c => (
                  <button
                    key={c.value}
                    className={`color-swatch${note.color === c.value ? ' active' : ''}`}
                    style={{ background: c.value }}
                    onClick={e => { e.stopPropagation(); updateNote(note.id, { color: c.value }); }}
                    title={c.name}
                  />
                ))}
              </div>
              <div className="popup-tail" />
            </div>
          )}

          {/* Font Popup */}
          {activePopup?.id === note.id && activePopup.type === 'font' && (
            <div className={`popup-bubble font-popup${closingPopup ? ' closing' : ''}`} onClick={e => e.stopPropagation()}>
              <div className="popup-label">Font</div>
              {FONTS.map(f => (
                <button
                  key={f.value}
                  className={`font-choice${note.font === f.value ? ' active' : ''}`}
                  style={{ fontFamily: f.value }}
                  onClick={e => { e.stopPropagation(); updateNote(note.id, { font: f.value }); }}
                >
                  {f.label}
                </button>
              ))}
              <div className="popup-tail" />
            </div>
          )}

          {/* Delete Confirm Popup */}
          {activePopup?.id === note.id && activePopup.type === 'delete' && (
            <div className={`popup-bubble delete-popup${closingPopup ? ' closing' : ''}`} onClick={e => e.stopPropagation()}>
              <div className="popup-label">Delete note?</div>
              <div className="delete-actions">
                <button className="del-confirm" onClick={e => { e.stopPropagation(); deleteNote(note.id); }}>Yes, delete</button>
                <button className="del-cancel" onClick={e => { e.stopPropagation(); closePopup(); }}>Cancel</button>
              </div>
              <div className="popup-tail" />
            </div>
          )}

          {/* Note Header */}
          <div className="note-header">
            <button
              className="hdr-btn"
              onClick={e => { e.stopPropagation(); updateNote(note.id, { isPinned: !note.isPinned }); setActivePopup(null); }}
              title={note.isPinned ? 'Unpin' : 'Pin'}
            >
              {note.isPinned ? <Pin size={14} fill="currentColor" /> : <PinOff size={14} />}
            </button>
            <div className="hdr-right">
              <button
                className={`hdr-btn${activePopup?.id === note.id && activePopup.type === 'color' ? ' on' : ''}`}
                onClick={e => togglePopup(e, note.id, 'color')}
              ><Palette size={14} /></button>
              <button
                className={`hdr-btn${activePopup?.id === note.id && activePopup.type === 'font' ? ' on' : ''}`}
                onClick={e => togglePopup(e, note.id, 'font')}
              ><Type size={14} /></button>
              <button
                className="hdr-btn del"
                onClick={e => { e.stopPropagation(); togglePopup(e, note.id, 'delete'); }}
              ><X size={15} /></button>
            </div>
          </div>

          {note.type === 'task-sync' ? (
            <div className="task-sync-content" style={{ fontFamily: note.font || FONTS[0].value }}>
              <div className="task-sync-title">Tasks</div>
              {tasks.length === 0 && <div className="task-sync-empty">No tasks yet.</div>}
              <div className="task-sync-list">
                {tasks.map(t => (
                  <div key={t.id} className={`task-sync-item ${t.completed ? 'completed' : ''}`} onClick={(e) => { e.stopPropagation(); toggleTask(t.id); }}>
                    <div className="task-sync-check">
                      {t.completed && <CheckCircle2 size={12} strokeWidth={3} />}
                    </div>
                    <span className="task-sync-text">
                      {t.text}
                      {t.calendarDate && <span className="task-sync-date"> {new Date(t.calendarDate + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : note.type === 'calendar-sync' ? (
            <div className="cal-sync-content" style={{ position: 'relative', width: '100%', height: '100%' }}>
              <textarea
                value={calendarNotes[note.dateKey] || ''}
                onChange={e => updateCalendarNote(note.dateKey, e.target.value)}
                placeholder="type shi..."
                style={{ fontFamily: note.font || FONTS[0].value, height: '100%', paddingBottom: '24px' }}
              />
              <div className="cal-sync-date-label">
                {new Date(note.dateKey + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </div>
            </div>
          ) : (
            <textarea
              value={note.text}
              onChange={e => updateNote(note.id, { text: e.target.value })}
              placeholder="type shi..."
              style={{ fontFamily: note.font || FONTS[0].value }}
            />
          )}
        </div>
        );
      })}

      <style jsx="true">{`
        .sticky-board {
          position: absolute; inset: 0;
          pointer-events: none;
          /* No overflow:hidden — notes can peek anywhere */
        }

        /* ── Custom Confirm Modal ─────────────────────────────────────────── */
        .custom-confirm-overlay {
          position: fixed; inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.2s ease;
        }
        .custom-confirm-modal {
          width: 90%; max-width: 320px;
          padding: 2rem;
          border-radius: 20px;
          display: flex; flex-direction: column; align-items: center; text-align: center;
          background: rgba(20, 25, 40, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .confirm-icon-wrap {
          width: 56px; height: 56px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 1rem;
        }
        .custom-confirm-modal h3 {
          margin: 0 0 0.5rem 0; font-size: 1.25rem; font-family: 'Outfit', sans-serif; color: var(--text-color);
        }
        .custom-confirm-modal p {
          margin: 0 0 1.5rem 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;
        }
        .confirm-actions {
          display: flex; gap: 0.8rem; width: 100%;
        }
        .confirm-actions button {
          flex: 1; padding: 0.6rem; border-radius: 12px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; font-family: 'Outfit', sans-serif;
        }
        .confirm-cancel {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: var(--text-muted);
        }
        .confirm-cancel:hover {
          background: rgba(255,255,255,0.1); color: var(--text-color);
        }
        .confirm-danger {
          background: #ef4444; border: none; color: white; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }
        .confirm-danger:hover {
          background: #dc2626; transform: translateY(-2px); box-shadow: 0 6px 15px rgba(239, 68, 68, 0.4);
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        
        .top-left-controls {
          display: flex;
          align-items: center;
          gap: 0.2rem;
          padding: 0.3rem;
          background: rgba(11, 17, 32, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 99px;
          z-index: 50;
          pointer-events: auto;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }

        .top-left-wrapper {
          position: absolute;
          top: 1.5rem;
          left: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
          z-index: 50;
          pointer-events: auto;
        }

        .live-clock-corner {
          pointer-events: none;
          padding-left: 6px;
        }

        .nav-separator {
          width: 1.5px;
          height: 18px;
          background: rgba(255,255,255,0.1);
          margin: 0 0.2rem;
        }

        .stats-btn {
          display: flex;
          align-items: center;
          gap: 0;
          padding: 0.5rem;
          background: transparent;
          border: none;
          border-radius: 99px;
          color: var(--text-muted);
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .stats-btn:hover {
          color: var(--text-color);
          background: rgba(255,255,255,0.08);
        }
        .stats-btn.active, .stats-btn:hover {
          gap: 0.5rem;
          padding-left: 1rem;
          padding-right: 1rem;
        }
        .stats-label {
          max-width: 0;
          opacity: 0;
          overflow: hidden;
          white-space: nowrap;
          transition: max-width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
        }
        .stats-btn.active .stats-label, .stats-btn:hover .stats-label {
          max-width: 80px;
          opacity: 1;
        }

        /* ── Peeking stack ─────────────────────────────────────────── */
        .notepad-stack {
          position: absolute;
          bottom: -20px; right: var(--sidebar-offset, 360px);
          width: 130px; height: 80px;
          cursor: pointer;
          pointer-events: auto;
          transition: transform .3s cubic-bezier(.34,1.56,.64,1), right 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: 200;
        }
        .notepad-stack:hover { transform: translateY(-14px); }

        .pad-layer {
          position: absolute; bottom: 0; width: 100%;
          border-radius: 3px 3px 0 0;
          border: 1px solid rgba(0,0,0,.06); border-bottom: none;
          box-shadow: 0 -3px 8px rgba(0,0,0,.08);
          padding-bottom: 20px;
        }
        .layer3 { height: 58px; right: -5px; transform: rotate(3.5deg);  background: #fde68a; }
        .layer2 { height: 70px; right: -2px; transform: rotate(-2deg);   background: #fef9c3; }
        .layer1 {
          height: 80px; right: 0;
          background: #fef08a;
          background-image: linear-gradient(to bottom, rgba(255,255,255,.35) 0%, transparent 100%);
          display: flex; align-items: flex-start; justify-content: center;
          padding-top: 18px;
        }
        .pad-text { font-family:'Kalam',cursive; font-size:1.05rem; color:#92400e; font-weight:700; }

        /* ── Peeking Trash ─────────────────────────────────────────── */
        .trash-stack {
          position: absolute;
          bottom: -20px; right: calc(var(--sidebar-offset, 360px) + 150px);
          width: 50px; height: 80px;
          cursor: pointer;
          pointer-events: auto;
          transition: transform .3s cubic-bezier(.34,1.56,.64,1), right 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: 200;
        }
        .trash-stack:hover { transform: translateY(-14px); }

        .trash-layer {
          position: absolute; bottom: 0; width: 100%; height: 80px;
          border-radius: 4px 4px 0 0;
          border: 1px solid rgba(0,0,0,.15); border-bottom: none;
          box-shadow: 0 -3px 8px rgba(0,0,0,.15);
          background: #ef4444;
          background-image: linear-gradient(to bottom, rgba(255,255,255,.2) 0%, transparent 100%);
          display: flex; align-items: flex-start; justify-content: center;
          padding-top: 16px;
          padding-bottom: 20px;
          color: #7f1d1d;
        }

        /* ── Note card ─────────────────────────────────────────────── */
        .sticky-note {
          position: absolute;
          width: 200px; height: 200px;
          padding: 8px 12px 12px;
          display: flex; flex-direction: column;
          pointer-events: auto;
          user-select: none;
          touch-action: none;
          cursor: grab;

          /* Clean paper look */
          border-radius: 1px;
          box-shadow:
            0 1px 2px rgba(0,0,0,.07),
            0 4px 10px rgba(0,0,0,.10),
            0 12px 28px rgba(0,0,0,.12);
          background-image: linear-gradient(160deg, rgba(255,255,255,.28) 0%, rgba(255,255,255,0) 100%);

          /* NO transform here — we only move via left/top */
        }

        .sticky-note.pinned { cursor: default; }

        .sticky-note:active:not(.pinned) { cursor: grabbing; }

        /* ── Header ────────────────────────────────────────────────── */
        .note-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 6px;
          opacity: 0;
          transition: opacity .15s;
          flex-shrink: 0;
          height: 22px;
        }
        .sticky-note:hover .note-header { opacity: 1; }

        .hdr-right { display: flex; gap: 4px; }

        .hdr-btn {
          display: flex; align-items: center; justify-content: center;
          width: 22px; height: 22px; border-radius: 4px;
          border: none; background: transparent;
          color: rgba(0,0,0,.45); cursor: pointer;
          transition: background .12s, color .12s;
        }
        .hdr-btn:hover { background: rgba(0,0,0,.08); color: rgba(0,0,0,.8); }
        .hdr-btn.on   { background: rgba(0,0,0,.1);  color: rgba(0,0,0,.9); }
        .hdr-btn.del:hover { background: rgba(220,38,38,.12); color: #dc2626; }

        /* ── Textarea ──────────────────────────────────────────────── */
        .sticky-note textarea {
          flex: 1; width: 100%;
          background: transparent; border: none; resize: none; outline: none;
          color: #1c1917; font-size: 1.1rem; line-height: 1.45;
          cursor: text;
        }
        .sticky-note textarea::placeholder { color: rgba(28,25,23,.35); }

        /* ── Popups ────────────────────────────────────────────────── */
        .popup-bubble {
          position: absolute;
          top: 0; left: calc(100% + 8px);
          background: rgba(255,255,255,.97);
          backdrop-filter: blur(12px);
          border-radius: 12px;
          padding: 10px;
          box-shadow: 0 8px 28px rgba(0,0,0,.18), 0 0 0 1px rgba(0,0,0,.07);
          z-index: 300;
          animation: popIn .18s cubic-bezier(.34,1.56,.64,1) both;
          max-height: 280px;
          overflow-y: auto;
        }

        .popup-bubble.font-popup {
          display: flex; flex-direction: column; gap: 2px; width: 148px;
        }

        .popup-tail {
          position: absolute;
          left: -5px; top: 14px;
          width: 10px; height: 10px;
          background: rgba(255,255,255,.97);
          transform: rotate(45deg);
          border-left: 1px solid rgba(0,0,0,.07);
          border-bottom: 1px solid rgba(0,0,0,.07);
        }

        @keyframes popIn {
          from { opacity:0; transform: translateX(-8px) scale(.92); }
          to   { opacity:1; transform: translateX(0) scale(1); }
        }

        @keyframes popOut {
          from { opacity:1; transform: translateX(0) scale(1); }
          to   { opacity:0; transform: translateX(-8px) scale(.92); }
        }

        .popup-bubble.closing {
          animation: popOut .16s cubic-bezier(0.4, 0, 1, 1) both;
        }

        .popup-label {
          font-family: 'Outfit', sans-serif;
          font-size: .6rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: .08em;
          color: #9ca3af; margin-bottom: 8px;
        }

        /* Color grid */
        .color-grid { display: flex; flex-wrap: wrap; gap: 6px; width: 120px; }

        .color-swatch {
          width: 24px; height: 24px; border-radius: 50%;
          border: 2px solid transparent; cursor: pointer; flex-shrink: 0;
          box-shadow: 0 1px 3px rgba(0,0,0,.15);
          transition: transform .12s;
        }
        .color-swatch:hover { transform: scale(1.15); }
        .color-swatch.active {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,.22);
          transform: scale(1.15);
        }

        /* Font list */
        .font-choice {
          background: transparent; border: none; border-radius: 7px;
          padding: 6px 10px; text-align: left; cursor: pointer;
          font-size: 1rem; color: #374151;
          transition: background .1s;
          white-space: nowrap;
        }
        .font-choice:hover  { background: rgba(0,0,0,.05); }
        /* Delete confirm */
        .delete-popup { width: 148px; }
        .delete-actions { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
        .del-confirm {
          background: #fef2f2; border: 1px solid #fecaca;
          color: #dc2626; font-size: 0.85rem; font-weight: 600;
          padding: 7px 10px; border-radius: 8px; cursor: pointer;
          transition: background .12s;
          font-family: 'Outfit', sans-serif;
        }
        .del-confirm:hover { background: #fee2e2; }
        .del-cancel {
          background: transparent; border: 1px solid rgba(0,0,0,.08);
          color: #6b7280; font-size: 0.85rem;
          padding: 6px 10px; border-radius: 8px; cursor: pointer;
          transition: background .12s;
          font-family: 'Outfit', sans-serif;
        }
        .del-cancel:hover { background: rgba(0,0,0,.04); }

        /* ── Mobile Overrides ─────────────────────────────────────────── */
        @media (max-width: 768px) {
          .sticky-note {
            width: 160px !important;
            height: 160px !important;
            min-height: 160px !important;
            box-sizing: border-box !important;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          }
          .mobile-fab-container {
            position: fixed;
            bottom: 96px; /* above mobile nav */
            right: 20px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            z-index: 9999;
          }
          .mobile-fab {
            width: 56px; height: 56px;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            border: none;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            color: white;
            cursor: pointer;
          }
          .mobile-fab.add-fab {
            background: #a855f7; /* Theme purple */
          }
          .mobile-fab.trash-fab {
            background: #ef4444; /* Danger red */
          }
          .notepad-stack, .trash-stack {
            display: none !important;
          }
          .top-left-controls {
            display: none !important;
          }
          .top-left-wrapper {
            display: none !important;
          }
          .note-header {
            opacity: 1 !important;
          }
        }
        /* ── Task Sync Note ─────────────────────────────────────────── */
        .task-sync-content {
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          height: 100%;
          color: rgba(0,0,0,0.85);
          cursor: default;
        }
        .task-sync-title {
          font-weight: bold;
          margin-bottom: 8px;
          font-size: 1.1em;
          border-bottom: 1px solid rgba(0,0,0,0.1);
          padding-bottom: 4px;
        }
        .task-sync-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          overflow-y: auto;
          flex: 1;
        }
        .task-sync-list::-webkit-scrollbar { width: 4px; }
        .task-sync-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
        .task-sync-empty {
          color: rgba(0,0,0,0.4);
          font-style: italic;
          font-size: 0.9em;
        }
        .task-sync-item {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          cursor: pointer;
          font-size: 0.95em;
          line-height: 1.3;
          transition: opacity 0.2s;
        }
        .task-sync-item:hover {
          opacity: 0.8;
        }
        .task-sync-item.completed {
          opacity: 0.5;
          text-decoration: line-through;
        }
        .task-sync-check {
          width: 14px;
          height: 14px;
          border-radius: 3px;
          border: 1.5px solid rgba(0,0,0,0.3);
          margin-top: 2px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(0,0,0,0.6);
        }
        .task-sync-item.completed .task-sync-check {
          border-color: rgba(0,0,0,0.6);
        }
        .task-sync-text {
          flex: 1;
          word-break: break-word;
        }
        .task-sync-date {
          font-size: 0.8em;
          opacity: 0.6;
        }

        /* ── Calendar Sync Note ─────────────────────────────────────────── */
        .cal-sync-date-label {
          position: absolute;
          bottom: 5px;
          right: 5px;
          font-size: 0.8rem;
          opacity: 0.4;
          color: #000;
          pointer-events: none;
          font-family: 'Outfit', sans-serif;
          font-weight: 500;
        }

      `}</style>
    </div>
  );
}
