'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Badge, Button, Input, Select, Textarea } from '@/components/ui';

export interface OfferOption {
  id: string;
  name: string;
}

const EMPTY = { company: '', contactName: '', email: '', phone: '', message: '', offerId: '' };

/** Public partnership form posting to POST /sponsors/requests. */
export default function PartnershipForm({
  offers,
  selectedOfferId,
  onOfferChange,
  eyebrow,
  title,
  subtitle,
}: {
  offers: OfferOption[];
  selectedOfferId?: string;
  onOfferChange?: (id: string) => void;
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  const t = useT();
  const [form, setForm] = useState({ ...EMPTY });
  const [loading, setLoading] = useState(false);
  const offerId = selectedOfferId ?? form.offerId;

  const handle = (k: keyof typeof EMPTY) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.company.trim().length < 2 || form.contactName.trim().length < 2 || !form.email.trim()) {
      toast.error(t('sponsors.form.fillError'));
      return;
    }
    if (form.message.trim().length < 10) {
      toast.error(t('sponsors.form.messageError'));
      return;
    }
    setLoading(true);
    try {
      await api.sponsors.sendRequest({
        company: form.company.trim(),
        contactName: form.contactName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        message: form.message.trim(),
        offerId: offerId || undefined,
      });
      toast.success(t('sponsors.form.success'));
      setForm({ ...EMPTY });
      onOfferChange?.('');
    } catch (err: any) {
      const status = err?.status ?? err?.statusCode;
      toast.error(status === 429 ? t('sponsors.form.rateLimited') : err?.message || t('sponsors.form.sendError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-xl border border-gaming-border bg-gaming-card shadow-gaming p-6 sm:p-10 max-w-3xl mx-auto"
    >
      <Badge variant="neon" size="sm" className="mb-3 uppercase tracking-[0.2em]">{eyebrow}</Badge>
      <h2 className="text-2xl sm:text-3xl font-bold text-white">{title}</h2>
      <p className="text-gray-400 mt-2">{subtitle}</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input placeholder={t('sponsors.form.company')} value={form.company} onChange={handle('company')} required />
          <Input placeholder={t('sponsors.form.contactName')} value={form.contactName} onChange={handle('contactName')} required />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input type="email" placeholder={t('sponsors.form.email')} value={form.email} onChange={handle('email')} required />
          <Input placeholder={t('sponsors.form.phone')} value={form.phone} onChange={handle('phone')} />
        </div>
        {offers.length > 0 && (
          <Select
            value={offerId}
            onChange={(e: any) => {
              setForm((f) => ({ ...f, offerId: e.target.value }));
              onOfferChange?.(e.target.value);
            }}
          >
            <option value="">{t('sponsors.form.offerAny')}</option>
            {offers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        )}
        <Textarea rows={5} placeholder={t('sponsors.form.message')} value={form.message} onChange={handle('message')} required />
        <Button type="submit" variant="primary" loading={loading} className="w-full">
          {t('sponsors.form.send')} <Send size={16} />
        </Button>
      </form>
    </motion.div>
  );
}
