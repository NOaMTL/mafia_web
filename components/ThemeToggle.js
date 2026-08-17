'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const syncTheme = () => {
      setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
    };

    syncTheme();
    window.addEventListener('mafia-theme-change', syncTheme);
    window.addEventListener('storage', syncTheme);

    return () => {
      window.removeEventListener('mafia-theme-change', syncTheme);
      window.removeEventListener('storage', syncTheme);
    };
  }, []);

  const toggle = () => {
    const current = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    if (next === 'light') document.documentElement.dataset.theme = 'light';
    else delete document.documentElement.dataset.theme;
    try { localStorage.setItem('theme', next); } catch {}
    setTheme(next);
    window.dispatchEvent(new Event('mafia-theme-change'));
  };

  return (
    <button className={`theme-toggle theme-toggle-${theme}`} onClick={toggle}
            aria-label={theme === 'light' ? 'Passer en mode sombre' : 'Passer en mode clair'}
            title={theme === 'light' ? 'Mode sombre' : 'Mode clair'}>
      <span className="theme-toggle-icon" aria-hidden="true">{theme === 'light' ? '🌙' : '☀️'}</span>
      <span className="theme-toggle-label">{theme === 'light' ? 'MODE NUIT' : 'MODE CLAIR'}</span>
    </button>
  );
}
