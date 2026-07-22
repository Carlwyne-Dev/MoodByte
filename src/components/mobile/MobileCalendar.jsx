import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, CheckSquare, Square } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function getDayKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

export default function MobileCalendar() {
  const today = new Date();
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedKey, setSelectedKey] = useState(null);
  const [dayNotes, setDayNotes] = useLocalStorage('calendarNotes', {});
  const [tasks] = useLocalStorage('tasks', []);
  const [noteText, setNoteText] = useState('');

  const year = view.getFullYear();
  const month = view.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const todayKey = getDayKey(today.getFullYear(), today.getMonth(), today.getDate());

  // Load note when selection changes
  useEffect(() => {
    if (selectedKey) {
      setNoteText(typeof dayNotes[selectedKey] === 'string' ? dayNotes[selectedKey] : '');
    }
  }, [selectedKey]);

  const saveNote = (text) => {
    setNoteText(text);
    setDayNotes(prev => ({ ...prev, [selectedKey]: text }));
  };

  // Build calendar grid — weeks as rows
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  // Group into weeks
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  // Find which week the selected day is in
  const selectedWeekIdx = selectedKey
    ? weeks.findIndex(week => week.some(d => d && getDayKey(year, month, d) === selectedKey))
    : -1;

  const getDotClass = (key) => {
    const active = tasks.filter(t => t.calendarDate === key && !t.completed).length;
    if (active === 0) return '';
    if (active <= 2) return 'dot-purple';
    if (active <= 5) return 'dot-orange';
    return 'dot-red';
  };

  const hasNote = (key) => {
    return dayNotes[key] && (typeof dayNotes[key] === 'string' ? dayNotes[key].trim().length > 0 : false);
  };

  const selectedDayTasks = selectedKey ? tasks.filter(t => t.calendarDate === selectedKey) : [];
  const selectedDate = selectedKey
    ? new Date(selectedKey + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
    : '';

  return (
    <div className="mob-calendar">
      {/* Month nav */}
      <div className="mob-cal-nav">
        <button className="mob-cal-nav-btn" onClick={() => {
          setSelectedKey(null);
          setView(new Date(year, month - 1, 1));
        }}>
          <ChevronLeft size={18} />
        </button>
        <span className="mob-cal-month font-pixel">{MONTH_NAMES[month]} {year}</span>
        <button className="mob-cal-nav-btn" onClick={() => {
          setSelectedKey(null);
          setView(new Date(year, month + 1, 1));
        }}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day name headers */}
      <div className="mob-cal-day-names">
        {DAY_NAMES.map(d => <div key={d} className="mob-cal-dn">{d}</div>)}
      </div>

      {/* Weeks with inline accordion */}
      <div className="mob-cal-weeks">
        {weeks.map((week, wi) => (
          <React.Fragment key={wi}>
            <div className="mob-cal-week">
              {week.map((d, di) => {
                const key = d ? getDayKey(year, month, d) : null;
                const isToday = key === todayKey;
                const isSelected = key === selectedKey;
                const dotClass = key ? getDotClass(key) : '';
                const note = key ? hasNote(key) : false;
                return (
                  <div
                    key={di}
                    className={`mob-cal-day ${d ? 'active' : 'empty'} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      if (!d) return;
                      setSelectedKey(isSelected ? null : key);
                    }}
                  >
                    {d || ''}
                    <span className="mob-day-dots">
                      {note && <span className="mob-dot dot-white" />}
                      {dotClass && <span className={`mob-dot ${dotClass}`} />}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Accordion panel after the week that contains the selected day */}
            {selectedWeekIdx === wi && selectedKey && (
              <div className="mob-day-panel">
                <div className="mob-day-panel-header">
                  <Calendar size={13} />
                  <span>{selectedDate}</span>
                </div>

                {/* Note area */}
                <div className="mob-panel-section">
                  <div className="mob-panel-label">Note</div>
                  <textarea
                    className="mob-panel-textarea"
                    placeholder="Write anything..."
                    value={noteText}
                    onChange={e => saveNote(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Tasks for this day */}
                {selectedDayTasks.length > 0 && (
                  <div className="mob-panel-section">
                    <div className="mob-panel-label">Tasks</div>
                    <ul className="mob-panel-tasks">
                      {selectedDayTasks.map(task => (
                        <li key={task.id} className={`mob-panel-task ${task.completed ? 'done' : ''}`}>
                          {task.completed
                            ? <CheckSquare size={13} className="mob-task-icon done" />
                            : <Square size={13} className="mob-task-icon" />}
                          <span>{task.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <style>{`
        .mob-calendar {
          width: 100%;
          padding: 16px 14px;
          box-sizing: border-box;
        }
        .mob-cal-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .mob-cal-nav-btn {
          width: 34px; height: 34px;
          border-radius: 10px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
        }
        .mob-cal-nav-btn:hover { background: var(--primary); border-color: var(--primary); }
        .mob-cal-month { font-size: 0.7rem; color: #fff; }

        .mob-cal-day-names {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
          margin-bottom: 6px;
        }
        .mob-cal-dn {
          font-family: 'Outfit', sans-serif;
          font-size: 0.62rem;
          color: rgba(255,255,255,0.35);
          padding: 4px 0;
        }

        .mob-cal-weeks { display: flex; flex-direction: column; gap: 3px; }
        .mob-cal-week {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 3px;
        }
        .mob-cal-day {
          position: relative;
          aspect-ratio: 1;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          font-family: 'Outfit', sans-serif;
          font-size: 0.85rem; color: #fff;
          border-radius: 10px;
          gap: 2px;
        }
        .mob-cal-day.active {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          cursor: pointer;
        }
        .mob-cal-day.active:active { opacity: 0.7; }
        .mob-cal-day.today {
          background: var(--primary) !important;
          border: none !important;
          font-weight: 700;
          box-shadow: 0 0 12px var(--primary);
        }
        .mob-cal-day.selected {
          background: rgba(168,85,247,0.25) !important;
          border-color: rgba(168,85,247,0.6) !important;
        }
        .mob-cal-day.empty { cursor: default; }
        .mob-day-dots {
          display: flex; gap: 2px; justify-content: center; align-items: center;
          min-height: 5px;
        }
        .mob-dot {
          width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0;
        }
        .dot-white  { background: rgba(255,255,255,0.4); }
        .dot-purple { background: #a855f7; box-shadow: 0 0 4px rgba(168,85,247,0.8); }
        .dot-orange { background: #f97316; box-shadow: 0 0 4px rgba(249,115,22,0.8); }
        .dot-red    { background: #ef4444; box-shadow: 0 0 5px rgba(239,68,68,0.8); }

        /* Accordion panel */
        .mob-day-panel {
          background: rgba(20, 27, 50, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(168,85,247,0.2);
          border-radius: 14px;
          padding: 14px;
          display: flex; flex-direction: column; gap: 12px;
          animation: panelSlide 0.22s cubic-bezier(0.34,1.56,0.64,1);
          margin: 2px 0;
        }
        @keyframes panelSlide {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .mob-day-panel-header {
          display: flex; align-items: center; gap: 6px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.78rem; font-weight: 600;
          color: var(--primary);
        }
        .mob-panel-section { display: flex; flex-direction: column; gap: 6px; }
        .mob-panel-label {
          font-family: 'Outfit', sans-serif;
          font-size: 0.65rem; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: rgba(255,255,255,0.35);
        }
        .mob-panel-textarea {
          width: 100%; box-sizing: border-box;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 10px 12px;
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 0.85rem;
          line-height: 1.5;
          resize: none;
          outline: none;
        }
        .mob-panel-textarea:focus {
          border-color: rgba(168,85,247,0.5);
          box-shadow: 0 0 0 3px rgba(168,85,247,0.08);
        }
        .mob-panel-textarea::placeholder { color: rgba(255,255,255,0.25); }
        .mob-panel-tasks {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 6px;
        }
        .mob-panel-task {
          display: flex; align-items: center; gap: 8px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.82rem; color: rgba(255,255,255,0.85);
        }
        .mob-panel-task.done {
          opacity: 0.45;
          text-decoration: line-through;
        }
        .mob-task-icon { color: rgba(255,255,255,0.4); flex-shrink: 0; }
        .mob-task-icon.done { color: #4ade80; }
      `}</style>
    </div>
  );
}
