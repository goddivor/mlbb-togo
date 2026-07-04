'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Check, ExternalLink, Handshake } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import {
  Card,
  Button,
  PageHeader,
  EmptyState,
  LoadingSpinner,
} from '@/components/ui';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import toast from 'react-hot-toast';

type SponsorForm = { logo: string; name: string; url: string };
const emptyForm: SponsorForm = { logo: '', name: '', url: '' };

const inputCls =
  'w-full px-3 py-2 text-sm rounded-lg border border-stroke bg-gray-2 text-black placeholder-bodydark2 focus:outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white';

export default function AdminSponsorsPage() {
  const t = useT();
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<SponsorForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<{ id: string } | null>(null);
  const [confirming, setConfirming] = useState(false);

  const errMsg = (e: any) => e?.message || t('admin.esport.errorGeneric');

  const load = async () => {
    try {
      const data = await api.esport.sponsors();
      setSponsors(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error(errMsg(e));
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (s: any) => {
    setEditId(s.id);
    setForm({ logo: s.logo || '', name: s.name || '', url: s.url || '' });
    setFormOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.logo.trim()) return;
    setSaving(true);
    try {
      const payload = {
        logo: form.logo.trim(),
        name: form.name.trim() || undefined,
        url: form.url.trim() || undefined,
      };
      if (editId) await api.esport.updateSponsor(editId, payload);
      else await api.esport.createSponsor(payload);
      toast.success(t('admin.esport.saved'));
      setFormOpen(false);
      await load();
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pending) return;
    setConfirming(true);
    try {
      await api.esport.deleteSponsor(pending.id);
      toast.success(t('admin.esport.deleted'));
      await load();
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setConfirming(false);
      setPending(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Handshake size={28} />}
        title={t('admin.sponsors.title')}
        variant="gold"
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus size={16} /> {t('admin.esport.newSponsor')}
          </Button>
        }
      />

      {loading ? (
        <LoadingSpinner size="lg" className="py-24" />
      ) : sponsors.length === 0 ? (
        <EmptyState icon={<Handshake size={28} />} title={t('admin.esport.noSponsors')} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sponsors.map((s) => (
            <Card key={s.id} hover={false} className="!p-3 flex items-center gap-3">
                {s.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.logo}
                    alt={s.name || 'sponsor'}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-lg object-contain bg-gray-2 border border-stroke shrink-0 dark:bg-meta-4 dark:border-strokedark"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gray-2 border border-stroke shrink-0 dark:bg-meta-4 dark:border-strokedark" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-black dark:text-white truncate">{s.name || '—'}</p>
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary truncate hover:underline"
                    >
                      <ExternalLink size={11} /> {s.url}
                    </a>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                    <Pencil size={14} />
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setPending({ id: s.id })}>
                    <Trash2 size={14} />
                  </Button>
                </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        closeLabel={t('common.close')}
        title={editId ? t('admin.esport.editSponsor') : t('admin.esport.newSponsor')}
        icon={<Handshake size={20} />}
        headerVariant={editId ? 'plain' : 'gradient'}
      >
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs text-body dark:text-bodydark mb-1">{t('admin.esport.sponsorLogo')}</label>
            <input className={inputCls} value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-body dark:text-bodydark mb-1">{t('admin.esport.sponsorName')}</label>
              <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-body dark:text-bodydark mb-1">{t('admin.esport.sponsorUrl')}</label>
              <input className={inputCls} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button size="sm" type="submit" disabled={saving}>
              <Check size={16} /> {editId ? t('admin.esport.save') : t('admin.esport.create')}
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setFormOpen(false)}>
              {t('admin.esport.cancel')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={confirmDelete}
        loading={confirming}
        danger
        title={t('admin.confirm.title')}
        message={t('admin.esport.deleteSponsorConfirm')}
        confirmLabel={t('admin.esport.delete')}
        cancelLabel={t('admin.esport.cancel')}
        closeLabel={t('common.close')}
      />
    </div>
  );
}
