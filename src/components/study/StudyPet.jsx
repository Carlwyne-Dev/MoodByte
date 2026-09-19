import { useState, useEffect, useRef } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { X, Gift } from 'lucide-react';
import { PET_TYPES } from './petData';
import { usePetPhysics } from './usePetPhysics';
import { usePetDialogue } from './usePetDialogue';
import './StudyPet.css';

export default function StudyPet({ showSettings, onCloseSettings }) {
  const [petSettings, setPetSettings] = useLocalStorage('studyPetSettings', {
    active: false,
    type: '3 Cat',
    name: 'Luna'
  });

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

  const [treatInventory, setTreatInventory] = useLocalStorage('studyPetTreats', {
    common: 0, rare: 0, epic: 0, legendary: 0
  });
  const [lootPopup, setLootPopup] = useState(null);
  const [showStash, setShowStash] = useState(false);
  const [isStashClosing, setIsStashClosing] = useState(false);
  const [isSettingsClosing, setIsSettingsClosing] = useState(false);

  const stashModalRef = useRef(null);
  const settingsModalRef = useRef(null);

  const closeStash = () => {
    setIsStashClosing(true);
    setTimeout(() => {
      setShowStash(false);
      setIsStashClosing(false);
    }, 200);
  };

  const closeSettings = () => {
    setIsSettingsClosing(true);
    setTimeout(() => {
      onCloseSettings();
      setIsSettingsClosing(false);
    }, 200);
  };

  const handleTimerFinish = (duration) => {
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

  const { speech, speak } = usePetDialogue({
    active: petSettings.active,
    petType: petSettings.type,
    onTimerFinish: handleTimerFinish,
  });

  const handleCatch = () => {
    speak("Yum! Got it!");
    const eatSound = new Audio('/animals/pet_eat.mp3');
    eatSound.volume = 0.5;
    eatSound.play().catch(e => console.log('Audio play failed:', e));
  };

  const {
    position,
    direction,
    state,
    treat,
    draggedTreat,
    setDraggedTreat,
    petContainerRef,
    treatNodeRef,
  } = usePetPhysics({ active: petSettings.active, onCatch: handleCatch });

  // Click outside listener for the stash & settings modals
  useEffect(() => {
    if (!petSettings.active) return;

    const handleClickOutside = (e) => {
      if (stashModalRef.current && !stashModalRef.current.contains(e.target)) {
        if (!e.target.closest('.treat-stash-btn')) closeStash();
      }
      if (settingsModalRef.current && !settingsModalRef.current.contains(e.target)) {
        if (!e.target.closest('.pet-settings-btn')) closeSettings();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [petSettings.active]);

  const equipTreat = (e, rarity) => {
    e.stopPropagation();
    if (treatInventory[rarity] > 0) {
      setTreatInventory(prev => ({ ...prev, [rarity]: prev[rarity] - 1 }));
      setDraggedTreat({ rarity, x: e.clientX, y: e.clientY });
      closeStash();
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
        <div ref={stashModalRef} className={`treat-stash-modal ${isStashClosing ? 'ui-modal-exit' : 'ui-modal-enter'}`}>
          <div className="treat-stash-header">
            <h3>Treat Stash</h3>
            <button className="icon-btn" onClick={closeStash}><X size={16} /></button>
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
        <div className={`pet-settings-overlay ${isSettingsClosing ? 'ui-overlay-exit' : 'ui-overlay-enter'}`} onClick={closeSettings}>
          <div ref={settingsModalRef} className={`pet-settings-modal ${isSettingsClosing ? 'ui-modal-exit' : 'ui-modal-enter'}`} onClick={e => e.stopPropagation()}>
          <div className="pet-settings-header">
            <h3>Pet Settings</h3>
            <button className="icon-btn" onClick={closeSettings}><X size={16} /></button>
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
        </div>
      )}
    </>
  );
}
