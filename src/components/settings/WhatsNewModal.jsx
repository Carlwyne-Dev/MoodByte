import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Radio, Clock, Cloud, LayoutList, ChevronRight, ChevronLeft } from 'lucide-react';

const UPDATES = [
  {
    icon: <Radio size={36} className="text-pink-400" />,
    title: "FM Radio / Live BGM",
    desc: "Tune in to curated lo-fi, jazz, and chillhop internet radio stations directly inside the app. One tap and the music never stops."
  },
  {
    icon: <Clock size={36} className="text-blue-400" />,
    title: "Live Animated Clock",
    desc: "A sleek real-time clock now lives on the board with smooth digit animations and a hover-reveal AM/PM indicator."
  },
  {
    icon: <Cloud size={36} className="text-purple-400" />,
    title: "Cross-Platform Cloud Sync",
    desc: "Sign in with Google to sync your tasks, stats, and settings across all your devices — PC, tablet, and mobile — instantly."
  },
  {
    icon: <LayoutList size={36} className="text-emerald-400" />,
    title: "Live Sync Notes",
    desc: "Send tasks or calendar notes straight to the Sticky Note Board. Edits on the note sync back to the source in real time."
  }
];

export default function WhatsNewModal({ onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleNext = () => {
    if (currentIndex < UPDATES.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const currentUpdate = UPDATES[currentIndex];

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100000 }}>
      <button className="floating-close" onClick={onClose}>
        <X size={24} />
      </button>

      <div className="floating-container" onClick={e => e.stopPropagation()}>
        
        <div className="floating-header">
          <Sparkles size={24} className="floating-header-icon" />
          <h1 className="floating-title">What's New in v1.2.0</h1>
        </div>

        <div className="card-stack-wrap">
          {/* Stacked background cards for depth */}
          <div className="stack-card-bg stack-card-bg-2" />
          <div className="stack-card-bg stack-card-bg-1" />

          {/* Active front card */}
          <div className="glass-card" key={currentIndex}>
            <div className="glass-card-icon-wrap">
              {currentUpdate.icon}
            </div>
            <h2 className="glass-card-title">{currentUpdate.title}</h2>
            <p className="glass-card-desc">{currentUpdate.desc}</p>
          </div>
        </div>

        <div className="floating-controls">
          <button 
            className={`float-btn-icon ${currentIndex === 0 ? 'disabled' : ''}`} 
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <ChevronLeft size={24} />
          </button>

          <div className="float-dots">
            {UPDATES.map((_, i) => (
              <div key={i} className={`float-dot ${i === currentIndex ? 'active' : ''}`} />
            ))}
          </div>

          <button className="float-btn-next" onClick={handleNext}>
            {currentIndex === UPDATES.length - 1 ? "Let's Go!" : "Next"}
            {currentIndex < UPDATES.length - 1 && <ChevronRight size={20} style={{ marginLeft: '4px' }} />}
          </button>
        </div>

      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(10, 15, 30, 0.6);
          backdrop-filter: blur(16px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100000;
          animation: fadeIn 0.3s ease-out forwards;
        }

        .floating-container {
          position: relative;
          width: 100%;
          max-width: 500px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .floating-close {
          position: absolute;
          top: 32px;
          right: 32px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.2s;
          padding: 12px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }
        
        .floating-close:hover {
          color: white;
          background: rgba(255, 255, 255, 0.15);
          transform: scale(1.1) rotate(90deg);
        }

        .floating-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 40px;
          animation: popDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        .floating-header-icon {
          color: #a78bfa;
          animation: pulseIcon 2s infinite ease-in-out;
        }

        @keyframes pulseIcon {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 1; text-shadow: 0 0 10px #a78bfa; }
        }

        .floating-title {
          font-size: 1.6rem;
          font-weight: 800;
          color: #fff;
          margin: 0;
          text-shadow: 0 4px 20px rgba(0,0,0,0.5);
          letter-spacing: 0.02em;
        }

        /* ─── STACKED CARDS WRAPPER ─── */
        .card-stack-wrap {
          position: relative;
          width: 100%;
          height: 300px;
          perspective: 1000px;
          margin-bottom: 20px;
        }

        .stack-card-bg {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.015);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 32px;
          pointer-events: none;
        }

        .stack-card-bg-1 {
          transform: translateY(-16px) scale(0.93);
          z-index: 1;
        }
        
        .stack-card-bg-2 {
          transform: translateY(-32px) scale(0.86);
          z-index: 0;
          opacity: 0.5;
        }

        .glass-card {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 36px 28px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.2);
          z-index: 2;
          animation: slideInCard 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transform-origin: bottom center;
        }

        @keyframes slideInCard {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes popDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .glass-card-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 72px;
          height: 72px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 24px;
          box-shadow: 0 15px 35px -10px rgba(0,0,0,0.4);
        }

        .text-pink-400 { color: #f472b6; }
        .text-blue-400 { color: #60a5fa; }
        .text-purple-400 { color: #c084fc; }
        .text-emerald-400 { color: #34d399; }

        .glass-card-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #f8fafc;
          margin: 0 0 16px 0;
          text-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }

        .glass-card-desc {
          font-size: 1.05rem;
          color: #cbd5e1;
          margin: 0;
          line-height: 1.6;
        }

        /* ─── FIXED CONTROLS ─── */
        .floating-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          height: 60px; /* Fixed height */
          margin-top: 10px;
          animation: popUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards 0.1s;
          opacity: 0;
        }

        @keyframes popUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .float-dots {
          display: flex;
          gap: 8px;
        }

        .float-dot {
          width: 8px;
          height: 8px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .float-dot.active {
          width: 24px;
          background: #8b5cf6;
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
        }

        .float-btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .float-btn-icon:hover:not(.disabled) {
          background: rgba(255, 255, 255, 0.15);
          transform: translateX(-4px);
        }

        .float-btn-icon.disabled {
          opacity: 0.3;
          cursor: default;
        }

        .float-btn-next {
          display: flex;
          align-items: center;
          padding: 12px 28px;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          background: linear-gradient(135deg, #8b5cf6, #d946ef);
          color: white;
          border: none;
          border-radius: 24px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 10px 20px -5px rgba(139, 92, 246, 0.5);
        }
        
        .float-btn-next:hover {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 15px 25px -5px rgba(139, 92, 246, 0.6);
        }
      `}</style>
    </div>,
    document.body
  );
}
