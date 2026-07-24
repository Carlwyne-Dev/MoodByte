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
          MoodByte started as a random thought in 2025 — what if a sticky note board had themes, a Pomodoro timer, and a music player?
        </p>
        <p className="about-modal-text">
          It slowly grew into something more: a cozy digital space for your thoughts, whether it's schoolwork or personal stuff. No productivity pressure, just a place to think, focus, and breathe.
        </p>
        <p className="about-modal-text">
          This is a complete rebuild of the original MoodByte. I shelved it for a while because I hit the limits of what I knew at the time. Instead of forcing it, I kept learning.
        </p>
        <p className="about-modal-text">
          Now it's back — rebuilt from the ground up. The original MoodByte was built by a student who didn't know enough yet. This version was built by the same person, just a little older and a lot more experienced, still driven by a love for pixel art, retro aesthetics, and creating a workspace I'd actually enjoy using every day.
        </p>
        <p className="about-modal-footer">Made with <span style={{ color: '#ef4444', animation: 'pulse 2s ease-in-out infinite' }}>❤</span>. Hope y'all like it.</p>
      </div>
    </div>,
    document.body
  );
}
