import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Users } from 'lucide-react';
import { useCommunityWall } from './useCommunityWall';
import { useNotePlacement } from './useNotePlacement';
import { useAnonId } from '../../hooks/useAnonId';
import { isTooLong, containsBlockedWord, MAX_NOTE_LENGTH } from '../../utils/wallModeration';
import { COLORS } from '../notes/StickyNoteBoard';

// Deterministic small tilt per note (not re-randomized on every render) so
// pinned notes feel hand-placed rather than perfectly aligned.
function tiltFor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return (Math.abs(hash) % 7) - 3; // -3deg .. 3deg
}

export default function CommunityWallModal({ onClose }) {
  const { notes, status, postNote } = useCommunityWall();
  const anonId = useAnonId();
  const boardRef = useRef(null);
  const [text, setText] = useState('');
  const [color, setColor] = useState(COLORS[0].value);
  const [formError, setFormError] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  const handlePlace = async ({ text: placedText, color: placedColor, x, y }) => {
    const result = await postNote({ text: placedText, color: placedColor, x, y, anonId });
    if (result.error === 'rate_limited') {
      window.dispatchEvent(new CustomEvent('sync-toast', {
        detail: { message: 'You can pin again in a few minutes.', type: 'error' }
      }));
    } else if (result.error === 'blocked_word') {
      window.dispatchEvent(new CustomEvent('sync-toast', {
        detail: { message: "That note couldn't be posted.", type: 'error' }
      }));
    } else if (result.error) {
      window.dispatchEvent(new CustomEvent('sync-toast', {
        detail: { message: "Couldn't pin your note, try again.", type: 'error' }
      }));
    }
  };

  const { armedNote, cursorPos, arm } = useNotePlacement({ boardRef, onPlace: handlePlace });

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 200);
  };

  const handlePinIt = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (isTooLong(trimmed)) {
      setFormError(`Keep it under ${MAX_NOTE_LENGTH} characters.`);
      return;
    }
    if (containsBlockedWord(trimmed)) {
      setFormError("That note couldn't be posted.");
      return;
    }
    setFormError('');
    arm(trimmed, color);
    setText('');
  };

  return createPortal(
    <div className={`wall-page ${isClosing ? 'ui-modal-exit' : 'ui-modal-enter'}`}>
      <header className="wall-header">
        <button className="wall-exit-btn" onClick={handleClose} title="Exit Community Wall">
          <X size={18} /> <span className="wall-exit-text">Exit</span>
        </button>
        <div className="wall-header-title">
          <Users size={18} className="wall-header-icon" />
          <h1>Community Wall</h1>
        </div>
        <div className="wall-header-spacer" />
      </header>

      <div className="wall-board" ref={boardRef}>
        {status === 'loading' && <p className="wall-status-text">Loading the wall...</p>}
        {status === 'error' && <p className="wall-status-text">Couldn't load the wall. Try again later.</p>}
        {notes.map(note => (
          <div
            key={note.id}
            className="wall-note"
            style={{ left: `${note.x}%`, top: `${note.y}%`, background: note.color, '--tilt': `${tiltFor(note.id)}deg` }}
          >
            {note.text}
          </div>
        ))}
      </div>

      <div className="wall-compose">
        <input
          type="text"
          className="wall-compose-input"
          placeholder="Pin a short note for everyone..."
          value={text}
          maxLength={MAX_NOTE_LENGTH}
          onChange={e => { setText(e.target.value); setFormError(''); }}
          onKeyDown={e => e.key === 'Enter' && handlePinIt()}
        />
        <div className="wall-color-swatches">
          {COLORS.slice(0, 6).map(c => (
            <button
              key={c.value}
              className={`wall-swatch ${color === c.value ? 'active' : ''}`}
              style={{ background: c.value }}
              title={c.name}
              onClick={() => setColor(c.value)}
            />
          ))}
        </div>
        <button className="wall-pin-btn" onClick={handlePinIt} disabled={!text.trim() || !anonId}>
          Pin it
        </button>
        {formError && <p className="wall-form-error">{formError}</p>}
      </div>
      <p className="wall-hint">
        {armedNote
          ? 'Now tap anywhere on the board to place your note.'
          : 'Click "Pin it", then click anywhere on the board to place your note.'}
      </p>

      {armedNote && (
        <div
          className={`wall-armed-note ${cursorPos ? '' : 'wall-armed-note-fixed'}`}
          style={cursorPos ? { left: cursorPos.x, top: cursorPos.y, background: armedNote.color } : { background: armedNote.color }}
        >
          {armedNote.text}
        </div>
      )}

      <style>{`
        .wall-page {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: flex;
          flex-direction: column;
        }

        .wall-header {
          height: 60px;
          flex-shrink: 0;
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
          z-index: 10;
        }
        .wall-exit-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(239, 68, 68, 0.15);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          font-weight: 500;
          transition: all 0.2s;
        }
        .wall-exit-btn:hover {
          background: rgba(239, 68, 68, 0.25);
        }
        .wall-header-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .wall-header-title h1 {
          margin: 0;
          font-family: 'Outfit', sans-serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: #fff;
        }
        .wall-header-icon { color: #a855f7; }
        .wall-header-spacer { width: 84px; } /* balances the exit button so the title stays centered */

        /* The board itself: a warm, speckled corkboard texture, not a UI panel */
        .wall-board {
          position: relative;
          flex: 1;
          overflow: hidden;
          cursor: crosshair;
          background-color: #b9895a;
          background-image:
            radial-gradient(circle at 1px 1px, rgba(0,0,0,0.18) 1px, transparent 0),
            linear-gradient(135deg, rgba(255,255,255,0.06), transparent 40%),
            linear-gradient(315deg, rgba(0,0,0,0.12), transparent 40%);
          background-size: 9px 9px, 100% 100%, 100% 100%;
          box-shadow: inset 0 0 120px rgba(0,0,0,0.45);
        }
        .wall-status-text {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          color: rgba(255,255,255,0.75);
          background: rgba(0,0,0,0.35);
          padding: 8px 16px;
          border-radius: 10px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
        }

        .wall-note {
          position: absolute;
          transform: translate(-50%, -50%) rotate(var(--tilt, -2deg));
          max-width: 150px;
          padding: 16px 12px 12px;
          border-radius: 2px;
          font-family: 'Kalam', cursive, 'Outfit', sans-serif;
          font-size: 0.82rem;
          line-height: 1.3;
          color: #1e293b;
          box-shadow: 3px 5px 12px rgba(0,0,0,0.4);
          word-break: break-word;
          pointer-events: none;
        }
        .wall-note::before {
          content: '';
          position: absolute;
          top: -5px;
          left: 50%;
          transform: translateX(-50%);
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #ff8787, #c92a2a);
          box-shadow: 0 2px 3px rgba(0,0,0,0.5);
        }

        .wall-compose {
          position: fixed;
          left: 50%;
          bottom: 76px;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(15, 23, 42, 0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 12px 16px;
          box-shadow: 0 12px 30px rgba(0,0,0,0.45);
          z-index: 20;
          flex-wrap: wrap;
          max-width: 92vw;
        }
        .wall-compose-input {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 10px 14px;
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
          outline: none;
          width: 240px;
        }
        .wall-compose-input:focus { border-color: #8b5cf6; }
        .wall-color-swatches {
          display: flex; gap: 6px;
        }
        .wall-swatch {
          width: 22px; height: 22px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
        }
        .wall-swatch.active { border-color: #fff; }
        .wall-pin-btn {
          background: #8b5cf6;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 10px 18px;
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .wall-pin-btn:hover:not(:disabled) { background: #7c3aed; }
        .wall-pin-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .wall-form-error {
          flex-basis: 100%;
          margin: 0;
          color: #f87171;
          font-family: 'Outfit', sans-serif;
          font-size: 0.8rem;
        }
        .wall-hint {
          position: fixed;
          left: 50%;
          bottom: 26px;
          transform: translateX(-50%);
          margin: 0;
          color: rgba(255,255,255,0.6);
          background: rgba(0,0,0,0.35);
          padding: 4px 12px;
          border-radius: 8px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.75rem;
          text-align: center;
          z-index: 20;
        }

        .wall-armed-note {
          position: fixed;
          transform: translate(-50%, -50%) rotate(-2deg);
          max-width: 150px;
          padding: 16px 12px 12px;
          border-radius: 2px;
          font-family: 'Kalam', cursive, 'Outfit', sans-serif;
          font-size: 0.82rem;
          color: #1e293b;
          box-shadow: 0 10px 24px rgba(0,0,0,0.5);
          pointer-events: none;
          z-index: 10001;
        }

        /* Before any real pointer/touch movement is seen (e.g. right after
           tapping "Pin it" on a touchscreen, where there's no hover), show
           the armed note in an obvious fixed spot instead of at a stale or
           zeroed position. */
        .wall-armed-note-fixed {
          left: 50% !important;
          top: auto !important;
          bottom: 150px;
          transform: translateX(-50%) rotate(-2deg);
          animation: armedNoteBounce 1s ease-in-out infinite;
        }
        @keyframes armedNoteBounce {
          0%, 100% { transform: translateX(-50%) translateY(0) rotate(-2deg); }
          50% { transform: translateX(-50%) translateY(-8px) rotate(-2deg); }
        }

        @media (max-width: 768px) {
          .wall-exit-text { display: none; }
          .wall-header-spacer { width: 40px; }
          .wall-compose {
            bottom: calc(84px + env(safe-area-inset-bottom, 0px));
            width: 92vw;
          }
          .wall-compose-input { width: 100%; }
          .wall-hint { bottom: calc(56px + env(safe-area-inset-bottom, 0px)); }
          .wall-armed-note-fixed { bottom: calc(200px + env(safe-area-inset-bottom, 0px)); }
        }
      `}</style>
    </div>,
    document.body
  );
}
