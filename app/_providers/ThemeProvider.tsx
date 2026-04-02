'use client';

import { useEffect } from 'react';

function applyTheme(theme: string) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else if (theme === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
  } else {
    // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
    root.classList.toggle('light', !prefersDark);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Default to dark for web-patient
    const theme = localStorage.getItem('patient-theme') || 'dark';
    applyTheme(theme);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const current = localStorage.getItem('patient-theme') || 'dark';
      if (current === 'system') applyTheme('system');
    };
    mq.addEventListener('change', handleSystemChange);
    return () => mq.removeEventListener('change', handleSystemChange);
  }, []);

  return <>{children}</>;
}
