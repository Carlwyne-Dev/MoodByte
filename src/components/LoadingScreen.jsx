import React, { useEffect, useState } from 'react';

const BG_URLS = [
  '/bg/night1.gif', '/bg/night2.gif', '/bg/night3.gif',
  '/bg/rain1.gif',  '/bg/rain2.gif',  '/bg/rain3.gif',
  '/bg/chill1.gif', '/bg/chill2.gif', '/bg/chill3.gif',
  '/bg/focus1.gif', '/bg/focus2.gif', '/bg/focus3.gif',
];

export default function LoadingScreen({ onComplete, bgImage }) {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    let loaded = 0;
    const total = BG_URLS.length;
    let minTimeDone = false;
    let imagesDone = false;

    const tryComplete = () => {
      if (minTimeDone && imagesDone) {
        setIsFading(true);
        setTimeout(() => {
          window.dispatchEvent(new Event('app-ready'));
          onComplete();
        }, 800);
      }
    };

    // Only block the loading screen on the currently active background!
    const activeImg = new Image();
    activeImg.onload = activeImg.onerror = () => {
      imagesDone = true;
      tryComplete();
    };
    activeImg.src = bgImage || BG_URLS[0];

    // Preload the rest silently in the background (does not block tryComplete)
    BG_URLS.forEach(url => {
      if (url !== bgImage) {
        const img = new Image();
        img.src = url;
      }
    });

    // Minimum 3s display time for the retro vibe
    const timer = setTimeout(() => {
      minTimeDone = true;
      tryComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`loading-screen ${isFading ? 'fade-out' : ''}`}>
      <div className="retro-container">
        
        <div className="title-container">
          <h1 className="retro-title">MOODBYTE</h1>
          <div className="eraser-block">
            <div className="pacman"></div>
          </div>
        </div>
        
        <p className="loading-text">LOADING...</p>
      </div>

      <style>{`
        .loading-screen {
          position: fixed;
          inset: 0;
          background: #0b1120;
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.8s ease-in-out, visibility 0.8s;
        }

        .loading-screen.fade-out {
          opacity: 0;
          visibility: hidden;
        }

        .retro-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4rem;
        }

        .title-container {
          position: relative;
          display: inline-block;
          padding: 10px 40px; /* Padding allows pacman to start before and end after text */
        }

        .retro-title {
          font-family: 'Press Start 2P', monospace;
          color: #00d4ff;
          font-size: 3.5rem;
          margin: 0;
          text-shadow: 4px 4px 0 #8a2be2;
          letter-spacing: 4px;
        }

        .eraser-block {
          position: absolute;
          top: -20px;
          bottom: -20px;
          left: 0;
          width: 0%;
          background: #0b1120; /* perfectly matches background */
          z-index: 10;
          animation: eat-text 2.2s linear forwards;
          animation-delay: 0.3s;
        }

        .pacman {
          position: absolute;
          right: -30px; /* Centers Pacman perfectly on the moving edge of the eraser */
          top: 50%;
          transform: translateY(-50%);
          width: 60px;
          height: 60px;
          background: #ffcc00;
          border-radius: 50%;
          z-index: 10;
          animation: chomp 0.18s linear infinite alternate;
        }

        /* Pacman's Eye */
        .pacman::after {
          content: "";
          position: absolute;
          top: 12px;
          left: 32px;
          width: 8px;
          height: 8px;
          background: #0b1120;
          border-radius: 50%;
        }

        .loading-text {
          font-family: 'Press Start 2P', monospace;
          color: #ffb8ff;
          font-size: 1rem;
          letter-spacing: 2px;
          animation: blink 1s steps(2, start) infinite;
          text-shadow: 0 0 10px rgba(255, 184, 255, 0.5);
        }

        @keyframes eat-text {
          0% { width: 0%; }
          100% { width: 100%; }
        }

        @keyframes chomp {
          0% { clip-path: polygon(100% 75%, 100% 100%, 0 100%, 0 0, 100% 0, 100% 25%, 50% 50%); }
          100% { clip-path: polygon(100% 50%, 100% 100%, 0 100%, 0 0, 100% 0, 100% 50%, 50% 50%); }
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .retro-title {
            font-size: 2rem;
          }
          .title-container {
            padding: 10px 30px;
          }
          .pacman {
            width: 40px;
            height: 40px;
            border-width: 20px;
            right: -20px;
          }
        }
      `}</style>
    </div>
  );
}
