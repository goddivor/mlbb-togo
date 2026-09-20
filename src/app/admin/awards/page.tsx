'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Award, Check, Crown, ExternalLink, Pencil, Plus, Presentation, RotateCcw, Sparkles, Trash2, Trophy, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Button, Card, PageHeader, EmptyState, LoadingSpinner, Badge } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import RoleIcon from '@/components/game/RoleIcon';
import { SeasonStatusBadge, seasonShortLabel, type TFn } from '@/components/seasons/shared';
import type { Season } from '@/store/useSeasonStore';
import {
  CATEGORY_ICON,
  FIXED_CATEGORIES,
  PlayerAvatar,
  TrophyVisual,
  categoryLabel,
  fmtNum,
  laneOf,
  type AwardCategory,
  type AwardCriteria,
  type AwardItem,
  type SeasonAwards,
  type TeamRef,
  type UserRef,
} from '@/components/awards/shared';

const inputCls =
  'w-full px-3 py-2 text-sm rounded-lg border border-stroke bg-gray-2 text-black placeholder-bodydark2 focus:outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white';

type Suggestion = {
  category: AwardCategory;
  lane: string | null;
  userId: string;
  teamId: string;
  user: UserRef;
  team: TeamRef;
  criteria: AwardCriteria;
  alternatives: { userId: string; teamId: string; user: UserRef; team: TeamRef; criteria: AwardCriteria }[];
};

type TeamWithMembers = TeamRef & { members?: { userId: string; role?: string | null; user: UserRef | null }[] };
type ExtraPlayer = { userId: string; teamId: string; teamName: string; role: string | null; user: UserRef };

type AwardForm = {
  category: AwardCategory;
  title: string;
  userId: string | null;
  teamId: string | null;
  description: string;
  imageUrl: string;
  criteria: AwardCriteria | null;
  keepCriteria: boolean;
};

const emptyForm = (category: AwardCategory = 'custom'): AwardForm => ({
  category,
  title: '',
  userId: null,
  teamId: null,
  description: '',
  imageUrl: '',
  criteria: null,
  keepCriteria: true,
});

type PodiumDraft = { 1: string; 2: string; 3: string };
const emptyPodium: PodiumDraft = { 1: '', 2: '', 3: '' };

/**
 * Admin awards & podiums (#46/#47): season picker, suggestion engine,
 * winner assignment with a player picker, podium editors.
 */
export default function AdminAwardsPage() {
  const t = useT();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonId, setSeasonId] = useState<string>('');
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [tournaments, setTournaments] = useState<{ id: string; name: string }[]>([]);
  const [data, setData] = useState<SeasonAwards | null>(null);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [hasStats, setHasStats] = useState(true);
  // Award form modal.
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<AwardForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<AwardItem | null>(null);
  const [removing, setRemoving] = useState(false);
  // Podiums.
  const [regular, setRegular] = useState<PodiumDraft>(emptyPodium);
  const [playoffs, setPlayoffs] = useState<PodiumDraft>(emptyPodium);
  const [tournamentId, setTournamentId] = useState('');
  const [podiumSaving, setPodiumSaving] = useState(false);

  const errMsg = (e: any) => e?.message || t('admin.esport.errorGeneric');

  useEffect(() => {
    (async () => {
      try {
        const [s, tm, tr] = await Promise.all([api.esport.seasons(), api.esport.teams(), api.tournaments.list()]);
        const list: Season[] = Array.isArray(s) ? s : [];
        setSeasons(list);
        setTeams(Array.isArray(tm) ? tm : []);
        setTournaments(Array.isArray(tr) ? tr.map((x: any) => ({ id: x.id, name: x.name })) : []);
        // Deep link (?season=<id>) from the league control room, else the live season.
        const wanted = new URLSearchParams(window.location.search).get('season');
        const linked = wanted ? list.find((x) => x.id === wanted || x.slug === wanted) : null;
        const live = list.find((x) => x.status === 'active' || x.status === 'playoffs');
        setSeasonId(linked?.id ?? live?.id ?? list[0]?.id ?? '');
        if (!list.length) setLoading(false);
      } catch (e: any) {
        toast.error(errMsg(e));
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async (id = seasonId) => {
    if (!id) return;
    try {
      const d = await api.awards.season(id);
      setData(d && d.season ? d : null);
      const toDraft = (entries: { placement: number; teamId: string }[], manual: boolean): PodiumDraft => {
        const draft = { ...emptyPodium };
        if (manual) for (const e of entries) draft[e.placement as 1 | 2 | 3] = e.teamId;
        return draft;
      };
      setRegular(toDraft(d?.podiums?.regular ?? [], d?.podiums?.source?.regular === 'manual'));
      setPlayoffs(toDraft(d?.podiums?.playoffs ?? [], d?.podiums?.source?.playoffs === 'manual'));
    } catch (e: any) {
      toast.error(errMsg(e));
      setData(null);
    }
  };

  useEffect(() => {
    if (!seasonId) return;
    setSuggestions(null);
    setLoading(true);
    load(seasonId).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasonId]);

  const season = data?.season ?? seasons.find((s) => s.id === seasonId) ?? null;
  // Players outside the current rosters (suggested or already awarded) stay pickable.
  const extraPlayers = useMemo(() => {
    const out: ExtraPlayer[] = [];
    for (const s of suggestions ?? []) {
      out.push({ userId: s.userId, teamId: s.teamId, teamName: s.team.name, role: s.lane, user: s.user });
      for (const a of s.alternatives) out.push({ userId: a.userId, teamId: a.teamId, teamName: a.team.name, role: s.lane, user: a.user });
    }
    for (const a of data?.awards ?? []) {
      if (a.user) out.push({ userId: a.user.id, teamId: a.teamId ?? '', teamName: a.team?.name ?? '', role: a.lane, user: a.user });
    }
    return out;
  }, [suggestions, data]);
  const byCategory = useMemo(() => new Map((data?.awards ?? []).map((a) => [a.category, a])), [data]);
  const customs = data?.awards.filter((a) => a.category === 'custom') ?? [];
  const suggestionFor = (c: AwardCategory) => suggestions?.find((s) => s.category === c) ?? null;

  const suggest = async () => {
    if (!seasonId) return;
    setSuggesting(true);
    try {
      const d = await api.awards.suggest(seasonId);
      setSuggestions(d?.suggestions ?? []);
      setHasStats(!!d?.hasPlayerStats);
      if (!d?.hasPlayerStats) toast(t('admin.awards.noStats'));
    } catch (e: any) {
      toast.error(errMsg(e));
    } finally {
      setSuggesting(false);
    }
  };

  const applySuggestion = async (s: Suggestion) => {
    const existing = byCategory.get(s.category);
    const payload = { userId: s.userId, teamId: s.teamId, criteria: s.criteria };
    if (existing) await api.awards.update(existing.id, payload);
    else await api.awards.create(seasonId, { category: s.category, ...payload });
  };

  const applyOne = async (s: Suggestion) => {
    try {
      await applySuggestion(s);
      toast.success(t('admin.awards.saved'));
      await load();
    } catch (e: any) {
      toast.error(errMsg(e));
    }
  };

  const applyAll = async () => {
    if (!suggestions?.length) return;
    try {
      for (const s of suggestions) await applySuggestion(s);
      toast.success(t('admin.awards.applied'));
      await load();
    } catch (e: any) {
      toast.error(errMsg(e));
    }
  };

  const openAssign = (category: AwardCategory, from?: Suggestion | null) => {
    setEditId(null);
    setForm({
      ...emptyForm(category),
      userId: from?.userId ?? null,
      teamId: from?.teamId ?? null,
      criteria: from?.criteria ?? null,
      keepCriteria: !!from,
    });
    setFormOpen(true);
  };

  const openEdit = (a: AwardItem) => {
    setEditId(a.id);
    setForm({
      category: a.category,
      title: a.title || '',
      userId: a.userId,
      teamId: a.teamId,
      description: a.description || '',
      imageUrl: a.imageUrl || '',
      criteria: a.criteria,
      keepCriteria: !!a.criteria,
    });
    setFormOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.category === 'custom' && !form.title.trim()) return;
    setSaving(true);
    try {
      const payload: any = {
        title: form.title.trim() || undefined,
        description: form.description.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        criteria: form.keepCriteria ? form.criteria : null,
      };
      if (form.userId) payload.userId = form.userId;
      if (form.teamId) payload.teamId = form.teamId;
      if (editId) {
        // A cleared player must be sent explicitly.
        if (!form.userId) payload.userId = null;
        if (!form.teamId) payload.teamId = null;
        await api.awards.update(editId, payload);
      } else {
        const create: any = { category: form.category };
        for (const [k, v] of Object.entries(payload)) if (v != null) create[k] = v;
        await api.awards.create(seasonId, create);
      }
      toast.success(t('admin.awards.saved'));
      setFormOpen(false);
      await load();
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = async () => {
    if (!pendingRemove) return;
    setRemoving(true);
    try {
      await api.awards.remove(pendingRemove.id);
      toast.success(t('admin.awards.removed'));
      await load();
    } catch (e: any) {
      toast.error(errMsg(e));
    } finally {
      setRemoving(false);
      setPendingRemove(null);
    }
  };

  const draftToEntries = (d: PodiumDraft) =>
    ([1, 2, 3] as const).filter((p) => d[p]).map((p) => ({ placement: p, teamId: d[p] }));

  const savePodiums = async (extra: { derivePlayoffs?: 'matches' | 'tournament'; tournamentId?: string; resetRegular?: boolean } = {}) => {
    if (!seasonId) return;
    const reg = draftToEntries(regular);
    const po = draftToEntries(playoffs);
    const dup = (d: PodiumDraft) => new Set(Object.values(d).filter(Boolean)).size !== Object.values(d).filter(Boolean).length;
    if (dup(regular) || dup(playoffs)) {
      toast.error(t('admin.awards.sameTeam'));
      return;
    }
    setPodiumSaving(true);
    try {
      const body: any = {
        regular: extra.resetRegular ? null : reg.length ? reg : null,
        playoffs: po.length ? po : null,
      };
      if (extra.derivePlayoffs) {
        body.derivePlayoffs = extra.derivePlayoffs;
        if (extra.tournamentId) body.tournamentId = extra.tournamentId;
      }
      await api.awards.setPodium(seasonId, body);
      toast.success(t('admin.awards.podiumSaved'));
      await load();
    } catch (e: any) {
      toast.error(errMsg(e));
    } finally {
      setPodiumSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Award size={28} />}
        title={t('admin.awards.title')}
        subtitle={t('admin.awards.subtitle')}
        variant="gold"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <select className={`${inputCls} w-auto`} value={seasonId} onChange={(e) => setSeasonId(e.target.value)} aria-label={t('admin.awards.season')}>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {seasonShortLabel(s)} · {s.name}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={suggest} disabled={!seasonId || suggesting} loading={suggesting}>
              <Wand2 size={16} /> {suggesting ? t('admin.awards.suggesting') : t('admin.awards.suggest')}
            </Button>
          </div>
        }
      />

      {loading ? (
        <LoadingSpinner size="lg" className="py-24" />
      ) : !season ? (
        <EmptyState icon={<Award size={28} />} title={t('admin.awards.noSeason')} />
      ) : (
        <>
          {/* Season strip */}
          <Card className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <SeasonStatusBadge status={season.status} t={t} />
              <span className="font-semibold text-black dark:text-white truncate">{season.name}</span>
              <span className="text-xs text-body dark:text-bodydark">
                {t('awards.count', { n: data?.awards.length ?? 0 })} · {t('awards.matches', { n: data?.matches.completed ?? 0 })}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {suggestions && suggestions.length > 0 && (
                <Button size="sm" variant="success" onClick={applyAll}>
                  <Sparkles size={14} /> {t('admin.awards.applyAll')}
                </Button>
              )}
              {season.slug && (
                <Link href={`/awards?season=${season.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  <ExternalLink size={14} /> {t('admin.awards.openPublic')}
                </Link>
              )}
              {season.slug && (
                <Link href={`/ceremony/${season.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  <Presentation size={14} /> {t('admin.awards.openCeremony')}
                </Link>
              )}
            </div>
          </Card>
          {season.status === 'closed' && <p className="text-xs text-body dark:text-bodydark">{t('admin.awards.closedNote')}</p>}
          {suggestions && !hasStats && <p className="text-xs text-warning">{t('admin.awards.noStats')}</p>}

          {/* Fixed categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
            {FIXED_CATEGORIES.map((c) => (
              <CategoryCard
                key={c}
                category={c}
                award={byCategory.get(c) ?? null}
                suggestion={suggestionFor(c)}
                t={t}
                onAssign={(from) => openAssign(c, from)}
                onEdit={openEdit}
                onRemove={setPendingRemove}
                onApply={applyOne}
              />
            ))}
          </div>

          {/* Custom awards */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-black dark:text-white inline-flex items-center gap-2">
                <Sparkles size={16} /> {t('admin.awards.custom')}
              </h3>
              <Button size="sm" variant="ghost" onClick={() => openAssign('custom')}>
                <Plus size={14} /> {t('admin.awards.addCustom')}
              </Button>
            </div>
            {customs.length === 0 ? (
              <p className="text-sm text-body dark:text-bodydark">{t('awards.none')}</p>
            ) : (
              <ul className="divide-y divide-stroke dark:divide-strokedark">
                {customs.map((a) => (
                  <li key={a.id} className="py-3 flex items-center gap-3">
                    <TrophyVisual category="custom" imageUrl={a.imageUrl} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-black dark:text-white truncate">{a.title}</p>
                      <p className="text-xs text-body dark:text-bodydark truncate">
                        {a.user ? a.user.displayName || a.user.username : a.team?.name || t('admin.awards.unassigned')}
                        {a.user && a.team ? ` · ${a.team.name}` : ''}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(a)} aria-label={t('admin.awards.edit')}>
                      <Pencil size={14} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setPendingRemove(a)} aria-label={t('admin.awards.remove')}>
                      <Trash2 size={14} className="text-danger" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Podiums */}
          <Card className="p-5 space-y-4">
            <div>
              <h3 className="font-semibold text-black dark:text-white inline-flex items-center gap-2">
                <Trophy size={16} className="text-warning" /> {t('admin.awards.podiums')}
              </h3>
              <p className="text-xs text-body dark:text-bodydark mt-1">{t('admin.awards.podiumsHint')}</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PodiumEditor
                label={t('admin.awards.podiumRegular')}
                source={t('awards.source.' + (data?.podiums.source.regular ?? 'none'))}
                current={data?.podiums.regular ?? []}
                draft={regular}
                onChange={setRegular}
                teams={teams}
                t={t}
              >
                <Button size="sm" variant="ghost" onClick={() => savePodiums({ resetRegular: true })} disabled={podiumSaving}>
                  <RotateCcw size={14} /> {t('admin.awards.resetRegular')}
                </Button>
              </PodiumEditor>
              <PodiumEditor
                label={t('admin.awards.podiumPlayoffs')}
                source={t('awards.source.' + (data?.podiums.source.playoffs ?? 'none'))}
                current={data?.podiums.playoffs ?? []}
                draft={playoffs}
                onChange={setPlayoffs}
                teams={teams}
                t={t}
              >
                <Button size="sm" variant="ghost" onClick={() => savePodiums({ derivePlayoffs: 'matches' })} disabled={podiumSaving}>
                  <Wand2 size={14} /> {t('admin.awards.deriveMatches')}
                </Button>
                {tournaments.length > 0 && (
                  <div className="flex items-center gap-2">
                    <select className={`${inputCls} w-auto`} value={tournamentId} onChange={(e) => setTournamentId(e.target.value)} aria-label={t('admin.awards.tournament')}>
                      <option value="">{t('admin.awards.tournament')}</option>
                      {tournaments.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="whitespace-nowrap"
                      disabled={!tournamentId || podiumSaving}
                      onClick={() => savePodiums({ derivePlayoffs: 'tournament', tournamentId })}
                    >
                      <Wand2 size={14} /> {t('admin.awards.deriveTournament')}
                    </Button>
                  </div>
                )}
              </PodiumEditor>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => savePodiums()} disabled={podiumSaving} loading={podiumSaving}>
                <Check size={16} /> {t('admin.awards.savePodium')}
              </Button>
            </div>
          </Card>
        </>
      )}

      {/* Award form */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        closeLabel={t('common.close')}
        title={editId ? t('admin.awards.edit') : t('admin.awards.assign')}
        subtitle={categoryLabel(t, { category: form.category, title: form.title })}
        icon={<Award size={20} />}
        headerVariant={editId ? 'plain' : 'gradient'}
        size="lg"
      >
        <form onSubmit={submit} className="space-y-4">
          {form.category === 'custom' && (
            <div>
              <label className="block text-xs text-body dark:text-bodydark mb-1">{t('admin.awards.titleField')}</label>
              <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={120} />
            </div>
          )}
          <PlayerPicker
            teams={teams}
            extra={extraPlayers}
            userId={form.userId}
            teamId={form.teamId}
            lane={laneOf(form.category)}
            onChange={(userId, teamId) => setForm({ ...form, userId, teamId })}
            t={t}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-body dark:text-bodydark mb-1">{t('admin.awards.description')}</label>
              <textarea className={inputCls} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={1000} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-body dark:text-bodydark mb-1">{t('admin.awards.imageUrl')}</label>
              <input className={inputCls} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://" />
            </div>
          </div>
          {form.criteria && (
            <label className="flex items-center gap-2 text-sm text-black dark:text-white">
              <input type="checkbox" checked={form.keepCriteria} onChange={(e) => setForm({ ...form, keepCriteria: e.target.checked })} />
              {t('admin.awards.keepCriteria')}
              <span className="text-xs text-body dark:text-bodydark">
                ({t('awards.criteria.games')} {fmtNum(form.criteria.games)} · {t('awards.criteria.kda')} {fmtNum(form.criteria.kda, 2)} ·{' '}
                {t('awards.criteria.mvp')} {fmtNum(form.criteria.mvpCount)})
              </span>
            </label>
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

      <ConfirmModal
        open={!!pendingRemove}
        onClose={() => setPendingRemove(null)}
        onConfirm={confirmRemove}
        loading={removing}
        danger
        title={t('admin.confirm.title')}
        message={t('admin.awards.confirmRemove')}
        confirmLabel={t('admin.awards.remove')}
        cancelLabel={t('admin.esport.cancel')}
        closeLabel={t('common.close')}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function CategoryCard({
  category,
  award,
  suggestion,
  t,
  onAssign,
  onEdit,
  onRemove,
  onApply,
}: {
  category: AwardCategory;
  award: AwardItem | null;
  suggestion: Suggestion | null;
  t: TFn;
  onAssign: (from?: Suggestion | null) => void;
  onEdit: (a: AwardItem) => void;
  onRemove: (a: AwardItem) => void;
  onApply: (s: Suggestion) => void;
}) {
  const Icon = CATEGORY_ICON[category];
  const lane = laneOf(category);
  const sameAsSuggestion = !!award && !!suggestion && award.userId === suggestion.userId;
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <TrophyVisual category={category} imageUrl={award?.imageUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-black dark:text-white truncate inline-flex items-center gap-1.5">
            <Icon size={14} /> {t('awards.category.' + category)}
          </p>
          <p className="text-xs text-body dark:text-bodydark">{award ? t('awards.criteria.basis.' + (award.criteria?.basis ?? (category === 'mvp' ? 'mvp' : 'kda'))) : t('admin.awards.unassigned')}</p>
        </div>
        {lane && <RoleIcon role={lane} size={22} />}
      </div>

      {award ? (
        <div className="flex items-center gap-3 rounded-lg border border-stroke dark:border-strokedark p-3">
          <PlayerAvatar user={award.user} size="md" />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-black dark:text-white truncate">
              {award.user ? award.user.displayName || award.user.username : t('awards.noPlayer')}
            </p>
            <p className="text-xs text-body dark:text-bodydark truncate">{award.team?.name ?? t('awards.noTeam')}</p>
            {award.criteria && (
              <p className="text-[11px] text-body dark:text-bodydark tabular-nums whitespace-normal">
                {t('awards.criteria.games')} {fmtNum(award.criteria.games)} · {t('awards.criteria.kda')} {fmtNum(award.criteria.kda, 2)} · {t('awards.criteria.mvp')}{' '}
                {fmtNum(award.criteria.mvpCount)}
              </p>
            )}
          </div>
          <Button size="sm" variant="ghost" onClick={() => onEdit(award)} aria-label={t('admin.awards.edit')}>
            <Pencil size={14} />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onRemove(award)} aria-label={t('admin.awards.remove')}>
            <Trash2 size={14} className="text-danger" />
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="ghost" onClick={() => onAssign(null)} className="w-full">
          <Plus size={14} /> {t('admin.awards.assign')}
        </Button>
      )}

      {suggestion && !sameAsSuggestion && (
        <div className="rounded-lg bg-warning/5 border border-warning/30 p-3 space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-warning inline-flex items-center gap-1">
            <Wand2 size={11} /> {t('admin.awards.suggestion')}
          </p>
          <div className="flex items-center gap-2">
            <PlayerAvatar user={suggestion.user} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-black dark:text-white truncate">{suggestion.user.displayName || suggestion.user.username}</p>
              <p className="text-[11px] text-body dark:text-bodydark truncate tabular-nums">
                {suggestion.team.name} · {t('awards.criteria.games')} {fmtNum(suggestion.criteria.games)} · {t('awards.criteria.kda')}{' '}
                {fmtNum(suggestion.criteria.kda, 2)} · {t('awards.criteria.mvp')} {fmtNum(suggestion.criteria.mvpCount)}
              </p>
            </div>
            <Button size="sm" onClick={() => onApply(suggestion)}>
              <Check size={14} /> {t('admin.awards.apply')}
            </Button>
          </div>
          {suggestion.alternatives.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer text-body dark:text-bodydark">{t('admin.awards.alternatives')}</summary>
              <ul className="mt-1 space-y-1">
                {suggestion.alternatives.map((a) => (
                  <li key={a.userId} className="flex items-center justify-between gap-2">
                    <span className="truncate text-black dark:text-white">
                      {a.user.displayName || a.user.username} <span className="text-body dark:text-bodydark">· {a.team.name}</span>
                    </span>
                    <span className="tabular-nums text-body dark:text-bodydark shrink-0">
                      {fmtNum(a.criteria.games)}G · {fmtNum(a.criteria.kda, 2)} · {fmtNum(a.criteria.mvpCount)} MVP
                    </span>
                    <button
                      type="button"
                      className="text-primary hover:underline shrink-0"
                      onClick={() => onAssign({ ...suggestion, userId: a.userId, teamId: a.teamId, user: a.user, team: a.team, criteria: a.criteria })}
                    >
                      {t('admin.awards.assign')}
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
      {sameAsSuggestion && (
        <Badge variant="green" size="sm">
          <Crown size={12} /> {t('admin.awards.suggestion')}
        </Badge>
      )}
    </Card>
  );
}

/** Team select + searchable roster list. */
function PlayerPicker({
  teams,
  extra = [],
  userId,
  teamId,
  lane,
  onChange,
  t,
}: {
  teams: TeamWithMembers[];
  extra?: ExtraPlayer[];
  userId: string | null;
  teamId: string | null;
  lane: string | null;
  onChange: (userId: string | null, teamId: string | null) => void;
  t: TFn;
}) {
  const [teamFilter, setTeamFilter] = useState<string>(teamId ?? '');
  const [q, setQ] = useState('');
  useEffect(() => {
    if (teamId) setTeamFilter(teamId);
  }, [teamId]);

  const rows = useMemo(() => {
    const out: ExtraPlayer[] = [];
    const seen = new Set<string>();
    for (const tm of teams) {
      if (teamFilter && tm.id !== teamFilter) continue;
      for (const m of tm.members ?? []) {
        if (!m.user) continue;
        out.push({ userId: m.userId, teamId: tm.id, teamName: tm.name, role: m.role ?? null, user: m.user });
        seen.add(`${tm.id}-${m.userId}`);
      }
    }
    for (const e of extra) {
      if (teamFilter && e.teamId !== teamFilter) continue;
      const key = `${e.teamId}-${e.userId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(e);
    }
    const needle = q.trim().toLowerCase();
    const filtered = needle
      ? out.filter((r) => (r.user.displayName || '').toLowerCase().includes(needle) || (r.user.username || '').toLowerCase().includes(needle))
      : out;
    // Players of the award lane first.
    return filtered.sort((a, b) => Number((b.role ?? '') === (lane ?? '-')) - Number((a.role ?? '') === (lane ?? '-')) || a.teamName.localeCompare(b.teamName));
  }, [teams, extra, teamFilter, q, lane]);

  return (
    <div className="space-y-2">
      <label className="block text-xs text-body dark:text-bodydark">{t('admin.awards.pickPlayer')}</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <select className={inputCls} value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
          <option value="">{t('admin.awards.allTeams')}</option>
          {teams.map((tm) => (
            <option key={tm.id} value={tm.id}>
              {tm.name}
            </option>
          ))}
        </select>
        <input className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('admin.awards.searchPlayer')} />
      </div>
      <div className="max-h-56 overflow-y-auto rounded-lg border border-stroke dark:border-strokedark divide-y divide-stroke dark:divide-strokedark">
        {rows.length === 0 ? (
          <p className="p-3 text-sm text-body dark:text-bodydark">{t('admin.awards.noPlayer')}</p>
        ) : (
          rows.map((r) => {
            const active = r.userId === userId;
            return (
              <button
                key={`${r.teamId}-${r.userId}`}
                type="button"
                onClick={() => onChange(active ? null : r.userId, active ? null : r.teamId)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                  active ? 'bg-primary/10' : 'hover:bg-gray dark:hover:bg-meta-4'
                }`}
              >
                <PlayerAvatar user={r.user} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-black dark:text-white truncate">{r.user.displayName || r.user.username}</span>
                  <span className="block text-[11px] text-body dark:text-bodydark truncate">{r.teamName}</span>
                </span>
                {r.role && <RoleIcon role={r.role} size={18} />}
                {active && <Check size={16} className="text-primary" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function PodiumEditor({
  label,
  source,
  current,
  draft,
  onChange,
  teams,
  t,
  children,
}: {
  label: string;
  source: string;
  current: { placement: number; team: TeamRef }[];
  draft: PodiumDraft;
  onChange: (d: PodiumDraft) => void;
  teams: TeamRef[];
  t: TFn;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-stroke dark:border-strokedark p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-black dark:text-white">{label}</p>
        <span className="text-[11px] text-body dark:text-bodydark">{t('admin.awards.source', { s: source })}</span>
      </div>
      {current.length > 0 && (
        <p className="text-xs text-body dark:text-bodydark truncate">
          {current
            .slice()
            .sort((a, b) => a.placement - b.placement)
            .map((p) => `${p.placement}. ${p.team.name}`)
            .join(' · ')}
        </p>
      )}
      {([1, 2, 3] as const).map((p) => (
        <div key={p} className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-xs text-body dark:text-bodydark">{t('admin.awards.place' + p)}</span>
          <select className={inputCls} value={draft[p]} onChange={(e) => onChange({ ...draft, [p]: e.target.value })}>
            <option value="">{t('admin.awards.empty')}</option>
            {teams.map((tm) => (
              <option key={tm.id} value={tm.id}>
                {tm.name}
              </option>
            ))}
          </select>
        </div>
      ))}
      {children && <div className="flex flex-wrap items-center gap-2 pt-1">{children}</div>}
    </div>
  );
}
