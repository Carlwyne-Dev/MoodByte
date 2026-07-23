import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

const SYNC_KEYS = [
  'moodbyte_notes',
  'moodbyte_tasks',
  'moodbyte_stats',
  'moodbyte_theme',
  'moodbyte_custom_bgs',
  'moodbyte_events',
  'moodbyte_bgm_volume',
  'moodbyte_has_seen_welcome',
  'moodbyte_achievements'
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
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
      if (e.detail && typeof e.detail.key === 'string' && e.detail.key.startsWith('moodbyte_')) {
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
            window.dispatchEvent(new CustomEvent('local-storage', { detail: { key, value } }));
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
        if (key.startsWith('moodbyte_')) {
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
