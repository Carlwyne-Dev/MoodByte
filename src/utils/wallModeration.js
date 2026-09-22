// Mirrors (does not replace) the Postgres guardrails in
// supabase_community_wall.sql — this exists only so the compose UI can give
// instant feedback before a network round-trip. The database trigger is the
// actual source of truth and cannot be bypassed by a modified client.
//
// 'badword1'/'badword2'/'badword3' are deliberate placeholders for real
// profanity — swap in an actual word list (here AND in the SQL trigger)
// before this is publicly reachable.

export const MAX_NOTE_LENGTH = 140;

const BLOCKED_WORDS = ['badword1', 'badword2', 'badword3'];

export function isTooLong(text) {
  return text.length > MAX_NOTE_LENGTH;
}

export function containsBlockedWord(text) {
  return BLOCKED_WORDS.some(word => new RegExp(`\\b${word}\\b`, 'i').test(text));
}
