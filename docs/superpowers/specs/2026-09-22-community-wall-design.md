# Community Wall — Design Spec

**Date:** 2026-09-22
**Status:** Approved for planning

## Summary

MoodByte currently has zero cross-user interaction — Supabase auth exists only
to sync one person's own data across their own devices. This adds a single,
narrow social feature: a **Community Wall**, a shared public board where any
visitor (no sign-in required) can pin one short note that every other visitor
sees. It is not a social network — no chat, no friends, no profiles. Users
"connect" only in the sense of seeing what strangers left on the same board.

## Goals

- Let any visitor pin a short (≤140 char) note to a board everyone shares.
- Notes are placed by dragging (reusing the existing Treat Stash
  click-to-arm/click-to-drop interaction from the Study Pet), then are
  **locked in place permanently** — no repositioning after placement, by
  anyone, including the original poster.
- The board is a single fixed-size canvas. As more notes accumulate, they
  visually overlap/pile up — there is no panning, scrolling, or auto-cleanup.
  This is intentional: the board is meant to visibly fill up over time.
- Basic, server-enforced abuse resistance (length cap, profanity filter, rate
  limit) since anonymous writes can't be trusted to self-police client-side.
- Admin (the existing hardcoded `ADMIN_EMAIL` in `AdminDashboard.jsx`) can
  view and delete any note.

## Non-Goals

- No accounts, friends, DMs, or any user-to-user messaging.
- No editing a note after it's placed, by anyone.
- No per-user history of "notes I've posted" (the anon identity is a soft
  rate-limit/ownership token, not a profile).
- No infinite/pannable canvas — fixed board only.
- Not bulletproof abuse resistance. See Known Limitations.

## Data Model

New table, added via a new SQL migration file following the existing
`supabase_page_visits.sql` convention (a new file, e.g.
`supabase_community_wall.sql`, safe to re-run):

```sql
CREATE TABLE IF NOT EXISTS public.board_notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text        text NOT NULL CHECK (char_length(text) BETWEEN 1 AND 140),
  color       text NOT NULL DEFAULT '#fef08a',
  x           numeric NOT NULL CHECK (x >= 0 AND x <= 100), -- percent of board width
  y           numeric NOT NULL CHECK (y >= 0 AND y <= 100), -- percent of board height
  anon_id     uuid NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.board_notes ENABLE ROW LEVEL SECURITY;

-- Anyone can read the wall.
CREATE POLICY "Allow select for all" ON public.board_notes
  FOR SELECT USING (true);

-- Anyone can insert, subject to the trigger's guardrails below.
CREATE POLICY "Allow insert for all" ON public.board_notes
  FOR INSERT WITH CHECK (true);

-- Only the admin account can delete (moderation).
CREATE POLICY "Allow delete for admin" ON public.board_notes
  FOR DELETE USING (auth.jwt() ->> 'email' = 'magharicarlwyne@gmail.com');

CREATE INDEX IF NOT EXISTS idx_board_notes_created_at ON public.board_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_board_notes_anon_id ON public.board_notes(anon_id);
```

x/y are stored as **percentages of the board's own dimensions**, not pixels —
consistent with how `StudyPet.jsx` positions the pet, and it keeps notes in
the same relative spot regardless of viewport size.

### Guardrails (Postgres trigger, not just client-side)

A `BEFORE INSERT` trigger function enforces what the client can't be trusted
to enforce itself:

- **Rate limit**: reject if `anon_id` has a `board_notes` row with
  `created_at` within the last 3 minutes (`RAISE EXCEPTION` with a
  recognizable message the client can pattern-match, e.g.
  `'rate_limited'`).
- **Profanity filter**: reject if `text` matches a small hardcoded
  case-insensitive word-boundary regex list (`RAISE EXCEPTION 'blocked_word'`).
  This is a blunt instrument, not comprehensive moderation — paired with
  admin delete as the real backstop.

The length cap is already enforced by the `CHECK` constraint above, so it
doesn't need trigger logic.

Client-side, `CommunityWallModal` does a **client-side pre-check** (length,
same word list) purely for instant UX feedback (no round-trip needed to tell
someone their note's too long) — the Postgres trigger is the actual source of
truth and cannot be bypassed by a modified client.

## Anonymous Identity

A UUID (`crypto.randomUUID()`) generated once and stored under
`localStorage['moodbyte_anon_id']`, read via the existing `useLocalStorage`
hook. This is the same `anon_id` sent with every insert. It is **not**
displayed anywhere and carries no other data — purely a rate-limit token.

## Client Architecture

New files, following existing project conventions (component + colocated
hook, matching the `StudyPet.jsx` / `usePetPhysics.js` split done in this
repo already):

- `src/hooks/useAnonId.js` — reads/creates the localStorage anon UUID. This
  one is genuinely general-purpose (not tied to the wall specifically), so it
  belongs in `src/hooks/` alongside `useIsMobile.js`/`useLocalStorage.js`.
  Pure, easily testable (given a mock storage, returns a stable UUID; creates
  one if absent).
- `src/utils/wallModeration.js` — pure functions: `isTooLong(text)`,
  `containsBlockedWord(text)`, mirroring (not replacing) the DB trigger's
  rules, used for the client-side instant-feedback pre-check. Unit tested
  with vitest, same pattern as `streakLogic.js`/`syncLogic.js`.
- `src/components/community/CommunityWallModal.jsx` — the modal itself:
  board canvas, existing `COLORS` palette (reused from
  `StickyNoteBoard.jsx`) for note color choice, the compose input, and the
  drag-to-place interaction.
- `src/components/community/useCommunityWall.js` — owns the Supabase query
  (initial fetch + Realtime subscription, same `postgres_changes` pattern as
  `useCloudSync.js`) and the insert call. Returns `{ notes, postNote, status }`.
  Colocated with `CommunityWallModal.jsx` rather than in `src/hooks/`,
  matching the precedent set by `usePetPhysics.js`/`usePetDialogue.js` living
  alongside `StudyPet.jsx` — it's feature-specific, not general-purpose.
- `src/components/community/useNotePlacement.js` — the drag-to-arm/click-to-drop
  state machine, adapted from `usePetPhysics.js`'s `draggedTreat` mechanic:
  arm a note (text + color chosen) → it follows the cursor → click on the
  board → compute click position as a percentage of the board's bounding
  rect → call `postNote({ text, color, x, y })`. Also colocated, same reason.

### Entry points

- Desktop: a new "Community Wall" trigger in `StickyNoteBoard.jsx`'s existing
  icon row (same place Stats/Settings/Study Desk live today), lazy-loaded
  with `React.lazy` + `Suspense`, same as the other modals.
- Mobile: added to `MOBILE_NAV_ITEMS` in `mobileNavConfig.js` (`kind: 'sheet'`)
  so it's automatically available to pin via the bottom-nav customizer built
  earlier, with no separate mobile-specific wiring needed.

## Placement UX Flow

1. Open Community Wall modal — shows the board (existing notes rendered at
   their stored x/y%) plus a compose row (text input, color swatches, "Pin
   it" button).
2. Type text, pick a color, click "Pin it" → client-side pre-check runs
   (length/word list) → if it fails, inline error, no network call.
3. On pass, the note becomes "armed": it follows the cursor (reusing the
   Treat Stash visual pattern — a small floating card at the pointer).
4. Click anywhere on the board canvas → compute `(x, y)` as a percentage of
   the board's `getBoundingClientRect()` → call `postNote()`.
5. On success: note appears immediately (optimistic add) at that position,
   locked. On failure (rate-limited or a race against the DB-side profanity
   check): armed note is dropped, a toast explains why.

## Realtime

`useCommunityWall` subscribes to `postgres_changes` (`INSERT` and `DELETE`)
on `board_notes`, same channel-per-table pattern `useCloudSync.js` already
uses. New notes from other visitors animate in; admin deletes remove the
note from everyone's view live.

## Admin Moderation

A new "Community Wall" section in `AdminDashboard.jsx`: a simple list of
recent notes (text, color swatch, relative timestamp) each with a delete
button, calling `supabase.from('board_notes').delete().eq('id', ...)` — the
RLS delete policy above ensures only the admin's own authenticated session
can actually succeed.

## Error Handling

`SyncToast.jsx` is a generic message toast (it just renders `e.detail` —
nothing sync-specific about its logic), but it's hardcoded to a green
checkmark/"success" look. Showing that icon for "you're rate-limited" would
read wrong. Rather than build a second toast component, extend
`SyncToast.jsx` minimally: accept either a plain string (existing callers,
unchanged, still render as success) or `{ message, type: 'error' }` in the
event detail, and swap the icon/color to a warning style when `type ===
'error'`. Small, backward-compatible, avoids duplicating toast plumbing.

- Insert rejected by the rate-limit trigger → error toast: "You can pin
  again in a few minutes."
- Insert rejected by the profanity trigger → error toast: "That note
  couldn't be posted." (Deliberately vague — no need to reveal the filter's
  word list.)
- Network/Supabase failure → error toast: generic "Couldn't pin your note,
  try again."
- Realtime subscription drop → `useCommunityWall` re-fetches the full note
  list on reconnect (same resilience approach as a fresh mount).

## Testing Plan

- `src/utils/wallModeration.test.js` — unit tests for `isTooLong` and
  `containsBlockedWord` (empty string, exactly-140-chars boundary, 141
  chars, clean text, blocked word, blocked word with different casing/word
  boundaries).
- `src/hooks/useAnonId.test.js` — unit test with a mock storage object
  (same `makeMockStorage` pattern already used in `syncLogic.test.js`):
  creates a UUID when absent, returns the same UUID on a second call.
- Manual verification (matching how every other feature this session was
  verified): build the app, drive the placement flow in the browser pane,
  confirm a second browser tab sees the new note appear live, confirm the
  rate-limit trigger actually rejects a rapid second post, confirm admin
  delete removes a note from both tabs.

## Known Limitations (accepted, not blocking)

- No sign-in means `anon_id` lives in localStorage. Clearing site data resets
  a visitor's rate limit. This is a deliberate tradeoff from the "anyone, no
  sign-in" decision — deters casual spam, does not stop a determined bad
  actor. Admin delete is the real backstop.
- The word-list profanity filter is blunt (exact/simple pattern matching),
  not a real moderation system. Acceptable for a small personal-project
  feature; would need revisiting if the site got real traffic.
- Fixed-size board with no cleanup means very old notes get visually buried
  under new ones indefinitely. This is the explicitly requested behavior,
  not an oversight.
