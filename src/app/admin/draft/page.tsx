'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Plus, Trash2, Check, Settings, Swords, Users, Activity, Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { fadeUp, stagger, still } from '@/lib/motion';
import CitySelect from '@/components/geo/CitySelect';
import {
  Card,
  Button,
  PageHeader,
  Badge,
  EmptyState,
  Input,
  Textarea,
  Skeleton,
  StatCard,
} from '@/components/ui';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import toast from 'react-hot-toast';

const labelCls = 'mb-2.5 block text-sm font-medium text-ink-1';

type Category = '1v1' | '3v3' | '5v5';
const CATEGORIES: Category[] = ['1v1', '3v3', '5v5'];
const LANES = ['gold', 'mid', 'jungle', 'exp', 'roam'] as const;
const TEAM_SIZE: Record<Category, number> = { '1v1': 1, '3v3': 3, '5v5': 5 };

const statusVariant: Record<string, string> = {
  draft: 'default',
  registration: 'green',
  closed: 'gold',
  drafted: 'blue',
  ongoing: 'purple',
  completed: 'default',
};

export default function AdminDraftPage() {
  const t = useT();
  const reduce = useReducedMotion();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create modal
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('5v5');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Delete
  const [pending, setPending] = useState<{ id: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const errMsg = (e: any) => e?.message || t('admin.draft.error');

  const load = async () => {
    try {
      const data = await api.draft.admin.list();
      setTournaments(Array.isArray(data) ? data : []);
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

  const teamSize = TEAM_SIZE[category];
  const needsRoles = category !== '5v5';

  const openCreate = () => {
    setName('');
    setCategory('5v5');
    setDescription('');
    setCity('');
    setRoles([]);
    setFormOpen(true);
  };

  const toggleRole = (r: string) => {
    setRoles((prev) => {
      if (prev.includes(r)) return prev.filter((x) => x !== r);
      if (prev.length >= teamSize) return prev; // enforce the exact count
      return [...prev, r];
    });
  };

  const setCat = (c: Category) => {
    setCategory(c);
    setRoles([]); // team size changed, reset the picker
  };

  const canSubmit =
    !!name.trim() && (!needsRoles || roles.length === teamSize) && !saving;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      const payload: any = {
        name: name.trim(),
        category,
        description: description.trim() || undefined,
        city: city || undefined,
      };
      if (needsRoles) payload.roles = roles;
      await api.draft.admin.create(payload);
      toast.success(t('admin.draft.created'));
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
    setDeleting(true);
    try {
      await api.draft.admin.remove(pending.id);
      toast.success(t('admin.draft.deleted'));
      await load();
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setDeleting(false);
      setPending(null);
    }
  };

  // Counts derived from the loaded list (no extra request).
  const openCount = tournaments.filter((tn) => tn.status === 'registration').length;
  const liveCount = tournaments.filter((tn) => tn.status === 'drafted' || tn.status === 'ongoing').length;
  const registered = tournaments.reduce((acc, tn) => acc + (tn.registeredCount ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('nav.section.esport')}
        icon={<Swords size={28} />}
        title={t('admin.draft.title')}
        subtitle={t('admin.draft.subtitle')}
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus size={16} /> {t('admin.draft.new')}
          </Button>
        }
      />

      {!loading && tournaments.length > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label={t('admin.draft.title')} value={tournaments.length} icon={<Trophy size={18} />} accent="cyan" />
          <StatCard label={t('draft.status.registration')} value={openCount} icon={<Plus size={18} />} accent="green" />
          <StatCard label={t('draft.status.ongoing')} value={liveCount} icon={<Activity size={18} />} accent="violet" />
          <StatCard label={t('admin.draft.registrations')} value={registered} icon={<Users size={18} />} accent="gold" />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <Skeleton lines={3} />
            </Card>
          ))}
        </div>
      ) : tournaments.length === 0 ? (
        <EmptyState
          icon={<Swords size={28} />}
          title={t('admin.draft.noTournaments')}
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus size={16} /> {t('admin.draft.new')}
            </Button>
          }
        />
      ) : (
        <motion.div
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
          variants={reduce ? still : stagger()}
          initial="hidden"
          animate="visible"
        >
          {tournaments.map((tn) => (
            <motion.div key={tn.id} variants={reduce ? still : fadeUp} className="flex">
              <Card
                className="flex w-full flex-col gap-3"
                accent={tn.status === 'ongoing' || tn.status === 'drafted' ? 'violet' : tn.status === 'registration' ? 'green' : undefined}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-bold tracking-tight2 text-ink-1">
                      {tn.name}
                    </p>
                    {tn.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-ink-2">
                        {tn.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="neon" size="sm">
                    {tn.category}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariant[tn.status] || 'default'} size="sm" dot>
                    {t('draft.status.' + tn.status)}
                  </Badge>
                  <span className="inline-flex items-center gap-1 text-xs text-ink-2 num">
                    <Users size={13} /> {t('draft.registeredCount', { count: tn.registeredCount ?? 0 })}
                  </span>
                </div>

                <div className="mt-auto flex items-center gap-2 pt-1">
                  <Link href={`/admin/draft/${tn.id}`} className="flex-1">
                    <Button size="sm" variant="secondary" className="w-full">
                      <Settings size={14} /> {t('admin.draft.manage')}
                    </Button>
                  </Link>
                  <Button size="sm" variant="danger" onClick={() => setPending({ id: tn.id })} aria-label={t('admin.draft.delete')}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        closeLabel={t('common.close')}
        title={t('admin.draft.new')}
        icon={<Swords size={20} />}
        headerVariant="gradient"
      >
        <form onSubmit={submit} className="space-y-4">
          <Input
            label={t('admin.draft.name')}
            value={name}
            onChange={(e: any) => setName(e.target.value)}
            required
            autoFocus
          />

          <div>
            <label className={labelCls}>{t('admin.draft.category')}</label>
            <div className="inline-flex w-full rounded-md border border-line-subtle bg-surface-2/70 p-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCat(c)}
                  className={`flex-1 rounded px-3 py-1.5 text-sm font-semibold transition-colors duration-fast ${
                    category === c
                      ? 'bg-primary text-on-primary'
                      : 'text-ink-2 hover:text-ink-1'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label={t('admin.draft.description')}
            value={description}
            onChange={(e: any) => setDescription(e.target.value)}
          />

          <CitySelect
            label={t('admin.draft.city')}
            value={city}
            onChange={setCity}
            className="py-2 px-3 text-sm"
          />

          {needsRoles && (
            <div>
              <label className={labelCls}>{t('admin.draft.roles')}</label>
              <p className="mb-2 text-xs text-ink-2">
                {t('admin.draft.rolesHelp')}
              </p>
              <div className="flex flex-wrap gap-2">
                {LANES.map((r) => {
                  const active = roles.includes(r);
                  const atMax = !active && roles.length >= teamSize;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleRole(r)}
                      disabled={atMax}
                      className={`inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-sm transition-colors duration-fast ${
                        active
                          ? 'border-primary bg-primary/10 font-medium text-primary'
                          : 'border-line-strong text-ink-2 hover:border-primary/50 disabled:opacity-40'
                      }`}
                    >
                      {active && <Check size={14} />}
                      {t('draft.role.' + r)}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-ink-3 num">
                {roles.length}/{teamSize}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button size="sm" type="submit" disabled={!canSubmit} loading={saving}>
              <Check size={16} /> {t('admin.draft.create')}
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
        loading={deleting}
        danger
        title={t('admin.confirm.title')}
        message={t('admin.draft.confirmDelete')}
        confirmLabel={t('admin.draft.delete')}
        cancelLabel={t('admin.esport.cancel')}
        closeLabel={t('common.close')}
      />
    </div>
  );
}
