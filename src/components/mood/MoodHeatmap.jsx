import React, { useMemo, useState } from 'react';
import { getMoodConfig } from '../../utils/moodConfig';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MoodHeatmap({ history }) {
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const nextMonth = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + 1);
      return next;
    });
  };

  const prevMonth = () => {
    setCurrentDate(prev => {
      const prevDate = new Date(prev);
      prevDate.setMonth(prev.getMonth() - 1);
      return prevDate;
    });
  };

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const data = [];
    const historyMap = {};
    
    history.forEach(entry => {
      const date = new Date(entry.timestamp);
      const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
      const dateStr = localDate.toISOString().split('T')[0];
      if (!historyMap[dateStr]) {
        historyMap[dateStr] = entry.mood;
      }
    });

    // Pad start
    for (let i = 0; i < firstDay; i++) {
      data.push({ empty: true, key: `empty-start-${i}` });
    }

    const todayDate = new Date();
    const todayLocal = new Date(todayDate.getTime() - (todayDate.getTimezoneOffset() * 60000));
    const todayStr = todayLocal.toISOString().split('T')[0];

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const localDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
      const dateStr = localDate.toISOString().split('T')[0];
      
      const moodId = historyMap[dateStr];
      let color = 'rgba(255, 255, 255, 0.05)';
      let tooltip = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      if (moodId) {
        const config = getMoodConfig(moodId);
        color = config.color;
        tooltip = `${tooltip} - ${config.label}`;
      }

      data.push({ 
        empty: false, 
        key: dateStr, 
        date: dateStr, 
        day, 
        color, 
        tooltip, 
        moodId,
        isToday: dateStr === todayStr 
      });
    }

    // Pad end to fill weeks
    const remaining = data.length % 7 === 0 ? 0 : 7 - (data.length % 7);
    for (let i = 0; i < remaining; i++) {
      data.push({ empty: true, key: `empty-end-${i}` });
    }

    return data;
  }, [currentDate, history]);

  const monthLabel = currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className="mood-heatmap-container">
      <div className="heatmap-header">
        <button className="month-nav" onClick={prevMonth}><ChevronLeft size={16} /></button>
        <span className="heatmap-title">{monthLabel}</span>
        <button className="month-nav" onClick={nextMonth}><ChevronRight size={16} /></button>
      </div>
      
      <div className="weekdays">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="weekday">{day}</div>
        ))}
      </div>

      <div className="heatmap-grid">
        {calendarData.map((cell) => (
          cell.empty ? (
            <div key={cell.key} className="heatmap-cell empty" />
          ) : (
            <div 
              key={cell.key} 
              className={`heatmap-cell ${cell.isToday ? 'today' : ''}`}
              style={{ backgroundColor: cell.color }}
              title={cell.tooltip}
            />
          )
        ))}
      </div>

      <style>{`
        .mood-heatmap-container {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .heatmap-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .month-nav {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.2rem;
          border-radius: 4px;
          transition: background 0.2s, color 0.2s;
        }
        
        .month-nav:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
        }

        .heatmap-title {
          font-family: 'Outfit', sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-color);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .weekdays {
          display: grid;
          grid-template-columns: repeat(7, 16px);
          gap: 6px;
          margin-bottom: 0.5rem;
          justify-content: center;
          text-align: center;
        }

        .weekday {
          font-size: 0.55rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .heatmap-grid {
          display: grid;
          grid-template-columns: repeat(7, 16px);
          gap: 6px;
          justify-content: center;
        }

        .heatmap-cell {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          cursor: pointer;
          transition: transform 0.1s, filter 0.2s, box-shadow 0.2s;
        }

        .heatmap-cell.empty {
          background: transparent !important;
          cursor: default;
        }

        .heatmap-cell:not(.empty):hover {
          transform: scale(1.2);
          filter: brightness(1.2);
          z-index: 2;
        }

        .heatmap-cell.today {
          border: 1.5px solid rgba(255, 255, 255, 0.9);
        }
      `}</style>
    </div>
  );
}
