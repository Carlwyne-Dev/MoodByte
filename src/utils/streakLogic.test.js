import { describe, it, expect } from 'vitest';
import { hasActivityToday, computeNextStreakStats } from './streakLogic';

const TODAY = '2024-06-10';
const YESTERDAY = '2024-06-09';

describe('hasActivityToday', () => {
  it('is true when a mood was logged today', () => {
    expect(hasActivityToday({
      moodHistory: [{ timestamp: `${TODAY}T08:00:00.000Z` }],
      taskHistory: [],
      tasks: [],
      todayStr: TODAY,
    })).toBe(true);
  });

  it('is true when a task was archived today', () => {
    expect(hasActivityToday({
      moodHistory: [],
      taskHistory: [{ archivedAt: `${TODAY}T08:00:00.000Z` }],
      tasks: [],
      todayStr: TODAY,
    })).toBe(true);
  });

  it('is true when any task in the active list is completed', () => {
    expect(hasActivityToday({
      moodHistory: [],
      taskHistory: [],
      tasks: [{ completed: true }],
      todayStr: TODAY,
    })).toBe(true);
  });

  it('is false when nothing happened today', () => {
    expect(hasActivityToday({
      moodHistory: [{ timestamp: `${YESTERDAY}T08:00:00.000Z` }],
      taskHistory: [{ archivedAt: `${YESTERDAY}T08:00:00.000Z` }],
      tasks: [{ completed: false }],
      todayStr: TODAY,
    })).toBe(false);
  });

  it('ignores an archived task with no archivedAt timestamp', () => {
    expect(hasActivityToday({
      moodHistory: [],
      taskHistory: [{ archivedAt: undefined }],
      tasks: [],
      todayStr: TODAY,
    })).toBe(false);
  });
});

describe('computeNextStreakStats', () => {
  const base = { currentStreak: 0, lastActiveDate: null, isActiveToday: false };

  it('starts a fresh streak at 1 on first-ever activity', () => {
    const next = computeNextStreakStats(base, { activityToday: true, todayStr: TODAY, yesterdayStr: YESTERDAY });
    expect(next).toEqual({ currentStreak: 1, lastActiveDate: TODAY, isActiveToday: true });
  });

  it('increments the streak when active today after being active yesterday', () => {
    const prev = { currentStreak: 5, lastActiveDate: YESTERDAY, isActiveToday: false };
    const next = computeNextStreakStats(prev, { activityToday: true, todayStr: TODAY, yesterdayStr: YESTERDAY });
    expect(next).toEqual({ currentStreak: 6, lastActiveDate: TODAY, isActiveToday: true });
  });

  it('does not double-count activity already logged today', () => {
    const prev = { currentStreak: 6, lastActiveDate: TODAY, isActiveToday: true };
    const next = computeNextStreakStats(prev, { activityToday: true, todayStr: TODAY, yesterdayStr: YESTERDAY });
    expect(next).toEqual({ currentStreak: 6, lastActiveDate: TODAY, isActiveToday: true });
  });

  it('restarts the streak at 1 if activity resumes after a gap of 2+ days', () => {
    const prev = { currentStreak: 6, lastActiveDate: '2024-06-01', isActiveToday: false };
    const next = computeNextStreakStats(prev, { activityToday: true, todayStr: TODAY, yesterdayStr: YESTERDAY });
    expect(next).toEqual({ currentStreak: 1, lastActiveDate: TODAY, isActiveToday: true });
  });

  it('keeps the streak alive (but not yet "active today") when yesterday was active and today has no activity so far', () => {
    const prev = { currentStreak: 6, lastActiveDate: YESTERDAY, isActiveToday: false };
    const next = computeNextStreakStats(prev, { activityToday: false, todayStr: TODAY, yesterdayStr: YESTERDAY });
    expect(next).toEqual({ currentStreak: 6, lastActiveDate: YESTERDAY, isActiveToday: false });
  });

  it('keeps isActiveToday true on re-evaluation when already active today, even without new activity', () => {
    const prev = { currentStreak: 6, lastActiveDate: TODAY, isActiveToday: true };
    const next = computeNextStreakStats(prev, { activityToday: false, todayStr: TODAY, yesterdayStr: YESTERDAY });
    expect(next).toEqual({ currentStreak: 6, lastActiveDate: TODAY, isActiveToday: true });
  });

  it('breaks the streak to 0 after a gap of 2+ days with no activity today', () => {
    const prev = { currentStreak: 6, lastActiveDate: '2024-06-01', isActiveToday: false };
    const next = computeNextStreakStats(prev, { activityToday: false, todayStr: TODAY, yesterdayStr: YESTERDAY });
    expect(next).toEqual({ currentStreak: 0, lastActiveDate: '2024-06-01', isActiveToday: false });
  });

  it('breaks the streak to 0 for a brand-new user with no prior activity and none today', () => {
    const next = computeNextStreakStats(base, { activityToday: false, todayStr: TODAY, yesterdayStr: YESTERDAY });
    expect(next).toEqual({ currentStreak: 0, lastActiveDate: null, isActiveToday: false });
  });
});
