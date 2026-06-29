'use client';

import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useThemeStore } from '@/store/useStore';
import ParticlesBackground from './ParticlesBackground';

export default function Providers({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s: any) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <>
      <ParticlesBackground />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: theme === 'dark' ? '#12122a' : '#ffffff',
            color: theme === 'dark' ? '#e2e8f0' : '#1a1a2e',
            border: `1px solid ${theme === 'dark' ? '#1e1e3f' : '#e2e8f0'}`,
            borderRadius: '12px',
          },
        }}
      />
      {children}
    </>
  );
}
