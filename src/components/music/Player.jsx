import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat,
  Volume2, VolumeX, Plus, Trash2, Music2, X, ChevronDown, ChevronUp, GripVertical, Maximize2, MoreHorizontal
} from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { saveTrackBlob, getTrackBlob, deleteTrackBlob } from '../../hooks/useAudioStorage';

const SpotifyIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.419.12-.84-.12-.96-.54-.12-.42.12-.84.54-.96 4.56-1.02 8.52-.6 11.76 1.38.36.18.48.66.24 1.02zm1.44-3.3c-.301.42-.84.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14 4.32-1.38 9.72-.72 13.439 1.56.42.24.6.84.301 1.26zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.18-1.2-.12-1.38-.72-.18-.6.12-1.2.72-1.38 4.2-1.26 11.28-1.02 15.721 1.62.539.3.719 1.02.42 1.56-.24.54-.9.72-1.56.3z"/>
  </svg>
);

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function Player({ isMobile = false }) {
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const progressRef = useRef(null);

  const [queue, setQueue] = useLocalStorage('player_queue_meta', []);  // only metadata (id, name)
  const [currentIdx, setCurrentIdx] = useLocalStorage('player_currentIdx', 0);
  const [volume, setVolume] = useLocalStorage('player_volume', 0.8);
  const [shuffle, setShuffle] = useLocalStorage('player_shuffle', false);
  const [repeat, setRepeat] = useLocalStorage('player_repeat', false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [closingQueue, setClosingQueue] = useState(false);
  const [showSpotify, setShowSpotify] = useState(false);
  const [closingSpotify, setClosingSpotify] = useState(false);
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [spotifyEmbed, setSpotifyEmbed] = useState(null);
  const [spotifyHistory, setSpotifyHistory] = useLocalStorage('spotify_history', []);
  const [showSpotifyConfirm, setShowSpotifyConfirm] = useState(false);
  const [showMobileOptions, setShowMobileOptions] = useState(false);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const [isOverflowing, setIsOverflowing] = useState(false);
  // blobUrls: map of id -> object URL (rebuilt each session from IndexedDB)
  const [blobUrls, setBlobUrls] = useState({});
  
  const actionRowRef = useRef(null);
  const playerRef = useRef(null);
  const trackNameRef = useRef(null);
  const popupRef = useRef(null);
  const shouldPlayRef = useRef(false);  // tracks whether we intend to auto-play after load
  
  // Drag and drop state for queue
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  // Resolve current track URL from blobUrls map
  const currentMeta  = queue[currentIdx] || null;
  const currentTrack = currentMeta ? { ...currentMeta, url: blobUrls[currentMeta.id] || '' } : null;

  // ── Restore blob URLs from IndexedDB on mount ──────────────────────────────
  useEffect(() => {
    if (queue.length === 0) return;
    (async () => {
      const entries = {};
      for (const track of queue) {
        const blob = await getTrackBlob(track.id);
        if (blob) entries[track.id] = URL.createObjectURL(blob);
      }
      setBlobUrls(entries);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // ── Load track when currentTrack URL changes ───────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    const url = currentTrack?.url;
    if (!audio || !url) return;

    audio.src = url;
    audio.load();
    // If shouldPlayRef is set (user clicked play/next or just imported), autoplay
    if (shouldPlayRef.current) {
      audio.play().catch(() => {});
      shouldPlayRef.current = false;
    }
  }, [currentTrack?.url]);

  // ── Check Title Overflow ─────────────────────────────────────────────────────
  useEffect(() => {
    if (trackNameRef.current) {
      // The parent wrap is the container, so we check if the single text span 
      // is larger than the wrap container. We need to check the first child's width.
      const wrapEl = trackNameRef.current.parentElement;
      const textEl = trackNameRef.current.children[0];
      if (wrapEl && textEl) {
        setIsOverflowing(textEl.scrollWidth > wrapEl.clientWidth);
      }
    }
  }, [currentTrack?.name]);

  // ── Audio event listeners ────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration);
    const onEnded = () => handleNext(true);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [queue, shuffle, repeat, currentIdx]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);
  // ── Controls ──────────────────────────────────────────────────────────────────
  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
      window.dispatchEvent(new Event('music-play'));
    }
  };

  useEffect(() => {
    const handleBgmPlay = () => {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      // If Spotify is active, force it to pause by briefly reloading the iframe
      setSpotifyEmbed(prev => {
        if (prev) {
          const current = { ...prev };
          setTimeout(() => setSpotifyEmbed(current), 50);
          return null;
        }
        return prev;
      });
    };
    window.addEventListener('bgm-play', handleBgmPlay);
    return () => window.removeEventListener('bgm-play', handleBgmPlay);
  }, []);

  // Detect clicks on the Spotify iframe to mute BGM
  useEffect(() => {
    const checkIframeClick = () => {
      if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
        window.dispatchEvent(new Event('music-play'));
      }
    };
    window.addEventListener('blur', checkIframeClick);
    return () => window.removeEventListener('blur', checkIframeClick);
  }, []);

  const handleNext = useCallback((fromEnd = false) => {
    if (queue.length === 0) return;
    if (repeat === 'one') {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      return;
    }
    let nextIdx;
    if (shuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else {
      nextIdx = (currentIdx + 1) % queue.length;
      if (nextIdx === 0 && fromEnd && repeat !== 'all') {
        audioRef.current.pause();
        setIsPlaying(false);
        return;
      }
    }
    shouldPlayRef.current = true;
    setCurrentIdx(nextIdx);
  }, [queue, currentIdx, shuffle, repeat]);

  const handlePrev = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    shouldPlayRef.current = true;
    setCurrentIdx(idx => (idx - 1 + queue.length) % queue.length);
  };

  const seek = (e) => {
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = ratio * duration;
  };

  // Remote Control Listeners for ZenMiniPlayer
  useEffect(() => {
    const handleCommand = (e) => {
      const { action } = e.detail;
      if (action === 'play') {
        if (!isPlaying) togglePlay();
      }
      if (action === 'pause') {
        if (isPlaying) togglePlay();
      }
      if (action === 'next') handleNext(false);
      if (action === 'prev') handlePrev();
    };
    const sendState = () => {
      window.dispatchEvent(new CustomEvent('zen-player-state', {
        detail: { isPlaying, currentTrack: currentTrack?.name, isSpotify: !!spotifyEmbed }
      }));
    };
    
    window.addEventListener('zen-player-command', handleCommand);
    window.addEventListener('zen-player-request-state', sendState);
    return () => {
      window.removeEventListener('zen-player-command', handleCommand);
      window.removeEventListener('zen-player-request-state', sendState);
    }
  }, [isPlaying, currentTrack, handleNext, spotifyEmbed]); // Also re-emit state when it changes
  
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('zen-player-state', {
      detail: { isPlaying, currentTrack: currentTrack?.name, isSpotify: !!spotifyEmbed }
    }));
  }, [isPlaying, currentTrack?.name, spotifyEmbed]);

  // ── File import ──────────────────────────────────────────────────────────────────
  const importFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newMeta = files.map(f => ({
      id: `${f.name}-${Date.now()}`,
      name: f.name.replace(/\.[^.]+$/, ''),
    }));

    // Save blobs to IndexedDB and build blob URLs for this session
    const newUrls = {};
    await Promise.all(files.map(async (f, i) => {
      await saveTrackBlob(newMeta[i].id, f);
      newUrls[newMeta[i].id] = URL.createObjectURL(f);
    }));

    setBlobUrls(prev => ({ ...prev, ...newUrls }));

    setQueue(prev => {
      const wasEmpty = prev.length === 0;
      if (wasEmpty) {
        shouldPlayRef.current = true;
        setCurrentIdx(0);
      }
      return [...prev, ...newMeta];
    });

    e.target.value = '';
  };

  const removeTrack = (id) => {
    deleteTrackBlob(id);
    setBlobUrls(prev => { const n = { ...prev }; delete n[id]; return n; });
    setQueue(prev => {
      const idx = prev.findIndex(t => t.id === id);
      const updated = prev.filter(t => t.id !== id);
      if (updated.length === 0) {
        setCurrentIdx(0);
        setIsPlaying(false);
        audioRef.current?.pause();
      } else if (idx <= currentIdx) {
        setCurrentIdx(i => Math.max(0, i - 1));
      }
      return updated;
    });
  };

  // ── Drag & Drop Queue Reordering ──────────────────────────────────────────────
  const handleDragStart = (e, idx) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', idx); 
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault(); 
    if (draggedIdx === null || draggedIdx === idx) return;
    setDragOverIdx(idx);
  };

  const handleDragEnd = () => {
    if (draggedIdx !== null && dragOverIdx !== null && draggedIdx !== dragOverIdx) {
      const newQueue = [...queue];
      const [draggedItem] = newQueue.splice(draggedIdx, 1);
      newQueue.splice(dragOverIdx, 0, draggedItem);
      
      let nextCurrentIdx = currentIdx;
      if (draggedIdx === currentIdx) {
        nextCurrentIdx = dragOverIdx;
      } else if (draggedIdx < currentIdx && dragOverIdx >= currentIdx) {
        nextCurrentIdx = currentIdx - 1;
      } else if (draggedIdx > currentIdx && dragOverIdx <= currentIdx) {
        nextCurrentIdx = currentIdx + 1;
      }
      
      // Batch update the queue and index so currentTrack never briefly points to the wrong song
      setCurrentIdx(nextCurrentIdx);
      setQueue(newQueue);
    }
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  // ── Spotify ──────────────────────────────────────────────────────────────────
  const loadSpotify = (urlOverride) => {
    try {
      let urlStr = (urlOverride || spotifyUrl).trim();
      if (!urlStr) return;
      let type, id;
      
      // Handle spotify:track:id format
      if (urlStr.startsWith('spotify:')) {
        const parts = urlStr.split(':');
        type = parts[1];
        id = parts[2];
      } else {
        // Handle standard URLs
        if (!urlStr.startsWith('http')) {
          urlStr = 'https://' + urlStr;
        }
        const u = new URL(urlStr);
        if (!u.hostname.includes('spotify')) throw new Error();
        
        const parts = u.pathname.split('/').filter(Boolean);
        const valid = ['track', 'playlist', 'album', 'episode', 'show'];
        const ti = parts.findIndex(p => valid.includes(p));
        
        if (ti === -1 || !parts[ti + 1]) throw new Error();
        type = parts[ti];
        id = parts[ti + 1].split('?')[0];
      }
      
      if (!type || !id) throw new Error();
      
      setSpotifyEmbed({ type, id });
      setSpotifyUrl('');
      
      // Save to history (max 5)
      setSpotifyHistory(prev => {
        const withoutCurrent = prev.filter(h => h !== urlStr);
        return [urlStr, ...withoutCurrent].slice(0, 5);
      });
    } catch {
      alert('Please paste a valid Spotify link (e.g., https://open.spotify.com/track/...)');
    }
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const cycleRepeat = () => setRepeat(r => r === false ? 'all' : r === 'all' ? 'one' : false);

  // ── Smart Popup Tracking ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!showSpotify && !showQueue) return;

    const sidebarContent = actionRowRef.current?.closest('.sidebar-content');
    if (!sidebarContent) return;

    const updatePosition = () => {
      if (!actionRowRef.current || !playerRef.current) return;
      
      const actionRect = actionRowRef.current.getBoundingClientRect();
      const playerRect = playerRef.current.getBoundingClientRect();
      const sidebar = actionRowRef.current.closest('.sidebar');
      const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : null;
      const contentRect = sidebarContent.getBoundingClientRect();
      
      // If the action row is scrolled completely out of view, close popups
      if (actionRect.bottom < contentRect.top || actionRect.top > contentRect.bottom) {
        if (showQueue) { setClosingQueue(true); setTimeout(() => { setShowQueue(false); setClosingQueue(false); }, 180); }
        if (showSpotify) { setClosingSpotify(true); setTimeout(() => { setShowSpotify(false); setClosingSpotify(false); }, 180); }
        return;
      }

      setPopupPos({
        top: playerRect.top + (playerRect.height / 2),
        left: sidebarRect ? sidebarRect.left - 260 : actionRect.left - 280
      });
    };

    sidebarContent.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition);
    updatePosition(); // Initial precise calc

    return () => {
      sidebarContent.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showSpotify, showQueue]);

  // ── Click outside to close popups ────────────────────────────────────────────
  useEffect(() => {
    if (!showQueue) return;
    const handleClickOutside = (e) => {
      const clickedInsidePopup = popupRef.current?.contains(e.target);
      const clickedInsidePlayer = playerRef.current?.contains(e.target);
      if (!clickedInsidePopup && !clickedInsidePlayer && !closingQueue) {
        setClosingQueue(true);
        setTimeout(() => { setShowQueue(false); setClosingQueue(false); }, 180);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showQueue, closingQueue]);

  const closePopup = (type) => {
    if (type === 'spotify') {
      setClosingSpotify(true);
      setTimeout(() => { setShowSpotify(false); setClosingSpotify(false); }, 180);
    } else {
      setClosingQueue(true);
      setTimeout(() => { setShowQueue(false); setClosingQueue(false); }, 180);
    }
  };

  const togglePopup = (type) => {
    if (type === 'spotify') {
      if (showSpotify) closePopup('spotify');
      else { setShowSpotify(true); if (showQueue) closePopup('queue'); }
    } else {
      if (showQueue) closePopup('queue');
      else { setShowQueue(true); if (showSpotify) closePopup('spotify'); }
    }
  };

  const fadeOutLocal = (onDone) => {
    const audio = audioRef.current;
    if (!audio || audio.paused) { onDone?.(); return; }
    const startVol = audio.volume;
    const steps = 20;
    const stepTime = 600 / steps; // 600ms total fade
    let step = 0;
    const fade = setInterval(() => {
      step++;
      audio.volume = Math.max(0, startVol * (1 - step / steps));
      if (step >= steps) {
        clearInterval(fade);
        audio.pause();
        audio.volume = startVol; // restore volume for next play
        setIsPlaying(false);
        onDone?.();
      }
    }, stepTime);
  };

  return (
    <div
      className={
        isMobile
          ? `player ${showSpotify || spotifyEmbed ? 'is-spotify' : 'is-local'}`
          : 'player inner-glass'
      }
      style={isMobile && (showSpotify || spotifyEmbed) ? {
        display: 'flex',
        flexDirection: 'column',
        padding: '8px',
        gap: 0,
        background: '#0f172a',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        height: 'fit-content',
        minHeight: 0,
      } : {}}
      ref={playerRef}
    >
      <audio ref={audioRef} preload="metadata" />

      {/* Mode tabs */}
      <div className="mode-tabs">
        <button
          className={`mode-tab ${!showSpotify && !spotifyEmbed ? 'active' : ''}`}
          onClick={() => {
            // Switching to Local: destroy Spotify embed (stops iframe audio)
            setShowSpotify(false);
            setSpotifyEmbed(null);
          }}
        >
          <Music2 size={12} /> Local
        </button>
        <button
          className={`mode-tab ${showSpotify || spotifyEmbed ? 'active' : ''}`}
          onClick={() => {
            // If local is playing, fade out then show Spotify
            // If already paused (or nothing loaded), just toggle directly
            if (audioRef.current && !audioRef.current.paused) {
              fadeOutLocal(() => setShowSpotify(true));
            } else {
              setShowSpotify(s => !s);
            }
          }}
        >
          <SpotifyIcon size={12} /> Spotify
        </button>
      </div>

      {/* Spotify import input */}
      {showSpotify && !spotifyEmbed && (
        <div className="spotify-import-view">
          <div className="spotify-input-wrap">
            <input
              type="text" placeholder="Paste Spotify link..."
              value={spotifyUrl}
              onChange={e => setSpotifyUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadSpotify()}
              className="spotify-input"
              autoFocus
            />
            <button className="go-btn" onClick={() => loadSpotify()}>Load</button>
          </div>
          <p className="spotify-hint">Paste a track, album, or playlist link</p>
          
          {spotifyHistory.length > 0 && (
            <div className="spotify-history">
              <span className="history-label">Recent Links</span>
              <div className="history-list">
                {spotifyHistory.map((link, i) => (
                  <button key={i} className="history-item" onClick={() => loadSpotify(link)}>
                    {link.replace('https://open.spotify.com/', '').split('?')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Spotify embed view */}
      {spotifyEmbed && (
        <div 
          className="spotify-view"
          style={isMobile ? { gap: 0, flex: 'none', height: 'auto', padding: '16px 12px' } : {}}
        >
          {isMobile ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#1DB954', width: '100%', fontFamily: "'Outfit', sans-serif", fontSize: '0.9rem', fontWeight: 500 }}>
              <SpotifyIcon size={16} />
              <span>Listening on Spotify</span>
              <div className="info-wrapper" style={{ marginLeft: 0 }}>
                <Info size={14} className="info-icon" />
                <div className="info-tooltip" style={{ bottom: '150%', top: 'auto', left: '50%', transform: 'translateX(-50%)' }}>
                  Spotify is playing. Tap the pill below to pause/play, or use the desktop player to change tracks.
                </div>
              </div>
            </div>
          ) : (
            <React.Fragment>
              <div className="spotify-scroll-wrap">
                <iframe
                  src={`https://open.spotify.com/embed/${spotifyEmbed.type}/${spotifyEmbed.id}?utm_source=generator&theme=0`}
                  width="100%"
                  height="352"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  style={{ borderRadius: '12px', minWidth: '320px', display: 'block' }}
                  title="Spotify"
                />
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
                Log in on this browser to hear full song
              </div>
              <div className="spotify-action-row">
                <button className="icon-btn close-btn" title="Close Spotify" onClick={() => setShowSpotifyConfirm(true)}>
                  <X size={16} />
                </button>
              </div>
            </React.Fragment>
          )}
        </div>
      )}

      {/* Spotify Close Confirmation */}
      {showSpotifyConfirm && createPortal(
        <div className="spotify-modal-overlay" onClick={() => setShowSpotifyConfirm(false)}>
          <div className="spotify-modal" onClick={e => e.stopPropagation()}>
            <h3 className="font-pixel">Close Spotify?</h3>
            <p>Are you sure you want to stop the Spotify player?</p>
            <div className="spotify-modal-actions">
              <button className="cancel-btn" onClick={() => setShowSpotifyConfirm(false)}>Cancel</button>
              <button className="confirm-btn" onClick={() => { setSpotifyEmbed(null); setShowSpotify(false); setShowSpotifyConfirm(false); }}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Local player controls */}
      {!showSpotify && !spotifyEmbed && (
        <>
          <div className="track-info">
            <div className="track-name-wrap">
              <div ref={trackNameRef} className={`track-name ${isOverflowing ? 'scrolling' : ''}`}>
                <span className="track-name-text">{currentTrack?.name || 'No track selected'}</span>
                {isOverflowing && <span className="track-name-text">{currentTrack?.name}</span>}
              </div>
            </div>
            <div className="track-time">{formatTime(currentTime)} / {formatTime(duration)}</div>
          </div>
          <div className="progress-wrap" ref={progressRef} onClick={seek}>
            <div className="progress-bg"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
            <div className="progress-thumb" style={{ left: `${progress}%` }} />
          </div>
          <div className="main-controls">
            <button className="ctrl sm" onClick={handlePrev} disabled={!currentTrack}><SkipBack size={16} fill="currentColor" /></button>
            <button className="ctrl lg" onClick={togglePlay} disabled={!currentTrack}>
              {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
            </button>
            <button className="ctrl sm" onClick={() => handleNext(false)} disabled={!currentTrack}><SkipForward size={16} fill="currentColor" /></button>
          </div>
          <div className="secondary-controls">
            <button className={`ctrl xs ${shuffle ? 'active' : ''}`} onClick={() => setShuffle(s => !s)}><Shuffle size={13} /></button>
            <button className={`ctrl xs ${repeat ? 'active' : ''}`} onClick={cycleRepeat}>
              <Repeat size={13} />{repeat === 'one' && <span className="repeat-badge">1</span>}
            </button>
          </div>
          <div className="volume-row">
            <button className="icon-btn" onClick={() => setIsMuted(m => !m)}>
              {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <div className="vol-track">
              <div className="vol-fill" style={{ width: `${isMuted ? 0 : volume * 100}%` }} />
              <input type="range" min="0" max="1" step="0.02"
                value={isMuted ? 0 : volume}
                onChange={e => { setVolume(+e.target.value); setIsMuted(false); }}
              />
            </div>
          </div>
        </>
      )}

      {/* Action row */}
      {!showSpotify && !spotifyEmbed && (
        <div className="action-row" ref={actionRowRef}>
          <div className="action-top-row">
            {/* Desktop: + Add Local button */}
            {!isMobile && (
              <button className="pill-btn primary" onClick={() => fileInputRef.current.click()}>
                <Plus size={14} /> Add Local
              </button>
            )}
            {/* Mobile: ··· and Spotify icon */}
            {isMobile && (
              <button className="pill-btn" onClick={() => { 
                setShowMobileOptions(true);
                if (showQueue) closePopup('queue');
              }}>
                <MoreHorizontal size={14} />
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="audio/*" multiple hidden onChange={importFiles} />
            {/* Desktop: Queue button */}
            {!isMobile && queue.length > 0 && (
              <button className="pill-btn" onClick={() => togglePopup('queue')}>
                <Music2 size={14} /> Queue ({queue.length})
              </button>
            )}
            {/* Mobile: Spotify icon shortcut */}
            {isMobile && (
              <button className="pill-btn" onClick={() => {
                if (audioRef.current && !audioRef.current.paused) {
                  fadeOutLocal(() => setShowSpotify(true));
                } else {
                  setShowSpotify(true);
                }
              }}>
                <SpotifyIcon size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Options Modal */}
      {showMobileOptions && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, touchAction: 'none' }} onPointerDown={() => setShowMobileOptions(false)} />
          <div className="player-portal-popup mobile-menu-popup" style={{ 
            zIndex: 10000,
            ...(isMobile ? {
              bottom: 'calc(160px + env(safe-area-inset-bottom, 0px))',
              right: 16,
              left: 'auto',
              top: 'auto',
              transform: 'none',
              width: 'max-content',
              minWidth: 200,
              padding: 12
            } : {})
          }}>
            <div className="queue-list" style={{ gap: '8px' }}>
              <button className="queue-item" onClick={() => { setShowMobileOptions(false); togglePopup('queue'); }}>
                <Music2 size={16} /> Open Queue
              </button>
              <button className="queue-item" onClick={() => { setShowMobileOptions(false); fileInputRef.current.click(); }}>
                <Plus size={16} /> Add Local Music
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Queue popup only — rendered via portal */}
      {/* Desktop/Mobile Queue Popup */}
      {(showQueue || closingQueue) && queue.length > 0 && createPortal(
        <div ref={popupRef} className={`player-portal-popup ${closingQueue ? 'closing' : ''}`} style={{ 
          top: isMobile ? 'auto' : `${popupPos.top}px`, 
          left: isMobile ? '50%' : `${popupPos.left}px`,
          ...(isMobile ? {
            bottom: 'calc(160px + env(safe-area-inset-bottom, 0px))',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 32px)',
            maxWidth: 420
          } : {})
        }}>
          <div className="player-popup-content">
              <div className="popup-label">Up Next</div>
              <div className="queue-list">
                {queue.map((t, i) => (
                  <div 
                    key={t.id} 
                    className={`queue-item ${i === currentIdx ? 'current' : ''} ${draggedIdx === i ? 'dragging' : ''} ${dragOverIdx === i ? 'drag-over' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDragEnd={handleDragEnd}
                    onClick={() => { 
                      if (currentIdx === i) {
                        audioRef.current?.play().catch(()=>{});
                        setIsPlaying(true);
                      } else {
                        shouldPlayRef.current = true; 
                        setCurrentIdx(i); 
                      }
                    }}
                  >
                    <div className="drag-handle"><GripVertical size={12} /></div>
                    <span className="q-name">{t.name}</span>
                    <button className="q-del" onClick={e => { e.stopPropagation(); removeTrack(t.id); }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          <div className="player-popup-tail" />
        </div>,
        document.body
      )}

      <style jsx="true">{`
        .show-on-mobile {
          display: none;
        }

        .player {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          padding: 1.25rem;
        }

        .mode-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 0.5rem;
        }
        .mode-tab {
          flex: 1;
          padding: 8px;
          border-radius: 8px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          color: var(--text-muted);
          font-family: 'Outfit', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .mode-tab:hover {
          background: rgba(255,255,255,0.08);
          color: var(--text-light);
        }
        .mode-tab.active {
          background: rgba(var(--primary-rgb), 0.15);
          border-color: rgba(var(--primary-rgb), 0.3);
          color: var(--primary);
        }

        .spotify-import-view {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .spotify-input-wrap {
          display: flex;
          position: relative;
        }
        .spotify-input {
          flex: 1;
          min-width: 0;
          background: rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 8px 76px 8px 12px;
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .spotify-input:focus {
          border-color: var(--primary);
        }
        .go-btn {
          position: absolute;
          right: 4px;
          top: 4px;
          bottom: 4px;
          background: var(--primary);
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 0 14px;
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .go-btn:hover {
          transform: translateY(-1px);
        }
        .spotify-hint {
          margin: 0;
          color: var(--text-muted);
          font-size: 0.8rem;
        }
        .spotify-history {
          margin-top: 8px;
        }
        .history-label {
          display: block;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .history-item {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          color: var(--text-light);
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          text-align: left;
          cursor: pointer;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: all 0.2s;
        }
        .history-item:hover {
          background: rgba(255,255,255,0.08);
          border-color: var(--primary);
        }

        .spotify-view {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .spotify-scroll-wrap {
          overflow-x: auto;
          overflow-y: hidden;
          border-radius: 12px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.2) rgba(255,255,255,0.05);
          padding-bottom: 4px;
        }
        .spotify-scroll-wrap::-webkit-scrollbar { 
          height: 6px; 
        }
        .spotify-scroll-wrap::-webkit-scrollbar-track { 
          background: rgba(255, 255, 255, 0.05); 
          border-radius: 4px;
        }
        .spotify-scroll-wrap::-webkit-scrollbar-thumb { 
          background: rgba(255, 255, 255, 0.2); 
          border-radius: 4px; 
        }
        .spotify-scroll-wrap::-webkit-scrollbar-thumb:hover { 
          background: rgba(255, 255, 255, 0.3); 
        }
        .spotify-action-row {
          display: flex;
          justify-content: flex-end;
        }
        .icon-btn.close-btn {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }
        .icon-btn.close-btn:hover {
          background: rgba(239, 68, 68, 0.2);
        }

        /* Spotify Modal */
        .spotify-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 10002;
          display: flex; align-items: center; justify-content: center;
        }
        .spotify-modal {
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px; width: 340px; text-align: center;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
          animation: popIn 0.2s ease-out forwards;
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .spotify-modal h3 {
          margin: 0 0 12px 0; color: #ef4444; font-size: 1.2rem;
        }
        .spotify-modal p {
          margin: 0 0 24px 0; color: #94a3b8; font-size: 0.95rem; line-height: 1.4;
        }
        .spotify-modal-actions {
          display: flex; gap: 12px;
        }
        .spotify-modal-actions button {
          flex: 1; padding: 10px; border-radius: 8px;
          font-family: 'Outfit', sans-serif; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
        }
        .cancel-btn {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff;
        }
        .cancel-btn:hover { background: rgba(255,255,255,0.1); }
        .confirm-btn {
          background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #ef4444;
        }
        .confirm-btn:hover { background: rgba(239, 68, 68, 0.3); }

        .track-info {
          text-align: center;
        }

        .track-name-wrap {
          width: 100%;
          overflow: hidden;
          position: relative;
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          margin-bottom: 4px;
        }
        .track-name {
          font-family: 'Outfit', sans-serif;
          font-weight: 500;
          font-size: 1rem;
          color: #fff;
          white-space: nowrap;
          display: inline-flex;
          gap: 2rem;
        }
        .track-name.scrolling {
          animation: marquee 10s linear infinite;
        }
        .track-name-text {
          display: inline-block;
        }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-50% - 1rem)); }
        }

        .track-time {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-variant-numeric: tabular-nums;
        }

        .progress-wrap {
          height: 20px;
          display: flex;
          align-items: center;
          cursor: pointer;
          position: relative;
        }
        .progress-bg {
          width: 100%;
          height: 4px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: var(--primary);
          transition: width 0.1s linear;
        }
        .progress-thumb {
          position: absolute;
          width: 12px;
          height: 12px;
          background: #fff;
          border-radius: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .progress-wrap:hover .progress-thumb {
          opacity: 1;
        }

        .main-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }
        .ctrl {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          border-radius: 50%;
        }
        .ctrl:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .ctrl:not(:disabled):hover {
          color: #fff;
          transform: scale(1.1);
        }
        .ctrl.active {
          color: var(--primary);
        }
        .ctrl.sm { width: 32px; height: 32px; }
        .ctrl.lg {
          width: 42px; height: 42px;
          background: rgba(255,255,255,0.1);
          color: #fff;
        }
        .ctrl.lg:not(:disabled):hover {
          background: var(--primary);
          transform: scale(1.05);
        }
        .ctrl.xs { width: 28px; height: 28px; position: relative; }

        .repeat-badge {
          position: absolute;
          top: 0px;
          right: 0px;
          background: var(--primary);
          color: #000;
          font-size: 0.5rem;
          font-weight: bold;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .secondary-controls {
          display: flex;
          justify-content: center;
          gap: 12px;
        }

        .volume-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 4px 1rem;
        }
        .icon-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
          padding: 0;
        }
        .icon-btn:hover {
          color: #fff;
        }
        .vol-track {
          flex: 1;
          max-width: 160px;
          height: 4px;
          background: rgba(255,255,255,0.12);
          border-radius: 2px;
          position: relative;
          cursor: pointer;
        }
        .vol-fill {
          position: absolute; left: 0; top: 0; height: 100%;
          background: var(--primary); border-radius: 2px;
          pointer-events: none;
        }
        .vol-track input[type=range] {
          position: absolute; inset: -8px 0;
          width: 100%; height: 20px;
          opacity: 0; cursor: pointer; margin: 0;
        }

        /* Actions */
        .action-row { display: flex; flex-direction: column; gap: 0.6rem; }
        .action-top-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
        .pill-btn {
          background: transparent; border: 1px solid rgba(255, 255, 255, 0.12);
          color: var(--text-muted); padding: 0.45rem 0.8rem; border-radius: 10px;
          font-size: 0.75rem; font-weight: 500; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 0.4rem;
          transition: all 0.2s; white-space: nowrap; width: 100%;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }
        .pill-btn.primary {
          background: var(--primary); 
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 2px 8px rgba(168, 85, 247, 0.25);
          color: white; font-weight: 600;
        }
        .pill-btn.active {
          background: rgba(168, 85, 247, 0.15); 
          border-color: rgba(168, 85, 247, 0.4);
          color: var(--primary-hover);
        }
        .pill-btn:hover:not(.primary) { border-color: rgba(255,255,255,0.2); color: var(--text-color); }
        .pill-btn.primary:hover { opacity: 0.9; }

        /* Portal Popups */
        .player-portal-popup {
          position: fixed;
          transform: translateY(-50%);
          width: 260px;
          background: rgba(30, 30, 35, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 1.2rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          animation: popInLeft 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 99999;
        }

        .player-popup-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .player-popup-tail {
          position: absolute;
          right: -6px;
          top: 50%;
          margin-top: -6px;
          width: 12px; height: 12px;
          background: rgba(45, 45, 55, 0.65);
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          border-right: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(16px);
          transform: rotate(45deg);
          border-radius: 2px;
          z-index: -1;
        }

        @keyframes popInLeft {
          from { opacity: 0; transform: translate(10px, -50%) scale(0.95); }
          to { opacity: 1; transform: translate(0, -50%) scale(1); }
        }
        @keyframes popOutLeft {
          from { opacity: 1; transform: translate(0, -50%) scale(1); }
          to { opacity: 0; transform: translate(10px, -50%) scale(0.95); }
        }
        .player-portal-popup.closing {
          animation: popOutLeft 0.18s cubic-bezier(0.4, 0, 1, 1) forwards;
        }

        .player-portal-popup .popup-label {
          font-family: 'Outfit', sans-serif;
          font-size: 0.75rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: var(--text-color);
          opacity: 0.9;
        }

        /* Spotify input inside popup */
        .player-portal-popup .spotify-input-wrap {
          display: flex; gap: 0.4rem; align-items: center;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 4px 4px 4px 12px;
          animation: fadeIn 0.2s ease;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .player-portal-popup .spotify-input {
          flex: 1; background: transparent; border: none; outline: none;
          color: var(--text-color); font-size: 0.8rem;
          font-family: 'Outfit', sans-serif;
          min-width: 0;
        }
        .player-portal-popup .spotify-input::placeholder { color: rgba(255, 255, 255, 0.4); }
        .player-portal-popup .go-btn {
          background: #1db954; color: white; border: none;
          border-radius: 20px; padding: 0.4rem 1rem;
          font-size: 0.75rem; font-weight: 700; cursor: pointer;
          font-family: 'Outfit', sans-serif;
          transition: all 0.2s;
          display: flex; align-items: center; justify-content: center;
          line-height: 1;
        }
        .player-portal-popup .go-btn:hover { 
          background: #1ed760;
          transform: scale(1.05);
        }
        .player-portal-popup .clear-btn {
          background: transparent; border: none; color: var(--text-muted);
          cursor: pointer; display: flex; align-items: center;
          transition: color 0.2s;
        }
        .player-portal-popup .clear-btn:hover { color: #f87171; }

        /* Spotify embed */
        .player-portal-popup .spotify-embed { border-radius: 10px; overflow: hidden; }

        /* Queue inside popup */
        .player-portal-popup .queue-list {
          display: flex; flex-direction: column; gap: 2px;
          max-height: 220px; overflow-y: auto;
          padding-right: 0.4rem; margin-right: -0.4rem;
        }
        .player-portal-popup .queue-list::-webkit-scrollbar { width: 4px; }
        .player-portal-popup .queue-list::-webkit-scrollbar-track { background: transparent; }
        .player-portal-popup .queue-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }
        .player-portal-popup .queue-item {
          display: flex; align-items: center; justify-content: space-between; gap: 0.4rem;
          padding: 0.4rem 0.6rem; border-radius: 8px;
          cursor: pointer; transition: background 0.15s;
        }
        .player-portal-popup .queue-item:hover { background: rgba(255,255,255,0.05); }
        .player-portal-popup .queue-item.current { background: rgba(168,85,247,0.12); }
        
        /* Drag & Drop styles */
        .player-portal-popup .queue-item.dragging {
          opacity: 0.5;
          background: rgba(255,255,255,0.02);
        }
        .player-portal-popup .queue-item.drag-over {
          border-top: 2px solid var(--primary);
          border-top-left-radius: 0;
          border-top-right-radius: 0;
        }
        .player-portal-popup .drag-handle {
          color: rgba(255,255,255,0.4);
          cursor: grab;
          display: flex; align-items: center;
          transition: color 0.2s;
        }
        .player-portal-popup .drag-handle:active { cursor: grabbing; }
        .player-portal-popup .queue-item:hover .drag-handle { color: rgba(255,255,255,0.7); }

        .player-portal-popup .q-name {
          font-size: 0.85rem; font-weight: 500;
          color: #ffffff;
          text-shadow: 0 1px 3px rgba(0,0,0,0.6);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          flex: 1;
        }
        .player-portal-popup .queue-item.current .q-name { color: var(--primary-hover); font-weight: 500; }
        .player-portal-popup .q-del {
          background: transparent; border: none; color: var(--text-muted);
          cursor: pointer; opacity: 0; transition: opacity 0.2s, color 0.2s;
          display: flex; align-items: center; flex-shrink: 0;
          padding: 2px;
        }
        .player-portal-popup .queue-item:hover .q-del { opacity: 1; }
        .player-portal-popup .q-del:hover { color: #f87171; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }


        /* ── Mobile floating pill styles (only inside .mobile-player-wrapper) ── */
        .mobile-player-wrapper .player.is-local {
          flex-direction: row !important;
          align-items: center !important;
          padding: 8px 16px !important;
          border-radius: 40px !important;
          gap: 12px !important;
          background: #0f172a !important;
          backdrop-filter: none !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
        }

        .mobile-player-wrapper .player.is-spotify {
          background: #0f172a !important;
          backdrop-filter: none !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          box-shadow: 0 4px 24px rgba(0,0,0,0.5) !important;
          border-radius: 20px !important;
          padding: 8px !important;
          height: fit-content !important;
          max-height: fit-content !important;
          min-height: 0 !important;
          gap: 0 !important;
          overflow: hidden !important;
        }
        
        .mobile-player-wrapper .player.is-spotify .spotify-view {
          gap: 0 !important;
          flex: none !important;
          height: auto !important;
        }
        
        .mobile-player-wrapper .player.is-spotify .spotify-scroll-wrap {
          padding: 0 !important;
          margin: 0 !important;
          flex: none !important;
          overflow: hidden !important;
        }
        
        .mobile-player-wrapper .player.is-spotify .spotify-action-row {
          display: none !important;
          height: 0 !important;
          overflow: hidden !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        .mobile-player-wrapper .player.is-spotify iframe {
          min-width: 0 !important;
          width: 100% !important;
          display: block !important;
          pointer-events: auto !important;
          position: relative !important;
          z-index: 10 !important;
        }
        
        .mobile-player-wrapper .player.is-spotify .mode-tabs {
          display: none !important;
          height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }

        .mobile-player-wrapper .show-on-mobile { display: flex !important; }
        .mobile-player-wrapper .hide-on-mobile { display: none !important; }

        .mobile-player-wrapper .player.is-local .mode-tabs, 
        .mobile-player-wrapper .player.is-local .progress-wrap, 
        .mobile-player-wrapper .player.is-local .secondary-controls, 
        .mobile-player-wrapper .player.is-local .volume-row, 
        .mobile-player-wrapper .player.is-local .track-time {
          display: none !important;
        }

        .mobile-player-wrapper .player.is-local .track-info {
          flex: 1 !important;
          min-width: 0 !important;
          margin: 0 !important;
          display: flex !important;
          align-items: center !important;
        }
        
        .mobile-player-wrapper .player.is-local .track-name-wrap {
          font-size: 0.85rem !important;
        }

        .mobile-player-wrapper .player.is-local .main-controls {
          flex-shrink: 0 !important;
          margin: 0 !important;
          gap: 8px !important;
        }

        .mobile-player-wrapper .player.is-local .action-row {
          flex-shrink: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          border: none !important;
        }
        
        .mobile-player-wrapper .player.is-local .action-top-row {
          gap: 6px !important;
        }
        
        .mobile-player-wrapper .player.is-local .action-top-row .pill-btn {
          padding: 0 !important;
          border-radius: 50% !important;
          width: 32px !important;
          height: 32px !important;
          justify-content: center !important;
          font-size: 0 !important;
        }
        
        .mobile-player-wrapper .player.is-local .action-top-row .pill-btn svg {
          margin: 0 !important;
          width: 14px !important;
          height: 14px !important;
        }

        /* ── Mobile portal popups (rendered via Portal, outside .mobile-player-wrapper) ── */
        @media (max-width: 768px) {
          .player-portal-popup {
            top: auto !important;
            bottom: calc(160px + env(safe-area-inset-bottom, 0px)) !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: calc(100% - 32px) !important;
            max-width: 420px !important;
            box-shadow: 0 10px 48px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.1);
          }
          .player-popup-tail {
            display: none !important;
          }
          .mobile-menu-popup {
            width: max-content !important;
            min-width: 200px !important;
            bottom: calc(160px + env(safe-area-inset-bottom, 0px)) !important;
            left: auto !important;
            right: 16px !important;
            top: auto !important;
            transform: none !important;
            padding: 12px !important;
          }
          .mobile-menu-popup .queue-item {
            justify-content: flex-start !important;
            gap: 12px !important;
            padding: 12px 16px !important;
          }
        }

      `}</style>
    </div>
  );
}
