import React, { createContext, useContext, useRef, useState, useEffect } from 'react';

const AudioContext = createContext();

export function AudioProvider({ children }) {
  const musicRef = useRef(null);
  const ambientRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [ambientVolume, setAmbientVolume] = useState(0.5);

  useEffect(() => {
    if (!musicRef.current) musicRef.current = new Audio();
    if (!ambientRef.current) ambientRef.current = new Audio();
    
    musicRef.current.volume = musicVolume;
    ambientRef.current.volume = ambientVolume;
  }, []);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    // In a real scenario with files, you would call .play() or .pause()
  };

  const updateMusicVolume = (vol) => {
    setMusicVolume(vol);
    if (musicRef.current) musicRef.current.volume = vol;
  };

  const updateAmbientVolume = (vol) => {
    setAmbientVolume(vol);
    if (ambientRef.current) ambientRef.current.volume = vol;
  };

  return (
    <AudioContext.Provider value={{
      isPlaying, togglePlay,
      musicVolume, updateMusicVolume,
      ambientVolume, updateAmbientVolume
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export const useAudio = () => useContext(AudioContext);
