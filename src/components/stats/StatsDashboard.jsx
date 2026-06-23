import React from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function StatsDashboard() {
  const [tasks] = useLocalStorage('tasks', []);
  const [pomodoroStats] = useLocalStorage('pomodoroStats', { sessions: 0 });
  const [moodHistory] = useLocalStorage('moodHistory', []);

  const completedTasks = tasks.filter(t => t.completed).length;
  
  // Calculate mood counts for chart
  const moodCounts = moodHistory.reduce((acc, curr) => {
    acc[curr.mood] = (acc[curr.mood] || 0) + 1;
    return acc;
  }, {});

  const data = Object.keys(moodCounts).map(key => ({
    name: key,
    count: moodCounts[key]
  }));

  const COLORS = ['#667eea', '#764ba2', '#f6ad55', '#48bb78', '#f56565'];

  return (
    <div className="stats-container fade-in">
      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-value">{tasks.length}</div>
          <div className="stat-label text-muted">Total Tasks</div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-value">{completedTasks}</div>
          <div className="stat-label text-muted">Completed Tasks</div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-value">{pomodoroStats.sessions}</div>
          <div className="stat-label text-muted">Pomodoro Sessions</div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-value">{moodHistory.length}</div>
          <div className="stat-label text-muted">Moods Logged</div>
        </div>
      </div>

      <div className="chart-container glass-panel">
        <h3>Mood Distribution</h3>
        {data.length > 0 ? (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data}>
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" allowDecimals={false} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-color)'}} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-muted text-center" style={{padding: '2rem'}}>No moods logged yet.</p>
        )}
      </div>

      <style jsx="true">{`
        .stats-container { display: flex; flex-direction: column; gap: 1.5rem; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1.5rem; }
        .stat-card { padding: 1.5rem; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; }
        .stat-value { font-size: 2.5rem; font-weight: 700; color: var(--primary); font-family: 'Press Start 2P', cursive; font-size: 1.5rem; margin-bottom: 0.5rem; }
        .stat-label { font-size: 0.9rem; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; }
        .chart-container { padding: 1.5rem; }
        .chart-container h3 { margin-bottom: 1.5rem; font-size: 1.2rem; }
        .chart-wrapper { width: 100%; height: 250px; }
      `}</style>
    </div>
  );
}
