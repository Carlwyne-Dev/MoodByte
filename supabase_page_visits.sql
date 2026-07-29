-- Run this in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard → Your Project → SQL Editor

-- 1. Create table (safe to re-run)
CREATE TABLE IF NOT EXISTS public.page_visits (
  id          bigserial PRIMARY KEY,
  session_id  text NOT NULL,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  theme       text,
  visited_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

-- 3. Policies — drop first so re-running never errors
DROP POLICY IF EXISTS "Allow insert for all" ON public.page_visits;
DROP POLICY IF EXISTS "Allow select for authenticated" ON public.page_visits;

CREATE POLICY "Allow insert for all" ON public.page_visits
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select for authenticated" ON public.page_visits
  FOR SELECT USING (auth.role() = 'authenticated');

-- 4. Indexes (safe to re-run)
CREATE INDEX IF NOT EXISTS idx_page_visits_visited_at ON public.page_visits(visited_at);
CREATE INDEX IF NOT EXISTS idx_page_visits_session_id ON public.page_visits(session_id);
