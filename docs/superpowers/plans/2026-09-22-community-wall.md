# Community Wall Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared public board ("Community Wall") where any visitor — no sign-in required — can pin one short note that every other visitor sees live, placed via a drag-to-drop interaction and locked permanently once placed.

**Architecture:** A new Supabase table (`board_notes`) with Postgres-enforced rate-limiting and profanity filtering (client-side checks alone can't be trusted for anonymous writes). A new `src/components/community/` directory holds the feature's hooks and modal component, following the same colocated-hook pattern already used by `src/components/study/StudyPet.jsx` + `usePetPhysics.js`. The drag-to-place interaction reuses the Study Pet's Treat Stash mechanic. The modal is lazy-loaded and wired into both the desktop sidebar and the mobile nav (which is already data-driven from `mobileNavConfig.js`, built in an earlier session).

**Tech Stack:** React 19, Supabase (Postgres + Realtime + RLS), Vite, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-22-community-wall-design.md`

## Global Constraints

- Notes are capped at 140 characters (enforced in Postgres via `CHECK`, mirrored client-side for instant feedback only).
- No sign-in required to post. Identity is a UUID (`anon_id`) generated once client-side and stored in `localStorage['moodbyte_anon_id']` — never displayed, used only for rate-limiting.
- Rate limit: one note per 3 minutes per `anon_id`, enforced in a Postgres trigger (not client-side only).
- Once placed, a note's position is permanent — no repositioning by anyone, including the poster.
- The board is a single fixed-size canvas — no panning/scrolling, no auto-cleanup of old notes.
- Admin delete reuses the existing hardcoded admin check (`ADMIN_EMAIL = 'magharicarlwyne@gmail.com'` in `AdminDashboard.jsx`) via an RLS delete policy — no new auth system.
- New feature-specific hooks are colocated with their component under `src/components/community/`, not `src/hooks/` — matching the existing `usePetPhysics.js`/`usePetDialogue.js` precedent (feature-specific hooks live with the feature; only genuinely general-purpose hooks like `useAnonId` go in `src/hooks/`).
- The bad-word list used in this plan (`'badword1'`, `'badword2'`, `'badword3'`) is a deliberate placeholder for actual profanity — real slurs don't belong committed to a public git repo. Swap in a real list (both client `wallModeration.js` and the Postgres trigger) before this ships publicly. Everything else in the filter/trigger logic is complete and functional.

---

### Task 1: Supabase migration — `board_notes` table, RLS, and guardrail trigger

**Files:**
- Create: `supabase_community_wall.sql`

**Interfaces:**
- Produces: table `public.board_notes` with columns `id uuid`, `text text`, `color text`, `x numeric`, `y numeric`, `anon_id uuid`, `created_at timestamptz`. Later tasks' Supabase queries (`.from('board_notes')`) depend on this schema exactly.

- [ ] **Step 1: Write the migration file**

```sql
-- Run this in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard → Your Project → SQL Editor

-- 1. Create table (safe to re-run)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.board_notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text        text NOT NULL CHECK (char_length(text) BETWEEN 1 AND 140),
  color       text NOT NULL DEFAULT '#fef08a',
  x           numeric NOT NULL CHECK (x >= 0 AND x <= 100),
  y           numeric NOT NULL CHECK (y >= 0 AND y <= 100),
  anon_id     uuid NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.board_notes ENABLE ROW LEVEL SECURITY;

-- 3. Policies — drop first so re-running never errors
DROP POLICY IF EXISTS "Allow select for all" ON public.board_notes;
DROP POLICY IF EXISTS "Allow insert for all" ON public.board_notes;
DROP POLICY IF EXISTS "Allow delete for admin" ON public.board_notes;

CREATE POLICY "Allow select for all" ON public.board_notes
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for all" ON public.board_notes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow delete for admin" ON public.board_notes
  FOR DELETE USING (auth.jwt() ->> 'email' = 'magharicarlwyne@gmail.com');

-- 4. Indexes (safe to re-run)
CREATE INDEX IF NOT EXISTS idx_board_notes_created_at ON public.board_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_board_notes_anon_id ON public.board_notes(anon_id);

-- 5. Guardrail trigger: rate limit + profanity filter.
-- Length is already enforced by the CHECK constraint above.
-- IMPORTANT: 'badword1'/'badword2'/'badword3' are deliberate placeholders —
-- swap in a real word list before this is publicly reachable.
CREATE OR REPLACE FUNCTION public.check_board_note()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  recent_count integer;
  blocked_words text[] := ARRAY['badword1', 'badword2', 'badword3'];
  word text;
BEGIN
  -- Rate limit: one note per 3 minutes per anon_id
  SELECT count(*) INTO recent_count
  FROM public.board_notes
  WHERE anon_id = NEW.anon_id
    AND created_at > now() - interval '3 minutes';

  IF recent_count > 0 THEN
    RAISE EXCEPTION 'rate_limited';
  END IF;

  -- Profanity filter: reject if text contains any blocked word (word-boundary, case-insensitive)
  FOREACH word IN ARRAY blocked_words LOOP
    IF NEW.text ~* ('\y' || word || '\y') THEN
      RAISE EXCEPTION 'blocked_word';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS board_notes_guardrails ON public.board_notes;

CREATE TRIGGER board_notes_guardrails
  BEFORE INSERT ON public.board_notes
  FOR EACH ROW EXECUTE FUNCTION public.check_board_note();
```

- [ ] **Step 2: Run the migration in Supabase**

Go to the Supabase dashboard → SQL Editor → paste the full file contents → Run. Expected: "Success. No rows returned."

- [ ] **Step 3: Manually verify the guardrails**

In the same SQL Editor, run each of these as separate queries and confirm the noted result:

```sql
-- Should succeed (a normal insert)
insert into public.board_notes (text, color, x, y, anon_id)
values ('hello wall', '#fef08a', 50, 50, gen_random_uuid());
```
Expected: 1 row inserted.

```sql
-- Should fail with "rate_limited" — reuse the SAME anon_id within 3 minutes
insert into public.board_notes (text, color, x, y, anon_id)
values ('second note too soon', '#fef08a', 20, 20, (select anon_id from public.board_notes order by created_at desc limit 1));
```
Expected: ERROR — `rate_limited`.

```sql
-- Should fail with "blocked_word"
insert into public.board_notes (text, color, x, y, anon_id)
values ('this has badword1 in it', '#fef08a', 30, 30, gen_random_uuid());
```
Expected: ERROR — `blocked_word`.

```sql
-- Should fail (constraint violation, text too long)
insert into public.board_notes (text, color, x, y, anon_id)
values (repeat('a', 141), '#fef08a', 30, 30, gen_random_uuid());
```
Expected: ERROR — check constraint violation on `text`.

- [ ] **Step 4: Clean up the test rows**

```sql
delete from public.board_notes;
```

- [ ] **Step 5: Commit**

```bash
git add supabase_community_wall.sql
git commit -m "feat: add board_notes table with rate-limit and profanity guardrails"
```

---

### Task 2: Anonymous identity hook

**Files:**
- Create: `src/hooks/useAnonId.js`
- Test: `src/hooks/useAnonId.test.js`

**Interfaces:**
- Produces: `getOrCreateAnonId(storage)` — pure function, `storage` is any object with `getItem(key)`/`setItem(key, value)`. Returns a UUID string. `useAnonId()` — React hook, returns `string | null` (null until the post-mount effect runs).

- [ ] **Step 1: Write the failing tests**

```js
// src/hooks/useAnonId.test.js
import { describe, it, expect } from 'vitest';
import { getOrCreateAnonId } from './useAnonId';

function makeMockStorage(initial = {}) {
  const store = { ...initial };
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = v; },
  };
}

describe('getOrCreateAnonId', () => {
  it('creates and persists a new id when none exists', () => {
    const storage = makeMockStorage();
    const id = getOrCreateAnonId(storage);
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(storage.getItem('moodbyte_anon_id')).toBe(id);
  });

  it('returns the same id on a second call', () => {
    const storage = makeMockStorage();
    const first = getOrCreateAnonId(storage);
    const second = getOrCreateAnonId(storage);
    expect(second).toBe(first);
  });

  it('returns an existing stored id without creating a new one', () => {
    const storage = makeMockStorage({ moodbyte_anon_id: 'existing-id-123' });
    expect(getOrCreateAnonId(storage)).toBe('existing-id-123');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/hooks/useAnonId.test.js`
Expected: FAIL — cannot find module `./useAnonId` (file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

```js
// src/hooks/useAnonId.js
import { useState, useEffect } from 'react';

const ANON_ID_KEY = 'moodbyte_anon_id';

// Reads (or creates) a stable per-browser anonymous id, used only as a soft
// rate-limit/ownership token for the Community Wall — never displayed, not
// an account. Exported separately from the hook so it's testable with a
// plain mock storage object, same pattern as collectSyncPayload in
// src/utils/syncLogic.js.
export function getOrCreateAnonId(storage) {
  const existing = storage.getItem(ANON_ID_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  storage.setItem(ANON_ID_KEY, id);
  return id;
}

// React wrapper: creates/reads the id once, after mount. Deliberately NOT a
// useState lazy initializer — writing to localStorage is a side effect and
// must not run during the render phase.
export function useAnonId() {
  const [anonId, setAnonId] = useState(null);

  useEffect(() => {
    setAnonId(getOrCreateAnonId(window.localStorage));
  }, []);

  return anonId;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/hooks/useAnonId.test.js`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAnonId.js src/hooks/useAnonId.test.js
git commit -m "feat: add useAnonId hook for Community Wall rate-limiting"
```

---

### Task 3: Client-side note validation

**Files:**
- Create: `src/utils/wallModeration.js`
- Test: `src/utils/wallModeration.test.js`

**Interfaces:**
- Produces: `MAX_NOTE_LENGTH` (number, 140), `isTooLong(text)` (boolean), `containsBlockedWord(text)` (boolean). These mirror — but do not replace — the Postgres trigger from Task 1; they exist purely for instant client-side feedback before a round-trip.

- [ ] **Step 1: Write the failing tests**

```js
// src/utils/wallModeration.test.js
import { describe, it, expect } from 'vitest';
import { isTooLong, containsBlockedWord, MAX_NOTE_LENGTH } from './wallModeration';

describe('isTooLong', () => {
  it('is false for text at exactly the limit', () => {
    expect(isTooLong('a'.repeat(MAX_NOTE_LENGTH))).toBe(false);
  });

  it('is true for text one character over the limit', () => {
    expect(isTooLong('a'.repeat(MAX_NOTE_LENGTH + 1))).toBe(true);
  });

  it('is false for an empty string', () => {
    expect(isTooLong('')).toBe(false);
  });
});

describe('containsBlockedWord', () => {
  it('is true when the text contains a blocked word', () => {
    expect(containsBlockedWord('this is a badword1 here')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(containsBlockedWord('BADWORD1')).toBe(true);
  });

  it('respects word boundaries and does not flag substrings', () => {
    expect(containsBlockedWord('badword1extra')).toBe(false);
  });

  it('is false for clean text', () => {
    expect(containsBlockedWord('have a wonderful day')).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/utils/wallModeration.test.js`
Expected: FAIL — cannot find module `./wallModeration`.

- [ ] **Step 3: Write the implementation**

```js
// src/utils/wallModeration.js
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/utils/wallModeration.test.js`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/utils/wallModeration.js src/utils/wallModeration.test.js
git commit -m "feat: add client-side note validation for Community Wall"
```

---

### Task 4: Extend SyncToast to support error-styled toasts

**Files:**
- Modify: `src/components/settings/SyncToast.jsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: the `sync-toast` window event now accepts either a plain string (existing behavior, unchanged, renders as success/green) or `{ message: string, type: 'error' }` (renders as error/red). Later tasks dispatch the error form.

- [ ] **Step 1: Modify the component**

In `src/components/settings/SyncToast.jsx`, change the import line and the state/handler logic:

```js
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Cloud, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function SyncToast() {
  const [message, setMessage] = useState(null);
  const [toastType, setToastType] = useState('success');
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    let queuedMsg = null;
    let timer = null;
    let exitTimer = null;

    const displayMessage = (detail) => {
      const isObject = detail && typeof detail === 'object';
      setMessage(isObject ? detail.message : detail);
      setToastType(isObject && detail.type === 'error' ? 'error' : 'success');
      setIsExiting(false);
      if (timer) clearTimeout(timer);
      if (exitTimer) clearTimeout(exitTimer);

      timer = setTimeout(() => {
        setIsExiting(true);
        exitTimer = setTimeout(() => {
          setMessage(null);
          setIsExiting(false);
        }, 300); // Wait for exit animation to finish
      }, 3500); // Display for 3.5 seconds
    };

    const handleToast = (e) => {
      // If loading screen is currently showing, queue it
      if (document.querySelector('.loading-screen')) {
        queuedMsg = e.detail;
      } else {
        displayMessage(e.detail);
      }
    };

    const handleAppReady = () => {
      if (queuedMsg) {
        displayMessage(queuedMsg);
        queuedMsg = null;
      }
    };

    window.addEventListener('sync-toast', handleToast);
    window.addEventListener('app-ready', handleAppReady);
    
    return () => {
      window.removeEventListener('sync-toast', handleToast);
      window.removeEventListener('app-ready', handleAppReady);
      if (timer) clearTimeout(timer);
      if (exitTimer) clearTimeout(exitTimer);
    };
  }, []);

  if (!message && !isExiting) return null;

  return createPortal(
    <div className={`sync-toast-container ${isExiting ? 'exiting' : ''}`}>
      <div className={`sync-toast-content ${toastType === 'error' ? 'error' : ''}`}>
        {toastType === 'error'
          ? <AlertTriangle size={18} className="sync-toast-icon" />
          : <CheckCircle2 size={18} className="sync-toast-icon" />}
        <span className="sync-toast-text">{message}</span>
      </div>

      <style jsx="true">{`
        .sync-toast-container {
          position: fixed;
          top: 32px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          animation: slideDownFadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .sync-toast-container.exiting {
          animation: slideUpFadeOut 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .sync-toast-content {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(34, 197, 94, 0.15);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 100px;
          padding: 10px 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }

        .sync-toast-content.error {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
        }
        
        .sync-toast-icon {
          color: #22c55e;
        }

        .sync-toast-content.error .sync-toast-icon {
          color: #ef4444;
        }
        
        .sync-toast-text {
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
        }

        @keyframes slideDownFadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }

        @keyframes slideUpFadeOut {
          from {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
          to {
            opacity: 0;
            transform: translate(-50%, -20px) scale(0.9);
          }
        }
      `}</style>
    </div>,
    document.body
  );
}
```

- [ ] **Step 2: Manually verify backward compatibility**

Run: `npm run dev`, open the app in a browser, open the devtools console, and run:

```js
window.dispatchEvent(new CustomEvent('sync-toast', { detail: 'Cloud Sync Activated!' }));
```
Expected: green success toast appears, same as before this change.

```js
window.dispatchEvent(new CustomEvent('sync-toast', { detail: { message: 'You can pin again in a few minutes.', type: 'error' } }));
```
Expected: red/error-styled toast appears with an `AlertTriangle` icon.

- [ ] **Step 3: Run the full test suite to confirm nothing else broke**

Run: `npx vitest run`
Expected: PASS (all existing tests still pass — this task touches no logic those tests cover)

- [ ] **Step 4: Commit**

```bash
git add src/components/settings/SyncToast.jsx
git commit -m "feat: support error-styled toasts in SyncToast"
```

---

### Task 5: Community Wall data hook (fetch, realtime, insert)

**Files:**
- Create: `src/components/community/useCommunityWall.js`

**Interfaces:**
- Consumes: `supabase` client from `src/lib/supabase.js` (existing).
- Produces: `useCommunityWall()` returns `{ notes, status, postNote }`.
  - `notes`: `Array<{ id, text, color, x, y, created_at }>`
  - `status`: `'loading' | 'ready' | 'error'`
  - `postNote({ text, color, x, y, anonId })`: `Promise<{ error: null, note } | { error: 'rate_limited' | 'blocked_word' | 'unknown' }>`

- [ ] **Step 1: Write the implementation**

There's no meaningful way to unit test this without a real or heavily-mocked Supabase client (it's a thin wrapper around Supabase's fetch/realtime/insert calls) — it's verified manually in Task 7 once the modal that uses it exists. Write it directly:

```js
// src/components/community/useCommunityWall.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export function useCommunityWall() {
  const [notes, setNotes] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'

  const fetchNotes = useCallback(async () => {
    const { data, error } = await supabase
      .from('board_notes')
      .select('id, text, color, x, y, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      setStatus('error');
      return;
    }
    setNotes(data || []);
    setStatus('ready');
  }, []);

  useEffect(() => {
    fetchNotes();

    const channel = supabase
      .channel('board-notes-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'board_notes' },
        (payload) => {
          setNotes(prev => prev.some(n => n.id === payload.new.id) ? prev : [...prev, payload.new]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'board_notes' },
        (payload) => {
          setNotes(prev => prev.filter(n => n.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotes]);

  const postNote = useCallback(async ({ text, color, x, y, anonId }) => {
    const { data, error } = await supabase
      .from('board_notes')
      .insert({ text, color, x, y, anon_id: anonId })
      .select()
      .single();

    if (error) {
      if (error.message?.includes('rate_limited')) return { error: 'rate_limited' };
      if (error.message?.includes('blocked_word')) return { error: 'blocked_word' };
      return { error: 'unknown' };
    }

    setNotes(prev => prev.some(n => n.id === data.id) ? prev : [...prev, data]);
    return { error: null, note: data };
  }, []);

  return { notes, status, postNote };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/community/useCommunityWall.js
git commit -m "feat: add useCommunityWall hook for fetch/realtime/insert"
```

---

### Task 6: Drag-to-place note positioning hook

**Files:**
- Create: `src/components/community/useNotePlacement.js`

**Interfaces:**
- Produces: `useNotePlacement({ boardRef, onPlace })` returns `{ armedNote, cursorPos, arm, cancel }`.
  - `boardRef`: a React ref to the board DOM element (placement position is computed relative to its bounding rect).
  - `onPlace({ text, color, x, y })`: called when a click lands inside the board while a note is armed. `x`/`y` are percentages (0-100) of the board's own width/height.
  - `armedNote`: `{ text, color } | null`
  - `cursorPos`: `{ x, y }` (viewport pixel coordinates, for rendering the note following the cursor)
  - `arm(text, color)`: arms a note.
  - `cancel()`: un-arms without placing.

- [ ] **Step 1: Write the implementation**

Adapted directly from the Study Pet's Treat Stash drag mechanic
(`src/components/study/usePetPhysics.js`'s `draggedTreat` state + the
`mousemove`/delayed-`click` listener pair), which is the codebase's
existing precedent for "arm something, it follows the cursor, click to
place it." No automated test — this is a browser-event state machine with
no pure logic to isolate; it's verified manually once wired into the modal
in Task 7.

```js
// src/components/community/useNotePlacement.js
import { useState, useEffect } from 'react';

// Drag-to-arm/click-to-place note positioning, adapted from the Study Pet's
// Treat Stash interaction (usePetPhysics.js's draggedTreat mechanic).
export function useNotePlacement({ boardRef, onPlace }) {
  const [armedNote, setArmedNote] = useState(null); // { text, color } | null
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const arm = (text, color) => setArmedNote({ text, color });
  const cancel = () => setArmedNote(null);

  useEffect(() => {
    if (!armedNote) return;

    const onMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    const onClick = (e) => {
      const board = boardRef.current;
      if (!board) return;

      const rect = board.getBoundingClientRect();
      const insideBoard =
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom;

      if (!insideBoard) {
        setArmedNote(null);
        return;
      }

      const xPct = ((e.clientX - rect.left) / rect.width) * 100;
      const yPct = ((e.clientY - rect.top) / rect.height) * 100;
      onPlace({ text: armedNote.text, color: armedNote.color, x: xPct, y: yPct });
      setArmedNote(null);
    };

    window.addEventListener('mousemove', onMouseMove);
    // Wait 50ms before adding the click listener so the "arm" click (the
    // "Pin it" button press) doesn't trigger an instant placement.
    const timeout = setTimeout(() => {
      window.addEventListener('click', onClick);
    }, 50);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onClick);
      clearTimeout(timeout);
    };
  }, [armedNote, boardRef, onPlace]);

  return { armedNote, cursorPos, arm, cancel };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/community/useNotePlacement.js
git commit -m "feat: add drag-to-place hook for Community Wall notes"
```

---

### Task 7: Community Wall modal component

**Files:**
- Modify: `src/components/notes/StickyNoteBoard.jsx:24` (export the `COLORS` array so it can be reused)
- Create: `src/components/community/CommunityWallModal.jsx`

**Interfaces:**
- Consumes: `useCommunityWall` (Task 5), `useNotePlacement` (Task 6), `useAnonId` (Task 2), `isTooLong`/`containsBlockedWord`/`MAX_NOTE_LENGTH` (Task 3), `COLORS` (from `StickyNoteBoard.jsx`).
- Produces: default export `CommunityWallModal({ onClose })` — a full-screen portal modal. Later tasks (8, 9) render this behind `showCommunityWall`/`activeSheet === 'community'` state.

- [ ] **Step 1: Export COLORS from StickyNoteBoard.jsx**

In `src/components/notes/StickyNoteBoard.jsx`, change:

```js
const COLORS = [
```
to:
```js
export const COLORS = [
```

(Only the one keyword changes — the array contents are untouched.)

- [ ] **Step 2: Write the modal component**

```jsx
// src/components/community/CommunityWallModal.jsx
import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Users } from 'lucide-react';
import { useCommunityWall } from './useCommunityWall';
import { useNotePlacement } from './useNotePlacement';
import { useAnonId } from '../../hooks/useAnonId';
import { isTooLong, containsBlockedWord, MAX_NOTE_LENGTH } from '../../utils/wallModeration';
import { COLORS } from '../notes/StickyNoteBoard';

export default function CommunityWallModal({ onClose }) {
  const { notes, status, postNote } = useCommunityWall();
  const anonId = useAnonId();
  const boardRef = useRef(null);
  const [text, setText] = useState('');
  const [color, setColor] = useState(COLORS[0].value);
  const [formError, setFormError] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  const handlePlace = async ({ text: placedText, color: placedColor, x, y }) => {
    const result = await postNote({ text: placedText, color: placedColor, x, y, anonId });
    if (result.error === 'rate_limited') {
      window.dispatchEvent(new CustomEvent('sync-toast', {
        detail: { message: 'You can pin again in a few minutes.', type: 'error' }
      }));
    } else if (result.error === 'blocked_word') {
      window.dispatchEvent(new CustomEvent('sync-toast', {
        detail: { message: "That note couldn't be posted.", type: 'error' }
      }));
    } else if (result.error) {
      window.dispatchEvent(new CustomEvent('sync-toast', {
        detail: { message: "Couldn't pin your note, try again.", type: 'error' }
      }));
    }
  };

  const { armedNote, cursorPos, arm } = useNotePlacement({ boardRef, onPlace: handlePlace });

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 200);
  };

  const handlePinIt = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (isTooLong(trimmed)) {
      setFormError(`Keep it under ${MAX_NOTE_LENGTH} characters.`);
      return;
    }
    if (containsBlockedWord(trimmed)) {
      setFormError("That note couldn't be posted.");
      return;
    }
    setFormError('');
    arm(trimmed, color);
    setText('');
  };

  return createPortal(
    <div className={`wall-overlay ${isClosing ? 'ui-overlay-exit' : 'ui-overlay-enter'}`} onClick={handleClose}>
      <div className={`wall-modal ${isClosing ? 'ui-modal-exit' : 'ui-modal-enter'}`} onClick={e => e.stopPropagation()}>
        <div className="wall-header">
          <div className="wall-header-title">
            <Users size={20} className="wall-header-icon" />
            <h2>Community Wall</h2>
          </div>
          <button className="wall-close-btn" onClick={handleClose}><X size={20} /></button>
        </div>

        <div className="wall-board" ref={boardRef}>
          {status === 'loading' && <p className="wall-status-text">Loading the wall...</p>}
          {status === 'error' && <p className="wall-status-text">Couldn't load the wall. Try again later.</p>}
          {notes.map(note => (
            <div
              key={note.id}
              className="wall-note"
              style={{ left: `${note.x}%`, top: `${note.y}%`, background: note.color }}
            >
              {note.text}
            </div>
          ))}
        </div>

        <div className="wall-compose">
          <input
            type="text"
            className="wall-compose-input"
            placeholder="Pin a short note for everyone..."
            value={text}
            maxLength={MAX_NOTE_LENGTH}
            onChange={e => { setText(e.target.value); setFormError(''); }}
            onKeyDown={e => e.key === 'Enter' && handlePinIt()}
          />
          <div className="wall-color-swatches">
            {COLORS.slice(0, 6).map(c => (
              <button
                key={c.value}
                className={`wall-swatch ${color === c.value ? 'active' : ''}`}
                style={{ background: c.value }}
                title={c.name}
                onClick={() => setColor(c.value)}
              />
            ))}
          </div>
          <button className="wall-pin-btn" onClick={handlePinIt} disabled={!text.trim() || !anonId}>
            Pin it
          </button>
        </div>
        {formError && <p className="wall-form-error">{formError}</p>}
        <p className="wall-hint">Click "Pin it", then click anywhere on the board to place your note.</p>
      </div>

      {armedNote && (
        <div
          className="wall-armed-note"
          style={{ left: cursorPos.x, top: cursorPos.y, background: armedNote.color }}
        >
          {armedNote.text}
        </div>
      )}

      <style>{`
        .wall-overlay {
          position: fixed; inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex; align-items: center; justify-content: center;
        }
        .wall-modal {
          background: rgba(15, 23, 42, 0.97);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          width: 720px;
          max-width: 95vw;
          max-height: 90vh;
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        .wall-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .wall-header-title {
          display: flex; align-items: center; gap: 12px;
        }
        .wall-header-title h2 {
          margin: 0; font-family: 'Outfit', sans-serif; font-size: 1.4rem; color: #fff;
        }
        .wall-header-icon { color: #a855f7; }
        .wall-close-btn {
          background: rgba(255,255,255,0.05); border: none; color: #94a3b8; cursor: pointer;
          border-radius: 10px; padding: 8px; transition: all 0.2s;
        }
        .wall-close-btn:hover { color: #ef4444; background: rgba(239,68,68,0.15); }

        .wall-board {
          position: relative;
          height: 420px;
          margin: 20px 24px 0;
          background: rgba(0,0,0,0.25);
          border: 1px dashed rgba(255,255,255,0.15);
          border-radius: 16px;
          overflow: hidden;
          cursor: crosshair;
        }
        .wall-status-text {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          color: #64748b; font-family: 'Outfit', sans-serif; font-size: 0.9rem;
        }
        .wall-note {
          position: absolute;
          transform: translate(-50%, -50%) rotate(-2deg);
          max-width: 140px;
          padding: 10px 12px;
          border-radius: 4px;
          font-family: 'Kalam', cursive, 'Outfit', sans-serif;
          font-size: 0.8rem;
          color: #1e293b;
          box-shadow: 0 6px 14px rgba(0,0,0,0.35);
          word-break: break-word;
          pointer-events: none;
        }

        .wall-compose {
          display: flex; align-items: center; gap: 12px;
          padding: 16px 24px;
        }
        .wall-compose-input {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 10px 14px;
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
          outline: none;
        }
        .wall-compose-input:focus { border-color: #8b5cf6; }
        .wall-color-swatches {
          display: flex; gap: 6px;
        }
        .wall-swatch {
          width: 22px; height: 22px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
        }
        .wall-swatch.active { border-color: #fff; }
        .wall-pin-btn {
          background: #8b5cf6;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 10px 18px;
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .wall-pin-btn:hover:not(:disabled) { background: #7c3aed; }
        .wall-pin-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .wall-form-error {
          margin: 0 24px 8px;
          color: #f87171;
          font-family: 'Outfit', sans-serif;
          font-size: 0.8rem;
        }
        .wall-hint {
          margin: 0 24px 20px;
          color: #64748b;
          font-family: 'Outfit', sans-serif;
          font-size: 0.78rem;
          text-align: center;
        }

        .wall-armed-note {
          position: fixed;
          transform: translate(-50%, -50%) rotate(-2deg);
          max-width: 140px;
          padding: 10px 12px;
          border-radius: 4px;
          font-family: 'Kalam', cursive, 'Outfit', sans-serif;
          font-size: 0.8rem;
          color: #1e293b;
          box-shadow: 0 10px 24px rgba(0,0,0,0.5);
          pointer-events: none;
          z-index: 10000;
        }
      `}</style>
    </div>,
    document.body
  );
}
```

- [ ] **Step 3: Run the full test suite**

Run: `npx vitest run`
Expected: PASS (all tests, including the new ones from Tasks 2-3)

- [ ] **Step 4: Commit**

```bash
git add src/components/notes/StickyNoteBoard.jsx src/components/community/CommunityWallModal.jsx
git commit -m "feat: add CommunityWallModal component"
```

---

### Task 8: Wire the Community Wall into the desktop sidebar

**Files:**
- Modify: `src/components/notes/StickyNoteBoard.jsx`

**Interfaces:**
- Consumes: `CommunityWallModal` (Task 7).

- [ ] **Step 1: Add the icon import**

In `src/components/notes/StickyNoteBoard.jsx`, add `Users` to the lucide-react import:

```js
import {
  Plus, Maximize2, Trash2, Pin, PinOff, Palette, Settings as SettingsIcon,
  Type, Move, BarChart2, BookOpen, Image as ImageIcon, X, Calendar as CalendarIcon, StickyNote, Cloud, CheckCircle2, Users
} from 'lucide-react';
```

- [ ] **Step 2: Add the lazy import**

Alongside the existing lazy modal imports:

```js
const StatsModal = lazy(() => import('../stats/StatsModal'));
const SettingsModal = lazy(() => import('../settings/SettingsModal'));
const SyncModal = lazy(() => import('../settings/SyncModal'));
const StudyDesk = lazy(() => import('../study/StudyDesk'));
const CalendarWidget = lazy(() => import('../study/CalendarWidget'));
const CommunityWallModal = lazy(() => import('../community/CommunityWallModal'));
```

- [ ] **Step 3: Add the state**

Alongside the existing `show*` state declarations:

```js
const [showStats, setShowStats] = useState(false);
const [showSettings, setShowSettings] = useState(false);
const [showSyncModal, setShowSyncModal] = useState(false);
const [showStudyDesk, setShowStudyDesk] = useState(false);
const [showCalendar, setShowCalendar] = useState(false);
const [showCommunityWall, setShowCommunityWall] = useState(false);
```

- [ ] **Step 4: Add the trigger button**

In the icon row (`.top-left-controls`), add a new button alongside the existing ones:

```jsx
<button className="stats-btn study-btn" onClick={(e) => { e.stopPropagation(); setShowStudyDesk(true); }} title="Zen Study Mode">
  <BookOpen size={18} />
  <span className="stats-label">Study Desk</span>
</button>
<button className="stats-btn" onClick={(e) => { e.stopPropagation(); setShowCommunityWall(true); }} title="Community Wall">
  <Users size={18} />
  <span className="stats-label">Wall</span>
</button>
```

- [ ] **Step 5: Render the modal**

In the existing `<Suspense>` block:

```jsx
<Suspense fallback={null}>
  {showStats && <StatsModal onClose={() => setShowStats(false)} />}
  {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
  {showSyncModal && <SyncModal onClose={() => setShowSyncModal(false)} />}
  {showStudyDesk && <StudyDesk onClose={() => setShowStudyDesk(false)} />}
  {showCalendar && <CalendarWidget onClose={() => setShowCalendar(false)} />}
  {showCommunityWall && <CommunityWallModal onClose={() => setShowCommunityWall(false)} />}
```

(leave the rest of that block, and everything after it, unchanged)

- [ ] **Step 6: Manually verify**

Run: `npm run dev`, open the app at desktop width (≥769px), confirm a "Wall" button appears in the top-left icon row. Click it → the Community Wall modal opens showing an empty board and a compose row. Type a short note, click "Pin it", then click on the board → the note should appear pinned at that spot and persist (check the Supabase `board_notes` table has a new row).

- [ ] **Step 7: Commit**

```bash
git add src/components/notes/StickyNoteBoard.jsx
git commit -m "feat: wire Community Wall into the desktop sidebar"
```

---

### Task 9: Wire the Community Wall into the mobile nav

**Files:**
- Modify: `src/config/mobileNavConfig.js`
- Modify: `src/components/mobile/MobileLayout.jsx`

**Interfaces:**
- Consumes: `CommunityWallModal` (Task 7).

- [ ] **Step 1: Add the nav item**

In `src/config/mobileNavConfig.js`, add `Users` to the icon import and a new entry to `MOBILE_NAV_ITEMS`:

```js
import { Moon, ClipboardList, Calendar, BookOpen, BarChart2, Image as ImageIcon, Settings, Music, Timer, Smile, Users } from 'lucide-react';

// Single source of truth for every destination reachable from the mobile
// bottom nav / "More" popup. `kind` tells MobileLayout how to open it:
// 'tray' (slide-up tray), 'sheet' (activeSheet overlay), or 'study' (full Study Desk).
export const MOBILE_NAV_ITEMS = [
  { id: 'themes',    Icon: Moon,          label: 'Themes',     kind: 'sheet' },
  { id: 'tasks',     Icon: ClipboardList, label: 'Tasks',      kind: 'tray'  },
  { id: 'calendar',  Icon: Calendar,      label: 'Calendar',   kind: 'tray'  },
  { id: 'study',     Icon: BookOpen,      label: 'Study',      kind: 'study' },
  { id: 'stats',     Icon: BarChart2,     label: 'Stats',      kind: 'sheet' },
  { id: 'settings',  Icon: ImageIcon,     label: 'Wallpapers', kind: 'sheet' },
  { id: 'sync',      Icon: Settings,      label: 'Settings',   kind: 'sheet' },
  { id: 'music',     Icon: Music,         label: 'Music',      kind: 'sheet' },
  { id: 'pomodoro',  Icon: Timer,         label: 'Pomodoro',   kind: 'sheet' },
  { id: 'mood',      Icon: Smile,         label: 'Mood',       kind: 'sheet' },
  { id: 'community', Icon: Users,         label: 'Wall',       kind: 'sheet' },
];
```

(only the import line and the new last array entry change — every existing entry stays exactly as-is)

- [ ] **Step 2: Add the lazy import and render in MobileLayout**

In `src/components/mobile/MobileLayout.jsx`, add the lazy import alongside the others:

```js
const StudyDesk = lazy(() => import('../study/StudyDesk'));
const StatsModal = lazy(() => import('../stats/StatsModal'));
const SettingsModal = lazy(() => import('../settings/SettingsModal'));
const SyncModal = lazy(() => import('../settings/SyncModal'));
const CommunityWallModal = lazy(() => import('../community/CommunityWallModal'));
```

And add it to the existing `activeSheet` Suspense block:

```jsx
<Suspense fallback={null}>
  {activeSheet === 'stats' && (
    <StatsModal onClose={() => setActiveSheet(null)} />
  )}
  {activeSheet === 'settings' && (
    <SettingsModal onClose={() => setActiveSheet(null)} />
  )}
  {activeSheet === 'sync' && (
    <SyncModal onClose={() => setActiveSheet(null)} />
  )}
  {activeSheet === 'community' && (
    <CommunityWallModal onClose={() => setActiveSheet(null)} />
  )}
</Suspense>
```

- [ ] **Step 3: Manually verify**

Run: `npm run dev`, resize the browser to mobile width (<769px). By default the new "Wall" item lands in the "More" popup (the bottom nav only shows 4 picked items + More). Open More → tap "Wall" → the Community Wall modal should open and behave the same as on desktop. Then open Settings → Bottom Bar Shortcuts (the customizer built in an earlier session) and confirm "Wall" appears as a pinnable option there too, and that pinning it makes it show up directly on the bottom bar.

- [ ] **Step 4: Commit**

```bash
git add src/config/mobileNavConfig.js src/components/mobile/MobileLayout.jsx
git commit -m "feat: wire Community Wall into the mobile nav"
```

---

### Task 10: Admin moderation for the Community Wall

**Files:**
- Modify: `src/components/admin/AdminDashboard.jsx`

**Interfaces:**
- Consumes: `supabase` client (existing).

- [ ] **Step 1: Add the Trash2 icon import**

```js
import { Users, Eye, Smile, CheckSquare, Palette, TrendingUp, ShieldAlert, RefreshCw, LogOut, Activity, MonitorSmartphone, Clock, Trash2 } from 'lucide-react';
```

- [ ] **Step 2: Add board-notes state**

Alongside the existing `stats`/`refreshing` state:

```js
const [stats, setStats] = useState(null);
const [refreshing, setRefreshing] = useState(false);
const [boardNotes, setBoardNotes] = useState([]);
```

- [ ] **Step 3: Add fetchBoardNotes and deleteNote**

Add these two functions near `fetchStats`:

```js
const fetchBoardNotes = async () => {
  const { data, error } = await supabase
    .from('board_notes')
    .select('id, text, color, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (!error) setBoardNotes(data || []);
};

const deleteNote = async (id) => {
  const { error } = await supabase.from('board_notes').delete().eq('id', id);
  if (!error) {
    setBoardNotes(prev => prev.filter(n => n.id !== id));
  }
};
```

- [ ] **Step 4: Call fetchBoardNotes alongside fetchStats**

In `handleUser`, change:

```js
if (!fetchedRef.current) {
  fetchedRef.current = true;
  fetchStats();
}
```
to:
```js
if (!fetchedRef.current) {
  fetchedRef.current = true;
  fetchStats();
  fetchBoardNotes();
}
```

And on the "Refresh" button, change:
```jsx
<button
  onClick={fetchStats}
  disabled={refreshing}
```
to:
```jsx
<button
  onClick={() => { fetchStats(); fetchBoardNotes(); }}
  disabled={refreshing}
```

- [ ] **Step 5: Add the moderation section to the JSX**

Immediately after the "Registered users table" block's closing `)}` and before the outer grid's closing `</div>` (the `<p>MoodByte Admin Dashboard...</p>` footer marks where the grid has already closed — insert this new section right before that footer `<p>`, outside the two-column grid so it can be full-width):

```jsx
        {/* Community Wall moderation */}
        <div style={{ marginTop: '32px', background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderTop: '1px solid rgba(255,255,255,0.2)', borderRadius: '24px', padding: '32px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '12px' }}>
              <Users color="#fff" size={24} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 600 }}>Community Wall ({boardNotes.length})</h3>
          </div>

          {boardNotes.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>No notes pinned yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
              {boardNotes.map(note => (
                <div key={note.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '14px 18px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: note.color, flexShrink: 0 }} />
                    <span style={{ color: '#fff', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.text}</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', flexShrink: 0 }}>{new Date(note.created_at).toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => deleteNote(note.id)}
                    style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '10px', padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                    title="Delete note"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: '64px', textAlign: 'center', fontWeight: 500, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
          MoodByte Admin Dashboard · Top Secret Data 👁️
        </p>
```

(that last `<p>` already existed — it's shown here only to mark exactly where the new section goes relative to it; don't duplicate it)

- [ ] **Step 6: Manually verify**

Run: `npm run dev`, sign in at `/admin` with the admin Google account, pin a couple of test notes via the regular app in another tab, then refresh the admin dashboard → confirm the "Community Wall" section lists them with correct text/color/timestamp. Click delete on one → confirm it disappears from the admin list AND from the Community Wall modal in the other tab (via realtime).

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/AdminDashboard.jsx
git commit -m "feat: add Community Wall moderation to admin dashboard"
```

---

## Post-Plan Checklist

- [ ] Run `npm run lint` — no new errors introduced by this plan's files.
- [ ] Run `npm run build` — production build succeeds.
- [ ] Run `npx vitest run` — full suite passes.
- [ ] Replace the placeholder word list in both `supabase_community_wall.sql` and `src/utils/wallModeration.js` with a real one before this is live on the public site.
