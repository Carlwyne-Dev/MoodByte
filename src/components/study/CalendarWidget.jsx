import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Plus, FileText, Check } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const STORAGE_KEY = 'calendarDayNotes';

function getDayKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
function loadNotes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function saveNotes(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export default function CalendarWidget({ onClose, inlineMode = false }) {
  const [position, setPosition] = useState({ x: 50, y: 150 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const widgetRef = useRef(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayNotes, setDayNotes] = useState(loadNotes);
  const [noteInput, setNoteInput] = useState('');
  const [taskInput, setTaskInput] = useState('');
  const [tasks, setTasks] = useLocalStorage('tasks', []);

  const onPointerDown = (e) => {
    if (inlineMode) return;
    if (e.target.closest('button') || e.target.closest('.cal-day')) return;
    if (!e.target.closest('.calendar-header-drag')) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    e.target.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
    // Close popup while dragging
    if (selectedDay) { setSelectedDay(null); setNoteInput(''); }
  };
  const onPointerUp = (e) => {
    setIsDragging(false);
    e.target.releasePointerCapture(e.pointerId);
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dayNames = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const handleDayClick = (d, e) => {
    if (!d) return;
    const key = getDayKey(year, month, d);
    if (selectedDay?.key === key) {
      setSelectedDay(null);
      setNoteInput('');
      setTaskInput('');
      return;
    }
    // Position popup to the right of the widget (or left if inline/sidebar)
    const widgetRect = widgetRef.current?.getBoundingClientRect();
    const dayRect = e.currentTarget.getBoundingClientRect();
    const popupTop = dayRect.top + dayRect.height / 2;
    const popupLeft = inlineMode
      ? (widgetRect ? widgetRect.left - 280 : dayRect.left - 280)
      : (widgetRect ? widgetRect.right + 12 : dayRect.right + 12);
    // Load existing note text for this day
    const existing = getNoteText(key);
    setNoteInput(existing);
    setSelectedDay({ day: d, key, popupTop, popupLeft });
    setTaskInput('');
  };

  const getNoteText = (key) => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')[key] || ''; }
    catch { return ''; }
  };

  const saveNoteText = (key, text) => {
    const all = loadNotes();
    if (text.trim()) all[key] = text;
    else delete all[key];
    saveNotes(all);
    setDayNotes({ ...all });
  };

  const addDayTask = () => {
    if (!taskInput.trim() || !selectedDay) return;
    const uid = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newTask = {
      id: uid,
      text: taskInput.trim(),
      completed: false,
      createdAt: selectedDay.key + 'T00:00:00.000Z',
      calendarDate: selectedDay.key
    };
    setTasks(prev => [newTask, ...prev]);
    setTaskInput('');
  };

  const toggleDayTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const selectedNotes = selectedDay ? (dayNotes[selectedDay.key] || []) : [];
  const selectedTasks = selectedDay
    ? tasks.filter(t => t.calendarDate === selectedDay.key)
    : [];

  // Close popup on outside click
  useEffect(() => {
    if (!selectedDay) return;
    const handle = (e) => {
      if (!e.target.closest('.cal-day-popup') && !e.target.closest('.cal-day.active')) {
        setSelectedDay(null);
        setNoteInput('');
        setTaskInput('');
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [selectedDay]);

  // Close the whole widget when clicking outside (not on portal popup)
  useEffect(() => {
    if (!onClose) return;
    const handleOutside = (e) => {
      if (
        widgetRef.current && !widgetRef.current.contains(e.target) &&
        !e.target.closest('.cal-day-popup')
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [onClose]);


  const formatSelectedDate = (d) => {
    if (!d) return '';
    return new Date(year, month, d.day).toLocaleDateString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric'
    });
  };

  return (
    <>
      <div
        ref={widgetRef}
        className={`calendar-widget ${isDragging ? 'dragging' : ''} ${inlineMode ? 'inline-mode' : ''}`}
        style={!inlineMode ? { transform: `translate(${position.x}px, ${position.y}px)` } : {}}
      >
        <div
          className={`calendar-header ${!inlineMode ? 'calendar-header-drag' : ''}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <div className="cal-title font-pixel">
            <CalendarIcon size={14} /> Planner
          </div>
          <button className="cal-close-btn" onClick={onClose}><X size={14} /></button>
        </div>

        <div className="calendar-body">
          <div className="cal-controls">
            <button onClick={prevMonth}><ChevronLeft size={16} /></button>
            <span className="cal-month-year font-pixel">{monthNames[month]} {year}</span>
            <button onClick={nextMonth}><ChevronRight size={16} /></button>
          </div>

          <div className="cal-grid">
            {dayNames.map(d => <div key={d} className="cal-day-name font-pixel">{d}</div>)}
            {days.map((d, i) => {
              const isToday = isCurrentMonth && d === today.getDate();
              const key = d ? getDayKey(year, month, d) : null;
              const hasNote = key && dayNotes[key] && (
                typeof dayNotes[key] === 'string'
                  ? dayNotes[key].trim().length > 0
                  : dayNotes[key].length > 0
              );
              const dayTaskList = key ? tasks.filter(t => t.calendarDate === key && !t.completed) : [];
              const taskCount = dayTaskList.length;
              const taskDotClass = taskCount === 0 ? '' : taskCount <= 2 ? 'dot-purple' : taskCount <= 5 ? 'dot-orange' : 'dot-red';
              const isSelected = selectedDay?.key === key;
              return (
                <div
                  key={i}
                  className={`cal-day ${d ? 'active' : 'empty'} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={(e) => handleDayClick(d, e)}
                >
                  {d || ''}
                  <span className="day-indicators">
                    {hasNote && <span className="day-dot day-dot-note" />}
                    {taskCount > 0 && <span className={`day-dot ${taskDotClass}`} />}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day popup — rendered in portal so it floats freely */}
      {selectedDay && createPortal(
        <div
          className={`cal-day-popup ${inlineMode ? 'popup-left' : 'popup-right'}`}
          style={{ top: `${selectedDay.popupTop}px`, left: `${selectedDay.popupLeft}px` }}
        >
          {/* Tail arrow */}
          <div className={`cal-popup-tail ${inlineMode ? 'tail-right' : 'tail-left'}`} />

          {/* Header */}
          <div className="cal-popup-header">
            <span className="cal-popup-date font-pixel">{formatSelectedDate(selectedDay)}</span>
            <button className="cal-popup-close" onClick={() => { setSelectedDay(null); setNoteInput(''); setTaskInput(''); }}>
              <X size={12} />
            </button>
          </div>

          {/* ── Notes Section ── */}
          <div className="cal-section">
            <div className="cal-section-label">Note</div>
            <textarea
              className="cal-day-textarea"
              placeholder="Write freely for this day..."
              value={noteInput}
              onChange={e => {
                setNoteInput(e.target.value);
                saveNoteText(selectedDay.key, e.target.value);
              }}
              autoFocus
            />
          </div>

          <div className="cal-divider" />

          {/* ── Tasks Section ── */}
          <div className="cal-section">
            <div className="cal-section-label">Tasks</div>
            <div className="cal-popup-notes">
              {selectedTasks.length === 0 && (
                <p className="cal-popup-empty">No tasks for this day.</p>
              )}
              {selectedTasks.map(task => (
                <div key={task.id} className={`cal-popup-note-item ${task.completed ? 'task-done' : ''}`}>
                  <button className="cal-task-check" onClick={() => toggleDayTask(task.id)}>
                    {task.completed ? <Check size={9} strokeWidth={3} /> : null}
                  </button>
                  <span>{task.text}</span>
                </div>
              ))}
            </div>
            {/* Task input with inline + pill */}
            <div className="cal-task-input-wrap">
              <input
                className="cal-popup-input cal-task-input"
                placeholder="Add a task..."
                value={taskInput}
                onChange={e => setTaskInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDayTask(); } }}
              />
              {taskInput.trim() && (
                <button className="cal-task-pill-btn" onClick={addDayTask}>
                  <Plus size={12} />
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        /* ── Calendar Widget ──────────────────────────────────────── */
        .calendar-widget {
          width: 260px;
          background: rgba(15, 23, 42, 0.92);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1);
          overflow: hidden;
          pointer-events: auto;
        }
        .calendar-widget:not(.inline-mode) {
          position: absolute; top: 0; left: 0;
          z-index: 100; transition: box-shadow 0.2s;
        }
        .calendar-widget.dragging {
          box-shadow: 0 20px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1);
        }

        .calendar-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 12px;
          background: rgba(0,0,0,0.3);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .calendar-header-drag { cursor: grab; }
        .calendar-header-drag:active { cursor: grabbing; }

        .cal-title {
          display: flex; align-items: center; gap: 8px;
          color: var(--primary); font-size: 0.65rem;
          text-transform: uppercase; pointer-events: none;
        }
        .cal-close-btn {
          background: none; border: none;
          color: rgba(255,255,255,0.5); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          padding: 2px; border-radius: 4px;
        }
        .cal-close-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }

        .calendar-body { padding: 12px; }

        .cal-controls {
          display: flex; justify-content: space-between;
          align-items: center; margin-bottom: 12px;
        }
        .cal-controls button {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff; border-radius: 6px;
          display: flex; align-items: center;
          justify-content: center; padding: 4px; cursor: pointer;
        }
        .cal-controls button:hover { background: var(--primary); border-color: var(--primary); }

        .cal-month-year { color: #fff; font-size: 0.7rem; }

        .cal-grid {
          display: grid; grid-template-columns: repeat(7, 1fr);
          gap: 4px; text-align: center;
        }
        .cal-day-name { color: rgba(255,255,255,0.4); font-size: 0.5rem; margin-bottom: 4px; }

        .cal-day {
          height: 28px; position: relative;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Outfit', sans-serif;
          font-size: 0.78rem; border-radius: 6px; color: #fff;
        }
        .cal-day.active {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05); cursor: pointer;
        }
        .cal-day.active:hover { background: rgba(255,255,255,0.1); }
        .cal-day.today {
          background: var(--primary); color: #fff; border: none;
          font-weight: bold; box-shadow: 0 0 10px var(--primary);
        }
        .cal-day.selected {
          background: rgba(168,85,247,0.25) !important;
          border-color: rgba(168,85,247,0.5) !important;
        }

        /* Indicators row under day number */
        .day-indicators {
          position: absolute; bottom: 2px;
          display: flex; align-items: center; justify-content: center;
          gap: 2px; left: 0; right: 0;
        }
        .day-dot {
          width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0;
        }
        /* Note dot — always soft white */
        .day-dot-note { background: rgba(255,255,255,0.45); }
        /* Task dot — color by load */
        .dot-purple { background: #a855f7; box-shadow: 0 0 4px rgba(168,85,247,0.7); }
        .dot-orange { background: #f97316; box-shadow: 0 0 4px rgba(249,115,22,0.7); }
        .dot-red    { background: #ef4444; box-shadow: 0 0 5px rgba(239,68,68,0.8); }

        /* ── Day Popup (portal) ───────────────────────────────────── */
        .cal-day-popup {
          position: fixed;
          transform: translateY(-50%);
          width: 240px;
          background: rgba(20, 27, 46, 0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 14px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08);
          z-index: 99999;
          overflow: hidden;
          animation: calPopIn 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes calPopIn {
          from { opacity: 0; transform: translateY(-50%) scale(0.92); }
          to   { opacity: 1; transform: translateY(-50%) scale(1); }
        }

        /* Arrow tail */
        .cal-popup-tail {
          position: absolute; top: 50%; width: 10px; height: 10px;
          background: rgba(30, 38, 60, 0.92);
          border: 1px solid rgba(255,255,255,0.15);
          transform: translateY(-50%) rotate(45deg);
          z-index: -1;
        }
        .tail-left {
          left: -6px;
          border-right: none; border-top: none;
        }
        .tail-right {
          right: -6px;
          border-left: none; border-bottom: none;
        }

        .cal-popup-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 12px;
          background: rgba(0,0,0,0.25);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .cal-popup-date {
          color: var(--primary); font-size: 0.58rem; text-transform: uppercase;
        }
        .cal-popup-close {
          background: none; border: none; color: rgba(255,255,255,0.4);
          cursor: pointer; padding: 2px; border-radius: 4px;
          display: flex; align-items: center;
        }
        .cal-popup-close:hover { color: #fff; background: rgba(255,255,255,0.08); }

        .cal-popup-notes {
          max-height: 140px; overflow-y: auto;
          padding: 8px 10px;
          display: flex; flex-direction: column; gap: 5px;
          scrollbar-width: thin;
          scrollbar-color: rgba(168,85,247,0.3) transparent;
        }
        .cal-popup-notes::-webkit-scrollbar { width: 3px; }
        .cal-popup-notes::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.3); border-radius: 2px; }

        .cal-popup-empty {
          font-size: 0.72rem; color: rgba(255,255,255,0.3);
          text-align: center; padding: 10px 0; margin: 0;
          font-family: 'Outfit', sans-serif;
        }

        .cal-popup-note-item {
          display: flex; align-items: flex-start; gap: 6px;
          font-size: 0.78rem; color: rgba(255,255,255,0.82);
          font-family: 'Outfit', sans-serif;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px; padding: 6px 8px;
          line-height: 1.4;
        }
        .cal-popup-note-item span { flex: 1; word-break: break-word; }
        .cal-popup-note-item.task-done span {
          text-decoration: line-through; opacity: 0.4;
        }
        .cal-popup-note-del {
          background: none; border: none; color: rgba(255,255,255,0.25);
          cursor: pointer; padding: 0; display: flex;
          align-items: center; flex-shrink: 0; border-radius: 3px;
        }
        .cal-popup-note-del:hover { color: #f87171; }

        .cal-task-check {
          width: 16px; height: 16px; border-radius: 4px; flex-shrink: 0;
          border: 1.5px solid rgba(255,255,255,0.25);
          background: transparent; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #fff; margin-top: 1px;
        }
        .cal-popup-note-item.task-done .cal-task-check {
          background: #4ade80; border-color: transparent;
        }

        .cal-section { padding: 10px 10px 8px; }
        .cal-section-label {
          font-size: 0.58rem; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; color: rgba(255,255,255,0.35);
          margin-bottom: 6px; font-family: 'Outfit', sans-serif;
        }
        .cal-divider {
          height: 1px; background: rgba(255,255,255,0.06); margin: 0;
        }

        /* Free-form note textarea */
        .cal-day-textarea {
          width: 100%;
          min-height: 80px;
          resize: none;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 8px 10px;
          color: rgba(255,255,255,0.85);
          font-size: 0.8rem;
          font-family: 'Outfit', sans-serif;
          line-height: 1.5;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .cal-day-textarea::placeholder { color: rgba(255,255,255,0.25); }
        .cal-day-textarea:focus { border-color: rgba(168,85,247,0.4); }

        /* Task input wrap — button inside */
        .cal-task-input-wrap {
          position: relative; margin-top: 6px;
        }
        .cal-task-input {
          width: 100%; padding-right: 36px; box-sizing: border-box;
        }
        .cal-task-pill-btn {
          position: absolute; right: 5px; top: 50%;
          transform: translateY(-50%);
          background: var(--primary); border: none; color: #fff;
          border-radius: 6px; width: 24px; height: 22px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: opacity 0.15s;
          animation: fadeInBtn 0.12s ease;
        }
        @keyframes fadeInBtn {
          from { opacity: 0; transform: translateY(-50%) scale(0.85); }
          to   { opacity: 1; transform: translateY(-50%) scale(1); }
        }
        .cal-task-pill-btn:hover { opacity: 0.85; }
        .cal-popup-input {
          flex: 1; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; padding: 5px 9px;
          color: #fff; font-size: 0.78rem;
          font-family: 'Outfit', sans-serif; outline: none;
        }
        .cal-popup-input::placeholder { color: rgba(255,255,255,0.3); }
        .cal-popup-input:focus { border-color: rgba(168,85,247,0.5); }

        .cal-popup-add-btn {
          background: var(--primary); border: none; color: #fff;
          border-radius: 8px; width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0; transition: opacity 0.15s;
        }
        .cal-popup-add-btn:disabled { opacity: 0.35; cursor: default; }
        .cal-popup-add-btn:not(:disabled):hover { opacity: 0.82; }
      `}</style>
    </>
  );
}
