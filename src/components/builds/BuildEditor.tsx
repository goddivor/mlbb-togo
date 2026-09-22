'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Hammer, Search, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, type CommunityBuild, type EmblemTalent } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/helpers';
import { Button, Input, Tabs, Textarea } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import { CatalogIcon } from '@/components/catalog/shared';
import { HeroPortrait } from '@/components/game/hero-meta/shared';
import { BUILD_LANES, BUILD_NOTES_MAX, BUILD_TITLE_MAX, buildErrorMessage } from './shared';

interface HeroOption {
  id: string;
  name: string;
  heroId?: number | null;
  thumb?: string | null;
  image?: string | null;
  laneKeys?: string[];
}

interface Entry {
  id: string;
  name: string;
  icon?: string | null;
  description?: string | null;
  enabled?: boolean | null;
}

interface ItemEntry extends Entry {
  category?: string | null;
  isComponent?: boolean;
}

interface Catalog {
  heroes: HeroOption[];
  items: ItemEntry[];
  categories: string[];
  emblems: Entry[];
  spells: Entry[];
  talents: EmblemTalent[];
}

// Catalog lists are shared by every editor opening of the session.
let catalogCache: Promise<Catalog> | null = null;

function loadCatalog(): Promise<Catalog> {
  if (!catalogCache) {
    catalogCache = Promise.all([
      api.heroes.list(),
      api.gameCatalog.items(),
      api.game.emblems(),
      api.game.battleSpells(),
      api.communityBuilds.talents(),
    ]).then(([heroes, items, emblems, spells, talents]: any[]) => {
      const catalog: Catalog = {
        heroes: [...(Array.isArray(heroes) ? heroes : [])].sort((a, b) => a.name.localeCompare(b.name)),
        items: items?.items ?? [],
        categories: (items?.categories ?? []).map((c: any) => c.name),
        emblems: (Array.isArray(emblems) ? emblems : []).filter((e: Entry) => e.enabled !== false),
        spells: (Array.isArray(spells) ? spells : []).filter((e: Entry) => e.enabled !== false),
        talents: Array.isArray(talents) ? talents : [],
      };
      if (!catalog.heroes.length || !catalog.items.length) catalogCache = null;
      return catalog;
    });
  }
  return catalogCache;
}

type Form = {
  heroId: string;
  title: string;
  notes: string;
  lane: string;
  itemIds: (string | null)[];
  emblemId: string | null;
  talentIds: string[];
  battleSpellId: string | null;
};

const EMPTY_SLOTS = [null, null, null, null, null, null];

const formFrom = (build?: CommunityBuild | null, heroRef?: string | number | null): Form => ({
  heroId: build ? String(build.hero.heroId ?? build.hero.id) : heroRef != null ? String(heroRef) : '',
  title: build?.title ?? '',
  notes: build?.notes ?? '',
  lane: build?.lane ?? '',
  itemIds: build ? EMPTY_SLOTS.map((_, i) => build.items[i]?.id ?? null) : [...EMPTY_SLOTS],
  emblemId: build?.emblem?.id ?? null,
  talentIds: build?.talents.map((x) => x.id) ?? [],
  battleSpellId: build?.battleSpell?.id ?? null,
});

const heroKey = (h: HeroOption) => String(h.heroId ?? h.id);

/**
 * Community build editor: hero, the 6 item slots (catalog picker with icons),
 * emblem, one talent per tier, battle spell, lane, title and notes. Saves as a
 * draft or publishes; editing a published build keeps it published.
 */
export default function BuildEditor({
  open,
  onClose,
  build,
  defaultHero,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  /** Build to edit (null = new build). */
  build?: CommunityBuild | null;
  /** Hero preselected for a new build (Moonton id or Mongo id). */
  defaultHero?: string | number | null;
  onSaved: (build: CommunityBuild) => void;
}) {
  const t = useT();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [form, setForm] = useState<Form>(() => formFrom(build, defaultHero));
  const [slot, setSlot] = useState<number | null>(0);
  const [heroQuery, setHeroQuery] = useState('');
  const [pickHero, setPickHero] = useState(false);
  const [itemQuery, setItemQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [finalOnly, setFinalOnly] = useState(true);
  const [saving, setSaving] = useState<'draft' | 'publish' | 'save' | null>(null);

  useEffect(() => {
    if (!open) return;
    const next = formFrom(build, defaultHero);
    setForm(next);
    setPickHero(!next.heroId);
    setHeroQuery('');
    setItemQuery('');
    setCategory('all');
    const firstEmpty = next.itemIds.findIndex((x) => !x);
    setSlot(firstEmpty === -1 ? null : firstEmpty);
    loadCatalog()
      .then(setCatalog)
      .catch(() => setCatalog(null));
  }, [open, build, defaultHero]);

  const byId = useMemo(() => {
    const map = new Map<string, Entry>();
    if (!catalog) return map;
    for (const list of [catalog.items, catalog.emblems, catalog.spells, catalog.talents]) {
      for (const e of list) map.set(e.id, e);
    }
    // Entries of the edited build stay displayable even when disabled since.
    for (const e of [...(build?.items ?? []), ...(build?.talents ?? []), build?.emblem, build?.battleSpell]) {
      if (e && !map.has(e.id)) map.set(e.id, e);
    }
    return map;
  }, [catalog, build]);

  const hero = catalog?.heroes.find((h) => heroKey(h) === form.heroId || h.id === form.heroId) ?? null;

  const heroes = useMemo(() => {
    const q = heroQuery.trim().toLowerCase();
    return (catalog?.heroes ?? []).filter((h) => !q || h.name.toLowerCase().includes(q));
  }, [catalog, heroQuery]);

  const items = useMemo(() => {
    const q = itemQuery.trim().toLowerCase();
    return (catalog?.items ?? []).filter(
      (i) =>
        (!finalOnly || !i.isComponent) &&
        (category === 'all' || (i.category ?? '').toLowerCase() === category) &&
        (!q || i.name.toLowerCase().includes(q)),
    );
  }, [catalog, itemQuery, category, finalOnly]);

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  const chooseItem = (id: string) => {
    if (slot == null) return;
    const next = [...form.itemIds];
    const existing = next.indexOf(id);
    if (existing !== -1) next[existing] = null; // move instead of duplicating
    next[slot] = id;
    set({ itemIds: next });
    const empty = next.findIndex((x, i) => !x && i !== slot);
    setSlot(empty === -1 ? null : empty);
  };

  const clearSlot = (i: number) => {
    const next = [...form.itemIds];
    next[i] = null;
    set({ itemIds: next });
    setSlot(i);
  };

  const toggleTalent = (talent: EmblemTalent) => {
    const tierOf = (id: string) => catalog?.talents.find((x) => x.id === id)?.tier;
    setForm((f) => {
      const kept = f.talentIds.filter((id) => id !== talent.id && tierOf(id) !== talent.tier);
      return {
        ...f,
        talentIds: f.talentIds.includes(talent.id) ? kept : [...kept, talent.id],
      };
    });
  };

  const titleOk = form.title.trim().length >= 3 && form.title.trim().length <= BUILD_TITLE_MAX;
  const itemCount = form.itemIds.filter(Boolean).length;

  const submit = async (mode: 'draft' | 'publish' | 'save') => {
    if (!form.heroId) return toast.error(t('communityBuilds.editor.pickHeroFirst'));
    if (!titleOk) return toast.error(t('communityBuilds.error.title_length'));
    if (mode === 'publish' && itemCount === 0) return toast.error(t('communityBuilds.error.publish_no_items'));
    setSaving(mode);
    const payload = {
      title: form.title.trim(),
      notes: form.notes.trim() || null,
      lane: form.lane || null,
      itemIds: form.itemIds.filter((x): x is string => !!x),
      emblemId: form.emblemId,
      talentIds: form.talentIds,
      battleSpellId: form.battleSpellId,
    };
    try {
      let saved: CommunityBuild;
      if (build) {
        saved = await api.communityBuilds.update(build.id, payload);
        if (mode === 'publish' && saved.status === 'draft') saved = await api.communityBuilds.publish(build.id);
      } else {
        saved = await api.communityBuilds.create({
          ...payload,
          heroId: form.heroId,
          publish: mode === 'publish',
        });
      }
      toast.success(
        saved.status === 'published' && mode === 'publish'
          ? t('communityBuilds.toast.published')
          : t('communityBuilds.toast.saved'),
      );
      onSaved(saved);
    } catch (err) {
      toast.error(buildErrorMessage(t, err));
    } finally {
      setSaving(null);
    }
  };

  const sectionTitle = 'mb-2 text-[11px] font-semibold uppercase tracking-eyebrow text-ink-3';
  const chip = (active: boolean) =>
    cn(
      'flex flex-col items-center gap-1 rounded border p-1.5 text-center transition-colors duration-fast',
      active ? 'border-primary bg-primary/10' : 'border-line-subtle hover:border-line-strong hover:bg-surface-2',
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeLabel={t('common.close')}
      size="xl"
      icon={<Hammer size={20} />}
      title={build ? t('communityBuilds.editor.editTitle') : t('communityBuilds.editor.newTitle')}
      subtitle={hero?.name}
    >
      {!catalog ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-line-strong border-t-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Hero */}
          <section>
            <p className={sectionTitle}>{t('communityBuilds.editor.hero')}</p>
            {hero && !pickHero ? (
              <div className="flex items-center gap-3">
                <HeroPortrait src={hero.thumb || hero.image} name={hero.name} size={48} />
                <span className="font-display text-lg font-bold text-ink-1">{hero.name}</span>
                {!build && (
                  <Button size="sm" variant="ghost" onClick={() => setPickHero(true)}>
                    {t('communityBuilds.editor.changeHero')}
                  </Button>
                )}
              </div>
            ) : (
              <div>
                <div className="relative mb-2 w-full sm:max-w-xs">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
                  />
                  <input
                    value={heroQuery}
                    onChange={(e) => setHeroQuery(e.target.value)}
                    placeholder={t('communityBuilds.editor.searchHero')}
                    aria-label={t('communityBuilds.editor.searchHero')}
                    className="w-full rounded border border-line-strong bg-surface-1 py-2 pl-9 pr-3 text-sm text-ink-1 outline-none placeholder:text-ink-3 focus:border-primary focus:ring-2 focus:ring-primary/25 dark:bg-surface-0/60"
                  />
                </div>
                <div className="grid max-h-56 grid-cols-4 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-8">
                  {heroes.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => {
                        set({
                          heroId: heroKey(h),
                          lane: form.lane || h.laneKeys?.[0] || '',
                        });
                        setPickHero(false);
                      }}
                      className={chip(heroKey(h) === form.heroId)}
                    >
                      <HeroPortrait src={h.thumb || h.image} name={h.name} size={40} />
                      <span className="line-clamp-1 w-full text-[10px] text-ink-2">{h.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Title, lane, notes */}
          <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input
              label={t('communityBuilds.editor.title')}
              value={form.title}
              maxLength={BUILD_TITLE_MAX}
              placeholder={t('communityBuilds.editor.titlePlaceholder')}
              onChange={(e: any) => set({ title: e.target.value })}
            />
            <div>
              <p className="mb-2 text-sm font-medium text-ink-1">{t('communityBuilds.editor.lane')}</p>
              <div className="no-scrollbar overflow-x-auto">
                <Tabs
                  size="sm"
                  tabs={[
                    { id: '', label: t('communityBuilds.editor.anyLane') },
                    ...BUILD_LANES.map((l) => ({
                      id: l,
                      label: t(`heroMeta.lane.${l}`),
                    })),
                  ]}
                  active={form.lane}
                  onChange={(id: string) => set({ lane: id })}
                />
              </div>
            </div>
          </section>

          {/* Items */}
          <section>
            <p className={sectionTitle}>
              {t('heroes.builds.items')} <span className="num">({itemCount}/6)</span>
            </p>
            <div className="grid max-w-md grid-cols-6 gap-2">
              {form.itemIds.map((id, i) => {
                const item = id ? byId.get(id) : null;
                return (
                  <div key={i} className="relative">
                    <button
                      type="button"
                      onClick={() => setSlot(i)}
                      aria-label={`${t('admin.catalog.slot')} ${i + 1}${item ? ` : ${item.name}` : ''}`}
                      className={cn(
                        'flex aspect-square w-full items-center justify-center rounded border transition-colors',
                        slot === i
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-dashed border-line-strong hover:border-primary/60',
                        item?.enabled === false && 'opacity-50',
                      )}
                      title={item?.name}
                    >
                      {item ? (
                        <CatalogIcon src={item.icon} alt={item.name} size={40} />
                      ) : (
                        <span className="num text-xs text-ink-3">{i + 1}</span>
                      )}
                    </button>
                    {item && (
                      <button
                        type="button"
                        onClick={() => clearSlot(i)}
                        aria-label={t('communityBuilds.editor.removeItem', {
                          name: item.name,
                        })}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-surface-3 text-ink-2 ring-1 ring-line-strong hover:bg-accent-red hover:text-white"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {slot != null && (
              <div className="mt-3 rounded-lg border border-line-subtle bg-surface-2/40 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-semibold text-ink-2">
                    {t('communityBuilds.editor.pickItemFor', { n: slot + 1 })}
                  </p>
                  <label className="inline-flex items-center gap-2 text-xs text-ink-2">
                    <input
                      type="checkbox"
                      checked={finalOnly}
                      onChange={(e) => setFinalOnly(e.target.checked)}
                      className="accent-[rgb(var(--primary))]"
                    />
                    {t('communityBuilds.editor.finalOnly')}
                  </label>
                </div>
                <div className="relative mt-2">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
                  />
                  <input
                    value={itemQuery}
                    onChange={(e) => setItemQuery(e.target.value)}
                    placeholder={t('catalog.items.search')}
                    aria-label={t('catalog.items.search')}
                    className="w-full rounded border border-line-strong bg-surface-1 py-2 pl-9 pr-3 text-sm text-ink-1 outline-none placeholder:text-ink-3 focus:border-primary focus:ring-2 focus:ring-primary/25 dark:bg-surface-0/60"
                  />
                </div>
                <div className="mt-2 overflow-x-auto">
                  <Tabs
                    variant="underline"
                    size="sm"
                    tabs={[
                      { id: 'all', label: t('catalog.items.allCategories') },
                      ...catalog.categories.map((c) => ({
                        id: c.toLowerCase(),
                        label: c,
                      })),
                    ]}
                    active={category}
                    onChange={setCategory}
                  />
                </div>
                <div className="mt-2 grid max-h-60 grid-cols-4 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-8">
                  {items.map((item) => {
                    const used = form.itemIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => chooseItem(item.id)}
                        title={item.description || item.name}
                        className={chip(used)}
                      >
                        <CatalogIcon src={item.icon} alt="" size={36} />
                        <span className="line-clamp-2 w-full text-[10px] leading-tight text-ink-2">{item.name}</span>
                      </button>
                    );
                  })}
                  {items.length === 0 && (
                    <p className="col-span-full py-6 text-center text-sm text-ink-3">
                      {t('communityBuilds.editor.noItem')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Emblem, talents, spell */}
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div>
              <p className={sectionTitle}>{t('heroes.builds.emblem')}</p>
              <div className="flex flex-wrap gap-1.5">
                {catalog.emblems.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => set({ emblemId: form.emblemId === e.id ? null : e.id })}
                    aria-pressed={form.emblemId === e.id}
                    title={e.description || e.name}
                    className={cn(chip(form.emblemId === e.id), 'w-[72px]')}
                  >
                    <CatalogIcon src={e.icon} alt="" size={32} round />
                    <span className="line-clamp-2 w-full text-[10px] leading-tight text-ink-2">{e.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className={sectionTitle}>{t('heroes.builds.battleSpell')}</p>
              <div className="flex flex-wrap gap-1.5">
                {catalog.spells.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      set({
                        battleSpellId: form.battleSpellId === s.id ? null : s.id,
                      })
                    }
                    aria-pressed={form.battleSpellId === s.id}
                    title={s.description || s.name}
                    className={cn(chip(form.battleSpellId === s.id), 'w-[72px]')}
                  >
                    <CatalogIcon src={s.icon} alt="" size={32} round />
                    <span className="line-clamp-1 w-full text-[10px] text-ink-2">{s.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section>
            <p className={sectionTitle}>{t('communityBuilds.editor.talents')}</p>
            <div className="space-y-2">
              {[1, 2, 3].map((tier) => (
                <div key={tier} className="flex items-start gap-1.5">
                  <span className="w-16 shrink-0 pt-2.5 text-[11px] font-semibold text-ink-3">
                    {tier === 3 ? t('communityBuilds.editor.coreTier') : t('communityBuilds.editor.tier', { n: tier })}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {catalog.talents
                      .filter((x) => x.tier === tier)
                      .map((talent) => {
                        const active = form.talentIds.includes(talent.id);
                        return (
                          <button
                            key={talent.id}
                            type="button"
                            onClick={() => toggleTalent(talent)}
                            aria-pressed={active}
                            aria-label={talent.name}
                            title={`${talent.name}${talent.description ? `\n${talent.description}` : ''}`}
                            className={cn(
                              'rounded-full p-0.5 ring-2 transition',
                              active ? 'ring-primary' : 'ring-transparent opacity-70 hover:opacity-100',
                            )}
                          >
                            <CatalogIcon src={talent.icon} alt="" size={32} round />
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
            {form.talentIds.length > 0 && (
              <p className="mt-2 text-xs text-ink-2">
                {form.talentIds
                  .map((id) => byId.get(id)?.name)
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
          </section>

          <section>
            <Textarea
              label={t('communityBuilds.editor.notes')}
              value={form.notes}
              maxLength={BUILD_NOTES_MAX}
              rows={4}
              placeholder={t('communityBuilds.editor.notesPlaceholder')}
              onChange={(e: any) => set({ notes: e.target.value })}
            />
            <p className="mt-1 text-right text-[11px] text-ink-3 num">
              {form.notes.length}/{BUILD_NOTES_MAX}
            </p>
          </section>

          <footer className="flex flex-col-reverse gap-2 border-t border-line-subtle pt-4 sm:flex-row sm:justify-end">
            <Button variant="ghost" size="sm" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            {build && build.status !== 'draft' ? (
              <Button size="sm" onClick={() => submit('save')} loading={saving === 'save'} disabled={!!saving}>
                <Check size={16} /> {t('common.save')}
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => submit('draft')}
                  loading={saving === 'draft'}
                  disabled={!!saving}
                >
                  <Check size={16} /> {t('communityBuilds.editor.saveDraft')}
                </Button>
                <Button size="sm" onClick={() => submit('publish')} loading={saving === 'publish'} disabled={!!saving}>
                  <Send size={16} /> {t('communityBuilds.editor.publish')}
                </Button>
              </>
            )}
          </footer>
        </div>
      )}
    </Modal>
  );
}
