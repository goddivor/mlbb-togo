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
        gutter={12}
        toastOptions={{
          duration: 3500,
          style: {
            background: theme === 'dark' ? 'rgba(18,18,42,0.92)' : 'rgba(255,255,255,0.95)',
            color: theme === 'dark' ? '#e2e8f0' : '#1a1a2e',
            border: `1px solid ${theme === 'dark' ? '#1e1e3f' : '#e2e8f0'}`,
            borderRadius: '14px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
            backdropFilter: 'blur(8px)',
          },
          success: {
            iconTheme: { primary: '#22c55e', secondary: '#0a0a1a' },
            style: { borderColor: 'rgba(34,197,94,0.4)' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#0a0a1a' },
            style: { borderColor: 'rgba(239,68,68,0.4)' },
          },
        }}
      />
      {children}
    </>
  );
}
