'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { LayoutGrid, Pencil, Check, RefreshCw, Sword, Shield, Sparkles, Users, Map, Swords } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { fadeUp, stagger, still } from '@/lib/motion';
import {
  Card,
  SectionCard,
  SectionTitle,
  StatCard,
  Button,
  Badge,
  Input,
  Textarea,
  PageHeader,
  Skeleton,
} from '@/components/ui';
import Modal from '@/components/ui/Modal';
import RoleIcon from '@/components/game/RoleIcon';
import CatalogEntitySection, { type CatalogEntity } from './CatalogEntitySection';
import BuildsSection from './BuildsSection';
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
  const reduce = useReducedMotion();
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [heroCount, setHeroCount] = useState<number | null>(null);
  const [items, setItems] = useState<CatalogEntity[]>([]);
  const [emblems, setEmblems] = useState<CatalogEntity[]>([]);
  const [battleSpells, setBattleSpells] = useState<CatalogEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editKey, setEditKey] = useState<string | null>(null);
  const [form, setForm] = useState<LaneForm | null>(null);
  const [saving, setSaving] = useState(false);

  // Load lanes + hero count via GraphQL.
  const load = async () => {
    try {
      const [ls, hs, rs, its, embs, sps] = await Promise.all([
        api.catalog.lanes(),
        api.catalog.heroes(),
        api.catalog.roles(),
        api.game.items(),
        api.game.emblems(),
        api.game.battleSpells(),
      ]);
      setLanes(Array.isArray(ls) ? ls : []);
      setHeroCount(Array.isArray(hs) ? hs.length : 0);
      setRoles(Array.isArray(rs) ? rs : []);
      setItems(Array.isArray(its) ? its : []);
      setEmblems(Array.isArray(embs) ? embs : []);
      setBattleSpells(Array.isArray(sps) ? sps : []);
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
        eyebrow={t('nav.section.catalog')}
        icon={<LayoutGrid size={28} />}
        title={t('admin.catalog.title')}
        subtitle={t('admin.catalog.subtitle')}
        variant="purple"
        action={
          <Button onClick={refreshHeroes} loading={refreshing} disabled={refreshing || loading}>
            <RefreshCw size={16} /> {t('admin.catalog.refreshFromMlbb')}
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Card key={i} className="!p-5">
                <Skeleton lines={2} />
              </Card>
            ))}
          </div>
          <Card>
            <Skeleton lines={4} />
          </Card>
        </div>
      ) : (
        <motion.div
          className="space-y-6"
          variants={reduce ? still : stagger(0.06)}
          initial="hidden"
          animate="visible"
        >
          {/* Catalog KPIs: counts already loaded with the sections below */}
          <motion.div variants={reduce ? still : fadeUp} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label={t('admin.catalog.heroes')}
              value={heroCount ?? 0}
              hint={t('admin.catalog.heroesCount', { count: heroCount ?? 0 })}
              icon={<Swords size={18} />}
              accent="violet"
            />
            <StatCard label={t('admin.catalog.roles')} value={roles.length} icon={<Users size={18} />} accent="cyan" />
            <StatCard label={t('admin.catalog.lanes')} value={lanes.length} icon={<Map size={18} />} accent="green" />
            <StatCard label={t('admin.catalog.items')} value={items.length} icon={<Sword size={18} />} accent="gold" />
          </motion.div>

          {/* Hero roles section (read-only reference) */}
          <motion.div variants={reduce ? still : fadeUp}>
            <SectionCard>
              <SectionTitle
                className="mb-4"
                title={t('admin.catalog.roles')}
                action={<Badge variant="purple" size="sm">{roles.length}</Badge>}
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {roles.map((r) => (
                  <div
                    key={r.key}
                    className="flex flex-col items-center gap-2 rounded-lg border border-line-subtle bg-surface-2 p-3 text-center"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.icon} alt={r.name} referrerPolicy="no-referrer" className="h-10 w-10 object-contain" />
                    <span className="text-sm font-medium text-ink-1">{r.name}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </motion.div>

          {/* Lanes section */}
          <motion.div variants={reduce ? still : fadeUp}>
            <SectionCard>
              <SectionTitle
                className="mb-4"
                title={t('admin.catalog.lanes')}
                action={<Badge variant="purple" size="sm">{lanes.length}</Badge>}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {lanes.map((lane) => (
                  <Card key={lane.id} hover={false} className="!p-4 flex items-start gap-3">
                    {lane.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={lane.icon}
                        alt={lane.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-lg object-contain bg-surface-2 border border-line-subtle shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-surface-2 border border-line-subtle shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink-1 truncate">{lane.name}</p>
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
                        <p className="text-xs text-ink-2 mt-1.5 line-clamp-2">{lane.description}</p>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(lane)}>
                      <Pencil size={14} /> <span className="hidden sm:inline">{t('admin.catalog.edit')}</span>
                    </Button>
                  </Card>
                ))}
              </div>
            </SectionCard>
          </motion.div>


          {/* Build blocks: items, emblems and battle spells feed the hero builds tab */}
          <CatalogEntitySection
            title={t('admin.catalog.items')}
            icon={<Sword size={20} />}
            rows={items}
            extraFields={['type', 'gold']}
            onCreate={api.game.createItem}
            onUpdate={api.game.updateItem}
            onDelete={api.game.deleteItem}
            onChanged={load}
          />
          <CatalogEntitySection
            title={t('admin.catalog.emblems')}
            icon={<Shield size={20} />}
            rows={emblems}
            extraFields={['type']}
            onCreate={api.game.createEmblem}
            onUpdate={api.game.updateEmblem}
            onDelete={api.game.deleteEmblem}
            onChanged={load}
          />
          <CatalogEntitySection
            title={t('admin.catalog.battleSpells')}
            icon={<Sparkles size={20} />}
            rows={battleSpells}
            extraFields={['cooldown']}
            onCreate={api.game.createBattleSpell}
            onUpdate={api.game.updateBattleSpell}
            onDelete={api.game.deleteBattleSpell}
            onChanged={load}
          />
          <BuildsSection items={items} emblems={emblems} battleSpells={battleSpells} />
        </motion.div>
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
