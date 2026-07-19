'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Check, Settings, Swords, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import {
  Card,
  Button,
  PageHeader,
  Badge,
  EmptyState,
  LoadingSpinner,
} from '@/components/ui';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import toast from 'react-hot-toast';

const inputCls =
  'w-full px-3 py-2 text-sm rounded-lg border border-stroke bg-gray-2 text-black placeholder-bodydark2 focus:outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white';
const labelCls = 'mb-1.5 block text-sm font-medium text-black dark:text-white';

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
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create modal
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('5v5');
  const [description, setDescription] = useState('');
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

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Swords size={28} />}
        title={t('admin.draft.title')}
        subtitle={t('admin.draft.subtitle')}
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus size={16} /> {t('admin.draft.new')}
          </Button>
        }
      />

      {loading ? (
        <LoadingSpinner size="lg" className="py-24" />
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tournaments.map((tn) => (
            <Card key={tn.id} hover className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-black dark:text-white">
                    {tn.name}
                  </p>
                  {tn.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-body dark:text-bodydark">
                      {tn.description}
                    </p>
                  )}
                </div>
                <Badge variant="neon" size="sm">
                  {tn.category}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant[tn.status] || 'default'} size="sm">
                  {t('draft.status.' + tn.status)}
                </Badge>
                <span className="inline-flex items-center gap-1 text-xs text-body dark:text-bodydark">
                  <Users size={13} /> {t('draft.registeredCount', { count: tn.registeredCount ?? 0 })}
                </span>
              </div>

              <div className="mt-auto flex items-center gap-2 pt-1">
                <Link href={`/admin/draft/${tn.id}`} className="flex-1">
                  <Button size="sm" variant="secondary" className="w-full">
                    <Settings size={14} /> {t('admin.draft.manage')}
                  </Button>
                </Link>
                <Button size="sm" variant="danger" onClick={() => setPending({ id: tn.id })}>
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
        title={t('admin.draft.new')}
        icon={<Swords size={20} />}
        headerVariant="gradient"
      >
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className={labelCls}>{t('admin.draft.name')}</label>
            <input
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className={labelCls}>{t('admin.draft.category')}</label>
            <div className="inline-flex w-full rounded-lg border border-stroke p-1 dark:border-strokedark">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCat(c)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    category === c
                      ? 'bg-primary text-white'
                      : 'text-body hover:bg-gray dark:text-bodydark dark:hover:bg-meta-4'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>{t('admin.draft.description')}</label>
            <textarea
              className={`${inputCls} min-h-[80px] resize-y`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {needsRoles && (
            <div>
              <label className={labelCls}>{t('admin.draft.roles')}</label>
              <p className="mb-2 text-xs text-body dark:text-bodydark">
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
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition ${
                        active
                          ? 'border-primary bg-primary/10 font-medium text-primary'
                          : 'border-stroke text-body hover:border-primary/50 disabled:opacity-40 dark:border-strokedark dark:text-bodydark'
                      }`}
                    >
                      {active && <Check size={14} />}
                      {t('draft.role.' + r)}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-bodydark2">
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
