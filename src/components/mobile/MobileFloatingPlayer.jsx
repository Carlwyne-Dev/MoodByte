import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Music2, Play, Pause, SkipForward, SkipBack } from 'lucide-react';

const PILL_H = 46;
const PEEK_H = 14; // px of top edge visible when hidden

export default function MobileFloatingPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackName, setTrackName] = useState('No track loaded');
  const [isSpotify, setIsSpotify] = useState(false);
  const [pillVisible, setPillVisible] = useState(true);
  const hideTimer = useRef(null);

  /* ── sync with the single Player in MobileLayout ── */
  useEffect(() => {
    const handleState = (e) => {
      setIsPlaying(e.detail.isPlaying ?? false);
      setTrackName(e.detail.currentTrack || 'No track loaded');
      setIsSpotify(!!e.detail.isSpotify);
    };
    window.addEventListener('zen-player-state', handleState);
    window.dispatchEvent(new CustomEvent('zen-player-request-state'));
    return () => window.removeEventListener('zen-player-state', handleState);
  }, []);

  /* ── auto-hide ── */
  const startHideTimer = useCallback(() => {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setPillVisible(false), 3000);
  }, []);

  const showPill = useCallback(() => {
    setPillVisible(true);
    startHideTimer();
  }, [startHideTimer]);

  useEffect(() => {
    startHideTimer();
    return () => clearTimeout(hideTimer.current);
  }, [startHideTimer]);

  const sendCmd = (action, e) => {
    e?.stopPropagation();
    window.dispatchEvent(new CustomEvent('zen-player-command', { detail: { action } }));
    showPill();
  };

  const accentColor = isSpotify ? '#1DB954' : '#a78bfa';
  // Slide down leaving only top PEEK_H visible
  const translateY = pillVisible ? 0 : PILL_H - PEEK_H;

  return (
    <div
      // tapping anywhere on the pill (incl. the peeking edge) shows it
      onClick={showPill}
      onPointerDown={(e) => { e.stopPropagation(); showPill(); }}
      style={{
        position: 'fixed',
        bottom: `calc(8px + env(safe-area-inset-bottom, 0px))`,
        left: '50%',
        transform: `translateX(-50%) translateY(${translateY}px)`,
        transition: 'transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 10500,
        width: 'min(92vw, 340px)',
        height: PILL_H,
        overflow: 'hidden',
        willChange: 'transform',
        cursor: 'default',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 8px 0 14px',
        height: '100%',
        borderRadius: 99,
        background: 'rgba(10,12,28,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px ${accentColor}30`,
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        boxSizing: 'border-box',
      }}>
        <span style={{
          flex: 1,
          fontFamily: "'Outfit', sans-serif",
          fontSize: '0.83rem',
          fontWeight: 500,
          color: '#e2e8f0',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          minWidth: 0,
        }}>
          {trackName}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          <button
            onClick={(e) => sendCmd('prev', e)}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, borderRadius: '50%',
              WebkitTapHighlightColor: 'transparent', flexShrink: 0,
              touchAction: 'manipulation',
            }}
          >
            <SkipBack size={14} />
          </button>
          <button
            onClick={(e) => sendCmd(isPlaying ? 'pause' : 'play', e)}
            style={{
              background: accentColor, border: 'none', borderRadius: '50%',
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent', flexShrink: 0,
              touchAction: 'manipulation',
            }}
          >
            {isPlaying
              ? <Pause size={14} fill="white" />
              : <Play  size={14} fill="white" style={{ marginLeft: 1 }} />
            }
          </button>
          <button
            onClick={(e) => sendCmd('next', e)}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, borderRadius: '50%',
              WebkitTapHighlightColor: 'transparent', flexShrink: 0,
              touchAction: 'manipulation',
            }}
          >
            <SkipForward size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
