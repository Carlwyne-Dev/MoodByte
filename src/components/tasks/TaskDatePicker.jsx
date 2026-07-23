import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function getDayKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * TaskDatePicker
 * A lightweight portal-based mini calendar for picking a due date in TaskList.
 *
 * Props:
 *  top, left  – absolute position for the portal panel
 *  onConfirm(dateKey)  – called when user clicks "Set Date"
 *  onClose()           – called when user clicks outside or cancels
 */
export default function TaskDatePicker({ top, left, onConfirm, onClose }) {
  const today = new Date();
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [picked, setPicked] = useState(null); // date key string

  const year = view.getFullYear();
  const month = view.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayKey = getDayKey(today.getFullYear(), today.getMonth(), today.getDate());

  const handleDayClick = (d) => {
    if (!d) return;
    setPicked(getDayKey(year, month, d));
  };

  const handleConfirm = () => {
    if (!picked) return;
    onConfirm(picked);
  };

  return createPortal(
    <>
      {/* Backdrop to close on outside click */}
      <div className="tdp-backdrop" onClick={onClose} />

      <div className="tdp-panel" style={{ top: `${top}px`, left: `${left}px` }}>
        <div className="tdp-tail" />

        {/* Month nav */}
        <div className="tdp-nav">
          <button className="tdp-nav-btn" onClick={() => setView(new Date(year, month - 1, 1))}>
            <ChevronLeft size={14} />
          </button>
          <span className="tdp-month font-pixel">{MONTH_NAMES[month]} {year}</span>
          <button className="tdp-nav-btn" onClick={() => setView(new Date(year, month + 1, 1))}>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Day names */}
        <div className="tdp-grid">
          {DAY_NAMES.map(d => (
            <div key={d} className="tdp-day-name font-pixel">{d}</div>
          ))}

          {cells.map((d, i) => {
            const key = d ? getDayKey(year, month, d) : null;
            const isToday = key === todayKey;
            const isSelected = key === picked;
            return (
              <div
                key={i}
                onClick={() => handleDayClick(d)}
                className={`tdp-day
                  ${d ? 'tdp-day-active' : 'tdp-day-empty'}
                  ${isToday ? 'tdp-today' : ''}
                  ${isSelected ? 'tdp-selected' : ''}
                `}
              >
                {d || ''}
              </div>
            );
          })}
        </div>

        {/* Confirm */}
        <div className="tdp-footer">
          {picked ? (
            <div className="tdp-picked-label">
              {new Date(picked + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          ) : (
            <div className="tdp-hint">Pick a date above</div>
          )}
          <button
            className="tdp-confirm-btn"
            onClick={handleConfirm}
            disabled={!picked}
          >
            <Check size={12} />
            Set Date
          </button>
        </div>
      </div>

      <style>{`
        .tdp-backdrop {
          position: fixed; inset: 0; z-index: 99990;
        }
        .tdp-panel {
          position: fixed;
          transform: translateY(-50%);
          width: 230px;
          background: rgba(15, 22, 40, 0.96);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 14px;
          box-shadow: 0 14px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07);
          z-index: 99999;
          overflow: hidden;
          user-select: none;
          -webkit-user-select: none;
          animation: tdpPopIn 0.18s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes tdpPopIn {
          from { opacity: 0; transform: translateY(-50%) scale(0.9); }
          to   { opacity: 1; transform: translateY(-50%) scale(1); }
        }

        .tdp-tail {
          position: absolute; top: 50%; right: -6px;
          width: 10px; height: 10px;
          background: rgba(22, 30, 52, 0.96);
          border: 1px solid rgba(255,255,255,0.14);
          border-left: none; border-bottom: none;
          transform: translateY(-50%) rotate(45deg);
          z-index: -1;
        }

        .tdp-nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 12px 8px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .tdp-nav-btn {
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          color: #fff; border-radius: 6px; width: 26px; height: 26px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
        }
        .tdp-nav-btn:hover { background: var(--primary); border-color: var(--primary); }
        .tdp-month { color: #fff; font-size: 0.65rem; }

        .tdp-grid {
          display: grid; grid-template-columns: repeat(7, 1fr);
          gap: 3px; padding: 10px 10px 6px; text-align: center;
        }
        .tdp-day-name { color: rgba(255,255,255,0.35); font-size: 0.48rem; margin-bottom: 2px; }
        .tdp-day {
          height: 26px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-family: 'Outfit', sans-serif; color: #fff;
        }
        .tdp-day-active {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          cursor: pointer;
        }
        .tdp-day-active:hover { background: rgba(255,255,255,0.1); }
        .tdp-today {
          background: var(--primary) !important;
          border: none !important;
          font-weight: 700;
          box-shadow: 0 0 8px var(--primary);
        }
        .tdp-selected {
          background: rgba(168,85,247,0.3) !important;
          border-color: rgba(168,85,247,0.6) !important;
        }
        .tdp-day-empty { cursor: default; }

        .tdp-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 12px 10px;
          border-top: 1px solid rgba(255,255,255,0.05);
          gap: 8px;
        }
        .tdp-picked-label {
          font-size: 0.72rem; font-family: 'Outfit', sans-serif;
          color: rgba(255,255,255,0.75); flex: 1;
        }
        .tdp-hint {
          font-size: 0.68rem; font-family: 'Outfit', sans-serif;
          color: rgba(255,255,255,0.25); flex: 1;
          font-style: italic;
        }
        .tdp-confirm-btn {
          display: flex; align-items: center; gap: 5px;
          background: var(--primary); border: none; color: #fff;
          border-radius: 8px; padding: 5px 10px;
          font-size: 0.72rem; font-weight: 600;
          font-family: 'Outfit', sans-serif;
          cursor: pointer; white-space: nowrap;
          transition: opacity 0.15s;
        }
        .tdp-confirm-btn:disabled { opacity: 0.35; cursor: default; }
        .tdp-confirm-btn:not(:disabled):hover { opacity: 0.85; }
      `}</style>
    </>,
    document.body
  );
}
