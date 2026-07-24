import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Radio, Play, Pause, Activity } from 'lucide-react';
import { RADIO_CHANNELS } from '../../config/radioChannels';

export default function LiveRadio() {
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentChannelId, setCurrentChannelId] = useState(RADIO_CHANNELS[0].id);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const tuningAudioRefs = useRef([]);
  const wasPlayingRef = useRef(false);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      
      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    } else if (window.YT && window.YT.Player) {
      initPlayer();
    }

    function initPlayer() {
      const pId = 'youtube-radio-player-' + Math.random().toString(36).substr(2, 9);
      const div = document.createElement('div');
      div.id = pId;
      containerRef.current.appendChild(div);

      const newPlayer = new window.YT.Player(pId, {
        height: '1',
        width: '1',
        videoId: RADIO_CHANNELS[0].videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1
        },
        events: {
          onReady: (event) => {
            setPlayer(event.target);
            setIsReady(true);
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              tuningAudioRefs.current.forEach(audio => {
                if (audio) {
                  audio.pause();
                  audio.currentTime = 0;
                }
              });
            } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
            }
          }
        }
      });
    }

    return () => {
      if (player && player.destroy) {
        player.destroy();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && buttonRef.current && !buttonRef.current.contains(e.target)) {
        closeDropdown();
      }
    };
    
    const updatePosition = () => {
      if (showDropdown && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPopupPos({
          top: rect.bottom + 12,
          left: rect.left
        });
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', updatePosition);
      updatePosition();
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showDropdown, isPlaying]);

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!player || !isReady) return;
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const switchChannel = (e, id) => {
    e.stopPropagation();
    const channel = RADIO_CHANNELS.find(c => c.id === id);
    if (channel && player && isReady) {
      setCurrentChannelId(id);
      player.loadVideoById(channel.videoId);
    }
  };

  const currentChannel = RADIO_CHANNELS.find(c => c.id === currentChannelId) || RADIO_CHANNELS[0];
  const currentIndex = RADIO_CHANNELS.findIndex(c => c.id === currentChannelId);

  const handleKnobStart = () => {
    wasPlayingRef.current = isPlaying;
  };

  const handleKnobChange = (e) => {
    const newIndex = parseInt(e.target.value, 10);
    const channel = RADIO_CHANNELS[newIndex];
    if (channel && channel.id !== currentChannelId) {
      setCurrentChannelId(channel.id);
      if (player && isReady) {
        player.pauseVideo();
        const isPlayingAny = tuningAudioRefs.current.some(audio => audio && !audio.paused);
        if (!isPlayingAny) {
          const randomAudio = tuningAudioRefs.current[Math.floor(Math.random() * tuningAudioRefs.current.length)];
          if (randomAudio) {
            randomAudio.volume = 0.5;
            randomAudio.play().catch(e => console.log('Tuning audio play failed:', e));
          }
        }
      }
    }
  };

  const handleKnobRelease = (e) => {
    const newIndex = parseInt(e.target.value, 10);
    const channel = RADIO_CHANNELS[newIndex];
    if (channel && player && isReady) {
      setIsPlaying(true); 
      player.loadVideoById(channel.videoId);
    }
    
    // We shouldn't need to manually pause here since autoplay is forced and onStateChange will pause it.
    // However, as a fallback, if we did want to pause manually, we iterate:
    tuningAudioRefs.current.forEach(audio => {
       // if we manually pause here, the static cuts out before the youtube video buffers.
       // so it's better to let onStateChange handle pausing it when PLAYING starts.
    });
  };

  const closeDropdown = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowDropdown(false);
      setIsClosing(false);
    }, 200); // 0.2s matches our CSS animation duration
  };

  const toggleDropdown = () => {
    if (showDropdown) {
      closeDropdown();
    } else {
      if (!isClosing) setShowDropdown(true);
    }
  };

  return (
    <div className="live-radio-wrapper">
      <div ref={containerRef} style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}></div>
      <audio ref={el => tuningAudioRefs.current[0] = el} src="/tuning.mp3" loop />
      <audio ref={el => tuningAudioRefs.current[1] = el} src="/tuning2.mp3" loop />
      
      {/* Main toggle button matching BgmPlayer style */}
      <button 
        ref={buttonRef}
        className={`bgm-toggle-btn ${isPlaying ? 'active' : ''}`} 
        onClick={toggleDropdown} 
        title="Live Radio"
      >
        <Radio size={18} />
        <span className="bgm-label">FM Radio</span>
      </button>

      {/* Tuner Interface */}
      {(showDropdown || isClosing) && createPortal(
        <div 
          className={`tuner-popup ${isClosing ? 'pop-out' : 'pop-in'} ${isPlaying ? 'tuner-playing-glow' : ''}`} 
          ref={dropdownRef}
          style={{ top: popupPos.top, left: popupPos.left, position: 'fixed' }}
        >
          
          <div className="tuner-header">
            <span className="tuner-frequency digital-readout">
              FM {(88 + (currentIndex * (20 / Math.max(1, RADIO_CHANNELS.length - 1)))).toFixed(1)}
            </span>
            <div className="tuner-title-container">
              <div className="title-visualizer-bg">
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`title-vis-bar ${isPlaying ? 'playing' : ''}`} 
                    style={{ animationDelay: `${Math.random() * 0.5}s` }} 
                  />
                ))}
              </div>
              <span className="tuner-title">{currentChannel.label}</span>
            </div>
          </div>

          <div className="tuner-dial-container">
            <div className="tuner-scale">
              {[...Array(31)].map((_, i) => (
                <div key={i} className="tuner-tick-wrapper">
                  {i % 6 === 0 && (
                    <span className="tuner-tick-label">{88 + (i / 6) * 4}</span>
                  )}
                  <div className={`tuner-tick ${i % 6 === 0 ? 'major' : ''}`} />
                </div>
              ))}
            </div>
            <div 
              className="tuner-needle" 
              style={{ left: `${(currentIndex / Math.max(1, RADIO_CHANNELS.length - 1)) * 95 + 2.5}%` }}
            />
          </div>

          <div className="tuner-controls">
            <button className={`tuner-play-btn ${isPlaying ? 'playing' : ''}`} onClick={togglePlay}>
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>
            
            <div className="tuner-slider-wrapper">
              <input 
                type="range" 
                min="0" 
                max={RADIO_CHANNELS.length - 1} 
                step="1" 
                value={currentIndex}
                onMouseDown={handleKnobStart}
                onTouchStart={handleKnobStart}
                onChange={handleKnobChange}
                onMouseUp={handleKnobRelease}
                onTouchEnd={handleKnobRelease}
                className="tuner-knob-slider"
                title="Drag to tune"
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .live-radio-wrapper {
          position: relative;
          pointer-events: auto;
        }
        
        .tuner-popup {
          width: 280px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          z-index: 9999;
          border-radius: 16px;
          background: var(--sidebar-bg);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
          transition: box-shadow 0.5s ease;
        }

        .tuner-playing-glow {
          box-shadow: 0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(168, 85, 247, 0.05);
        }

        .tuner-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          background: rgba(0,0,0,0.15);
          padding: 14px 10px;
          border-radius: 8px;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.2);
        }

        .tuner-frequency {
          font-size: 26px;
          font-weight: 600;
          color: var(--primary);
          letter-spacing: 1.5px;
          font-family: 'DM Mono', monospace;
          opacity: 0.95;
          text-shadow: 0 0 10px rgba(168, 85, 247, 0.2);
        }

        .tuner-title-container {
          position: relative;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          padding-top: 6px;
          padding-bottom: 2px;
          overflow: hidden;
        }

        .title-visualizer-bg {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 4px;
          z-index: 0;
          pointer-events: none;
          filter: blur(1px);
        }

        .title-vis-bar {
          flex: 1;
          max-width: 12px;
          background: var(--primary);
          border-radius: 2px;
          height: 2px;
          opacity: 0.05;
          transition: height 0.2s ease, opacity 0.2s ease;
        }

        .title-vis-bar.playing {
          opacity: 0.15;
          animation: ghostEq 1s ease-in-out infinite alternate;
        }

        @keyframes ghostEq {
          0% { height: 2px; }
          50% { height: 100%; }
          100% { height: 30%; }
        }

        .tuner-title {
          position: relative;
          z-index: 1;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-color);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .tuner-dial-container {
          position: relative;
          height: 60px;
          background: rgba(0, 0, 0, 0.35);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: inset 0 6px 16px rgba(0,0,0,0.6);
          overflow: hidden;
          margin-bottom: 8px;
        }
        
        .tuner-dial-container::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 45%;
          background: linear-gradient(to bottom, rgba(255,255,255,0.06), transparent);
          pointer-events: none;
        }

        .tuner-scale {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          height: 100%;
          padding: 0 5% 10px 5%;
        }

        .tuner-tick-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          height: 100%;
          justify-content: flex-end;
        }

        .tuner-tick {
          width: 2px;
          height: 10px;
          background: rgba(255,255,255,0.15);
          border-radius: 2px;
        }
        
        .tuner-tick.major {
          height: 18px;
          background: rgba(255,255,255,0.4);
        }
        
        .tuner-tick-label {
          position: absolute;
          top: 10px;
          font-size: 10px;
          font-weight: 600;
          color: rgba(255,255,255,0.3);
          font-family: 'DM Mono', monospace;
          letter-spacing: 0.5px;
        }

        .tuner-needle {
          position: absolute;
          bottom: 0;
          width: 2px;
          height: 100%;
          background: #ef4444;
          box-shadow: 0 0 4px #ef4444;
          transition: left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: 2;
        }

        .tuner-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .tuner-play-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          color: var(--text-color);
          border: 1px solid rgba(255,255,255,0.1);
          cursor: pointer;
          transition: all 0.2s;
        }
        .tuner-play-btn:hover {
          background: rgba(255,255,255,0.1);
          transform: scale(1.05);
        }
        .tuner-play-btn.playing {
          color: var(--primary);
          border-color: var(--primary);
          background: rgba(168, 85, 247, 0.1);
        }

        .tuner-slider-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          padding-left: 8px;
        }

        .tuner-knob-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          background: rgba(0,0,0,0.3);
          border-radius: 4px;
          outline: none;
          border: 1px solid rgba(255,255,255,0.05);
          cursor: grab;
        }
        
        .tuner-knob-slider:active {
          cursor: grabbing;
        }

        .tuner-knob-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #444;
          border: 2px solid var(--primary);
          box-shadow: inset 0 2px 4px rgba(255,255,255,0.2), 0 0 10px rgba(168,85,247,0.4);
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }

        .tuner-knob-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #444;
          border: 2px solid var(--primary);
          box-shadow: inset 0 2px 4px rgba(255,255,255,0.2), 0 0 10px rgba(168,85,247,0.4);
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }

        .tuner-knob-slider::-webkit-slider-thumb:hover {
          background: #555;
          transform: scale(1.1);
        }
        
        .tuner-knob-slider:active::-webkit-slider-thumb {
          background: var(--primary);
          box-shadow: inset 0 2px 4px rgba(255,255,255,0.4), 0 0 15px rgba(168,85,247,0.8);
        }

        .pop-in {
          animation: popIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .pop-out {
          animation: popOut 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.95) translateY(-10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes popOut {
          0% { opacity: 1; transform: scale(1) translateY(0); }
          100% { opacity: 0; transform: scale(0.95) translateY(-10px); }
        }

        .anim-pulse {
          animation: iconPulse 1.5s infinite ease-in-out;
        }
        @keyframes iconPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
