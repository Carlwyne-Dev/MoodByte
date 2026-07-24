import React, { useState } from 'react';
import { createPortal } from 'react-dom';

export default function AboutModal({ onClose }) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 200);
  };

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div className={`about-overlay ${isClosing ? 'ui-overlay-exit' : 'ui-overlay-enter'}`} onClick={handleClose}>
      <div className={`about-modal ${isClosing ? 'ui-modal-exit' : 'ui-modal-enter'}`} onClick={e => e.stopPropagation()}>
        <h2 className="about-modal-title">About MoodByte</h2>
        <p className="about-modal-text">
          MoodByte started as a random thought in 2025 — what if a sticky note board had themes, a Pomodoro timer, and a music player? It grew into something more: a safe space for your thoughts, whether it's schoolwork or personal stuff. No hard productivity pressure, just a cozy home for whatever's on your mind.
        </p>
        <p className="about-modal-text">
          This is a full rebuild of the original MoodByte, shelved for a while because I hit the limits of what I knew at the time. Now, it's back and better than ever, built during late nights in a dorm room, driven by a love for pixel art and retro aesthetics.
        </p>
        <p className="about-modal-footer">Made with <span style={{ color: '#ef4444', animation: 'pulse 2s ease-in-out infinite' }}>❤</span>. Hope ya'll like it.</p>
        <button className="about-close-btn" onClick={handleClose}>Close</button>
      </div>
    </div>,
    document.body
  );
}
