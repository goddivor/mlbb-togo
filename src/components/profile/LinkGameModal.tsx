'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Gamepad2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useStore';
import toast from 'react-hot-toast';
import { useT } from '@/lib/i18n';
import Modal from '@/components/ui/Modal';
import { Button, Input } from '@/components/ui';

export default function LinkGameModal({
  open,
  onClose,
  initialGameId,
  initialServerId,
}: {
  open: boolean;
  onClose: () => void;
  /** Prefill (reconnecting an already linked account whose session expired). */
  initialGameId?: number | string | null;
  initialServerId?: number | string | null;
}) {
  const [form, setForm] = useState({ gameId: '', serverId: '', code: '' });
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const t = useT();

  useEffect(() => {
    if (!open) {
      setForm({ gameId: '', serverId: '', code: '' });
      setCooldown(0);
    } else if (initialGameId || initialServerId) {
      setForm((f) => ({
        ...f,
        gameId: f.gameId || (initialGameId ? String(initialGameId) : ''),
        serverId: f.serverId || (initialServerId ? String(initialServerId) : ''),
      }));
    }
  }, [open, initialGameId, initialServerId]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const handle = (k: string) => (e: any) =>
    setForm((f) => ({ ...f, [k]: e.target.value.replace(/[^0-9]/g, '') }));

  const sendCode = async () => {
    if (!form.gameId || !form.serverId) {
      toast.error(t('linkGame.fillIds'));
      return;
    }
    setSending(true);
    try {
      await api.auth.mlbbSendVc({ roleId: Number(form.gameId), zoneId: Number(form.serverId) });
      toast.success(t('linkGame.codeSent'));
      setCooldown(60);
    } catch (err: any) {
      toast.error(err?.message || t('linkGame.sendError'));
    } finally {
      setSending(false);
    }
  };

  const link = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.gameId || !form.serverId || !form.code) {
      toast.error(t('linkGame.fillAll'));
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
      toast.success(t('linkGame.success'));
      onClose();
    } catch (err: any) {
      toast.error(err?.message || t('linkGame.invalidCode'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      icon={<Gamepad2 size={18} />}
      title={t('linkGame.title')}
      subtitle={t('gameAccount.link.subtitle')}
      closeLabel={t('linkGame.close')}
    >
      <form onSubmit={link} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label={t('linkGame.gameId')}
            placeholder="123456789"
            inputMode="numeric"
            className="num"
            value={form.gameId}
            onChange={handle('gameId')}
          />
          <Input
            label={t('linkGame.serverId')}
            placeholder="2201"
            inputMode="numeric"
            className="num"
            value={form.serverId}
            onChange={handle('serverId')}
          />
        </div>
        <div className="flex items-end gap-2">
          <Input
            label={t('linkGame.code')}
            placeholder="000000"
            inputMode="numeric"
            className="num tracking-[0.2em]"
            value={form.code}
            onChange={handle('code')}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={sendCode}
            disabled={sending || cooldown > 0}
            loading={sending}
            className="mb-px h-[50px] shrink-0 whitespace-nowrap num"
          >
            {cooldown > 0 ? `${cooldown}s` : t('linkGame.getCode')}
          </Button>
        </div>

        <Button type="submit" loading={loading} disabled={loading} className="w-full" size="lg">
          {t('linkGame.submit')} <ArrowRight size={18} />
        </Button>
      </form>
    </Modal>
  );
}
