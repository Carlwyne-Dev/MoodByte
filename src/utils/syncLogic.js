// Pure last-write-wins sync decisions, kept separate from useCloudSync.js so
// they can be unit tested without a real Supabase client, DOM, or localStorage.

export const SYNC_KEYS = [
  'moodbyte_welcome_main',
  'moodbyte_welcome_desk',
  'moodbyte_dailyQuote',
  'calendarNotes',
  'tasks',
  'taskHistory',
  'moodHistory',
  'stickyNotes',
  'pomodoroStats',
  'pomodoroCustom',
  'unlockedAchievements',
  'streakStats',
  'zenStudyNotes',
  'studyPetSettings',
  'studyPetTreats',
  'theme',
  'customBgsV2',
  'player_volume',
  'player_shuffle',
  'player_repeat',
  'spotify_history',
];

// Whether a localStorage key should participate in cloud sync at all.
export function isSyncableKey(key) {
  return SYNC_KEYS.includes(key) || key.startsWith('moodbyte_');
}

// A cloud write only wins over what's on this device if it's strictly newer —
// equal timestamps favor local so we don't re-apply our own echoed write.
export function shouldApplyCloudUpdate(cloudTs, localTs) {
  return cloudTs > localTs;
}

// On login, decide whether to pull cloud data down or push local data up
// instead, when the caller only wants to apply cloud data if it's newer.
// Returns 'apply' | 'pushLocalInstead'.
export function resolveInitialPull({ onlyIfNewer, localTs, cloudTs }) {
  if (onlyIfNewer && localTs > cloudTs) return 'pushLocalInstead';
  return 'apply';
}

// Reads every syncable key off a Storage-like object (anything exposing
// .length, .key(i) and .getItem(key) — real localStorage, or a plain mock in
// tests) and returns a plain object ready to upload, parsing JSON where
// possible and falling back to the raw string otherwise.
export function collectSyncPayload(storage) {
  const payload = {};
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!isSyncableKey(key)) continue;
    const raw = storage.getItem(key);
    try {
      payload[key] = JSON.parse(raw);
    } catch {
      payload[key] = raw;
    }
  }
  return payload;
}
