import { useState, useEffect } from 'react';

// Drag-to-arm/click-to-place note positioning, adapted from the Study Pet's
// Treat Stash interaction (usePetPhysics.js's draggedTreat mechanic).
//
// Supports both mouse and touch. The two are fundamentally different here:
// on desktop, mousemove fires continuously so the note can visibly follow
// the cursor between the "arm" click and the "place" click. On a touchscreen
// there's no hover — nothing fires between two separate taps — so cursorPos
// stays null until a real pointer/touch move is seen, and the caller should
// render the armed note in a fixed spot (not at some stale/zero position)
// until then.
export function useNotePlacement({ boardRef, onPlace }) {
  const [armedNote, setArmedNote] = useState(null); // { text, color } | null
  const [cursorPos, setCursorPos] = useState(null); // { x, y } | null

  const arm = (text, color) => setArmedNote({ text, color });
  const cancel = () => setArmedNote(null);

  useEffect(() => {
    if (!armedNote) return;

    const onMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    const onTouchMove = (e) => {
      const touch = e.touches[0];
      if (touch) setCursorPos({ x: touch.clientX, y: touch.clientY });
    };

    const tryPlace = (clientX, clientY) => {
      const board = boardRef.current;
      if (!board) return;

      const rect = board.getBoundingClientRect();
      const insideBoard =
        clientX >= rect.left && clientX <= rect.right &&
        clientY >= rect.top && clientY <= rect.bottom;

      if (!insideBoard) {
        setArmedNote(null);
        return;
      }

      const xPct = ((clientX - rect.left) / rect.width) * 100;
      const yPct = ((clientY - rect.top) / rect.height) * 100;
      onPlace({ text: armedNote.text, color: armedNote.color, x: xPct, y: yPct });
      setArmedNote(null);
    };

    const onClick = (e) => tryPlace(e.clientX, e.clientY);

    const onTouchEnd = (e) => {
      const touch = e.changedTouches[0];
      if (!touch) return;
      // Suppress the synthesized mouse/click events the browser would
      // otherwise fire after this touch, so the tap doesn't place twice.
      e.preventDefault();
      tryPlace(touch.clientX, touch.clientY);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    // Wait 50ms before adding the placement listeners so the "arm" tap (the
    // "Pin it" button press) doesn't trigger an instant placement.
    const timeout = setTimeout(() => {
      window.addEventListener('click', onClick);
      window.addEventListener('touchend', onTouchEnd, { passive: false });
    }, 50);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('click', onClick);
      window.removeEventListener('touchend', onTouchEnd);
      clearTimeout(timeout);
    };
  }, [armedNote, boardRef, onPlace]);

  return { armedNote, cursorPos, arm, cancel };
}
