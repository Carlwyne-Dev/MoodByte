import React, { useState, useEffect, useRef } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { Settings, X, Gift } from 'lucide-react';

const PET_TYPES = [
  { id: '1 Dog', label: 'Dog 1' },
  { id: '2 Dog 2', label: 'Dog 2' },
  { id: '3 Cat', label: 'Cat 1' },
  { id: '4 Cat 2', label: 'Cat 2' },
  { id: '5 Rat', label: 'Rat 1' },
  { id: '6 Rat 2', label: 'Rat 2' },
  { id: '7 Bird', label: 'Bird 1' },
  { id: '8 Bird 2', label: 'Bird 2' },
];

const DIALOGUE = {
  focusing: [
    "Keep going! You're doing great.",
    "Deep breaths. We got this.",
    "Don't look at your phone. I'm watching you.",
    "You're in the zone! Don't stop now.",
    "Just a little bit more. Stay focused!",
    "I believe in you! Keep pushing.",
    "This is where the magic happens."
  ],
  break: [
    "Phew! Time for a well-deserved stretch!",
    "Pomodoro complete! Go grab some water.",
    "We survived! Let your eyes rest.",
    "Great session! Shake those hands out.",
    "Time's up! Take a real break, no cheating.",
    "I'm exhausted just watching you. Break time!",
    "Mission accomplished. Hydrate!"
  ],
  idle: [
    "Are you still there? The page is getting cold...",
    "Daydreaming again? Let's get back to it!",
    "Zzz... Oh! You're back! Let's focus.",
    "Hello? Did you fall down a rabbit hole?",
    "I'm getting lonely wandering down here...",
    "You were doing so well! Come back to the desk!",
    "I'm waiting for you to make a move..."
  ],
  general: [
    "Wow, that's a lot of words. You're on fire.",
    "I like this music. Good choice.",
    "Are you really going to read all of that?",
    "I'm just a handful of pixels, but I'm proud of you.",
    "If I had hands, I'd give you a high five.",
    "Don't forget to blink!"
  ],
  facts: {
    Cat: [
      "Did you know? Cats sleep for 12 to 16 hours a day. I wish I could.",
      "Fun fact: Cats can rotate their ears 180 degrees... mostly to ignore you.",
      "Did you know? A digital cat's purr can lower your stress. *purrs digitally*",
      "Fun fact: Cats have five toes on their front paws, but only four on the back.",
      "Did you know? Adult cats only meow at humans, never at other cats!"
    ],
    Dog: [
      "Fun fact: Dogs have three eyelids! That's why I never need to blink.",
      "Did you know? A dog's sense of smell is 10,000 times stronger than yours.",
      "Fun fact: Dogs can understand up to 250 words and gestures.",
      "Did you know? Just petting a dog can lower your blood pressure. Pretend to pet me!",
      "Fun fact: Greyhounds can beat cheetahs in a long-distance race."
    ],
    Rat: [
      "Did you know? Rats are highly ticklish and even 'laugh' when tickled.",
      "Fun fact: Rats have excellent memories and learn complex mazes. Your desk is easy.",
      "Did you know? Rats grind their teeth when they're happy, it's called 'bruxing'.",
      "Fun fact: Despite the stereotypes, rats are incredibly clean and groom constantly.",
      "Did you know? A rat can tread water for up to three days. Not that I want to try."
    ],
    Bird: [
      "Fun fact: Birds don't have teeth! That's why I don't need a dentist.",
      "Did you know? Some birds can sleep with one eye open.",
      "Fun fact: Crows can recognize human faces and remember them... so be nice.",
      "Did you know? Hummingbirds are the only birds that can fly backwards.",
      "Fun fact: Pigeons can do complex math. Just kidding, but we are very smart!"
    ]
  }
};

export default function StudyPet({ showSettings, onCloseSettings }) {
  const [petSettings, setPetSettings] = useLocalStorage('studyPetSettings', {
    active: false,
    type: '3 Cat',
    name: 'Luna'
  });

  const [position, setPosition] = useState(50); // percentage 0-100
  const [direction, setDirection] = useState(1); // 1 = right, -1 = left
  const [state, setState] = useState('Idle'); // 'Idle' or 'Walk'
  const [speech, setSpeech] = useState(null);
  const [draftSettings, setDraftSettings] = useState(petSettings);
  
  useEffect(() => {
    if (showSettings) {
      setDraftSettings(petSettings);
    }
  }, [showSettings, petSettings]);

  const applySettings = () => {
    setPetSettings(draftSettings);
    onCloseSettings();
  };
  
  const [treat, setTreat] = useState(null);
  const [treatInventory, setTreatInventory] = useLocalStorage('studyPetTreats', {
    common: 0, rare: 0, epic: 0, legendary: 0
  });
  const [lootPopup, setLootPopup] = useState(null);
  const [showStash, setShowStash] = useState(false);
  const [draggedTreat, setDraggedTreat] = useState(null);
  const requestRef = useRef(null);
  
  const lastActiveRef = useRef(Date.now());
  const isTimerRunningRef = useRef(false);
  const speechTimeoutRef = useRef(null);
  const treatRef = useRef(null);
  const petContainerRef = useRef(null);
  const stashModalRef = useRef(null);
  const settingsModalRef = useRef(null);
  const treatNodeRef = useRef(null);

  // Helper to trigger speech
  const speak = (text) => {
    setSpeech(text);
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    speechTimeoutRef.current = setTimeout(() => {
      setSpeech(null);
    }, 6000);
  };

  const getAnimalCategory = () => {
    if (petSettings.type.includes('Cat')) return 'Cat';
    if (petSettings.type.includes('Dog')) return 'Dog';
    if (petSettings.type.includes('Rat')) return 'Rat';
    if (petSettings.type.includes('Bird')) return 'Bird';
    return 'Cat';
  };

  // Setup Event Listeners for Activity & Custom Events
  useEffect(() => {
    if (petSettings.active) {
      setTimeout(() => {
        speak(`Welcome back! Let's get to work.`);
      }, 1500);
    }
  }, []);

  useEffect(() => {
    if (!petSettings.active) return;

    const handleActivity = () => { 
      const now = Date.now();
      if (now - lastActiveRef.current > 120000) {
        speak("Ah, you're back! Let's continue.");
      }
      lastActiveRef.current = now; 
    };
    
    // Click outside listener for modals
    const handleClickOutside = (e) => {
      if (stashModalRef.current && !stashModalRef.current.contains(e.target)) {
        if (!e.target.closest('.treat-stash-btn')) setShowStash(false);
      }
      if (settingsModalRef.current && !settingsModalRef.current.contains(e.target)) {
        if (!e.target.closest('.pet-settings-btn')) onCloseSettings();
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    document.addEventListener('mousedown', handleClickOutside);

    const handleTimerStart = () => { isTimerRunningRef.current = true; };
    const handleTimerStop = () => { isTimerRunningRef.current = false; };
    
    const handleTimerFinish = (e) => {
      isTimerRunningRef.current = false;
      const lines = DIALOGUE.break;
      speak(lines[Math.floor(Math.random() * lines.length)]);
      
      const duration = e.detail?.duration || 25;
      let c = 0, r = 0, ep = 0, l = 0;
      
      if (duration < 15) { c = 1; }
      else if (duration < 30) { c = 2; r = 1; }
      else if (duration < 45) { c = 2; r = 2; ep = 1; }
      else { c = 3; r = 2; ep = 2; l = 1; }
      
      const loot = { common: c, rare: r, epic: ep, legendary: l };
      
      setTreatInventory(prev => ({
        common: (prev.common || 0) + c,
        rare: (prev.rare || 0) + r,
        epic: (prev.epic || 0) + ep,
        legendary: (prev.legendary || 0) + l
      }));
      
      setLootPopup(loot);
      
      // Play reward notification audio
      const giftAudio = new Audio('/animals/gift_active.mp3');
      giftAudio.volume = 0.5;
      giftAudio.play().catch(e => console.log('Gift audio failed:', e));

      setTimeout(() => setLootPopup(null), 2000); // 2 seconds
    };

    const handleNotesExported = () => {
      speak("Notes safely exported! Great job.");
    };

    window.addEventListener('zenTimerStart', handleTimerStart);
    window.addEventListener('zenTimerStop', handleTimerStop);
    window.addEventListener('zenTimerFinish', handleTimerFinish);
    window.addEventListener('zenNotesExported', handleNotesExported);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('zenTimerStart', handleTimerStart);
      window.removeEventListener('zenTimerStop', handleTimerStop);
      window.removeEventListener('zenTimerFinish', handleTimerFinish);
      window.removeEventListener('zenNotesExported', handleNotesExported);
    };
  }, [petSettings.active]);

  // Physics Refs to prevent React batching/closure desyncs
  const positionRef = useRef(50);
  const directionRef = useRef(1);

  // Main wandering and speech interval loop
  useEffect(() => {
    if (!petSettings.active) return;
    
    // Animation tick
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
    
    // Dialogue AI Tick
    const aiInterval = setInterval(() => {
      const timeSinceActive = Date.now() - lastActiveRef.current;
      
      // Idle Check (2 minutes)
      if (timeSinceActive > 120000) {
        if (Math.random() > 0.5) {
          const lines = DIALOGUE.idle;
          speak(lines[Math.floor(Math.random() * lines.length)]);
        }
        return;
      }
      
      // Timer Running Encouragement
      if (isTimerRunningRef.current) {
        if (Math.random() > 0.6) {
          const lines = DIALOGUE.focusing;
          speak(lines[Math.floor(Math.random() * lines.length)]);
        }
        return;
      }

      // Random general line or animal fact (if idle is false, timer false)
      if (Math.random() > 0.7) {
        const isFact = Math.random() > 0.5;
        if (isFact) {
          const category = getAnimalCategory();
          const lines = DIALOGUE.facts[category];
          speak(lines[Math.floor(Math.random() * lines.length)]);
        } else {
          const lines = DIALOGUE.general;
          speak(lines[Math.floor(Math.random() * lines.length)]);
        }
      }
    }, 45000); // Check for dialogue every 45 seconds
    
    return () => {
      clearInterval(animInterval);
      clearInterval(aiInterval);
    };
  }, [petSettings.active, petSettings.type]);

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
          speak("Yum! Got it!");
          setState('Idle');
          setPosition(positionRef.current); // Re-sync React state when chase ends
          
          // Play eating sound
          const eatSound = new Audio('/animals/pet_eat.mp3');
          eatSound.volume = 0.5;
          eatSound.play().catch(e => console.log('Audio play failed:', e));
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

  const equipTreat = (e, rarity) => {
    e.stopPropagation();
    if (treatInventory[rarity] > 0) {
      setTreatInventory(prev => ({ ...prev, [rarity]: prev[rarity] - 1 }));
      setDraggedTreat({ rarity, x: e.clientX, y: e.clientY });
      setShowStash(false);
    }
  };

  const isBird = petSettings.type.includes('Bird');
  const isRat = petSettings.type.includes('Rat');
  const frameWidth = isRat || isBird ? 32 : 48;
  const bottomPos = isBird ? '40px' : '0px';

  const totalTreats = (treatInventory.common || 0) + (treatInventory.rare || 0) + (treatInventory.epic || 0) + (treatInventory.legendary || 0);

  return (
    <>
      {petSettings.active && (
        <div 
          ref={petContainerRef}
          className={`study-pet-container ${treat ? 'chasing' : ''}`}
          style={{ 
            left: `${position}%`, 
            bottom: bottomPos,
            transform: `translateX(-50%) scaleX(${direction})`,
            '--frame-width': `${frameWidth}px`,
            '--sprite-width': `-${frameWidth * 4}px`
          }}
        >
          <div className="pet-sprite-wrapper">
             {speech && (
               <div className="pet-speech-bubble fade-in" style={{ transform: `scaleX(${direction})`, '--direction-scale': direction }}>
                 {speech}
               </div>
             )}
             <div className="pet-name-plate" style={{ transform: `scaleX(${direction})` }}>
               {petSettings.name}
             </div>
             <img 
               src={`/animals/${petSettings.type}/${state}.png`} 
               alt="Study Pet" 
               className={`pet-sprite ${state.toLowerCase()}`}
             />
          </div>
        </div>
      )}
      
      {treat && (
        <div 
          ref={treatNodeRef}
          className="pet-treat-container" 
          style={{ 
            left: `${treat.x}px`, 
            top: `${treat.y}px`,
            bottom: 'auto'
          }}
        >
          <div className={`pet-treat ${treat.rarity}`} />
        </div>
      )}
      
      {draggedTreat && (
        <div 
          className="pet-treat-container dragged" 
          style={{ 
            left: `${draggedTreat.x}px`, 
            top: `${draggedTreat.y}px`,
            bottom: 'auto',
            pointerEvents: 'none',
            zIndex: 999
          }}
        >
          <div className={`pet-treat ${draggedTreat.rarity}`} />
        </div>
      )}

      {/* Treat Stash Button */}
      {petSettings.active && (
        <button className="treat-stash-btn" onClick={() => setShowStash(!showStash)}>
          <Gift size={20} />
          {totalTreats > 0 && <span className="treat-badge">{totalTreats}</span>}
        </button>
      )}

      {/* Treat Stash Modal */}
      {showStash && (
        <div ref={stashModalRef} className="treat-stash-modal fade-in">
          <div className="treat-stash-header">
            <h3>Treat Stash</h3>
            <button className="icon-btn" onClick={() => setShowStash(false)}><X size={16} /></button>
          </div>
          <p className="stash-desc">Drag and drop a treat for your pet!</p>
          <div className="treat-list">
            <button className="treat-item-btn" onClick={(e) => equipTreat(e, 'common')} disabled={!treatInventory.common}>
              <div className="treat-icon-preview common"></div>
              <span>Common ({treatInventory.common || 0})</span>
            </button>
            <button className="treat-item-btn" onClick={(e) => equipTreat(e, 'rare')} disabled={!treatInventory.rare}>
              <div className="treat-icon-preview rare"></div>
              <span>Rare ({treatInventory.rare || 0})</span>
            </button>
            <button className="treat-item-btn" onClick={(e) => equipTreat(e, 'epic')} disabled={!treatInventory.epic}>
              <div className="treat-icon-preview epic"></div>
              <span>Epic ({treatInventory.epic || 0})</span>
            </button>
            <button className="treat-item-btn" onClick={(e) => equipTreat(e, 'legendary')} disabled={!treatInventory.legendary}>
              <div className="treat-icon-preview legendary"></div>
              <span>Legendary ({treatInventory.legendary || 0})</span>
            </button>
          </div>
        </div>
      )}

      {/* Loot Popup */}
      {lootPopup && (
        <div className="loot-popup fade-in">
          <h4>Focus Reward!</h4>
          <p>Treats added to your stash:</p>
          <div className="loot-items">
            {lootPopup.common > 0 && <div className="loot-row"><div className="treat-icon-preview common"></div> +{lootPopup.common} Common</div>}
            {lootPopup.rare > 0 && <div className="loot-row"><div className="treat-icon-preview rare"></div> +{lootPopup.rare} Rare</div>}
            {lootPopup.epic > 0 && <div className="loot-row"><div className="treat-icon-preview epic"></div> +{lootPopup.epic} Epic</div>}
            {lootPopup.legendary > 0 && <div className="loot-row"><div className="treat-icon-preview legendary"></div> +{lootPopup.legendary} Legendary</div>}
          </div>
        </div>
      )}

      {showSettings && (
        <div ref={settingsModalRef} className="pet-settings-modal fade-in">
          <div className="pet-settings-header">
            <h3>Pet Settings</h3>
            <button className="icon-btn" onClick={onCloseSettings}><X size={16} /></button>
          </div>
          <div className="pet-settings-body">
            {/* Pet Preview Area */}
            <div className="pet-preview-area">
               <div 
                 className="pet-preview-sprite" 
                 style={{ '--frame-width': draftSettings.type.includes('Rat') || draftSettings.type.includes('Bird') ? '32px' : '48px' }}
               >
                 <img src={`/animals/${draftSettings.type}/Idle.png`} alt="Pet Preview" />
               </div>
               <div className="pet-preview-name">{draftSettings.name || 'Unnamed'}</div>
            </div>

            <div className="form-group row">
              <label>Enable Pet</label>
              <input 
                type="checkbox" 
                checked={draftSettings.active} 
                onChange={e => setDraftSettings({ ...draftSettings, active: e.target.checked })}
              />
            </div>
            
            <div className="form-group">
              <label>Pet Name</label>
              <input 
                type="text" 
                value={draftSettings.name} 
                onChange={e => setDraftSettings({ ...draftSettings, name: e.target.value })}
                maxLength={12}
                placeholder="Give them a name..."
              />
            </div>

            <div className="form-group">
              <label>Pet Type</label>
              <div className="pet-grid">
                {PET_TYPES.map(t => (
                  <button 
                    key={t.id} 
                    className={`pet-type-btn ${draftSettings.type === t.id ? 'active' : ''}`}
                    onClick={() => setDraftSettings({ ...draftSettings, type: t.id })}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            
            <button className="apply-settings-btn" onClick={applySettings}>Save Changes</button>
          </div>
        </div>
      )}

      <style>{`
        .study-pet-container {
          position: absolute;
          bottom: 0;
          z-index: 50;
          cursor: pointer;
          transition: left 3s linear;
        }
        
        .study-pet-container.chasing {
          transition: none; /* Disable 3s transition so 60fps JS physics works perfectly */
        }
        
        .pet-sprite-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .pet-speech-bubble {
          position: absolute;
          bottom: calc(100% - 10px);
          left: 50%;
          background: #fff;
          color: #0f172a;
          padding: 8px 12px;
          border-radius: 12px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          white-space: nowrap;
          pointer-events: none;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
          animation: floatBubble 2s ease-in-out infinite;
        }

        .pet-speech-bubble::after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          border-width: 6px 6px 0 6px;
          border-style: solid;
          border-color: #fff transparent transparent transparent;
        }

        @keyframes floatBubble {
          0%, 100% { transform: translateX(-50%) translateY(0) scaleX(var(--direction-scale, 1)); }
          50% { transform: translateX(-50%) translateY(-3px) scaleX(var(--direction-scale, 1)); }
        }

        .pet-name-plate {
          position: absolute;
          top: -5px;
          color: rgba(255, 255, 255, 0.8);
          font-family: 'Outfit', sans-serif;
          font-size: 0.75rem;
          font-weight: 500;
          pointer-events: none;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.2s;
          text-shadow: 0 1px 3px rgba(0,0,0,0.8);
        }
        
        .study-pet-container:hover .pet-name-plate {
          opacity: 1;
        }

        .pet-sprite {
          height: var(--frame-width);
          object-fit: none;
          object-position: left center;
          width: var(--frame-width);
          image-rendering: pixelated;
        }
        
        @keyframes playSprite {
          100% { object-position: var(--sprite-width) center; } 
        }
        
        .pet-sprite.walk {
          animation: playSprite 0.6s steps(4) infinite;
        }
        .pet-sprite.idle {
          animation: playSprite 1s steps(4) infinite;
        }

        /* Treat System Styles */
        .treat-stash-btn {
          position: absolute;
          bottom: 24px;
          right: 24px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          z-index: 60;
        }
        .treat-stash-btn:hover {
          background: rgba(15, 23, 42, 0.9);
          transform: scale(1.05);
        }
        
        .treat-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: var(--primary);
          color: #fff;
          font-size: 0.7rem;
          font-weight: bold;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .treat-stash-modal {
          position: absolute;
          bottom: 80px;
          right: 24px;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 16px;
          width: 240px;
          z-index: 100;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          color: #fff;
        }

        .treat-stash-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .treat-stash-header h3 {
          margin: 0;
          font-family: 'Outfit', sans-serif;
          font-size: 1.1rem;
        }
        .stash-desc {
          font-size: 0.8rem;
          color: #94a3b8;
          margin-bottom: 12px;
        }

        .treat-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .treat-item-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 10px;
          border-radius: 8px;
          color: #fff;
          cursor: pointer;
          transition: background 0.2s;
        }
        .treat-item-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.1);
        }
        .treat-item-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          filter: grayscale(1);
        }

        .treat-icon-preview {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        /* Treat Visuals (Used in UI and Game) */
        .pet-treat-container {
          position: absolute;
          z-index: 900;
          transform: translate(-50%, -50%);
        }
        
        .pet-treat {
          width: 12px;
          height: 12px;
        }

        .common {
          background: radial-gradient(circle at 30% 30%, #fbbf24, #d97706);
          border-radius: 50%;
          box-shadow: 0 4px 10px rgba(217, 119, 6, 0.4);
        }
        
        .rare {
          background: radial-gradient(circle at 30% 30%, #38bdf8, #0284c7);
          clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
          filter: drop-shadow(0 0 4px rgba(56,189,248,0.6));
        }
        
        .epic {
          background: radial-gradient(circle at 30% 30%, #a855f7, #7e22ce);
          border-radius: 50%;
          box-shadow: 0 0 15px 5px rgba(168, 85, 247, 0.6);
        }
        
        .legendary {
          background: radial-gradient(circle at 30% 30%, #2dd4bf, #0d9488);
          animation: legendaryMorph 2s infinite linear;
          box-shadow: 0 0 20px 8px rgba(45, 212, 191, 0.8);
        }

        @keyframes legendaryMorph {
          0% { border-radius: 50%; filter: hue-rotate(0deg); clip-path: none; }
          25% { border-radius: 0%; filter: hue-rotate(90deg); clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); }
          50% { border-radius: 0%; filter: hue-rotate(180deg); clip-path: polygon(50% 0%, 100% 100%, 0% 100%); }
          75% { border-radius: 0%; filter: hue-rotate(270deg); clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%); }
          100% { border-radius: 50%; filter: hue-rotate(360deg); clip-path: none; }
        }

        .loot-popup {
          position: absolute;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 16px;
          padding: 20px;
          z-index: 100;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          color: #fff;
          text-align: center;
          min-width: 200px;
          animation: dropIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        .loot-popup h4 {
          margin: 0 0 8px 0;
          color: #fbbf24;
          font-family: 'Outfit', sans-serif;
          font-size: 1.2rem;
        }
        .loot-popup p {
          margin: 0 0 16px 0;
          font-size: 0.9rem;
          color: #cbd5e1;
        }

        .loot-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }

        .loot-row {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
          font-size: 1.1rem;
        }

        @keyframes dropIn {
          0% { transform: translate(-50%, -50px); opacity: 0; }
          100% { transform: translate(-50%, 0); opacity: 1; }
        }

        /* Existing Settings Styles */
        .pet-settings-modal {
          position: absolute;
          top: 70px;
          right: 24px;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 12px 16px;
          width: 260px;
          z-index: 100;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          color: #fff;
        }

        .pet-settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .pet-settings-header h3 {
          margin: 0;
          font-family: 'Outfit', sans-serif;
          font-size: 1.1rem;
          color: #f8fafc;
        }

        .pet-preview-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px;
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          margin-bottom: 12px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        
        .pet-preview-sprite {
          width: var(--frame-width);
          height: var(--frame-width);
          overflow: hidden;
          margin-bottom: 4px;
          image-rendering: pixelated;
        }
        
        @keyframes walkCyclePreview {
          from { transform: translateX(0); }
          to { transform: translateX(calc(var(--frame-width) * -4)); }
        }
        
        .pet-preview-sprite img {
          height: 100%;
          animation: walkCyclePreview 0.8s steps(4) infinite;
        }
        
        .pet-preview-name {
          font-family: 'Outfit', sans-serif;
          color: #fbbf24;
          font-weight: 600;
          letter-spacing: 0.5px;
          font-size: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 10px;
        }
        
        .form-group.row {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
        }

        .form-group label {
          font-size: 0.8rem;
          color: #94a3b8;
          font-weight: 500;
        }

        .form-group input[type="text"] {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          padding: 6px 10px;
          border-radius: 6px;
          font-family: 'Outfit', sans-serif;
          outline: none;
          transition: border-color 0.2s;
          font-size: 0.9rem;
        }
        .form-group input[type="text"]:focus {
          border-color: #8b5cf6;
        }

        .form-group input[type="checkbox"] {
          width: 16px;
          height: 16px;
          accent-color: #8b5cf6;
          cursor: pointer;
        }
        
        .pet-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }
        
        .pet-type-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #cbd5e1;
          padding: 6px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .pet-type-btn:hover {
          background: rgba(255,255,255,0.1);
          color: #fff;
        }
        .pet-type-btn.active {
          background: rgba(139, 92, 246, 0.2);
          border-color: #8b5cf6;
          color: #fff;
        }
        
        .apply-settings-btn {
          width: 100%;
          padding: 8px;
          background: #8b5cf6;
          color: white;
          border: none;
          border-radius: 6px;
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 0.9rem;
          margin-top: 4px;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }
        .apply-settings-btn:hover {
          background: #7c3aed;
        }
        .apply-settings-btn:active {
          transform: scale(0.98);
        }
      `}</style>
    </>
  );
}
