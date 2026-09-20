// Pure streak-calculation logic, kept separate from StreakCounter.jsx so it
// can be unit tested without mounting a component or touching localStorage.

// Does this snapshot of local data show any activity for `todayStr`?
export function hasActivityToday({ moodHistory, taskHistory, tasks, todayStr }) {
  const moodToday = moodHistory.some(m => m.timestamp.startsWith(todayStr));
  const taskHistoryToday = taskHistory.some(t => t.archivedAt && t.archivedAt.startsWith(todayStr));
  // Note: this checks ANY completed task in the current list, not just ones
  // completed today — matches the original component's known limitation.
  const taskCompletedToday = tasks.some(t => t.completed);
  return moodToday || taskHistoryToday || taskCompletedToday;
}

// Given the previous streak state and whether there's activity today,
// compute the next streak state. `todayStr`/`yesterdayStr` are
// YYYY-MM-DD strings (from `date.toISOString().split('T')[0]`).
export function computeNextStreakStats(prev, { activityToday, todayStr, yesterdayStr }) {
  let currentStreak = prev.currentStreak;
  let isActiveToday;
  let lastActiveDate = prev.lastActiveDate;

  if (activityToday) {
    if (prev.lastActiveDate === yesterdayStr) {
      currentStreak = prev.currentStreak + 1;
    } else if (prev.lastActiveDate !== todayStr) {
      // Either never active before, or last active more than a day ago.
      currentStreak = 1;
    }
    // else: already counted today (lastActiveDate === todayStr) — leave
    // currentStreak as-is so re-triggering doesn't double-count.
    lastActiveDate = todayStr;
    isActiveToday = true;
  } else if (prev.lastActiveDate !== todayStr && prev.lastActiveDate !== yesterdayStr) {
    // No activity today, and the streak wasn't kept alive yesterday either.
    currentStreak = 0;
    isActiveToday = false;
  } else if (prev.lastActiveDate === todayStr) {
    // Already active earlier today; this just re-confirms it.
    isActiveToday = true;
  } else {
    // lastActiveDate === yesterdayStr: streak survives, but not active *yet* today.
    isActiveToday = false;
  }

  return { currentStreak, lastActiveDate, isActiveToday };
}
