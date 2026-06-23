import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { saveImageBlob, getImageBlob, deleteImageBlob } from '../hooks/useImageStorage';

const ThemeContext = createContext();

const getThemePrefix = (theme) => {
  if (theme === 'rainy') return 'rain';
  if (theme === 'productive') return 'focus';
  return theme;
};

const getRandomBg = (theme) => {
  const prefix = getThemePrefix(theme);
  const num = Math.floor(Math.random() * 3) + 1;
  return `/bg/${prefix}${num}.gif`;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useLocalStorage('theme', 'chill');
  const [customBgs, setCustomBgs] = useLocalStorage('customBgsV2', {
    night: [], rainy: [], chill: [], productive: []
  });
  const [bgImage, setBgImage] = useState(() => getRandomBg(theme));

  const updateBgImage = (newUrl) => {
    setBgImage((prev) => {
      if (prev && prev.startsWith('blob:') && prev !== newUrl) {
        // Delay revoking the old URL to allow CSS background transitions (1.5s) to finish!
        setTimeout(() => {
          URL.revokeObjectURL(prev);
        }, 2000);
      }
      return newUrl;
    });
  };

  const loadThemeBg = (targetTheme, currentMap = customBgs) => {
    const customList = currentMap[targetTheme] || [];
    const totalChoices = 3 + customList.length;
    const roll = Math.floor(Math.random() * totalChoices);

    if (roll < 3) {
      // Pick a default background
      const prefix = getThemePrefix(targetTheme);
      updateBgImage(`/bg/${prefix}${roll + 1}.gif`);
    } else {
      // Pick a custom background
      const customIndex = roll - 3;
      const randomId = customList[customIndex];
      getImageBlob(randomId).then(blob => {
        if (blob) {
          updateBgImage(URL.createObjectURL(blob));
        } else {
          // If blob is missing in storage, prune it from state
          setCustomBgs(prev => ({
            ...prev,
            [targetTheme]: (prev[targetTheme] || []).filter(id => id !== randomId)
          }));
          updateBgImage(getRandomBg(targetTheme));
        }
      });
    }
  };

  useEffect(() => {
    loadThemeBg(theme);
  }, []); // Run once on mount

  useEffect(() => {
    // Apply theme to document root
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.setProperty('--bg-image', `url('${bgImage}')`);
  }, [theme, bgImage]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    loadThemeBg(newTheme);
  };

  const uploadCustomBgForTheme = async (themeId, file) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("Image is too large! Please upload an image under 5MB.");
      return;
    }
    const currentList = customBgs[themeId] || [];
    if (currentList.length >= 3) {
      alert("You already have 3 custom backgrounds for this theme! Please delete one first to replace it.");
      return;
    }

    const uniqueId = `custom-bg-${themeId}-${Date.now()}`;
    await saveImageBlob(uniqueId, file);
    
    const newBgs = { ...customBgs, [themeId]: [...currentList, uniqueId] };
    setCustomBgs(newBgs);
    
    if (theme === themeId) {
      updateBgImage(URL.createObjectURL(file));
    }
  };

  const removeCustomBg = async (themeId, bgId) => {
    const currentList = customBgs[themeId] || [];
    const newBgs = { 
      ...customBgs, 
      [themeId]: currentList.filter(id => id !== bgId) 
    };
    setCustomBgs(newBgs);
    
    await deleteImageBlob(bgId);

    if (theme === themeId) {
      loadThemeBg(themeId, newBgs);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, bgImage, customBgs, changeTheme, uploadCustomBgForTheme, removeCustomBg }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
