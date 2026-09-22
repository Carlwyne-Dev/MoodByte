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
