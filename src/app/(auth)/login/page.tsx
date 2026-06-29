'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Swords, ArrowRight } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useThemeStore, useAuthStore } from '@/store/useStore';
import { api, setToken } from '@/lib/api';
import toast from 'react-hot-toast';

export default function Login() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res: any = await api.auth.login({ email: formData.email, password: formData.password });
      setToken(res.token);
      useAuthStore.getState().setUser(res.user);
      useAuthStore.getState().setUserProfile(res.user);
      toast.success('Connexion réussie!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.message || 'Échec de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${theme === 'dark' ? 'bg-gaming-darker' : 'bg-gray-50'}`}>
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple mb-4 shadow-neon"
          >
            <Swords className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Bon retour!</h1>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Connectez-vous à votre compte MLBB Togo
          </p>
        </div>

        {/* Form */}
        <div className={`rounded-2xl border p-8 ${
          theme === 'dark'
            ? 'bg-gaming-card/80 border-gaming-border backdrop-blur-xl'
            : 'bg-white border-gray-200 shadow-xl'
        }`}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="votre@email.com"
              value={formData.email}
              onChange={(e: any) => setFormData({ ...formData, email: e.target.value })}
            />
            <div className="relative">
              <Input
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e: any) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gaming-border bg-gaming-card accent-neon-blue" />
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Se souvenir</span>
              </label>
              <Link href="/change-password" className="text-neon-blue hover:text-neon-blue/80 transition-colors">
                Mot de passe oublié?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Se connecter
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </form>

          <p className={`text-center text-sm mt-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Pas encore de compte?{' '}
            <Link href="/register" className="text-neon-blue font-medium hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
