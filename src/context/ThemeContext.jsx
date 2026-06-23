import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { saveImageBlob, getImageBlob } from '../hooks/useImageStorage';

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
  const [customBgs, setCustomBgs] = useLocalStorage('customBgs', {});
  const [bgImage, setBgImage] = useState(() => getRandomBg(theme));

  const loadThemeBg = (targetTheme, currentMap = customBgs) => {
    if (currentMap[targetTheme]) {
      getImageBlob(`custom-bg-${targetTheme}`).then(blob => {
        if (blob) {
          setBgImage(URL.createObjectURL(blob));
        } else {
          setCustomBgs(prev => ({ ...prev, [targetTheme]: false }));
          setBgImage(getRandomBg(targetTheme));
        }
      });
    } else {
      setBgImage(getRandomBg(targetTheme));
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
    await saveImageBlob(`custom-bg-${themeId}`, file);
    
    const newBgs = { ...customBgs, [themeId]: true };
    setCustomBgs(newBgs);
    
    if (theme === themeId) {
      setBgImage(URL.createObjectURL(file));
    }
  };

  const clearCustomBgForTheme = async (themeId) => {
    const newBgs = { ...customBgs, [themeId]: false };
    setCustomBgs(newBgs);
    if (theme === themeId) {
      setBgImage(getRandomBg(themeId));
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, bgImage, customBgs, changeTheme, uploadCustomBgForTheme, clearCustomBgForTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
