'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Button, Input, Textarea, SectionTitle } from '@/components/ui';
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

      <div className="cut-corners relative z-10 border border-line-subtle bg-surface-1 p-6 shadow-elev-2 sm:p-10 lg:pr-[40%]">
        <SectionTitle
          size="lg"
          eyebrow={t('contact.eyebrow')}
          title={<span className="uppercase">{t('contact.title')}</span>}
          description={t('contact.subtitle')}
        />

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input placeholder={t('contact.name')} value={form.name} onChange={handle('name')} />
            <Input type="email" placeholder={t('contact.email')} value={form.email} onChange={handle('email')} />
          </div>
          <Input placeholder={t('contact.subject')} value={form.subject} onChange={handle('subject')} />
          <Textarea rows={5} placeholder={t('contact.message')} value={form.message} onChange={handle('message')} />
          <Button type="submit" variant="primary" loading={loading} className="w-full">
            {t('contact.send')} <Send size={16} />
          </Button>
        </form>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/cecilion.png"
        alt="Cecilion"
        aria-hidden
        className="hidden lg:block absolute right-[-2%] bottom-0 h-[118%] w-auto z-20 pointer-events-none select-none drop-shadow-[0_25px_55px_rgb(var(--accent-violet)/0.4)]"
      />
    </div>
  );
}
