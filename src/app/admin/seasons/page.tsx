'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  CalendarDays,
  Flag,
  Lock,
  Trophy,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { useSeasonStore, isLiveSeason, type Season, type SeasonSummary } from '@/store/useSeasonStore';
import { Card, Button, PageHeader, EmptyState, LoadingSpinner, Input, Textarea } from '@/components/ui';
import { fadeUp, stagger, still } from '@/lib/motion';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { SeasonStatusBadge, SeasonPodium, seasonPeriod, fmtSeasonDate } from '@/components/seasons/shared';
import { useSeasonLifecycle } from '@/components/admin/seasons/useSeasonLifecycle';
import SeasonLifecycleButtons from '@/components/admin/seasons/SeasonLifecycleButtons';
import SeasonLifecycleModals from '@/components/admin/seasons/SeasonLifecycleModals';
import toast from 'react-hot-toast';
import ImageUpload from '@/components/ui/ImageUpload';

type SeasonForm = {
  name: string;
  slug: string;
  number: string;
  theme: string;
  slogan: string;
  description: string;
  startDate: string;
  endDate: string;
  playoffsStartDate: string;
  banner: string;
  color: string;
};
const emptyForm: SeasonForm = {
  name: '',
  slug: '',
  number: '',
  theme: '',
  slogan: '',
  description: '',
  startDate: '',
  endDate: '',
  playoffsStartDate: '',
  banner: '',
  color: '',
};

// Compact field sizing for the modal form (primitives default to a taller field).
const fieldCls = '!px-3 !py-2 text-sm';

const day = (v: string | null) => (v ? v.slice(0, 10) : '');

export default function AdminSeasonsPage() {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const reduce = useReducedMotion();
  const refreshStore = useSeasonStore((s) => s.load);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<SeasonForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Season | null>(null);
  const [confirming, setConfirming] = useState(false);
  // Frozen summary viewer for closed seasons.
  const [viewing, setViewing] = useState<Season | null>(null);

  const errMsg = (e: any) => e?.message || t('admin.esport.errorGeneric');

  const load = async () => {
    try {
      const data = await api.esport.seasons();
      setSeasons(Array.isArray(data) ? data : []);
      void refreshStore(true);
    } catch (e: any) {
      toast.error(errMsg(e));
    }
  };

  // Lifecycle actions (activate / playoffs / close / reopen / settings) shared with /admin/league.
  const lifecycle = useSeasonLifecycle(load);

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

  const openEdit = (s: Season) => {
    setEditId(s.id);
    setForm({
      name: s.name || '',
      slug: s.slug || '',
      number: s.number ? String(s.number) : '',
      theme: s.theme || '',
      slogan: s.slogan || '',
      description: s.description || '',
      startDate: day(s.startDate),
      endDate: day(s.endDate),
      playoffsStartDate: day(s.playoffsStartDate),
      banner: s.banner || '',
      color: s.color || '',
    });
    setFormOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const num = form.number.trim() ? Number(form.number) : null;
      const base = {
        name: form.name.trim(),
        theme: form.theme.trim() || null,
        slogan: form.slogan.trim() || null,
        description: form.description.trim() || null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        playoffsStartDate: form.playoffsStartDate || null,
        banner: form.banner.trim() || null,
        color: form.color.trim() || null,
      };
      if (editId) {
        await api.esport.updateSeason(editId, {
          ...base,
          ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
          ...(num && Number.isFinite(num) ? { number: num } : {}),
        });
      } else {
        // Create: omit nulls (the DTO only accepts strings / undefined).
        const payload: any = {};
        for (const [k, v] of Object.entries(base)) if (v != null) payload[k] = v;
        if (form.slug.trim()) payload.slug = form.slug.trim();
        if (num && Number.isFinite(num)) payload.number = num;
        await api.esport.createSeason(payload);
      }
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
    if (!deleting) return;
    setConfirming(true);
    try {
      await api.esport.deleteSeason(deleting.id);
      toast.success(t('admin.esport.deleted'));
      await load();
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setConfirming(false);
      setDeleting(null);
    }
  };

  const field = (label: string, node: React.ReactNode, hint?: string) => (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink-2">{label}</label>
      {node}
      {hint && <p className="mt-1 text-[11px] text-ink-3">{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<CalendarDays size={28} />}
        eyebrow={t('nav.section.esport')}
        title={t('admin.seasons.title')}
        subtitle={t('admin.seasons.subtitle')}
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
        <motion.div
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
          variants={reduce ? still : stagger()}
          initial="hidden"
          animate="visible"
        >
          {seasons.map((s) => {
            const period = seasonPeriod(s, lang);
            const accent = s.color || undefined;
            const live = isLiveSeason(s);
            return (
              <motion.div key={s.id} variants={reduce ? still : fadeUp} className="h-full">
                <Card glow={live} className="flex h-full flex-col overflow-hidden !p-0">
                  {/* Banner / colour strip */}
                  <div
                    className="relative h-28 bg-gradient-to-r from-primary/80 to-accent-violet/70"
                    style={
                      s.banner
                        ? { backgroundImage: `url(${s.banner})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                        : accent
                          ? { background: `linear-gradient(135deg, ${accent}, ${accent}66)` }
                          : undefined
                    }
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e19]/85 via-[#0a0e19]/30 to-transparent" />
                    <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        {s.number != null && (
                          <p className="eyebrow mb-1 num !text-white/75">{t('seasons.numberLabel', { n: s.number })}</p>
                        )}
                        <p className="truncate font-display text-lg font-bold tracking-tight2 text-white">{s.name}</p>
                      </div>
                      <SeasonStatusBadge status={s.status} t={t} className="shrink-0 bg-[#0a0e19]/70 backdrop-blur-sm" />
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-2 p-4">
                    {(s.theme || s.slogan) && (
                      <div>
                        {s.theme && (
                          <p className="inline-flex items-center gap-1 text-sm font-semibold text-ink-1">
                            <Sparkles size={13} className="text-accent-gold" /> {s.theme}
                          </p>
                        )}
                        {s.slogan && <p className="text-xs italic text-ink-2">« {s.slogan} »</p>}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-2 num">
                      {period && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays size={12} /> {period}
                        </span>
                      )}
                      {s.playoffsStartDate && (
                        <span className="inline-flex items-center gap-1">
                          <Flag size={12} /> {t('seasons.playoffsFrom', { date: fmtSeasonDate(s.playoffsStartDate, lang) || '' })}
                        </span>
                      )}
                      {s.closedAt && (
                        <span className="inline-flex items-center gap-1">
                          <Lock size={12} /> {t('seasons.closedOn', { date: fmtSeasonDate(s.closedAt, lang) || '' })}
                        </span>
                      )}
                      {s.slug && <span className="font-mono text-ink-3">/{s.slug}</span>}
                    </div>
                    {s.description && (
                      <p className="line-clamp-3 whitespace-pre-line text-xs text-ink-2">{s.description}</p>
                    )}
                    {s.summary?.champion && (
                      <p className="inline-flex items-center gap-1 text-xs text-accent-gold">
                        <Trophy size={12} /> {t('seasons.champion')} : <b>{s.summary.champion.team.name}</b>
                      </p>
                    )}

                    {/* Lifecycle actions */}
                    <div className="mt-auto flex flex-wrap gap-1.5 border-t border-line-subtle pt-3">
                      <SeasonLifecycleButtons season={s} lifecycle={lifecycle} />
                      {s.status === 'closed' && (
                        <Button size="sm" variant="outline" onClick={() => setViewing(s)}>
                          <Trophy size={14} /> {t('admin.seasons.summary.view')}
                        </Button>
                      )}
                      <span className="flex-1" />
                      {s.slug && (
                        <Link
                          href={`/seasons/${s.slug}`}
                          target="_blank"
                          className="inline-flex items-center rounded px-2 py-1.5 text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink-1"
                          title={t('seasons.viewPublic')}
                        >
                          <ExternalLink size={14} />
                        </Link>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                        <Pencil size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={s.status === 'active' || s.status === 'playoffs'}
                        onClick={() => setDeleting(s)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Create / edit */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        closeLabel={t('common.close')}
        title={editId ? t('admin.seasons.edit') : t('admin.seasons.new')}
        icon={<CalendarDays size={20} />}
        headerVariant={editId ? 'plain' : 'gradient'}
        size="lg"
      >
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_6rem] gap-3">
            {field(
              t('admin.seasons.name'),
              <Input className={fieldCls} value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} required />,
            )}
            {field(
              t('admin.seasons.number'),
              <Input
                type="number"
                min={1}
                className={fieldCls}
                value={form.number}
                placeholder={t('admin.seasons.auto')}
                onChange={(e: any) => setForm({ ...form, number: e.target.value })}
              />,
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {field(
              t('admin.seasons.theme'),
              <Input
                className={fieldCls}
                value={form.theme}
                placeholder={t('admin.seasons.themePlaceholder')}
                onChange={(e: any) => setForm({ ...form, theme: e.target.value })}
              />,
            )}
            {field(
              t('admin.seasons.slogan'),
              <Input
                className={fieldCls}
                value={form.slogan}
                placeholder={t('admin.seasons.sloganPlaceholder')}
                onChange={(e: any) => setForm({ ...form, slogan: e.target.value })}
              />,
            )}
          </div>
          {field(
            t('admin.seasons.description'),
            <Textarea
              className={fieldCls}
              rows={3}
              value={form.description}
              onChange={(e: any) => setForm({ ...form, description: e.target.value })}
            />,
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {field(
              t('admin.seasons.startDate'),
              <Input type="date" className={fieldCls} value={form.startDate} onChange={(e: any) => setForm({ ...form, startDate: e.target.value })} />,
            )}
            {field(
              t('admin.seasons.playoffsDate'),
              <Input
                type="date"
                className={fieldCls}
                value={form.playoffsStartDate}
                onChange={(e: any) => setForm({ ...form, playoffsStartDate: e.target.value })}
              />,
            )}
            {field(
              t('admin.seasons.endDate'),
              <Input type="date" className={fieldCls} value={form.endDate} onChange={(e: any) => setForm({ ...form, endDate: e.target.value })} />,
            )}
          </div>
          <ImageUpload
            purpose="season"
            targetId={editId}
            shape="wide"
            label={t('admin.seasons.banner')}
            value={form.banner}
            onChange={(banner) => setForm((f) => ({ ...f, banner }))}
            allowUrl
          />
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_8rem] gap-3">
            {field(
              t('admin.seasons.slug'),
              <Input
                className={fieldCls}
                value={form.slug}
                placeholder={t('admin.seasons.auto')}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                onChange={(e: any) => setForm({ ...form, slug: e.target.value })}
              />,
              t('admin.seasons.slugHint'),
            )}
            {field(
              t('admin.seasons.color'),
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-9 w-10 shrink-0 rounded border border-line-strong bg-transparent p-0.5"
                  value={form.color || '#3c50e0'}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                />
                <Input
                  className={fieldCls}
                  value={form.color}
                  placeholder="#RRGGBB"
                  onChange={(e: any) => setForm({ ...form, color: e.target.value })}
                />
              </div>,
            )}
          </div>
          {form.banner && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.banner} alt="" className="h-20 w-full rounded-lg border border-line-subtle object-cover" />
          )}
          <div className="flex gap-2 pt-2">
            <Button size="sm" type="submit" disabled={saving} loading={saving}>
              <Check size={16} /> {editId ? t('admin.esport.save') : t('admin.esport.create')}
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setFormOpen(false)}>
              {t('admin.esport.cancel')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Frozen summary viewer */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        closeLabel={t('common.close')}
        title={t('admin.seasons.summary.title')}
        subtitle={viewing?.name}
        icon={<Trophy size={20} />}
        size="lg"
      >
        {viewing?.summary ? (
          <div className="space-y-4">
            <p className="text-xs text-ink-3 num">
              {t('seasons.frozenAt', { date: fmtSeasonDate(viewing.summary.frozenAt, lang) || '' })} ·{' '}
              {t('admin.seasons.summary.matches', { n: viewing.summary.matches.completed, total: viewing.summary.matches.total })}
            </p>
            <SeasonPodium podium={viewing.summary.podium} t={t} compact />
          </div>
        ) : (
          <p className="text-sm text-ink-2">{t('seasons.podium.empty')}</p>
        )}
      </Modal>

      <SeasonLifecycleModals lifecycle={lifecycle} />

      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={confirming}
        variant="danger"
        title={deleting ? `${t('admin.confirm.title')} · ${deleting.name}` : ''}
        message={t('admin.seasons.deleteConfirm')}
        confirmLabel={t('admin.esport.delete')}
        cancelLabel={t('admin.esport.cancel')}
        closeLabel={t('common.close')}
      />
    </div>
  );
}
