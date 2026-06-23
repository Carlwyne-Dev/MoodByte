import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Music2, Info } from 'lucide-react';

export default function ZenMiniPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackName, setTrackName] = useState('No track selected');
  const [isSpotify, setIsSpotify] = useState(false);

  useEffect(() => {
    const handleState = (e) => {
      setIsPlaying(e.detail.isPlaying);
      setTrackName(e.detail.currentTrack || 'No track selected');
      setIsSpotify(e.detail.isSpotify);
    };
    window.addEventListener('zen-player-state', handleState);
    
    // Request initial state
    window.dispatchEvent(new CustomEvent('zen-player-request-state'));

    return () => window.removeEventListener('zen-player-state', handleState);
  }, []);

  const sendCommand = (action) => {
    window.dispatchEvent(new CustomEvent('zen-player-command', { detail: { action } }));
  };

  return (
    <div className={`zen-mini-player ${isSpotify ? 'spotify-mode' : ''}`}>
      <div className="zmp-header">
        <Music2 size={14} className="zmp-icon" style={{ color: isSpotify ? '#1DB954' : '#38bdf8' }} />
        <div className="zmp-track">
          <span style={{ color: isSpotify ? '#1DB954' : 'inherit' }}>
            {isSpotify ? 'Listening on Spotify' : trackName}
          </span>
        </div>
        
        <div className="zmp-controls">
          {!isSpotify && (
            <>
              <button className="zmp-btn" onClick={() => sendCommand('prev')}><SkipBack size={14} /></button>
              <button className="zmp-btn play" onClick={() => sendCommand(isPlaying ? 'pause' : 'play')}>
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
              </button>
              <button className="zmp-btn" onClick={() => sendCommand('next')}><SkipForward size={14} /></button>
            </>
          )}
          <div className="info-wrapper">
            <Info size={14} className="info-icon" />
            <div className="info-tooltip">
              {isSpotify 
                ? "Spotify is playing. Open main Music tab to change tracks or playlists." 
                : "Open main Music tab to add songs, load Spotify, or change volume."}
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .zen-mini-player {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          color: #fff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          width: 280px;
          height: 44px;
        }

        .zen-mini-player.spotify-mode {
          width: 240px;
        }

        .zmp-header {
          display: flex;
          align-items: center;
          height: 44px;
          padding: 0 16px;
          gap: 12px;
        }

        .zmp-icon {
          color: #38bdf8;
          flex-shrink: 0;
        }

        .zmp-track {
          flex: 1;
          min-width: 0;
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .zmp-controls {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .zmp-btn {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          transition: all 0.2s;
        }
        .zmp-btn:hover {
          color: #fff;
          background: rgba(255,255,255,0.1);
        }

        .zmp-btn.play {
          color: #fff;
        }

        .zmp-div {
          display: none;
        }

        .zmp-body {
          padding: 12px 16px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }

        .zmp-hint {
          font-size: 0.8rem;
          color: #94a3b8;
        }
        .zmp-btn.play:hover {
          transform: scale(1.1);
          color: #fff;
        }

        .info-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          margin-left: 8px;
          color: rgba(255,255,255,0.4);
          cursor: help;
          transition: color 0.2s;
        }
        .info-wrapper:hover {
          color: #38bdf8;
        }
        .info-tooltip {
          position: absolute;
          top: 120%;
          right: -10px;
          width: 200px;
          background: #1e293b;
          border: 1px solid rgba(255,255,255,0.1);
          padding: 10px;
          border-radius: 8px;
          font-size: 0.75rem;
          line-height: 1.4;
          color: #e2e8f0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s;
          pointer-events: none;
          text-align: center;
        }
        .info-tooltip::after {
          content: '';
          position: absolute;
          bottom: 100%;
          right: 14px;
          border-width: 6px;
          border-style: solid;
          border-color: transparent transparent #1e293b transparent;
        }
        .info-wrapper:hover .info-tooltip {
          opacity: 1;
          visibility: visible;
          top: 150%;
        }
      `}</style>
    </div>
  );
}
