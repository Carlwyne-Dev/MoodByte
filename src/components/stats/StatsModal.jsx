import React from 'react';
import { createPortal } from 'react-dom';
import { X, CheckSquare, Clock, Award, Activity, Star, Timer, Heart, Flame, Smile } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { ACHIEVEMENTS } from './AchievementManager';

import { MOODS } from '../../utils/moodConfig';

export default function StatsModal({ onClose }) {
  const [taskHistory] = useLocalStorage('taskHistory', []);
  const [tasks] = useLocalStorage('tasks', []);
  const [pomodoroStats] = useLocalStorage('pomodoroStats', { sessions: 0 });
  const [moodHistory] = useLocalStorage('moodHistory', []);
  const [unlockedAchievements] = useLocalStorage('unlockedAchievements', []);

  // Compute stats
  const completedActiveTasks = tasks.filter(t => t.completed);
  const totalCompletedTasks = taskHistory.length + completedActiveTasks.length;
  const totalFocusSessions = pomodoroStats.sessions || 0;
  const totalMoodsLogged = moodHistory.length;

  // Mood counts — built dynamically from MOODS so it always matches
  const moodCounts = Object.fromEntries(MOODS.map(m => [m.id, 0]));
  let maxMoodCount = 0;
  moodHistory.forEach(entry => {
    if (moodCounts[entry.mood] !== undefined) {
      moodCounts[entry.mood]++;
    } else {
      moodCounts[entry.mood] = 1;
    }
    if (moodCounts[entry.mood] > maxMoodCount) {
      maxMoodCount = moodCounts[entry.mood];
    }
  });

  // Top Mood
  let topMood = 'None yet';
  let topMoodColor = '#a8b2d1';
  if (totalMoodsLogged > 0) {
    const sorted = Object.keys(moodCounts).sort((a, b) => moodCounts[b] - moodCounts[a]);
    const tm = MOODS.find(m => m.id === sorted[0]);
    if (tm) {
      topMood = tm.label;
      topMoodColor = tm.color;
    }
  }

  // Last 7 days task activity
  const today = new Date();
  const last7Days = Array.from({length: 7}).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const activityByDate = {};
  last7Days.forEach(d => activityByDate[d] = 0);
  
  // Count archived tasks by date
  taskHistory.forEach(t => {
    if (t.archivedAt) {
      const d = t.archivedAt.split('T')[0];
      if (activityByDate[d] !== undefined) activityByDate[d]++;
    }
  });
  
  // Active completed tasks assumed to be completed today
  const todayStr = today.toISOString().split('T')[0];
  completedActiveTasks.forEach(() => {
    if (activityByDate[todayStr] !== undefined) activityByDate[todayStr]++;
  });

  const maxActivity = Math.max(...Object.values(activityByDate), 1); // Avoid div by 0

  return createPortal(
    <div className="stats-overlay fade-in" onClick={onClose}>
      <div className="full-stats-modal pop-in" onClick={e => e.stopPropagation()}>
        <div className="stats-header-bar">
          <div className="header-title">
            <Activity size={24} className="header-icon" />
            <h2>Full Analytics</h2>
          </div>
          <button className="stats-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="stats-scroll-content">
          
          {/* Top Overview Cards */}
          <div className="stats-overview-grid">
            <div className="overview-card">
              <div className="stat-icon focus-icon"><Clock size={24} /></div>
              <div className="overview-val">{totalFocusSessions}</div>
              <div className="overview-lbl">Focus Sessions</div>
            </div>
            <div className="overview-card">
              <div className="stat-icon task-icon"><CheckSquare size={24} /></div>
              <div className="overview-val">{totalCompletedTasks}</div>
              <div className="overview-lbl">Tasks Done</div>
            </div>
            <div className="overview-card">
              <div className="stat-icon mood-icon"><Smile size={24} /></div>
              <div className="overview-val">{totalMoodsLogged}</div>
              <div className="overview-lbl">Moods Logged</div>
            </div>
            <div className="overview-card">
              <div className="stat-icon top-icon" style={{color: topMoodColor}}><Award size={24} /></div>
              <div className="overview-val" style={{color: topMoodColor}}>{topMood}</div>
              <div className="overview-lbl">Top Mood</div>
            </div>
          </div>

          <div className="stats-charts-row">
            
            {/* Task Activity Graph */}
            <div className="chart-card">
              <h3 className="chart-title">Task Activity (Last 7 Days)</h3>
              <div className="activity-graph">
                {last7Days.map(date => {
                  const count = activityByDate[date];
                  const pct = (count / maxActivity) * 100;
                  const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
                  return (
                    <div key={date} className="activity-col">
                      <div className="activity-bar-track">
                        <div 
                          className="activity-bar-fill" 
                          style={{ height: `${pct}%`, transitionDelay: '0.2s' }}
                        >
                          <span className="activity-tooltip">{count}</span>
                        </div>
                      </div>
                      <div className="activity-day">{dayName}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mood Distribution Graph */}
            <div className="chart-card">
              <h3 className="chart-title">Mood Distribution</h3>
              <div className="mood-bars">
                {MOODS.map(m => {
                  const count = moodCounts[m.id];
                  const pct = maxMoodCount > 0 ? (count / maxMoodCount) * 100 : 0;
                  return (
                    <div key={m.id} className="mood-bar-row">
                      <div className="mood-bar-label"><m.icon size={16} color={m.color} /> <span className="m-lbl">{m.label}</span></div>
                      <div className="mood-bar-track">
                        <div 
                          className="mood-bar-fill" 
                          style={{ 
                            width: `${pct}%`,
                            backgroundColor: m.color,
                            boxShadow: `0 0 15px ${m.color}60`,
                            transitionDelay: '0.4s'
                          }}
                        />
                      </div>
                      <div className="mood-bar-count">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Achievement Badges */}
          <div className="chart-card badges-card" style={{ marginTop: '1.5rem' }}>
            <h3 className="chart-title">Unlockable Achievements</h3>
            <div className="badges-grid">
              {ACHIEVEMENTS.map(ach => {
                const isUnlocked = unlockedAchievements.includes(ach.id);
                const Icon = ach.icon;
                return (
                  <div key={ach.id} className={`badge ${isUnlocked ? 'unlocked' : 'locked'}`}>
                    <div className="badge-icon"><Icon size={22} color={isUnlocked ? ach.color : '#a8b2d1'} /></div>
                    <div className="badge-info">
                      <h4>{ach.title}</h4>
                      <p>{ach.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .stats-overlay {
          position: fixed;
          inset: 0;
          background: rgba(5, 8, 15, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .full-stats-modal {
          width: 95%;
          max-width: 800px;
          max-height: 90vh;
          border-radius: 24px;
          background: linear-gradient(145deg, rgba(20, 25, 40, 0.95), rgba(10, 14, 25, 0.98));
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 30px 60px rgba(0,0,0,0.6), inset 0 2px 20px rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .stats-header-bar {
          padding: 1.5rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(255, 255, 255, 0.02);
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-icon {
          color: var(--primary);
        }

        .stats-header-bar h2 {
          margin: 0;
          font-family: 'Outfit', sans-serif;
          font-size: 1.5rem;
          color: #fff;
          letter-spacing: 0.02em;
        }

        .stats-close-btn {
          background: rgba(255,255,255,0.05);
          border: none;
          color: #a8b2d1;
          cursor: pointer;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .stats-close-btn:hover {
          background: rgba(255,255,255,0.1);
          color: #fff;
          transform: rotate(90deg);
        }

        .stats-scroll-content {
          padding: 2rem;
          overflow-y: auto;
        }

        /* Top Grid */
        .stats-overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .overview-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .overview-card:hover {
          transform: translateY(-5px);
          background: rgba(255, 255, 255, 0.05);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          margin-bottom: 12px;
        }

        .focus-icon { color: #38bdf8; background: rgba(56, 189, 248, 0.15); }
        .task-icon { color: #10b981; background: rgba(16, 185, 129, 0.15); }
        .mood-icon { color: #f59e0b; background: rgba(245, 158, 11, 0.15); }
        .top-icon { background: rgba(255, 255, 255, 0.05); }

        .overview-val {
          font-family: 'Outfit', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.1;
          margin-bottom: 4px;
        }

        .overview-lbl {
          font-size: 0.85rem;
          color: #a8b2d1;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Charts Row */
        .stats-charts-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .chart-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 20px;
          padding: 1.5rem;
        }

        .chart-title {
          margin: 0 0 1.5rem 0;
          font-size: 1rem;
          font-family: 'Outfit', sans-serif;
          color: #a8b2d1;
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        /* Activity Graph (Vertical Bars) */
        .activity-graph {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          height: 180px;
          padding-top: 20px;
        }

        .activity-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .activity-bar-track {
          width: 14px;
          height: 140px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          position: relative;
          display: flex;
          align-items: flex-end;
        }

        .activity-bar-fill {
          width: 100%;
          background: linear-gradient(to top, var(--primary), #a855f7);
          border-radius: 6px;
          height: 0%;
          animation: growUp 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          position: relative;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.3);
        }

        .activity-tooltip {
          position: absolute;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.8);
          color: #fff;
          font-size: 0.75rem;
          padding: 4px 8px;
          border-radius: 4px;
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
          white-space: nowrap;
        }

        .activity-bar-fill:hover .activity-tooltip {
          opacity: 1;
        }

        .activity-day {
          font-size: 0.75rem;
          color: #8892b0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Mood Distribution Graph (Horizontal Bars) */
        .mood-bars {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
          padding-top: 10px;
        }

        .mood-bar-row {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .mood-bar-label {
          width: 80px;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .m-lbl {
          color: #a8b2d1;
        }

        .mood-bar-track {
          flex: 1;
          height: 10px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 5px;
          overflow: hidden;
        }

        .mood-bar-fill {
          height: 100%;
          border-radius: 5px;
          width: 0%;
          animation: growRight 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .mood-bar-count {
          width: 20px;
          text-align: right;
          font-size: 0.85rem;
          color: #fff;
          font-weight: 500;
        }

        /* Animations */
        @keyframes growUp {
          from { height: 0%; }
        }
        @keyframes growRight {
          from { width: 0%; }
        }

        /* Achievement Badges */
        .badges-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
        }

        .badge {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 16px;
          transition: all 0.3s;
        }

        .badge.locked {
          opacity: 0.4;
          filter: grayscale(100%);
        }

        .badge.unlocked {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.1);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.02);
        }

        .badge-icon {
          font-size: 1.8rem;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
        }

        .badge.unlocked .badge-icon {
          animation: badgePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .badge-info h4 {
          margin: 0 0 4px 0;
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem;
          color: #fff;
        }

        .badge-info p {
          margin: 0;
          font-size: 0.75rem;
          color: #a8b2d1;
        }

        @keyframes badgePop {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        /* Responsive */
        @media (max-width: 600px) {
          .stats-header-bar {
            padding: 1rem 1.5rem;
          }
          .stats-scroll-content {
            padding: 1.5rem;
          }
          .activity-bar-track {
            width: 8px;
          }
        }
      `}</style>
    </div>,
    document.body
  );
}
