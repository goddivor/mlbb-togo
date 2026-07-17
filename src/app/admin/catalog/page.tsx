'use client';

import { useEffect, useState } from 'react';
import { LayoutGrid, Pencil, Check, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import {
  Card,
  SectionCard,
  Button,
  Badge,
  Input,
  Textarea,
  PageHeader,
  LoadingSpinner,
} from '@/components/ui';
import Modal from '@/components/ui/Modal';
import RoleIcon from '@/components/game/RoleIcon';
import toast from 'react-hot-toast';

// Shape of a lane as returned by GraphQL / REST.
interface Lane {
  id: string;
  key: string;
  name: string;
  shortName?: string;
  description: string;
  icon: string;
  color?: string;
  compatibleClasses: string[];
  sort: number;
}

// Editable fields in the modal (classes as a comma-separated string).
type LaneForm = {
  name: string;
  shortName: string;
  description: string;
  icon: string;
  color: string;
  compatibleClasses: string;
  sort: string;
};

export default function AdminCatalogPage() {
  const t = useT();
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [heroCount, setHeroCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editKey, setEditKey] = useState<string | null>(null);
  const [form, setForm] = useState<LaneForm | null>(null);
  const [saving, setSaving] = useState(false);

  // Load lanes + hero count via GraphQL.
  const load = async () => {
    try {
      const [ls, hs, rs] = await Promise.all([
        api.catalog.lanes(),
        api.catalog.heroes(),
        api.catalog.roles(),
      ]);
      setLanes(Array.isArray(ls) ? ls : []);
      setHeroCount(Array.isArray(hs) ? hs.length : 0);
      setRoles(Array.isArray(rs) ? rs : []);
    } catch (e: any) {
      toast.error(e?.message || t('admin.catalog.loadError'));
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

  const openEdit = (lane: Lane) => {
    setEditKey(lane.key);
    setForm({
      name: lane.name || '',
      shortName: lane.shortName || '',
      description: lane.description || '',
      icon: lane.icon || '',
      color: lane.color || '',
      compatibleClasses: (lane.compatibleClasses || []).join(', '),
      sort: String(lane.sort ?? 0),
    });
  };

  const closeEdit = () => {
    setEditKey(null);
    setForm(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editKey || !form) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim() || undefined,
        shortName: form.shortName.trim() || undefined,
        description: form.description.trim() || undefined,
        icon: form.icon.trim() || undefined,
        color: form.color.trim() || undefined,
        compatibleClasses: form.compatibleClasses
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        sort: Number(form.sort) || 0,
      };
      await api.lanes.update(editKey, payload);
      toast.success(t('admin.catalog.laneUpdated'));
      closeEdit();
      await load();
    } catch (err: any) {
      toast.error(err?.message || t('admin.catalog.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const refreshHeroes = async () => {
    setRefreshing(true);
    try {
      const res = await api.heroes.refresh();
      toast.success(t('admin.catalog.heroesUpdated', { count: res?.updated ?? 0 }));
      await load();
    } catch (err: any) {
      toast.error(err?.message || t('admin.catalog.refreshFailed'));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<LayoutGrid size={28} />}
        title={t('admin.catalog.title')}
        subtitle={t('admin.catalog.subtitle')}
        variant="purple"
      />

      {loading ? (
        <LoadingSpinner size="lg" className="py-24" />
      ) : (
        <>
          {/* Hero roles section (read-only reference) */}
          <SectionCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-black dark:text-white">{t('admin.catalog.roles')}</h2>
              <Badge variant="purple" size="sm">{roles.length}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {roles.map((r) => (
                <div
                  key={r.key}
                  className="flex flex-col items-center gap-2 rounded-lg border border-stroke bg-gray-2 p-3 text-center dark:border-strokedark dark:bg-meta-4"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.icon} alt={r.name} referrerPolicy="no-referrer" className="h-10 w-10 object-contain" />
                  <span className="text-sm font-medium text-black dark:text-white">{r.name}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Lanes section */}
          <SectionCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-black dark:text-white">{t('admin.catalog.lanes')}</h2>
              <Badge variant="purple" size="sm">
                {lanes.length}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {lanes.map((lane) => (
                <Card key={lane.id} hover={false} className="!p-4 flex items-start gap-3">
                  {lane.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={lane.icon}
                      alt={lane.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-lg object-contain bg-gray-2 border border-stroke shrink-0 dark:bg-meta-4 dark:border-strokedark"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-2 border border-stroke shrink-0 dark:bg-meta-4 dark:border-strokedark" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-black dark:text-white truncate">{lane.name}</p>
                    {lane.compatibleClasses?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {lane.compatibleClasses.map((c) => (
                          <Badge key={c} variant="neon" size="sm" className="gap-1">
                            <RoleIcon role={c} size={13} />
                            {c}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {lane.description && (
                      <p className="text-xs text-body dark:text-bodydark mt-1.5 line-clamp-2">{lane.description}</p>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(lane)}>
                    <Pencil size={14} /> {t('admin.catalog.edit')}
                  </Button>
                </Card>
              ))}
            </div>
          </SectionCard>

          {/* Heroes section */}
          <SectionCard>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-black dark:text-white">{t('admin.catalog.heroes')}</h2>
                <p className="text-sm text-body dark:text-bodydark mt-0.5">
                  {t('admin.catalog.heroesCount', { count: heroCount ?? 0 })}
                </p>
              </div>
              <Button onClick={refreshHeroes} loading={refreshing} disabled={refreshing}>
                <RefreshCw size={16} /> {t('admin.catalog.refreshFromMlbb')}
              </Button>
            </div>
          </SectionCard>
        </>
      )}

      {/* Lane edit modal */}
      <Modal
        open={!!editKey}
        onClose={closeEdit}
        closeLabel={t('common.close')}
        title={t('admin.catalog.editLane')}
        subtitle={editKey || undefined}
        icon={<LayoutGrid size={20} />}
      >
        {form && (
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label={t('admin.catalog.name')}
                value={form.name}
                onChange={(e: any) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                label={t('admin.catalog.shortName')}
                value={form.shortName}
                onChange={(e: any) => setForm({ ...form, shortName: e.target.value })}
              />
            </div>
            <Textarea
              label={t('admin.catalog.description')}
              value={form.description}
              onChange={(e: any) => setForm({ ...form, description: e.target.value })}
            />
            <Input
              label={t('admin.catalog.iconUrl')}
              value={form.icon}
              onChange={(e: any) => setForm({ ...form, icon: e.target.value })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label={t('admin.catalog.color')}
                value={form.color}
                onChange={(e: any) => setForm({ ...form, color: e.target.value })}
                placeholder="#3b82f6"
              />
              <Input
                label={t('admin.catalog.sortOrder')}
                type="number"
                value={form.sort}
                onChange={(e: any) => setForm({ ...form, sort: e.target.value })}
              />
            </div>
            <Input
              label={t('admin.catalog.compatibleClasses')}
              value={form.compatibleClasses}
              onChange={(e: any) => setForm({ ...form, compatibleClasses: e.target.value })}
              placeholder="Fighter, Tank"
            />
            <div className="flex gap-2 pt-2">
              <Button type="submit" size="sm" loading={saving} disabled={saving}>
                <Check size={16} /> {t('common.save')}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={closeEdit}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
