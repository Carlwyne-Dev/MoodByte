import React, { useEffect, useState } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useIsMobile } from '../../hooks/useIsMobile';

export default function StreakCounter() {
  const isMobile = useIsMobile();
  const [taskHistory] = useLocalStorage('taskHistory', []);
  const [tasks] = useLocalStorage('tasks', []);
  const [pomodoroStats] = useLocalStorage('pomodoroStats', { sessions: 0 });
  const [moodHistory] = useLocalStorage('moodHistory', []);
  
  const [streakStats, setStreakStats] = useLocalStorage('streakStats', {
    currentStreak: 0,
    lastActiveDate: null,
    isActiveToday: false
  });

  useEffect(() => {
    // Check if there's any activity today
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // Check if any mood was logged today
    const moodToday = moodHistory.some(m => m.timestamp.startsWith(todayStr));
    
    // Check if any task was archived today
    const taskHistoryToday = taskHistory.some(t => t.archivedAt && t.archivedAt.startsWith(todayStr));
    
    // Check if any active task was completed today
    const taskCompletedToday = tasks.some(t => t.completed); // assuming active tasks are today
    
    // For Pomodoro, we only have total sessions. We can't easily check today's sessions unless we track it.
    // So mood and tasks are enough to trigger 'activity'.
    
    const hasActivityToday = moodToday || taskHistoryToday || taskCompletedToday;

    setStreakStats(prev => {
      let newStreak = prev.currentStreak;
      let newIsActiveToday = prev.isActiveToday;
      let newLastActiveDate = prev.lastActiveDate;

      if (hasActivityToday) {
        if (prev.lastActiveDate === yesterdayStr) {
          newStreak = prev.currentStreak + 1;
        } else if (prev.lastActiveDate !== todayStr) {
          // It's either null or before yesterday
          newStreak = 1;
        }
        newLastActiveDate = todayStr;
        newIsActiveToday = true;
      } else {
        // If they just logged in but haven't done anything today
        if (prev.lastActiveDate !== todayStr && prev.lastActiveDate !== yesterdayStr) {
          // Streak broken
          newStreak = 0;
          newIsActiveToday = false;
        } else if (prev.lastActiveDate === todayStr) {
          newIsActiveToday = true;
        } else {
          newIsActiveToday = false;
        }
      }

      // Only update if something changed
      if (
        newStreak !== prev.currentStreak ||
        newIsActiveToday !== prev.isActiveToday ||
        newLastActiveDate !== prev.lastActiveDate
      ) {
        return {
          currentStreak: newStreak,
          lastActiveDate: newLastActiveDate,
          isActiveToday: newIsActiveToday
        };
      }
      
      return prev;
    });
  }, [taskHistory, tasks, moodHistory, setStreakStats]);

  const [hovered, setHovered] = React.useState(false);
  const isActive = streakStats.isActiveToday;
  const count = streakStats.currentStreak;

  return (
    <div
      style={{
        position: 'fixed',
        ...(isMobile ? {
          top: '72px',
          right: '14px',
        } : {
          top: '24px',
          right: 'calc(var(--sidebar-offset, 360px) + 32px)',
          transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }),
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: '5px 12px',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.12)',
        zIndex: 1000,
        cursor: 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Wrapper div that clips the gif to exact dimensions */}
      <div style={{
        width: '28px',
        height: '28px',
        minWidth: '28px',
        minHeight: '28px',
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: isActive ? 'none' : 'grayscale(1) brightness(0.5)',
        transition: 'filter 0.3s ease',
      }}>
        <img
          src="/streak.gif"
          alt="Streak Fire"
          style={{
            width: '28px',
            height: '28px',
            display: 'block',
            flexShrink: 0,
          }}
        />
      </div>

      <span style={{
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 700,
        fontSize: '1.1rem',
        color: isActive ? '#fff' : '#94a3b8',
        transition: 'color 0.3s ease',
      }}>
        {count}
      </span>

      {/* Tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 12px)',
          right: 0,
          background: 'rgba(15, 23, 42, 0.95)',
          color: '#fff',
          fontSize: '0.85rem',
          padding: '8px 12px',
          borderRadius: '8px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1001,
        }}>
          {isActive
            ? `You're on a ${count} day streak!`
            : 'Complete a task or log a mood to keep your streak alive!'}
        </div>
      )}
    </div>
  );
}
