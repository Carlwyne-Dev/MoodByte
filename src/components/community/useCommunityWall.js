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
