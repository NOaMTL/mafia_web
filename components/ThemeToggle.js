'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
  }, []);

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    if (next === 'light') document.documentElement.dataset.theme = 'light';
    else delete document.documentElement.dataset.theme;
    try { localStorage.setItem('theme', next); } catch {}
    setTheme(next);
  };

  return (
    <button className="theme-toggle" onClick={toggle}
            aria-label={theme === 'light' ? 'Passer en mode sombre' : 'Passer en mode clair'}
            title={theme === 'light' ? 'Mode sombre' : 'Mode clair'}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
