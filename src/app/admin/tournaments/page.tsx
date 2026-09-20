'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Trophy, Settings2, Users, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Card, Button, Badge, PageHeader, EmptyState, LoadingSpinner, Input, Textarea, Select } from '@/components/ui';
import CitySelect from '@/components/geo/CitySelect';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { TOURNAMENT_STATUS_VARIANT } from '@/components/tournaments/tournament-utils';
import toast from 'react-hot-toast';

const STATUSES = ['upcoming', 'ongoing', 'completed'];

type Form = {
  name: string;
  description: string;
  organizer: string;
  status: string;
  startDate: string;
  endDate: string;
  prizePool: string;
  maxTeams: string;
  format: string;
  rules: string;
  banner: string;
  streamUrl: string;
  city: string;
};

const emptyForm: Form = {
  name: '',
  description: '',
  organizer: '',
  status: 'upcoming',
  startDate: '',
  endDate: '',
  prizePool: '',
  maxTeams: '16',
  format: '',
  rules: '',
  banner: '',
  streamUrl: '',
  city: '',
};

export default function AdminTournamentsPage() {
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const errMsg = (e: any) => e?.message || t('common.error');

  const load = async () => {
    try {
      const list = await api.tournaments.list();
      setTournaments(Array.isArray(list) ? list : []);
    } catch (e: any) {
      toast.error(errMsg(e));
    }
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (tn: any) => {
    setEditing(tn);
    setForm({
      name: tn.name || '',
      description: tn.description || '',
      organizer: tn.organizer || '',
      status: tn.status || 'upcoming',
      startDate: tn.startDate || '',
      endDate: tn.endDate || '',
      prizePool: tn.prizePool || '',
      maxTeams: String(tn.maxTeams ?? 16),
      format: tn.format || '',
      rules: tn.rules || '',
      banner: tn.banner || '',
      streamUrl: tn.streamUrl || '',
      city: tn.city || '',
    });
    setFormOpen(true);
  };

  const set = (k: keyof Form) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || saving) return;
    setSaving(true);
    try {
      const maxTeams = parseInt(form.maxTeams, 10);
      const payload: any = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        organizer: form.organizer.trim() || undefined,
        status: form.status,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        prizePool: form.prizePool.trim() || undefined,
        maxTeams: Number.isFinite(maxTeams) && maxTeams > 1 ? maxTeams : undefined,
        format: form.format.trim() || undefined,
        rules: form.rules.trim() || undefined,
        banner: form.banner.trim() || undefined,
        streamUrl: form.streamUrl.trim() || undefined,
        city: form.city || null,
      };
      if (editing) {
        await api.tournaments.update(editing.id, payload);
        toast.success(t('admin.tournaments.updated'));
      } else {
        await api.tournaments.create(payload);
        toast.success(t('admin.tournaments.created'));
      }
      setFormOpen(false);
      await load();
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.tournaments.remove(pendingDelete.id);
      toast.success(t('admin.tournaments.deleted'));
      await load();
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Trophy size={28} />}
        title={t('admin.tournaments.title')}
        subtitle={t('admin.tournaments.subtitle')}
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus size={16} /> {t('admin.tournaments.new')}
          </Button>
        }
      />

      {loading ? (
        <LoadingSpinner size="lg" className="py-24" />
      ) : tournaments.length === 0 ? (
        <EmptyState
          icon={<Trophy size={28} />}
          title={t('admin.tournaments.empty')}
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus size={16} /> {t('admin.tournaments.new')}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tournaments.map((tn) => {
            const regCount = (tn.registeredTeams || []).length;
            const hasBracket = Array.isArray(tn.brackets) && tn.brackets.length > 0;
            return (
              <Card key={tn.id} hover className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-black dark:text-white">{tn.name}</p>
                    {tn.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-body dark:text-bodydark">{tn.description}</p>
                    )}
                  </div>
                  <Badge variant={TOURNAMENT_STATUS_VARIANT[tn.status] || 'default'} size="sm">
                    {t(`tournament.status.${tn.status}`) }
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-body dark:text-bodydark">
                  <span className="inline-flex items-center gap-1">
                    <Users size={12} /> {t('tournament.teamsCount', { count: regCount, max: tn.maxTeams })}
                  </span>
                  {(tn.startDate || tn.endDate) && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={12} /> {tn.startDate}{tn.endDate ? ` → ${tn.endDate}` : ''}
                    </span>
                  )}
                  {tn.format && <Badge variant="purple" size="sm">{tn.format}</Badge>}
                  {hasBracket && <Badge variant="blue" size="sm">{t('admin.tournaments.bracket')}</Badge>}
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-2">
                  <Link href={`/admin/tournaments/${tn.id}`}>
                    <Button size="sm">
                      <Settings2 size={14} /> {t('admin.tournaments.manage')}
                    </Button>
                  </Link>
                  <Button size="sm" variant="secondary" onClick={() => openEdit(tn)}>
                    <Pencil size={14} /> {t('admin.tournaments.edit')}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setPendingDelete(tn)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? t('admin.tournaments.edit') : t('admin.tournaments.new')}
        icon={<Trophy size={20} />}
        size="lg"
        closeLabel={t('common.close')}
      >
        <form onSubmit={submit} className="space-y-4">
          <Input label={t('admin.tournaments.form.name')} value={form.name} onChange={set('name')} required />
          <Textarea label={t('admin.tournaments.form.description')} value={form.description} onChange={set('description')} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label={t('admin.tournaments.form.organizer')} value={form.organizer} onChange={set('organizer')} />
            <Select
              label={t('admin.tournaments.form.status')}
              value={form.status}
              onChange={set('status')}
              options={STATUSES.map((s) => ({ value: s, label: t(`tournament.status.${s}`) }))}
            />
            <Input type="date" label={t('admin.tournaments.form.startDate')} value={form.startDate} onChange={set('startDate')} />
            <Input type="date" label={t('admin.tournaments.form.endDate')} value={form.endDate} onChange={set('endDate')} />
            <Input label={t('admin.tournaments.form.prizePool')} value={form.prizePool} onChange={set('prizePool')} />
            <Input type="number" min={2} label={t('admin.tournaments.form.maxTeams')} value={form.maxTeams} onChange={set('maxTeams')} />
            <Input label={t('admin.tournaments.form.format')} value={form.format} onChange={set('format')} />
            <Input label={t('admin.tournaments.form.banner')} value={form.banner} onChange={set('banner')} />
            <CitySelect label={t('admin.tournaments.form.city')} value={form.city} onChange={(city) => setForm((f) => ({ ...f, city }))} />
          </div>
          <Input label={t('admin.tournaments.form.streamUrl')} value={form.streamUrl} onChange={set('streamUrl')} />
          <Textarea label={t('admin.tournaments.form.rules')} value={form.rules} onChange={set('rules')} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={saving} disabled={!form.name.trim() || saving}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title={t('admin.tournaments.delete')}
        message={t('admin.tournaments.deleteConfirm')}
        confirmLabel={t('admin.tournaments.delete')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
