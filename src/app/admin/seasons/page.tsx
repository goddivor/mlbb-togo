'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  CalendarDays,
  Play,
  Flag,
  Lock,
  RotateCcw,
  Trophy,
  SlidersHorizontal,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { useSeasonStore, type Season, type SeasonSummary } from '@/store/useSeasonStore';
import { Card, Button, PageHeader, EmptyState, LoadingSpinner, Badge } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { SeasonStatusBadge, SeasonPodium, seasonPeriod, fmtSeasonDate } from '@/components/seasons/shared';
import toast from 'react-hot-toast';

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

type Action = 'activate' | 'playoffs' | 'reopen' | 'delete';

const inputCls =
  'w-full px-3 py-2 text-sm rounded-lg border border-stroke bg-gray-2 text-black placeholder-bodydark2 focus:outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white';

const day = (v: string | null) => (v ? v.slice(0, 10) : '');

export default function AdminSeasonsPage() {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const refreshStore = useSeasonStore((s) => s.load);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<SeasonForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<{ action: Action; season: Season } | null>(null);
  const [confirming, setConfirming] = useState(false);
  // Closing flow: preview of the frozen summary before confirming.
  const [closing, setClosing] = useState<Season | null>(null);
  const [preview, setPreview] = useState<SeasonSummary | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [force, setForce] = useState(false);
  // Frozen summary viewer for closed seasons.
  const [viewing, setViewing] = useState<Season | null>(null);
  // Standings settings (qualification threshold + points rule) per season.
  const [settingsFor, setSettingsFor] = useState<Season | null>(null);
  const [settings, setSettings] = useState({ qualifyTop: 4, win: 3, draw: 1, loss: 0 });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const errMsg = (e: any) => e?.message || t('admin.esport.errorGeneric');

  const openSettings = async (season: Season) => {
    setSettingsFor(season);
    setSettingsLoading(true);
    try {
      const data = await api.standings.settings(season.id);
      setSettings({
        qualifyTop: data?.qualifyTop ?? 4,
        win: data?.points?.win ?? 3,
        draw: data?.points?.draw ?? 1,
        loss: data?.points?.loss ?? 0,
      });
    } catch (e: any) {
      toast.error(errMsg(e));
    } finally {
      setSettingsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settingsFor) return;
    setSettingsSaving(true);
    try {
      await api.standings.updateSettings(settingsFor.id, {
        qualifyTop: settings.qualifyTop,
        points: { win: settings.win, draw: settings.draw, loss: settings.loss },
      });
      toast.success(t('admin.seasons.settings.saved'));
      setSettingsFor(null);
    } catch (e: any) {
      toast.error(errMsg(e));
    } finally {
      setSettingsSaving(false);
    }
  };

  const load = async () => {
    try {
      const data = await api.esport.seasons();
      setSeasons(Array.isArray(data) ? data : []);
      void refreshStore(true);
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

  const runPending = async () => {
    if (!pending) return;
    setConfirming(true);
    try {
      const { action, season } = pending;
      if (action === 'activate') await api.esport.activateSeason(season.id);
      else if (action === 'playoffs') await api.esport.startSeasonPlayoffs(season.id);
      else if (action === 'reopen') await api.esport.reopenSeason(season.id);
      else if (action === 'delete') await api.esport.deleteSeason(season.id);
      toast.success(action === 'delete' ? t('admin.esport.deleted') : t('admin.seasons.lifecycle.done'));
      await load();
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setConfirming(false);
      setPending(null);
    }
  };

  const openClose = async (s: Season) => {
    setClosing(s);
    setPreview(null);
    setForce(false);
    setPreviewLoading(true);
    try {
      const p = (await api.esport.seasonSummaryPreview(s.id)) as SeasonSummary | null;
      setPreview(p);
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setPreviewLoading(false);
    }
  };

  const confirmClose = async () => {
    if (!closing) return;
    setConfirming(true);
    try {
      await api.esport.closeSeason(closing.id, force);
      toast.success(t('admin.seasons.lifecycle.closed'));
      setClosing(null);
      await load();
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setConfirming(false);
    }
  };

  const pendingCopy: Record<Action, { title: string; message: string; confirm: string; variant: any }> = {
    activate: {
      title: t('admin.seasons.lifecycle.activate'),
      message: t('admin.seasons.lifecycle.activateConfirm'),
      confirm: t('admin.seasons.lifecycle.activate'),
      variant: 'success',
    },
    playoffs: {
      title: t('admin.seasons.lifecycle.playoffs'),
      message: t('admin.seasons.lifecycle.playoffsConfirm'),
      confirm: t('admin.seasons.lifecycle.playoffs'),
      variant: 'warning',
    },
    reopen: {
      title: t('admin.seasons.lifecycle.reopen'),
      message: t('admin.seasons.lifecycle.reopenConfirm'),
      confirm: t('admin.seasons.lifecycle.reopen'),
      variant: 'warning',
    },
    delete: {
      title: t('admin.confirm.title'),
      message: t('admin.seasons.deleteConfirm'),
      confirm: t('admin.esport.delete'),
      variant: 'danger',
    },
  };

  const field = (label: string, node: React.ReactNode, hint?: string) => (
    <div>
      <label className="block text-xs text-body dark:text-bodydark mb-1">{label}</label>
      {node}
      {hint && <p className="mt-1 text-[11px] text-bodydark2">{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<CalendarDays size={28} />}
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {seasons.map((s) => {
            const period = seasonPeriod(s, lang);
            const accent = s.color || undefined;
            return (
              <Card key={s.id} hover={false} className="!p-0 overflow-hidden flex flex-col h-full">
                {/* Banner / colour strip */}
                <div
                  className="relative h-24 bg-gradient-to-r from-primary/80 to-meta-5/80"
                  style={
                    s.banner
                      ? { backgroundImage: `url(${s.banner})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                      : accent
                        ? { background: `linear-gradient(135deg, ${accent}, ${accent}66)` }
                        : undefined
                  }
                >
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="absolute inset-x-3 bottom-2 flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      {s.number != null && (
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/80">
                          {t('seasons.numberLabel', { n: s.number })}
                        </p>
                      )}
                      <p className="text-base font-bold text-white truncate drop-shadow">{s.name}</p>
                    </div>
                    <SeasonStatusBadge status={s.status} t={t} className="shrink-0 bg-white/90 dark:bg-boxdark/90" />
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-2 flex-1">
                  {(s.theme || s.slogan) && (
                    <div>
                      {s.theme && (
                        <p className="text-sm font-semibold text-black dark:text-white inline-flex items-center gap-1">
                          <Sparkles size={13} className="text-warning" /> {s.theme}
                        </p>
                      )}
                      {s.slogan && <p className="text-xs italic text-body dark:text-bodydark">« {s.slogan} »</p>}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-body dark:text-bodydark">
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
                    {s.slug && <span className="font-mono text-bodydark2">/{s.slug}</span>}
                  </div>
                  {s.description && (
                    <p className="text-xs text-body dark:text-bodydark whitespace-pre-line line-clamp-3">{s.description}</p>
                  )}
                  {s.summary?.champion && (
                    <p className="text-xs inline-flex items-center gap-1 text-warning">
                      <Trophy size={12} /> {t('seasons.champion')} : <b>{s.summary.champion.team.name}</b>
                    </p>
                  )}

                  {/* Lifecycle actions */}
                  <div className="mt-auto pt-2 flex flex-wrap gap-1.5 border-t border-stroke dark:border-strokedark">
                    {s.status === 'upcoming' && (
                      <Button size="sm" variant="success" onClick={() => setPending({ action: 'activate', season: s })}>
                        <Play size={14} /> {t('admin.seasons.lifecycle.activate')}
                      </Button>
                    )}
                    {s.status === 'active' && (
                      <Button size="sm" variant="secondary" onClick={() => setPending({ action: 'playoffs', season: s })}>
                        <Flag size={14} /> {t('admin.seasons.lifecycle.playoffs')}
                      </Button>
                    )}
                    {(s.status === 'active' || s.status === 'playoffs') && (
                      <Button size="sm" variant="outline" onClick={() => openClose(s)}>
                        <Lock size={14} /> {t('admin.seasons.lifecycle.close')}
                      </Button>
                    )}
                    {s.status === 'closed' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setViewing(s)}>
                          <Trophy size={14} /> {t('admin.seasons.summary.view')}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setPending({ action: 'reopen', season: s })}>
                          <RotateCcw size={14} /> {t('admin.seasons.lifecycle.reopen')}
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => openSettings(s)}>
                      <SlidersHorizontal size={14} /> {t('admin.seasons.settings.action')}
                    </Button>
                    <span className="flex-1" />
                    {s.slug && (
                      <Link
                        href={`/seasons/${s.slug}`}
                        target="_blank"
                        className="inline-flex items-center px-2 py-1.5 rounded-md text-body hover:bg-gray dark:text-bodydark dark:hover:bg-meta-4"
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
                      onClick={() => setPending({ action: 'delete', season: s })}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
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
              <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />,
            )}
            {field(
              t('admin.seasons.number'),
              <input
                type="number"
                min={1}
                className={inputCls}
                value={form.number}
                placeholder={t('admin.seasons.auto')}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
              />,
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {field(
              t('admin.seasons.theme'),
              <input
                className={inputCls}
                value={form.theme}
                placeholder={t('admin.seasons.themePlaceholder')}
                onChange={(e) => setForm({ ...form, theme: e.target.value })}
              />,
            )}
            {field(
              t('admin.seasons.slogan'),
              <input
                className={inputCls}
                value={form.slogan}
                placeholder={t('admin.seasons.sloganPlaceholder')}
                onChange={(e) => setForm({ ...form, slogan: e.target.value })}
              />,
            )}
          </div>
          {field(
            t('admin.seasons.description'),
            <textarea
              className={inputCls}
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />,
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {field(
              t('admin.seasons.startDate'),
              <input type="date" className={inputCls} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />,
            )}
            {field(
              t('admin.seasons.playoffsDate'),
              <input
                type="date"
                className={inputCls}
                value={form.playoffsStartDate}
                onChange={(e) => setForm({ ...form, playoffsStartDate: e.target.value })}
              />,
            )}
            {field(
              t('admin.seasons.endDate'),
              <input type="date" className={inputCls} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />,
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_8rem] gap-3">
            {field(
              t('admin.seasons.banner'),
              <input
                type="url"
                className={inputCls}
                value={form.banner}
                placeholder="https://…"
                onChange={(e) => setForm({ ...form, banner: e.target.value })}
              />,
            )}
            {field(
              t('admin.seasons.slug'),
              <input
                className={inputCls}
                value={form.slug}
                placeholder={t('admin.seasons.auto')}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />,
              t('admin.seasons.slugHint'),
            )}
            {field(
              t('admin.seasons.color'),
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-9 w-10 rounded border border-stroke bg-transparent p-0.5 dark:border-strokedark"
                  value={form.color || '#3c50e0'}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                />
                <input
                  className={inputCls}
                  value={form.color}
                  placeholder="#RRGGBB"
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                />
              </div>,
            )}
          </div>
          {form.banner && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.banner} alt="" className="h-20 w-full rounded-lg object-cover border border-stroke dark:border-strokedark" />
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

      {/* Close with preview of the frozen podium */}
      <Modal
        open={!!closing}
        onClose={() => (confirming ? undefined : setClosing(null))}
        closeLabel={t('common.close')}
        title={t('admin.seasons.lifecycle.close')}
        subtitle={closing?.name}
        icon={<Lock size={20} />}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-body dark:text-bodydark">{t('admin.seasons.lifecycle.closeIntro')}</p>
          {previewLoading ? (
            <LoadingSpinner size="md" className="py-8" />
          ) : preview ? (
            <>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="blue">{t('admin.seasons.summary.matches', { n: preview.matches.completed, total: preview.matches.total })}</Badge>
                <Badge variant="purple">{t('admin.seasons.summary.teams', { n: preview.standings.length })}</Badge>
              </div>
              <div className="rounded-lg border border-stroke bg-gray-2 p-4 dark:border-strokedark dark:bg-meta-4">
                <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-bodydark2">
                  {t('admin.seasons.summary.podiumPreview')}
                </p>
                <SeasonPodium podium={preview.podium} t={t} compact />
              </div>
              {preview.standings.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-stroke dark:border-strokedark">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-2 dark:bg-meta-4 text-bodydark2">
                      <tr>
                        <th className="px-2 py-1.5 text-left">#</th>
                        <th className="px-2 py-1.5 text-left">{t('seasons.standings.team')}</th>
                        <th className="px-2 py-1.5 text-right">{t('seasons.standings.played')}</th>
                        <th className="px-2 py-1.5 text-right">{t('seasons.standings.wins')}</th>
                        <th className="px-2 py-1.5 text-right">{t('seasons.standings.losses')}</th>
                        <th className="px-2 py-1.5 text-right">{t('seasons.standings.diff')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.standings.map((r) => (
                        <tr key={r.teamId} className="border-t border-stroke dark:border-strokedark">
                          <td className="px-2 py-1.5">{r.rank}</td>
                          <td className="px-2 py-1.5 font-medium text-black dark:text-white">{r.team.name}</td>
                          <td className="px-2 py-1.5 text-right tabular-nums">{r.played}</td>
                          <td className="px-2 py-1.5 text-right tabular-nums text-success">{r.wins}</td>
                          <td className="px-2 py-1.5 text-right tabular-nums text-danger">{r.losses}</td>
                          <td className="px-2 py-1.5 text-right tabular-nums">{r.scoreDiff > 0 ? `+${r.scoreDiff}` : r.scoreDiff}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {preview.matches.completed === 0 && (
                <label className="flex items-start gap-2 text-sm text-warning cursor-pointer">
                  <input type="checkbox" className="mt-0.5 accent-primary" checked={force} onChange={(e) => setForce(e.target.checked)} />
                  {t('admin.seasons.lifecycle.forceClose')}
                </label>
              )}
            </>
          ) : (
            <p className="text-sm text-danger">{t('admin.esport.errorGeneric')}</p>
          )}
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              variant="danger"
              onClick={confirmClose}
              disabled={confirming || !preview || (preview.matches.completed === 0 && !force)}
              loading={confirming}
            >
              <Lock size={14} /> {t('admin.seasons.lifecycle.closeConfirm')}
            </Button>
            <Button size="sm" variant="ghost" type="button" disabled={confirming} onClick={() => setClosing(null)}>
              {t('admin.esport.cancel')}
            </Button>
          </div>
        </div>
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
            <p className="text-xs text-bodydark2">
              {t('seasons.frozenAt', { date: fmtSeasonDate(viewing.summary.frozenAt, lang) || '' })} ·{' '}
              {t('admin.seasons.summary.matches', { n: viewing.summary.matches.completed, total: viewing.summary.matches.total })}
            </p>
            <SeasonPodium podium={viewing.summary.podium} t={t} compact />
          </div>
        ) : (
          <p className="text-sm text-body dark:text-bodydark">{t('seasons.podium.empty')}</p>
        )}
      </Modal>

      <Modal
        open={!!settingsFor}
        onClose={() => setSettingsFor(null)}
        closeLabel={t('common.close')}
        title={t('admin.seasons.settings.title')}
        subtitle={settingsFor?.name}
        icon={<SlidersHorizontal size={20} />}
      >
        {settingsLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-bodydark2">{t('admin.seasons.settings.hint')}</p>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-black dark:text-white">
                {t('admin.seasons.settings.qualifyTop')}
              </label>
              <select
                value={settings.qualifyTop}
                onChange={(e) => setSettings((v) => ({ ...v, qualifyTop: Number(e.target.value) }))}
                className="w-full rounded-sm border border-stroke bg-transparent px-3 py-2 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:text-white dark:bg-meta-4"
              >
                {[1, 2, 3, 4, 6, 8].map((n) => (
                  <option key={n} value={n}>
                    {t('admin.seasons.settings.topN', { n })}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(['win', 'draw', 'loss'] as const).map((key) => (
                <div key={key}>
                  <label className="mb-1.5 block text-sm font-medium text-black dark:text-white">
                    {t(`admin.seasons.settings.${key}`)}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={settings[key]}
                    onChange={(e) => setSettings((v) => ({ ...v, [key]: Number(e.target.value) }))}
                    className="w-full rounded-sm border border-stroke bg-transparent px-3 py-2 text-sm text-black outline-none focus:border-primary dark:border-strokedark dark:text-white dark:bg-meta-4"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSettingsFor(null)}>
                {t('admin.esport.cancel')}
              </Button>
              <Button onClick={saveSettings} loading={settingsSaving}>
                {t('admin.esport.save')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={runPending}
        loading={confirming}
        variant={pending ? pendingCopy[pending.action].variant : 'info'}
        title={pending ? `${pendingCopy[pending.action].title} · ${pending.season.name}` : ''}
        message={pending ? pendingCopy[pending.action].message : ''}
        confirmLabel={pending ? pendingCopy[pending.action].confirm : ''}
        cancelLabel={t('admin.esport.cancel')}
        closeLabel={t('common.close')}
      />
    </div>
  );
}
