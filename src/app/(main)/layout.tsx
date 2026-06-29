'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { api, getToken, setToken } from '@/lib/api';
import { useAuthStore } from '@/store/useStore';

/**
 * Garde d'authentification : toute l'application (avec sidebar) est réservée
 * aux utilisateurs connectés. Sans jeton valide, on redirige vers /login.
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const setUser = useAuthStore((s: any) => s.setUser);
  const setUserProfile = useAuthStore((s: any) => s.setUserProfile);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    api.auth
      .me()
      .then((user: any) => {
        setUser(user);
        setUserProfile(user);
        setChecked(true);
      })
      .catch(() => {
        // Jeton invalide ou expiré : on nettoie et on renvoie vers la connexion.
        setToken(null);
        router.replace('/login');
      });
  }, [router, setUser, setUserProfile]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gaming-dark">
        <div className="w-10 h-10 border-2 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin" />
      </div>
    );
  }

  return <Layout>{children}</Layout>;
}
