import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Generate or retrieve a persistent anonymous session ID
function getSessionId() {
  const key = 'moodbyte_anon_session_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

const ADMIN_EMAIL = 'magharicarlwyne@gmail.com';

export function useAnalytics(theme) {
  useEffect(() => {
    const logVisit = async () => {
      try {
        const sessionId = getSessionId();
        // Don't log if already logged today
        const todayKey = `moodbyte_visit_logged_${new Date().toDateString()}`;
        if (sessionStorage.getItem(todayKey)) return;

        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || null;

        // Skip recording admin's own visits
        if (session?.user?.email === ADMIN_EMAIL) return;

        await supabase.from('page_visits').insert({
          session_id: sessionId,
          user_id: userId,
          theme: theme || 'chill',
          visited_at: new Date().toISOString(),
        });

        sessionStorage.setItem(todayKey, '1');
      } catch (err) {
        // Silent fail — analytics should never break the app
        console.warn('Analytics log failed:', err.message);
      }
    };

    logVisit();
  }, []); // Only run once on mount
}
