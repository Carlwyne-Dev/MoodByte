import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Users } from 'lucide-react';
import { useCommunityWall } from './useCommunityWall';
import { useNotePlacement } from './useNotePlacement';
import { useAnonId } from '../../hooks/useAnonId';
import { isTooLong, containsBlockedWord, MAX_NOTE_LENGTH } from '../../utils/wallModeration';
import { COLORS } from '../notes/StickyNoteBoard';

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
    <div className={`wall-overlay ${isClosing ? 'ui-overlay-exit' : 'ui-overlay-enter'}`} onClick={handleClose}>
      <div className={`wall-modal ${isClosing ? 'ui-modal-exit' : 'ui-modal-enter'}`} onClick={e => e.stopPropagation()}>
        <div className="wall-header">
          <div className="wall-header-title">
            <Users size={20} className="wall-header-icon" />
            <h2>Community Wall</h2>
          </div>
          <button className="wall-close-btn" onClick={handleClose}><X size={20} /></button>
        </div>

        <div className="wall-board" ref={boardRef}>
          {status === 'loading' && <p className="wall-status-text">Loading the wall...</p>}
          {status === 'error' && <p className="wall-status-text">Couldn't load the wall. Try again later.</p>}
          {notes.map(note => (
            <div
              key={note.id}
              className="wall-note"
              style={{ left: `${note.x}%`, top: `${note.y}%`, background: note.color }}
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
        </div>
        {formError && <p className="wall-form-error">{formError}</p>}
        <p className="wall-hint">Click "Pin it", then click anywhere on the board to place your note.</p>
      </div>

      {armedNote && (
        <div
          className="wall-armed-note"
          style={{ left: cursorPos.x, top: cursorPos.y, background: armedNote.color }}
        >
          {armedNote.text}
        </div>
      )}

      <style>{`
        .wall-overlay {
          position: fixed; inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex; align-items: center; justify-content: center;
        }
        .wall-modal {
          background: rgba(15, 23, 42, 0.97);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          width: 720px;
          max-width: 95vw;
          max-height: 90vh;
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        .wall-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .wall-header-title {
          display: flex; align-items: center; gap: 12px;
        }
        .wall-header-title h2 {
          margin: 0; font-family: 'Outfit', sans-serif; font-size: 1.4rem; color: #fff;
        }
        .wall-header-icon { color: #a855f7; }
        .wall-close-btn {
          background: rgba(255,255,255,0.05); border: none; color: #94a3b8; cursor: pointer;
          border-radius: 10px; padding: 8px; transition: all 0.2s;
        }
        .wall-close-btn:hover { color: #ef4444; background: rgba(239,68,68,0.15); }

        .wall-board {
          position: relative;
          height: 420px;
          margin: 20px 24px 0;
          background: rgba(0,0,0,0.25);
          border: 1px dashed rgba(255,255,255,0.15);
          border-radius: 16px;
          overflow: hidden;
          cursor: crosshair;
        }
        .wall-status-text {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          color: #64748b; font-family: 'Outfit', sans-serif; font-size: 0.9rem;
        }
        .wall-note {
          position: absolute;
          transform: translate(-50%, -50%) rotate(-2deg);
          max-width: 140px;
          padding: 10px 12px;
          border-radius: 4px;
          font-family: 'Kalam', cursive, 'Outfit', sans-serif;
          font-size: 0.8rem;
          color: #1e293b;
          box-shadow: 0 6px 14px rgba(0,0,0,0.35);
          word-break: break-word;
          pointer-events: none;
        }

        .wall-compose {
          display: flex; align-items: center; gap: 12px;
          padding: 16px 24px;
        }
        .wall-compose-input {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 10px 14px;
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
          outline: none;
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
          margin: 0 24px 8px;
          color: #f87171;
          font-family: 'Outfit', sans-serif;
          font-size: 0.8rem;
        }
        .wall-hint {
          margin: 0 24px 20px;
          color: #64748b;
          font-family: 'Outfit', sans-serif;
          font-size: 0.78rem;
          text-align: center;
        }

        .wall-armed-note {
          position: fixed;
          transform: translate(-50%, -50%) rotate(-2deg);
          max-width: 140px;
          padding: 10px 12px;
          border-radius: 4px;
          font-family: 'Kalam', cursive, 'Outfit', sans-serif;
          font-size: 0.8rem;
          color: #1e293b;
          box-shadow: 0 10px 24px rgba(0,0,0,0.5);
          pointer-events: none;
          z-index: 10000;
        }
      `}</style>
    </div>,
    document.body
  );
}
