'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, KeyRound, ArrowRight } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useThemeStore } from '@/store/useStore';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ChangePassword() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    if (formData.newPassword.length < 6) {
      toast.error('Le nouveau mot de passe doit faire au moins 6 caractères');
      return;
    }
    setLoading(true);
    try {
      await api.auth.changePassword({
        email: formData.email,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      toast.success('Mot de passe mis à jour ! Connectez-vous.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err?.message || 'Échec du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${theme === 'dark' ? 'bg-gaming-darker' : 'bg-gray-50'}`}>
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
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple mb-4 shadow-neon"
          >
            <KeyRound className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Changer de mot de passe</h1>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Saisissez votre mot de passe actuel et le nouveau
          </p>
        </div>

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
            <Input
              label="Mot de passe actuel"
              type="password"
              placeholder="••••••••"
              value={formData.currentPassword}
              onChange={(e: any) => setFormData({ ...formData, currentPassword: e.target.value })}
            />
            <div className="relative">
              <Input
                label="Nouveau mot de passe"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.newPassword}
                onChange={(e: any) => setFormData({ ...formData, newPassword: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <Input
              label="Confirmer le nouveau mot de passe"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e: any) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Mettre à jour
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </form>

          <p className={`text-center text-sm mt-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            <Link href="/login" className="text-neon-blue font-medium hover:underline">
              Retour à la connexion
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
