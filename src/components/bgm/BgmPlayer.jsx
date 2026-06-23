import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function BgmPlayer() {
  const { theme } = useTheme();
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!audioRef.current) return;
    // For productive theme, the file is focus.mp3
    const filename = theme === 'productive' ? 'focus' : (theme === 'rainy' ? 'rain' : theme);
    const src = `/bgm/${filename}.mp3`;
    
    // Only update src if it changed
    if (!audioRef.current.src.endsWith(src)) {
      audioRef.current.src = src;
      if (!isMuted) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [theme, isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
        window.dispatchEvent(new Event('bgm-play'));
      }
    }
  }, [isMuted]);

  useEffect(() => {
    const handleMusicPlay = () => setIsMuted(true);
    window.addEventListener('music-play', handleMusicPlay);
    return () => window.removeEventListener('music-play', handleMusicPlay);
  }, []);

  return (
    <div className="bgm-player-wrapper">
      <button className={`bgm-toggle-btn ${!isMuted ? 'active' : ''}`} onClick={() => setIsMuted(!isMuted)} title="Toggle Ambient BGM">
        {!isMuted ? <Volume2 size={18} /> : <VolumeX size={18} />}
        <span className="bgm-label">Ambience</span>
      </button>
      <audio ref={audioRef} loop />

      <style>{`
        .bgm-player-wrapper {
          pointer-events: auto;
        }
        .bgm-toggle-btn {
          display: flex;
          align-items: center;
          gap: 0;
          padding: 0.5rem;
          background: transparent;
          border: none;
          border-radius: 99px;
          color: var(--text-muted);
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .bgm-toggle-btn:hover {
          color: var(--text-color);
          background: rgba(255,255,255,0.08);
        }
        .bgm-toggle-btn.active {
          color: var(--primary);
          background: rgba(255,255,255,0.1);
        }
        .bgm-toggle-btn.active, .bgm-toggle-btn:hover {
          gap: 0.5rem;
          padding-left: 1rem;
          padding-right: 1rem;
        }
        .bgm-label {
          max-width: 0;
          opacity: 0;
          overflow: hidden;
          white-space: nowrap;
          transition: max-width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
        }
        .bgm-toggle-btn.active .bgm-label, .bgm-toggle-btn:hover .bgm-label {
          max-width: 80px;
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
