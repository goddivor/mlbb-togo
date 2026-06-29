'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Swords, ArrowRight, Gamepad2 } from 'lucide-react';
import { Button, Input, Select } from '@/components/ui';
import { useThemeStore, useAuthStore } from '@/store/useStore';
import { MLBB_RANKS, MLBB_ROLES } from '@/lib/constants';
import { api, setToken } from '@/lib/api';
import toast from 'react-hot-toast';

export default function Register() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    rank: '',
    role: '',
    mlbbId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (formData.password !== formData.confirmPassword) {
        toast.error('Les mots de passe ne correspondent pas');
        return;
      }
      setStep(2);
      return;
    }
    setLoading(true);
    try {
      const res: any = await api.auth.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        rank: formData.rank,
        role: formData.role,
        mlbbId: formData.mlbbId,
      });
      setToken(res.token);
      useAuthStore.getState().setUser(res.user);
      useAuthStore.getState().setUserProfile(res.user);
      toast.success('Compte créé avec succès!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.message || 'Échec de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${theme === 'dark' ? 'bg-gaming-darker' : 'bg-gray-50'}`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl" />
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
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-purple to-neon-blue mb-4 shadow-neon-purple"
          >
            <Swords className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Rejoignez la communauté
          </h1>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Créez votre compte MLBB Togo
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                step >= s
                  ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white shadow-neon'
                  : theme === 'dark' ? 'bg-gaming-surface text-gray-500' : 'bg-gray-200 text-gray-400'
              }`}>
                {s}
              </div>
              {s < 2 && (
                <div className={`w-12 h-0.5 rounded-full transition-all duration-300 ${
                  step > s ? 'bg-neon-blue' : theme === 'dark' ? 'bg-gaming-border' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className={`rounded-2xl border p-8 ${
          theme === 'dark'
            ? 'bg-gaming-card/80 border-gaming-border backdrop-blur-xl'
            : 'bg-white border-gray-200 shadow-xl'
        }`}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 ? (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <Input
                  label="Pseudo"
                  placeholder="Votre pseudo gaming"
                  value={formData.username}
                  onChange={(e: any) => setFormData({ ...formData, username: e.target.value })}
                />
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
                    className="absolute right-3 top-9 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <Input
                  label="Confirmer le mot de passe"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e: any) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-neon-blue/5 border-neon-blue/20' : 'bg-primary-50 border-primary-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Gamepad2 size={16} className="text-neon-blue" />
                    <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Profil MLBB</span>
                  </div>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Ces informations apparaîtront sur votre profil public.
                  </p>
                </div>

                <Select
                  label="Rang MLBB"
                  value={formData.rank}
                  onChange={(e: any) => setFormData({ ...formData, rank: e.target.value })}
                  options={[
                    { value: '', label: 'Sélectionnez votre rang' },
                    ...MLBB_RANKS.map((r) => ({ value: r.id, label: r.name })),
                  ]}
                />
                <Select
                  label="Rôle principal"
                  value={formData.role}
                  onChange={(e: any) => setFormData({ ...formData, role: e.target.value })}
                  options={[
                    { value: '', label: 'Sélectionnez votre rôle' },
                    ...MLBB_ROLES.map((r) => ({ value: r.id, label: `${r.icon} ${r.name}` })),
                  ]}
                />
                <Input
                  label="ID MLBB (optionnel)"
                  placeholder="Ex: 123456789"
                  value={formData.mlbbId}
                  onChange={(e: any) => setFormData({ ...formData, mlbbId: e.target.value })}
                />
              </motion.div>
            )}

            <div className="flex gap-3">
              {step === 2 && (
                <Button variant="ghost" type="button" onClick={() => setStep(1)} className="flex-1">
                  Retour
                </Button>
              )}
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : step === 1 ? (
                  <>
                    Continuer
                    <ArrowRight size={16} />
                  </>
                ) : (
                  'Créer mon compte'
                )}
              </Button>
            </div>
          </form>

          <p className={`text-center text-sm mt-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Déjà un compte?{' '}
            <Link href="/login" className="text-neon-blue font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
