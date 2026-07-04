'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Check, CalendarDays } from 'lucide-react';
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

type SeasonForm = {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
};
const emptyForm: SeasonForm = { name: '', description: '', startDate: '', endDate: '', isActive: false };

const inputCls =
  'w-full px-3 py-2 text-sm rounded-lg border border-stroke bg-gray-2 text-black placeholder-bodydark2 focus:outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white';

const fmtDate = (v: any) => {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString();
};

export default function AdminSeasonsPage() {
  const t = useT();
  const [seasons, setSeasons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<SeasonForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<{ id: string } | null>(null);
  const [confirming, setConfirming] = useState(false);

  const errMsg = (e: any) => e?.message || t('admin.esport.errorGeneric');

  const load = async () => {
    try {
      const data = await api.esport.seasons();
      setSeasons(Array.isArray(data) ? data : []);
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
    setForm({
      name: s.name || '',
      description: s.description || '',
      startDate: s.startDate ? s.startDate.slice(0, 10) : '',
      endDate: s.endDate ? s.endDate.slice(0, 10) : '',
      isActive: !!s.isActive,
    });
    setFormOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        isActive: form.isActive,
      };
      if (editId) await api.esport.updateSeason(editId, payload);
      else await api.esport.createSeason(payload);
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
      await api.esport.deleteSeason(pending.id);
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
        icon={<CalendarDays size={28} />}
        title={t('admin.seasons.title')}
        variant="cyan"
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus size={16} /> {t('admin.seasons.new')}
          </Button>
        }
      />

      {loading ? (
        <LoadingSpinner size="lg" className="py-24" />
      ) : seasons.length === 0 ? (
        <EmptyState icon={<CalendarDays size={28} />} title={t('admin.seasons.none')} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {seasons.map((s) => {
            const start = fmtDate(s.startDate);
            const end = fmtDate(s.endDate);
            const period = start || end ? `${start || '—'} → ${end || '—'}` : null;
            return (
              <Card key={s.id} hover={false} className="!p-4 flex flex-col gap-2 h-full">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-black dark:text-white truncate">{s.name || '—'}</p>
                        {s.isActive && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/10 text-success">
                            {t('admin.seasons.active')}
                          </span>
                        )}
                      </div>
                      {period && (
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-body dark:text-bodydark">
                          <CalendarDays size={12} /> {period}
                        </p>
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
                  </div>
                {s.description && (
                  <p className="text-xs text-body dark:text-bodydark whitespace-pre-line">{s.description}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        closeLabel={t('common.close')}
        title={editId ? t('admin.seasons.edit') : t('admin.seasons.new')}
        icon={<CalendarDays size={20} />}
        headerVariant={editId ? 'plain' : 'gradient'}
      >
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs text-body dark:text-bodydark mb-1">{t('admin.seasons.name')}</label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-xs text-body dark:text-bodydark mb-1">{t('admin.seasons.description')}</label>
            <textarea
              className={inputCls}
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-body dark:text-bodydark mb-1">{t('admin.seasons.startDate')}</label>
              <input
                type="date"
                className={inputCls}
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-body dark:text-bodydark mb-1">{t('admin.seasons.endDate')}</label>
              <input
                type="date"
                className={inputCls}
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-body dark:text-bodydark cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-stroke bg-gray-2 accent-primary dark:border-strokedark dark:bg-meta-4"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            {t('admin.seasons.active')}
          </label>
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
        message={t('admin.seasons.deleteConfirm')}
        confirmLabel={t('admin.esport.delete')}
        cancelLabel={t('admin.esport.cancel')}
        closeLabel={t('common.close')}
      />
    </div>
  );
}
