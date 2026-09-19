'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Check, Swords } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, mlbbImg } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Badge, Button, Input, LoadingSpinner, SectionCard, Select, Textarea } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import type { CatalogEntity } from './CatalogEntitySection';

interface Hero {
  id: string;
  name: string;
  heroId?: number | null;
}

interface Build {
  id: string;
  name?: string | null;
  description?: string | null;
  priority?: number | null;
  sort?: number | null;
  items?: CatalogEntity[];
  emblem?: CatalogEntity | null;
  battleSpell?: CatalogEntity | null;
  itemIds?: string[];
  emblemId?: string | null;
  battleSpellId?: string | null;
}

/** Builds are addressed by the Moonton numeric id, which the hero modal sends. */
const heroRef = (hero: Hero) => String(hero.heroId ?? hero.id);

const SLOTS = [0, 1, 2, 3, 4, 5];

type Form = {
  name: string;
  description: string;
  priority: string;
  sort: string;
  itemIds: string[];
  emblemId: string;
  battleSpellId: string;
};

const emptyForm: Form = {
  name: '',
  description: '',
  priority: '0',
  sort: '0',
  itemIds: ['', '', '', '', '', ''],
  emblemId: '',
  battleSpellId: '',
};

export default function BuildsSection({
  items,
  emblems,
  battleSpells,
}: {
  items: CatalogEntity[];
  emblems: CatalogEntity[];
  battleSpells: CatalogEntity[];
}) {
  const t = useT();
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [heroKey, setHeroKey] = useState('');
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Build | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Build | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.heroes
      .list()
      .then((list: Hero[]) => {
        const sorted = [...(Array.isArray(list) ? list : [])].sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        setHeroes(sorted);
        if (sorted.length) setHeroKey(heroRef(sorted[0]));
      })
      .catch(() => setHeroes([]));
  }, []);

  const loadBuilds = useCallback(async () => {
    if (!heroKey) return;
    setLoading(true);
    try {
      const list = await api.builds.byHero(heroKey);
      setBuilds(Array.isArray(list) ? list : []);
    } catch {
      setBuilds([]);
    } finally {
      setLoading(false);
    }
  }, [heroKey]);

  useEffect(() => {
    loadBuilds();
  }, [loadBuilds]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (build: Build) => {
    const ids = (build.items || []).map((i) => i.id);
    setEditing(build);
    setForm({
      name: build.name || '',
      description: build.description || '',
      priority: String(build.priority ?? 0),
      sort: String(build.sort ?? 0),
      itemIds: SLOTS.map((i) => ids[i] || ''),
      emblemId: build.emblem?.id || '',
      battleSpellId: build.battleSpell?.id || '',
    });
    setOpen(true);
  };

  const setSlot = (index: number, value: string) => {
    const next = [...form.itemIds];
    next[index] = value;
    setForm({ ...form, itemIds: next });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroKey) return;
    setSaving(true);
    try {
      const blank = editing ? null : undefined;
      const payload: Record<string, unknown> = {
        name: form.name.trim() || blank,
        description: form.description.trim() || blank,
        itemIds: form.itemIds.filter(Boolean),
        emblemId: form.emblemId || blank,
        battleSpellId: form.battleSpellId || blank,
        priority: Number(form.priority) || 0,
        sort: Number(form.sort) || 0,
      };
      if (editing) await api.builds.update(heroKey, editing.id, payload);
      else await api.builds.create(heroKey, payload);
      toast.success(t('admin.catalog.saved'));
      setOpen(false);
      await loadBuilds();
    } catch (err: any) {
      toast.error(err?.message || t('admin.catalog.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.builds.delete(heroKey, toDelete.id);
      toast.success(t('admin.catalog.deleted'));
      setToDelete(null);
      await loadBuilds();
    } catch (err: any) {
      toast.error(err?.message || t('admin.catalog.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  const heroOptions = heroes.map((h) => ({ value: heroRef(h), label: h.name }));
  const itemOptions = [
    { value: '', label: t('admin.catalog.noneOption') },
    ...items.map((i) => ({ value: i.id, label: i.name })),
  ];
  const emblemOptions = [
    { value: '', label: t('admin.catalog.noneOption') },
    ...emblems.map((e) => ({ value: e.id, label: e.name })),
  ];
  const spellOptions = [
    { value: '', label: t('admin.catalog.noneOption') },
    ...battleSpells.map((s) => ({ value: s.id, label: s.name })),
  ];

  return (
    <SectionCard>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <h2 className="mb-2 text-lg font-semibold text-black dark:text-white">
            {t('admin.catalog.builds')}
          </h2>
          <Select
            label={t('admin.catalog.pickHero')}
            options={heroOptions}
            value={heroKey}
            onChange={(e: any) => setHeroKey(e.target.value)}
          />
        </div>
        <Button size="sm" onClick={openCreate} disabled={!heroKey}>
          <Plus size={16} /> {t('admin.catalog.newBuild')}
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner className="py-10" />
      ) : builds.length === 0 ? (
        <p className="py-6 text-center text-sm text-body dark:text-bodydark">
          {t('admin.catalog.noBuild')}
        </p>
      ) : (
        <div className="space-y-3">
          {builds.map((build) => (
            <div
              key={build.id}
              className="rounded-lg border border-stroke bg-gray-2 p-4 dark:border-strokedark dark:bg-meta-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-black dark:text-white">
                    {build.name || t('heroes.builds.unnamed')}
                  </p>
                  <Badge variant="purple" size="sm">
                    {t('admin.catalog.priority')} {build.priority ?? 0}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(build)}>
                    <Pencil size={14} /> {t('admin.catalog.edit')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setToDelete(build)}>
                    <Trash2 size={14} className="text-danger" />
                  </Button>
                </div>
              </div>
              {build.description && (
                <p className="mt-1 text-xs text-body dark:text-bodydark">{build.description}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(build.items || []).map((item, i) => (
                    <span
                      key={`${item.id}-${i}`}
                      className="flex items-center gap-1 rounded border border-stroke bg-white px-2 py-1 text-xs text-black dark:border-strokedark dark:bg-boxdark dark:text-white"
                    >
                      {item.icon && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mlbbImg(item.icon, 80)}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="h-4 w-4 rounded object-cover"
                        />
                      )}
                      {item.name}
                    </span>
                  ))}
                </div>
                {build.emblem && (
                  <Badge size="sm">
                    {t('heroes.builds.emblem')}: {build.emblem.name}
                  </Badge>
                )}
                {build.battleSpell && (
                  <Badge size="sm">
                    {t('heroes.builds.battleSpell')}: {build.battleSpell.name}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        closeLabel={t('common.close')}
        size="lg"
        title={editing ? t('admin.catalog.editBuild') : t('admin.catalog.newBuild')}
        subtitle={heroes.find((h) => heroRef(h) === heroKey)?.name}
        icon={<Swords size={20} />}
      >
        <form onSubmit={submit} className="space-y-3">
          <Input
            label={t('admin.catalog.buildName')}
            value={form.name}
            onChange={(e: any) => setForm({ ...form, name: e.target.value })}
            placeholder={t('heroes.builds.unnamed')}
          />
          <Textarea
            label={t('admin.catalog.description')}
            value={form.description}
            onChange={(e: any) => setForm({ ...form, description: e.target.value })}
          />
          <div>
            <p className="mb-2 text-sm font-medium text-black dark:text-white">
              {t('admin.catalog.itemSlots')}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {SLOTS.map((i) => (
                <Select
                  key={i}
                  label={`${t('admin.catalog.slot')} ${i + 1}`}
                  options={itemOptions}
                  value={form.itemIds[i]}
                  onChange={(e: any) => setSlot(i, e.target.value)}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label={t('heroes.builds.emblem')}
              options={emblemOptions}
              value={form.emblemId}
              onChange={(e: any) => setForm({ ...form, emblemId: e.target.value })}
            />
            <Select
              label={t('heroes.builds.battleSpell')}
              options={spellOptions}
              value={form.battleSpellId}
              onChange={(e: any) => setForm({ ...form, battleSpellId: e.target.value })}
            />
            <Input
              label={t('admin.catalog.priority')}
              type="number"
              value={form.priority}
              onChange={(e: any) => setForm({ ...form, priority: e.target.value })}
            />
            <Input
              label={t('admin.catalog.sortOrder')}
              type="number"
              value={form.sort}
              onChange={(e: any) => setForm({ ...form, sort: e.target.value })}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" size="sm" loading={saving} disabled={saving}>
              <Check size={16} /> {t('common.save')}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        variant="danger"
        loading={deleting}
        title={t('admin.catalog.deleteBuildTitle')}
        message={t('admin.catalog.deleteBuildMessage')}
        confirmLabel={t('admin.catalog.delete')}
        cancelLabel={t('common.cancel')}
        closeLabel={t('common.close')}
      />
    </SectionCard>
  );
}
