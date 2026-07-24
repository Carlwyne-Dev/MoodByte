import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Star, Timer, Heart, Flame, Zap, CheckSquare, Target, Award, Crown, Smile } from 'lucide-react';

export const ACHIEVEMENTS = [
  { id: 'task_1', title: 'First Step', desc: 'Complete 1 task', icon: Star, color: '#facc15', req: (s) => s.tasks >= 1 },
  { id: 'task_10', title: 'Task Master', desc: 'Complete 10 tasks', icon: CheckSquare, color: '#34d399', req: (s) => s.tasks >= 10 },
  { id: 'task_50', title: 'Unstoppable', desc: 'Complete 50 tasks', icon: Flame, color: '#f97316', req: (s) => s.tasks >= 50 },
  
  { id: 'focus_1', title: 'Getting Started', desc: 'Finish 1 Pomodoro', icon: Target, color: '#a78bfa', req: (s) => s.focus >= 1 },
  { id: 'focus_5', title: 'Deep Focus', desc: 'Finish 5 Pomodoros', icon: Timer, color: '#38bdf8', req: (s) => s.focus >= 5 },
  { id: 'focus_20', title: 'Zen Master', desc: 'Finish 20 Pomodoros', icon: Crown, color: '#c084fc', req: (s) => s.focus >= 20 },
  
  { id: 'mood_1', title: 'In Touch', desc: 'Log your first mood', icon: Smile, color: '#fbbf24', req: (s) => s.moods >= 1 },
  { id: 'mood_7', title: 'Self Aware', desc: 'Log 7 moods', icon: Heart, color: '#f43f5e', req: (s) => s.moods >= 7 },
  { id: 'mood_30', title: 'Emotional Guru', desc: 'Log 30 moods', icon: Award, color: '#ec4899', req: (s) => s.moods >= 30 }
];

// Helper constants for achievements


export default function AchievementManager() {
  const [taskHistory] = useLocalStorage('taskHistory', []);
  const [tasks] = useLocalStorage('tasks', []);
  const [pomodoroStats] = useLocalStorage('pomodoroStats', { sessions: 0 });
  const [moodHistory] = useLocalStorage('moodHistory', []);
  
  const [unlocked, setUnlocked] = useLocalStorage('unlockedAchievements', []);
  const [recentUnlock, setRecentUnlock] = useState(null);

  const [popupQueue, setPopupQueue] = useState([]);

  useEffect(() => {
    const stats = {
      tasks: taskHistory.length + tasks.filter(t => t.completed).length,
      focus: pomodoroStats.sessions || 0,
      moods: moodHistory.length
    };

    const newlyUnlocked = [];

    ACHIEVEMENTS.forEach(ach => {
      if (!unlocked.includes(ach.id) && ach.req(stats)) {
        newlyUnlocked.push(ach);
      }
    });

    if (newlyUnlocked.length > 0) {
      setUnlocked([...unlocked, ...newlyUnlocked.map(a => a.id)]);
      setPopupQueue(prev => [...prev, ...newlyUnlocked]);
    }
  }, [taskHistory, tasks, pomodoroStats, moodHistory]);

  useEffect(() => {
    if (popupQueue.length > 0 && !recentUnlock) {
      const nextAch = popupQueue[0];
      setRecentUnlock(nextAch);
      
      // Play sound
      const audio = new Audio('/animals/notif.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.error("Audio play blocked", e));

      // Hide popup after 4 seconds
      setTimeout(() => {
        setRecentUnlock(null);
        setPopupQueue(prev => prev.slice(1));
      }, 4000);
    }
  }, [popupQueue, recentUnlock]);

  if (!recentUnlock) return null;

  const Icon = recentUnlock.icon;

  return createPortal(
    <div className="achievement-popup slide-in-top">
      <div className="ach-icon-box" style={{ background: `${recentUnlock.color}20`, color: recentUnlock.color }}>
        <Icon size={28} />
      </div>
      <div className="ach-text">
        <span className="ach-label">Achievement Unlocked!</span>
        <h4 className="ach-title">{recentUnlock.title}</h4>
        <p className="ach-desc">{recentUnlock.desc}</p>
      </div>

      <style>{`
        .achievement-popup {
          position: fixed;
          top: 40px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-left: 4px solid ${recentUnlock.color};
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          gap: 16px;
          z-index: 100000;
          min-width: 300px;
        }

        .ach-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 0 10px rgba(255,255,255,0.05);
          animation: pulseIcon 2s infinite;
        }

        .ach-text {
          display: flex;
          flex-direction: column;
        }

        .ach-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: ${recentUnlock.color};
          font-weight: 700;
          margin-bottom: 2px;
        }

        .ach-title {
          margin: 0;
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 1.1rem;
        }

        .ach-desc {
          margin: 4px 0 0 0;
          font-size: 0.85rem;
          color: #94a3b8;
        }

        .slide-in-top {
          animation: dropIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, fadeOutUp 0.5s ease-in 3.5s forwards;
        }

        @keyframes dropIn {
          from { transform: translate(-50%, -100px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }

        @keyframes fadeOutUp {
          from { transform: translate(-50%, 0); opacity: 1; }
          to { transform: translate(-50%, -100px); opacity: 0; }
        }

        @keyframes pulseIcon {
          0% { box-shadow: 0 0 0 0 ${recentUnlock.color}40; }
          70% { box-shadow: 0 0 0 10px ${recentUnlock.color}00; }
          100% { box-shadow: 0 0 0 0 ${recentUnlock.color}00; }
        }
      `}</style>
    </div>,
    document.body
  );
}
