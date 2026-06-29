'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useStore';
import toast from 'react-hot-toast';

/**
 * Modal de liaison d'un compte de jeu MLBB au compte connecté, par code de
 * vérification (même flux que la connexion, mais sans créer de nouveau compte).
 */
export default function LinkGameModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ gameId: '', serverId: '', code: '' });
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!open) {
      setForm({ gameId: '', serverId: '', code: '' });
      setCooldown(0);
    }
  }, [open]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const handle = (k: string) => (e: any) =>
    setForm((f) => ({ ...f, [k]: e.target.value.replace(/[^0-9]/g, '') }));

  const sendCode = async () => {
    if (!form.gameId || !form.serverId) {
      toast.error("Renseigne l'ID de jeu et le serveur.");
      return;
    }
    setSending(true);
    try {
      await api.auth.mlbbSendVc({ roleId: Number(form.gameId), zoneId: Number(form.serverId) });
      toast.success('Code envoyé dans ton courrier en jeu (valable 5 minutes).');
      setCooldown(60);
    } catch (err: any) {
      toast.error(err?.message || "Échec de l'envoi du code.");
    } finally {
      setSending(false);
    }
  };

  const link = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.gameId || !form.serverId || !form.code) {
      toast.error('Remplis tous les champs.');
      return;
    }
    setLoading(true);
    try {
      const updated: any = await api.auth.linkMlbb({
        roleId: Number(form.gameId),
        zoneId: Number(form.serverId),
        vc: Number(form.code),
      });
      useAuthStore.getState().setUser(updated);
      useAuthStore.getState().setUserProfile(updated);
      toast.success('Compte de jeu lié.');
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Code invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl border border-[#1e3f66] bg-gradient-to-b from-[#0c2038] to-[#0a1626] p-7 sm:p-8 shadow-2xl"
          >
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="absolute top-4 right-4 text-[#6f9fd6] hover:text-white transition-colors"
            >
              <X size={22} />
            </button>

            <h2 className="text-center text-xl font-bold tracking-wide text-[#7fb3ff] mb-2">
              Lier un compte de jeu
            </h2>
            <p className="text-center text-xs text-[#6f9fd6] mb-6">
              Connecte ton compte Mobile Legends pour récupérer tes vraies statistiques.
            </p>

            <form onSubmit={link} className="space-y-4">
              <input
                className="w-full px-4 py-3 rounded-lg bg-[#0a1a2e] border border-[#1e3f66] text-white placeholder-[#5a7ba6] focus:outline-none focus:border-[#3f7ad1]"
                placeholder="ID de jeu (role_id)"
                inputMode="numeric"
                value={form.gameId}
                onChange={handle('gameId')}
              />
              <input
                className="w-full px-4 py-3 rounded-lg bg-[#0a1a2e] border border-[#1e3f66] text-white placeholder-[#5a7ba6] focus:outline-none focus:border-[#3f7ad1]"
                placeholder="Serveur (zone_id)"
                inputMode="numeric"
                value={form.serverId}
                onChange={handle('serverId')}
              />
              <div className="flex gap-0">
                <input
                  className="flex-1 px-4 py-3 rounded-l-lg bg-[#0a1a2e] border border-[#1e3f66] border-r-0 text-white placeholder-[#5a7ba6] focus:outline-none focus:border-[#3f7ad1]"
                  placeholder="Code de vérification"
                  inputMode="numeric"
                  value={form.code}
                  onChange={handle('code')}
                />
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={sending || cooldown > 0}
                  className="px-4 rounded-r-lg text-white text-sm font-medium border border-[#1e3f66] disabled:opacity-60 transition-all"
                  style={{ background: 'linear-gradient(180deg, #2f7ad1 0%, #1f5aa8 100%)' }}
                >
                  {cooldown > 0 ? `${cooldown}s` : sending ? '…' : 'Recevoir'}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg text-white font-bold border border-yellow-700/40 transition-all hover:brightness-110 disabled:opacity-70"
                style={{ background: 'linear-gradient(180deg, #f0b32a 0%, #d4901a 100%)' }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Lier le compte <ArrowRight size={18} /></>
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
