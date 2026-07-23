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

export function useCloudSync() {
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const syncTimeoutRef = useRef(null);

  // 1. Listen for Auth State
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (event === 'SIGNED_IN') {
        // If they just logged in, this flag was set right before the redirect.
        if (sessionStorage.getItem('moodbyte_expecting_login')) {
          sessionStorage.removeItem('moodbyte_expecting_login');
          window.dispatchEvent(new CustomEvent('sync-toast', { detail: 'Cloud Sync Activated!' }));
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Initial Pull on Login
  useEffect(() => {
    if (user) {
      pullFromCloud();
    }
  }, [user]);

  // 3. Listen for Local Changes and Push to Cloud
  useEffect(() => {
    if (!user) return;

    const handleLocalChange = (e) => {
      if (e.detail?.fromCloud) return; // Don't push to cloud if the change came from the cloud!

      if (e.detail && typeof e.detail.key === 'string' && (SYNC_KEYS.includes(e.detail.key) || e.detail.key.startsWith('moodbyte_'))) {
        // Debounce cloud push by 3 seconds
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        
        setSyncStatus('syncing');
        syncTimeoutRef.current = setTimeout(() => {
          pushToCloud();
        }, 3000);
      }
    };

    window.addEventListener('local-storage', handleLocalChange);
    return () => window.removeEventListener('local-storage', handleLocalChange);
  }, [user]);

  // 4. Listen for Real-time Cloud Updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-sync-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_sync_data', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newData = payload.new?.data;
          if (newData) {
            Object.entries(newData).forEach(([key, value]) => {
              if (SYNC_KEYS.includes(key) || key.startsWith('moodbyte_')) {
                const localStr = window.localStorage.getItem(key);
                const newStr = JSON.stringify(value);
                // Only update and dispatch if there is an actual change
                if (localStr !== newStr) {
                  window.localStorage.setItem(key, newStr);
                  window.dispatchEvent(new CustomEvent('local-storage', { detail: { key, value, fromCloud: true } }));
                }
              }
            });
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

  const pullFromCloud = async () => {
    try {
      setSyncStatus('syncing');
      const { data, error } = await supabase
        .from('user_sync_data')
        .select('data, updated_at')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
        throw error;
      }

      if (data && data.data) {
        const cloudData = data.data;
        let appliedAny = false;
        
        // Apply cloud data to local storage
        Object.entries(cloudData).forEach(([key, value]) => {
          if (SYNC_KEYS.includes(key) || key.startsWith('moodbyte_')) {
            window.localStorage.setItem(key, JSON.stringify(value));
            window.dispatchEvent(new CustomEvent('local-storage', { detail: { key, value, fromCloud: true } }));
            appliedAny = true;
          }
        });
        
        if (data.updated_at) {
          setLastSyncTime(new Date(data.updated_at));
        }
      } else {
        // If no cloud data exists yet, push our local data to start
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
      
      // Gather all local data
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
