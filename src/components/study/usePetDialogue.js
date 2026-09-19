import { useState, useRef, useEffect } from 'react';
import { DIALOGUE, getAnimalCategory } from './petData';

const randomLine = (lines) => lines[Math.floor(Math.random() * lines.length)];

// Handles the pet's speech bubble: reacts to focus timer events, user
// activity/idleness, and periodically chats with idle/focus/fact lines.
export function usePetDialogue({ active, petType, onTimerFinish }) {
  const [speech, setSpeech] = useState(null);
  const speechTimeoutRef = useRef(null);
  const lastActiveRef = useRef(Date.now());
  const isTimerRunningRef = useRef(false);

  const speak = (text) => {
    setSpeech(text);
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    speechTimeoutRef.current = setTimeout(() => {
      setSpeech(null);
    }, 6000);
  };

  // Welcome message on first mount
  useEffect(() => {
    if (active) {
      const t = setTimeout(() => {
        speak(`Welcome back! Let's get to work.`);
      }, 1500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Activity tracking + focus-session event listeners
  useEffect(() => {
    if (!active) return;

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActiveRef.current > 120000) {
        speak("Ah, you're back! Let's continue.");
      }
      lastActiveRef.current = now;
    };

    const handleTimerStart = () => { isTimerRunningRef.current = true; };
    const handleTimerStop = () => { isTimerRunningRef.current = false; };

    const handleTimerFinish = (e) => {
      isTimerRunningRef.current = false;
      speak(randomLine(DIALOGUE.break));
      onTimerFinish && onTimerFinish(e.detail?.duration || 25);
    };

    const handleNotesExported = () => {
      speak("Notes safely exported! Great job.");
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('zenTimerStart', handleTimerStart);
    window.addEventListener('zenTimerStop', handleTimerStop);
    window.addEventListener('zenTimerFinish', handleTimerFinish);
    window.addEventListener('zenNotesExported', handleNotesExported);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('zenTimerStart', handleTimerStart);
      window.removeEventListener('zenTimerStop', handleTimerStop);
      window.removeEventListener('zenTimerFinish', handleTimerFinish);
      window.removeEventListener('zenNotesExported', handleNotesExported);
    };
  }, [active]);

  // Periodic idle / focus / general chatter
  useEffect(() => {
    if (!active) return;

    const aiInterval = setInterval(() => {
      const timeSinceActive = Date.now() - lastActiveRef.current;

      // Idle Check (2 minutes)
      if (timeSinceActive > 120000) {
        if (Math.random() > 0.5) {
          speak(randomLine(DIALOGUE.idle));
        }
        return;
      }

      // Timer Running Encouragement
      if (isTimerRunningRef.current) {
        if (Math.random() > 0.6) {
          speak(randomLine(DIALOGUE.focusing));
        }
        return;
      }

      // Random general line or animal fact
      if (Math.random() > 0.7) {
        const isFact = Math.random() > 0.5;
        if (isFact) {
          speak(randomLine(DIALOGUE.facts[getAnimalCategory(petType)]));
        } else {
          speak(randomLine(DIALOGUE.general));
        }
      }
    }, 45000); // Check for dialogue every 45 seconds

    return () => clearInterval(aiInterval);
  }, [active, petType]);

  return { speech, speak };
}
