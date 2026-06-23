import React from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { getMoodConfig } from '../../utils/moodConfig';
import MoodHeatmap from './MoodHeatmap';

export default function MoodHistory() {
  const [history] = useLocalStorage('moodHistory', []);

  if (history.length === 0) {
    return (
      <div className="empty-history fade-in">
        <p className="font-handwriting">No mood entries yet. Go to the dashboard to log how you feel!</p>
      </div>
    );
  }

  return (
    <div className="mood-history-list fade-in">
      <MoodHeatmap history={history} />
      
      {history.map((entry) => {
        const config = getMoodConfig(entry.mood);
        const Icon = config.icon;
        
        return (
          <div key={entry.id} className="history-card">
            <div className="history-header">
              <div className="mood-badge" style={{ color: config.color }}>
                <Icon size={14} strokeWidth={2.5} />
                <span>{config.label}</span>
              </div>
              <span className="timestamp text-muted">
                {new Date(entry.timestamp).toLocaleString(undefined, { 
                  month: 'short', day: 'numeric', 
                  hour: 'numeric', minute: '2-digit' 
                })}
              </span>
            </div>
            
            {entry.reflection && (
              <div className="reflection-text">
                "{entry.reflection}"
              </div>
            )}
          </div>
        );
      })}

      <style jsx="true">{`
        .empty-history {
          padding: 2rem 1rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        .mood-history-list {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .history-card {
          padding: 0.6rem 0.7rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 10px;
          display: flex; flex-direction: column; gap: 0.4rem;
          transition: background 0.2s;
        }
        .history-card:hover {
          background: rgba(255,255,255,0.06);
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .mood-badge {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-weight: 600;
          font-size: 0.75rem;
          font-family: 'Outfit', sans-serif;
        }

        .timestamp {
          font-size: 0.65rem;
          opacity: 0.7;
        }

        .reflection-text {
          font-style: italic;
          color: rgba(255,255,255,0.7);
          font-size: 0.75rem;
          line-height: 1.4;
          padding-left: 0.2rem;
          border-left: 2px solid rgba(255,255,255,0.1);
        }
      `}</style>
    </div>
  );
}
