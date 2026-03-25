import { useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const theme: Theme = 'dark';

  useEffect(() => {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  const toggleTheme = () => {
    // Theme switching is disabled
  };

  return {
    theme,
    toggleTheme,
    isDark: true
  };
} 
