import { useState, useEffect } from 'react';

// Drag-to-arm/click-to-place note positioning, adapted from the Study Pet's
// Treat Stash interaction (usePetPhysics.js's draggedTreat mechanic).
export function useNotePlacement({ boardRef, onPlace }) {
  const [armedNote, setArmedNote] = useState(null); // { text, color } | null
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const arm = (text, color) => setArmedNote({ text, color });
  const cancel = () => setArmedNote(null);

  useEffect(() => {
    if (!armedNote) return;

    const onMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    const onClick = (e) => {
      const board = boardRef.current;
      if (!board) return;

      const rect = board.getBoundingClientRect();
      const insideBoard =
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom;

      if (!insideBoard) {
        setArmedNote(null);
        return;
      }

      const xPct = ((e.clientX - rect.left) / rect.width) * 100;
      const yPct = ((e.clientY - rect.top) / rect.height) * 100;
      onPlace({ text: armedNote.text, color: armedNote.color, x: xPct, y: yPct });
      setArmedNote(null);
    };

    window.addEventListener('mousemove', onMouseMove);
    // Wait 50ms before adding the click listener so the "arm" click (the
    // "Pin it" button press) doesn't trigger an instant placement.
    const timeout = setTimeout(() => {
      window.addEventListener('click', onClick);
    }, 50);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onClick);
      clearTimeout(timeout);
    };
  }, [armedNote, boardRef, onPlace]);

  return { armedNote, cursorPos, arm, cancel };
}
