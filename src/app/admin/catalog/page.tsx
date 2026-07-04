'use client';

import { useEffect, useState } from 'react';
import { LayoutGrid, Pencil, Check, RefreshCw, Swords } from 'lucide-react';
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
  StatCard,
  LoadingSpinner,
} from '@/components/ui';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

// Forme d'une lane telle que renvoyée par GraphQL / REST.
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

// Champs éditables dans la modale (classes en chaîne séparée par virgules).
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
  const [heroCount, setHeroCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editKey, setEditKey] = useState<string | null>(null);
  const [form, setForm] = useState<LaneForm | null>(null);
  const [saving, setSaving] = useState(false);

  // Charge lanes + nombre de héros via GraphQL.
  const load = async () => {
    try {
      const [ls, hs] = await Promise.all([
        api.catalog.lanes(),
        api.catalog.heroes(),
      ]);
      setLanes(Array.isArray(ls) ? ls : []);
      setHeroCount(Array.isArray(hs) ? hs.length : 0);
    } catch (e: any) {
      toast.error(e?.message || 'Erreur de chargement du catalogue');
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
      toast.success('Lane mise à jour');
      closeEdit();
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Échec de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const refreshHeroes = async () => {
    setRefreshing(true);
    try {
      const res = await api.heroes.refresh();
      toast.success(`${res?.updated ?? 0} héros mis à jour`);
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Échec du rafraîchissement');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        icon={<LayoutGrid size={28} />}
        title={t('admin.catalog.title')}
        subtitle="Lanes et synchronisation des héros"
        variant="purple"
      >
        <div className="grid grid-cols-2 gap-3">
          <StatCard translucent label="Lanes" value={lanes.length} icon={<LayoutGrid size={18} />} />
          <StatCard translucent label="Héros" value={heroCount ?? '—'} icon={<Swords size={18} />} />
        </div>
      </PageHeader>

      {loading ? (
        <LoadingSpinner size="lg" className="py-24" />
      ) : (
        <>
          {/* Section Lanes */}
          <SectionCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Lanes</h2>
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
                      className="w-12 h-12 rounded-lg object-contain bg-gaming-surface border border-gaming-border shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gaming-surface border border-gaming-border shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white truncate">{lane.name}</p>
                      {lane.shortName && (
                        <Badge variant="default" size="sm">
                          {lane.shortName}
                        </Badge>
                      )}
                    </div>
                    {lane.compatibleClasses?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {lane.compatibleClasses.map((c) => (
                          <Badge key={c} variant="neon" size="sm">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {lane.description && (
                      <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{lane.description}</p>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(lane)}>
                    <Pencil size={14} /> Modifier
                  </Button>
                </Card>
              ))}
            </div>
          </SectionCard>

          {/* Section Héros */}
          <SectionCard>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Héros</h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  {heroCount ?? 0} héros en base. Resynchronise depuis les serveurs MLBB.
                </p>
              </div>
              <Button onClick={refreshHeroes} loading={refreshing} disabled={refreshing}>
                <RefreshCw size={16} /> Rafraîchir depuis MLBB
              </Button>
            </div>
          </SectionCard>
        </>
      )}

      {/* Modale d'édition d'une lane */}
      <Modal
        open={!!editKey}
        onClose={closeEdit}
        closeLabel={t('common.close')}
        title="Modifier la lane"
        subtitle={editKey || undefined}
        icon={<LayoutGrid size={20} />}
      >
        {form && (
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nom"
                value={form.name}
                onChange={(e: any) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                label="Nom court"
                value={form.shortName}
                onChange={(e: any) => setForm({ ...form, shortName: e.target.value })}
              />
            </div>
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e: any) => setForm({ ...form, description: e.target.value })}
            />
            <Input
              label="Icône (URL)"
              value={form.icon}
              onChange={(e: any) => setForm({ ...form, icon: e.target.value })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Couleur"
                value={form.color}
                onChange={(e: any) => setForm({ ...form, color: e.target.value })}
                placeholder="#3b82f6"
              />
              <Input
                label="Ordre (sort)"
                type="number"
                value={form.sort}
                onChange={(e: any) => setForm({ ...form, sort: e.target.value })}
              />
            </div>
            <Input
              label="Classes compatibles (séparées par des virgules)"
              value={form.compatibleClasses}
              onChange={(e: any) => setForm({ ...form, compatibleClasses: e.target.value })}
              placeholder="Fighter, Tank"
            />
            <div className="flex gap-2 pt-2">
              <Button type="submit" size="sm" loading={saving} disabled={saving}>
                <Check size={16} /> Enregistrer
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={closeEdit}>
                Annuler
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
