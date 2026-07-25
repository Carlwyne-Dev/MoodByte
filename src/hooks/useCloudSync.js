import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

const SYNC_KEYS = [
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
  'spotify_history'
];

const LOCAL_TS_KEY = 'moodbyte_local_last_modified';

function getLocalTimestamp() {
  return parseInt(localStorage.getItem(LOCAL_TS_KEY) || '0', 10);
}

function bumpLocalTimestamp() {
  const ts = Date.now();
  localStorage.setItem(LOCAL_TS_KEY, String(ts));
  return ts;
}

export function useCloudSync() {
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const syncTimeoutRef = useRef(null);
  // Track when we're applying cloud data so we don't re-push it
  const applyingCloudRef = useRef(false);

  // 1. Listen for Auth State
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (event === 'SIGNED_IN') {
        if (sessionStorage.getItem('moodbyte_expecting_login')) {
          sessionStorage.removeItem('moodbyte_expecting_login');
          window.dispatchEvent(new CustomEvent('sync-toast', { detail: 'Cloud Sync Activated!' }));
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Initial Pull on Login — only apply if cloud is newer than local
  useEffect(() => {
    if (user) {
      pullFromCloud({ onlyIfNewer: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 3. Listen for Local Changes → bump timestamp → push to cloud (debounced)
  useEffect(() => {
    if (!user) return;

    const handleLocalChange = (e) => {
      // Ignore changes that came from cloud application
      if (applyingCloudRef.current) return;
      if (e.detail?.fromCloud) return;

      if (e.detail && typeof e.detail.key === 'string' &&
          (SYNC_KEYS.includes(e.detail.key) || e.detail.key.startsWith('moodbyte_'))) {
        
        // Bump local timestamp so we know local is now the "latest"
        bumpLocalTimestamp();

        // Debounce cloud push slightly (500ms) to avoid spamming the network on every keystroke,
        // but fast enough to feel instant. Local save is already instantaneous.
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        setSyncStatus('syncing');
        syncTimeoutRef.current = setTimeout(() => {
          pushToCloud();
        }, 500);
      }
    };

    window.addEventListener('local-storage', handleLocalChange);
    return () => window.removeEventListener('local-storage', handleLocalChange);
  }, [user]);

  // 4. Listen for Real-time Cloud Updates — only apply if cloud is newer
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-sync-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_sync_data', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const cloudUpdatedAt = payload.new?.updated_at
            ? new Date(payload.new.updated_at).getTime()
            : 0;
          const localTs = getLocalTimestamp();

          // Only apply cloud update if cloud data is strictly newer
          if (cloudUpdatedAt <= localTs) return;

          const newData = payload.new?.data;
          if (newData) {
            applyingCloudRef.current = true;
            Object.entries(newData).forEach(([key, value]) => {
              if (SYNC_KEYS.includes(key) || key.startsWith('moodbyte_')) {
                const localStr = window.localStorage.getItem(key);
                const newStr = JSON.stringify(value);
                if (localStr !== newStr) {
                  window.localStorage.setItem(key, newStr);
                  window.dispatchEvent(new CustomEvent('local-storage', { detail: { key, value, fromCloud: true } }));
                }
              }
            });
            applyingCloudRef.current = false;

            if (payload.new.updated_at) {
              setLastSyncTime(new Date(payload.new.updated_at));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const pullFromCloud = async ({ onlyIfNewer = false } = {}) => {
    try {
      setSyncStatus('syncing');
      const { data, error } = await supabase
        .from('user_sync_data')
        .select('data, updated_at')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data && data.data) {
        const cloudTs = data.updated_at ? new Date(data.updated_at).getTime() : 0;
        const localTs = getLocalTimestamp();

        // If local is newer (user made changes since last cloud write), skip pull
        if (onlyIfNewer && localTs > cloudTs) {
          setSyncStatus('success');
          // Push our newer local data up instead
          pushToCloud();
          return;
        }

        const cloudData = data.data;
        applyingCloudRef.current = true;
        Object.entries(cloudData).forEach(([key, value]) => {
          if (SYNC_KEYS.includes(key) || key.startsWith('moodbyte_')) {
            window.localStorage.setItem(key, JSON.stringify(value));
            window.dispatchEvent(new CustomEvent('local-storage', { detail: { key, value, fromCloud: true } }));
          }
        });
        applyingCloudRef.current = false;

        if (data.updated_at) {
          setLastSyncTime(new Date(data.updated_at));
        }
      } else {
        // No cloud data yet — push local data to bootstrap the cloud
        pushToCloud();
      }

      setSyncStatus('success');
    } catch (err) {
      console.error('Error pulling from cloud:', err);
      setSyncStatus('error');
    }
  };

  const pushToCloud = async () => {
    if (!user) return;

    try {
      setSyncStatus('syncing');

      const localData = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (SYNC_KEYS.includes(key) || key.startsWith('moodbyte_')) {
          try {
            localData[key] = JSON.parse(window.localStorage.getItem(key));
          } catch (e) {
            localData[key] = window.localStorage.getItem(key);
          }
        }
      }

      const { error } = await supabase
        .from('user_sync_data')
        .upsert({
          user_id: user.id,
          data: localData,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setLastSyncTime(new Date());
      setSyncStatus('success');
    } catch (err) {
      console.error('Error pushing to cloud:', err);
      setSyncStatus('error');
    }
  };

  return { user, syncStatus, lastSyncTime, pullFromCloud, pushToCloud };
}
