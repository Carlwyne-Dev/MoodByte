import { useState, useRef, useEffect } from 'react';

// Handles wandering movement, the 60fps treat-drop/chase physics loop, and
// drag-to-place treat placement. Kept separate from dialogue/settings so the
// rAF loop's identity (and its single-mount effect) stays easy to reason about.
export function usePetPhysics({ active, onCatch }) {
  const [position, setPosition] = useState(50); // percentage 0-100
  const [direction, setDirection] = useState(1); // 1 = right, -1 = left
  const [state, setState] = useState('Idle'); // 'Idle' or 'Walk'
  const [treat, setTreat] = useState(null);
  const [draggedTreat, setDraggedTreat] = useState(null);

  const requestRef = useRef(null);
  const treatRef = useRef(null);
  const petContainerRef = useRef(null);
  const treatNodeRef = useRef(null);
  const positionRef = useRef(50);
  const directionRef = useRef(1);

  const onCatchRef = useRef(onCatch);
  useEffect(() => { onCatchRef.current = onCatch; }, [onCatch]);

  // Wandering interval (paused while chasing a treat)
  useEffect(() => {
    if (!active) return;

    const animInterval = setInterval(() => {
      if (treatRef.current) return; // Physics loop handles chasing at 60fps

      const isWalking = Math.random() > 0.4;
      if (isWalking) {
        setState('Walk');
        const moveAmount = Math.random() * 10 + 5; // move 5-15%

        let d = directionRef.current;
        if (Math.random() > 0.7) d *= -1;

        let p = positionRef.current;
        // Force bounce if already at the edge
        if (p >= 95 && d === 1) d = -1;
        if (p <= 5 && d === -1) d = 1;

        let nextP = p + (moveAmount * d);
        if (nextP > 95) nextP = 95;
        if (nextP < 5) nextP = 5;

        directionRef.current = d;
        positionRef.current = nextP;

        setDirection(d);
        setPosition(nextP);
      } else {
        setState('Idle');
      }
    }, 3000);

    return () => clearInterval(animInterval);
  }, [active]);

  // Realtime 2D Physics Loop for bouncing treat & 60fps Pet Chasing
  useEffect(() => {
    const physicsLoop = () => {
      if (treatRef.current) {
        let t = { ...treatRef.current };

        if (!t.isResting) {
          t.vy += 0.8; // Gravity
          t.x += t.vx;
          t.y += t.vy;

          const floor = window.innerHeight - 10; // Desk floor height flush with bottom

          if (t.y >= floor) {
            t.y = floor;
            t.vy *= -0.85; // Bouncier! (retains 85% energy)
            t.vx *= 0.95;  // Less ground friction so it slides more

            if (Math.abs(t.vy) < 2.5 && Math.abs(t.vx) < 0.5) {
              t.vy = 0;
              t.vx = 0;
              t.isResting = true;
            }
          }

          // Wall collisions
          if (t.x <= 10) { t.x = 10; t.vx *= -0.8; }
          else if (t.x >= window.innerWidth - 20) { t.x = window.innerWidth - 20; t.vx *= -0.8; }
        }

        // --- Pet Chasing Logic (60fps) ---
        let p = positionRef.current;
        const tPercent = (t.x / window.innerWidth) * 100;
        let dist = tPercent - p;

        // Catch condition: close horizontally, and treat is close to the ground
        const currentFloor = window.innerHeight - 10;
        if (Math.abs(dist) < 2 && t.y > currentFloor - 40) {
          setTreat(null);
          treatRef.current = null;
          setState('Idle');
          setPosition(positionRef.current); // Re-sync React state when chase ends
          onCatchRef.current && onCatchRef.current();
        } else {
          // Pet runs towards treat
          setState('Walk');
          let d = dist > 0 ? 1 : -1;
          let moveSpeed = 0.4; // % of screen width per frame (~5px)

          let nextP = p + (moveSpeed * d);
          if ((d === 1 && nextP > tPercent) || (d === -1 && nextP < tPercent)) {
            nextP = tPercent; // don't overshoot
          }

          directionRef.current = d;
          positionRef.current = nextP;

          // Directly manipulate DOM to bypass React re-renders for butter-smooth 60fps
          if (petContainerRef.current) {
            petContainerRef.current.style.left = `${nextP}%`;
            petContainerRef.current.style.transform = `translateX(-50%) scaleX(${d})`;
          }

          setDirection(d);

          treatRef.current = t;
          if (treatNodeRef.current) {
            treatNodeRef.current.style.left = `${t.x}px`;
            treatNodeRef.current.style.top = `${t.y}px`;
          }
        }
      }
      requestRef.current = requestAnimationFrame(physicsLoop);
    };
    requestRef.current = requestAnimationFrame(physicsLoop);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  // Click to Equip & Click to Drop mouse handlers
  useEffect(() => {
    if (!draggedTreat) return;

    const rarity = draggedTreat.rarity;

    const onMouseMove = (e) => {
      setDraggedTreat(prev => {
        if (!prev) return prev;
        return { ...prev, x: e.clientX, y: e.clientY };
      });
    };

    const onDropClick = (e) => {
      const newTreat = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY,
        vx: (Math.random() - 0.5) * 15, // Toss left or right harder
        vy: 0,
        isResting: false,
        rarity: rarity
      };
      treatRef.current = newTreat;
      setTreat(newTreat);
      setDraggedTreat(null);
    };

    window.addEventListener('mousemove', onMouseMove);
    // Wait 50ms before adding the click listener so the "equip" click doesn't trigger the drop instantly
    const timeout = setTimeout(() => {
      window.addEventListener('click', onDropClick);
    }, 50);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onDropClick);
      clearTimeout(timeout);
    };
  }, [draggedTreat ? draggedTreat.rarity : null]);

  return {
    position,
    direction,
    state,
    treat,
    draggedTreat,
    setDraggedTreat,
    petContainerRef,
    treatNodeRef,
  };
}
