'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = {
  emerald: {
    name: 'Forest Emerald',
    primary: '#0A5C43',
    primaryDark: '#074532',
    primaryMid: '#147A5A',
    primaryLight: '#E6F4EF',
    primaryLighter: '#F0F9F5',
  },
  royal: {
    name: 'Royal Sapphire',
    primary: '#1D4ED8',
    primaryDark: '#1E3A8A',
    primaryMid: '#2563EB',
    primaryLight: '#DBEAFE',
    primaryLighter: '#EFF6FF',
  },
  obsidian: {
    name: 'Midnight Obsidian',
    primary: '#1F2937',
    primaryDark: '#111827',
    primaryMid: '#374151',
    primaryLight: '#E5E7EB',
    primaryLighter: '#F3F4F6',
  },
  rose: {
    name: 'Rose Gold',
    primary: '#9D174D',
    primaryDark: '#831843',
    primaryMid: '#BE185D',
    primaryLight: '#FCE7F3',
    primaryLighter: '#FDF2F8',
  }
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState('emerald');

  const applyTheme = (key) => {
    const theme = THEMES[key] || THEMES.emerald;
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--color-primary', theme.primary);
      root.style.setProperty('--color-primary-dark', theme.primaryDark);
      root.style.setProperty('--color-primary-mid', theme.primaryMid);
      root.style.setProperty('--color-primary-light', theme.primaryLight);
      root.style.setProperty('--color-primary-lighter', theme.primaryLighter);
    }
  };

  useEffect(() => {
    const storedTheme = localStorage.getItem('app_theme');
    if (storedTheme && THEMES[storedTheme]) {
      setThemeKey(storedTheme);
      applyTheme(storedTheme);
    } else {
      applyTheme('emerald');
    }
  }, []);

  const changeTheme = (key) => {
    if (THEMES[key]) {
      setThemeKey(key);
      localStorage.setItem('app_theme', key);
      applyTheme(key);
    }
  };

  return (
    <ThemeContext.Provider value={{ themeKey, changeTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
