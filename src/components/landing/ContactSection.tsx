'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import toast from 'react-hot-toast';

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const t = useT();

  const handle = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || form.message.trim().length < 5) {
      toast.error(t('contact.fillError'));
      return;
    }
    setLoading(true);
    try {
      await api.contact.send(form);
      toast.success(t('contact.success'));
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      toast.error(t('contact.sendError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative max-w-5xl mx-auto">
      {/* Carte formulaire — champs à gauche, espace réservé à droite pour le personnage */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="card-gaming relative z-10 p-6 sm:p-10 lg:pr-[40%]"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neon-blue mb-2">{t('contact.eyebrow')}</p>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">{t('contact.title')}</h2>
        <p className="text-gray-400 mt-2">{t('contact.subtitle')}</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <input className="input-gaming" placeholder={t('contact.name')} value={form.name} onChange={handle('name')} />
            <input className="input-gaming" type="email" placeholder={t('contact.email')} value={form.email} onChange={handle('email')} />
          </div>
          <input className="input-gaming" placeholder={t('contact.subject')} value={form.subject} onChange={handle('subject')} />
          <textarea className="input-gaming resize-none" rows={5} placeholder={t('contact.message')} value={form.message} onChange={handle('message')} />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {t('contact.send')} <Send size={16} />
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* Cecilion : chevauche le bord DROIT du formulaire */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/cecilion.png"
        alt="Cecilion"
        aria-hidden
        className="hidden lg:block absolute right-[-2%] bottom-0 h-[118%] w-auto z-20 pointer-events-none select-none drop-shadow-[0_25px_55px_rgba(168,85,247,0.4)]"
      />
    </div>
  );
}
