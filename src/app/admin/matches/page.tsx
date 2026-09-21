'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  Trophy,
  Swords,
  Users,
  Star,
  Camera,
  Video,
  Radio,
  ExternalLink,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { MATCH_FORMATS, MATCH_STAGES, MatchStage, formatDuration } from '@/components/matches/shared';
import { useT } from '@/lib/i18n';
import {
  Badge,
  Button,
  Card,
  PageHeader,
  EmptyState,
  LoadingSpinner,
  StatCard,
} from '@/components/ui';
import { scorelineStatus } from '@/components/game/MatchScoreline';
import { fadeUp, stagger, still } from '@/lib/motion';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import toast from 'react-hot-toast';
import ImageUpload from '@/components/ui/ImageUpload';

const TYPES = ['friendly', 'training', 'official'];
const LANES = ['roam', 'jungle', 'mid', 'exp', 'gold'];

const inputCls =
  'w-full rounded border border-line-strong bg-surface-1 px-3 py-2 text-sm text-ink-1 placeholder:text-ink-3 outline-none transition-[border-color,box-shadow] duration-base focus:border-primary focus:ring-2 focus:ring-primary/25 dark:bg-surface-0/60';

const smallInput =
  'w-full rounded border border-line-strong bg-surface-1 px-2 py-1.5 text-sm text-ink-1 placeholder:text-ink-3 outline-none transition-[border-color,box-shadow] duration-base focus:border-primary focus:ring-2 focus:ring-primary/25 dark:bg-surface-0/60';

type Pending = { message: string; action: () => Promise<any> } | null;

type MatchForm = {
  stage: MatchStage;
  type: string;
  format: string;
  seasonId: string;
  teamAId: string;
  teamBId: string;
  scheduledAt: string;
  streamUrl: string;
  vodUrl: string;
  notes: string;
};

const emptyMatchForm: MatchForm = {
  stage: 'scrim',
  type: 'friendly',
  format: '',
  seasonId: '',
  teamAId: '',
  teamBId: '',
  scheduledAt: '',
  streamUrl: '',
  vodUrl: '',
  notes: '',
};

/** List filters (deep-linked from /admin/league: ?season=<id>&status=scheduled|completed|pending|cancelled). */
type StatusFilter = 'all' | 'scheduled' | 'completed' | 'pending' | 'cancelled';
const STATUS_FILTERS: StatusFilter[] = ['all', 'scheduled', 'completed', 'pending', 'cancelled'];

/** `pending` = completed without a scoresheet (neither game details nor player rows). */
function matchesFilter(m: any, season: string, status: StatusFilter) {
  if (season && m.seasonId !== season) return false;
  if (status === 'all') return true;
  if (status === 'pending') return m.status === 'completed' && !(m.gamesCount > 0) && !(m.playersCount > 0);
  return m.status === status;
}

/** Number of games of a series format (bo3 -> 3). */
const maxGames = (format: string) => (format ? Number(format.slice(2)) || 1 : 1);

/** "mm:ss" or plain seconds -> seconds. */
function parseDuration(v: string): number | null {
  const s = v.trim();
  if (!s) return null;
  const m = s.match(/^(\d{1,3}):(\d{1,2})$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

function statusVariant(status: string): any {
  if (status === 'completed') return 'green';
  if (status === 'cancelled') return 'red';
  return 'default';
}

function TeamBadge({ team }: { team: any }) {
  if (!team) return null;
  return (
    <div className="flex items-center gap-2 min-w-0">
      {team.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={team.image}
          alt={team.name}
          referrerPolicy="no-referrer"
          className="h-8 w-8 shrink-0 rounded cut-corners-sm border border-line-subtle object-cover"
        />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded cut-corners-sm bg-surface-2 text-xs font-bold text-ink-2 ring-1 ring-inset ring-line-subtle">
          {team.name?.[0]?.toUpperCase() || 'T'}
        </div>
      )}
      <span className="text-sm font-semibold text-ink-1 truncate">{team.name}</span>
    </div>
  );
}

export default function AdminMatchesPage() {
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [filterSeason, setFilterSeason] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');

  const errMsg = (e: any) => e?.message || t('admin.esport.errorGeneric');

  useEffect(() => {
    // Deep link from the league control room.
    const params = new URLSearchParams(window.location.search);
    const season = params.get('season');
    const status = params.get('status') as StatusFilter | null;
    if (season) setFilterSeason(season);
    if (status && STATUS_FILTERS.includes(status)) setFilterStatus(status);
  }, []);

  const visible = useMemo(
    () => matches.filter((m) => matchesFilter(m, filterSeason, filterStatus)),
    [matches, filterSeason, filterStatus],
  );

  const loadMatches = async () => {
    try {
      const data = await api.esport.matches();
      setMatches(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error(errMsg(e));
    }
  };

  const loadRefs = async () => {
    try {
      const [tm, ss] = await Promise.all([api.esport.teams(), api.esport.seasons()]);
      setTeams(Array.isArray(tm) ? tm : []);
      setSeasons(Array.isArray(ss) ? ss : []);
    } catch (e: any) {
      toast.error(errMsg(e));
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadMatches(), loadRefs()]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [formOpen, setFormOpen] = useState(false);
  const [editMatch, setEditMatch] = useState<any>(null);
  const [resultMatch, setResultMatch] = useState<any>(null);
  const [playersMatch, setPlayersMatch] = useState<any>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [confirming, setConfirming] = useState(false);

  const seasonName = (id: string) => seasons.find((s) => s.id === id)?.name || '';

  const runConfirm = async () => {
    if (!pending) return;
    setConfirming(true);
    try {
      await pending.action();
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setConfirming(false);
      setPending(null);
    }
  };

  const askDelete = (match: any) =>
    setPending({
      message: t('admin.matches.deleteConfirm'),
      action: async () => {
        await api.esport.deleteMatch(match.id);
        toast.success(t('admin.esport.deleted'));
        await loadMatches();
      },
    });

  // KPI strip computed from the already-loaded list (no extra request).
  const stats = useMemo(() => {
    const now = Date.now();
    let live = 0;
    let pendingResults = 0;
    let scheduled = 0;
    let completed = 0;
    for (const m of matches) {
      if (m.status === 'completed') {
        completed += 1;
        if (!(m.gamesCount > 0) && !(m.playersCount > 0)) pendingResults += 1;
      } else if (m.status === 'scheduled') {
        scheduled += 1;
        if (scorelineStatus(m, now) === 'live') live += 1;
      }
    }
    return { live, pendingResults, scheduled, completed };
  }, [matches]);

  const reduce = useReducedMotion();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Swords size={28} />}
        eyebrow={t('nav.section.esport')}
        title={t('admin.matches.title')}
        variant="purple"
        action={
          <Button
            size="sm"
            onClick={() => {
              setEditMatch(null);
              setFormOpen(true);
            }}
          >
            <Plus size={16} /> {t('admin.matches.new')}
          </Button>
        }
      />

      {!loading && (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            label={t('admin.matches.filter.scheduled')}
            value={stats.scheduled}
            icon={<Swords size={16} />}
            accent="cyan"
          />
          <StatCard
            label={t('matches.status.live')}
            value={stats.live}
            icon={<Radio size={16} />}
            accent="red"
          />
          <StatCard
            label={t('admin.matches.filter.pending')}
            value={stats.pendingResults}
            icon={<Trophy size={16} />}
            accent={stats.pendingResults ? 'gold' : 'green'}
          />
          <StatCard
            label={t('admin.matches.filter.completed')}
            value={stats.completed}
            icon={<Check size={16} />}
            accent="green"
          />
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <select
          className={`${inputCls} sm:w-auto`}
          value={filterSeason}
          onChange={(e) => setFilterSeason(e.target.value)}
          aria-label={t('admin.matches.season')}
        >
          <option value="">{t('admin.matches.filter.allSeasons')}</option>
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          className={`${inputCls} sm:w-auto`}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as StatusFilter)}
          aria-label={t('admin.matches.filter.status')}
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {t('admin.matches.filter.' + s)}
            </option>
          ))}
        </select>
        {!loading && (
          <span className="text-xs text-ink-3 num">{t('admin.matches.filter.count', { n: visible.length, total: matches.length })}</span>
        )}
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-24" />
      ) : visible.length === 0 ? (
        <EmptyState icon={<Swords size={28} />} title={t('admin.matches.none')} />
      ) : (
        <motion.div
          className="space-y-3"
          variants={reduce ? still : stagger()}
          initial="hidden"
          animate="visible"
        >
          {visible.map((m) => {
            const live = m.status === 'scheduled' && scorelineStatus(m) === 'live';
            return (
              <motion.div key={m.id} variants={reduce ? still : fadeUp}>
                <Card className={`relative overflow-hidden !p-3 sm:!p-4 ${live ? 'border-accent-red/50' : ''}`}>
                  {live && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-accent-red" />}
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant={m.stage === 'playoff' ? 'gold' : m.stage === 'league' ? 'purple' : 'default'} size="sm">
                      {t('matches.stage.' + (m.stage || 'scrim'))}
                    </Badge>
                    {m.stage === 'scrim' && (
                      <Badge variant="default" size="sm">
                        {t('matchType.' + m.type)}
                      </Badge>
                    )}
                    {m.format && (
                      <Badge variant="neon" size="sm" className="font-bold">
                        {String(m.format).toUpperCase()}
                      </Badge>
                    )}
                    {live ? (
                      <Badge variant="live" size="sm">{t('matches.status.live')}</Badge>
                    ) : (
                      <Badge variant={statusVariant(m.status)} size="sm">
                        {t('matchStatus.' + m.status)}
                      </Badge>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-ink-3">
                      {m.streamUrl && <Radio size={12} aria-label={t('matches.links.stream')} />}
                      {m.vodUrl && <Video size={12} aria-label={t('matches.links.vod')} />}
                      {m.screenshotsCount > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-xs num">
                          <Camera size={12} /> {m.screenshotsCount}
                        </span>
                      )}
                    </span>
                    {m.seasonId && seasonName(m.seasonId) && (
                      <span className="inline-flex items-center gap-1 text-xs text-ink-2">
                        <Trophy size={12} /> {seasonName(m.seasonId)}
                      </span>
                    )}
                    {m.scheduledAt && (
                      <span className="text-xs text-ink-3 num">
                        {new Date(m.scheduledAt).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <TeamBadge team={m.teamA} />
                    </div>

                    <div className="flex shrink-0 flex-col items-center px-2">
                      {m.status === 'completed' ? (
                        <span className="font-display text-2xl font-bold leading-none text-ink-1 num">
                          {m.scoreA} <span className="text-xs font-semibold uppercase text-ink-3">{t('admin.matches.vs')}</span> {m.scoreB}
                        </span>
                      ) : (
                        <span className="font-display text-xs font-semibold uppercase text-ink-3">{t('admin.matches.vs')}</span>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 justify-end text-right">
                      <TeamBadge team={m.teamB} />
                    </div>
                  </div>

                  {m.status === 'completed' && m.winner?.name && (
                    <div className="mt-2 text-center text-xs">
                      <span className="inline-flex items-center gap-1 font-bold text-accent-gold">
                        <Trophy size={12} /> {m.winner.name}
                      </span>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-line-subtle pt-3">
                    <Link href={`/dashboard/matches/${m.id}`} target="_blank" title={t('admin.matches.view')}>
                      <Button size="sm" variant="ghost">
                        <ExternalLink size={14} />
                      </Button>
                    </Link>
                    <Button size="sm" variant="secondary" onClick={() => setResultMatch(m)}>
                      <Trophy size={14} /> {t('admin.matches.setResult')}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setPlayersMatch(m)}>
                      <Users size={14} /> {t('admin.matches.players')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title={t('admin.matches.edit')}
                      onClick={() => {
                        setEditMatch(m);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      title={t('admin.esport.delete')}
                      onClick={() => askDelete(m)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <MatchFormModal
        open={formOpen}
        match={editMatch}
        teams={teams}
        seasons={seasons}
        onClose={() => setFormOpen(false)}
        onSaved={loadMatches}
        t={t}
        errMsg={errMsg}
      />

      <ResultModal
        match={resultMatch}
        onClose={() => setResultMatch(null)}
        onSaved={loadMatches}
        t={t}
        errMsg={errMsg}
      />

      <MatchPlayersModal
        match={playersMatch}
        onClose={() => setPlayersMatch(null)}
        t={t}
        errMsg={errMsg}
      />

      <ConfirmModal
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={runConfirm}
        loading={confirming}
        danger
        title={t('admin.confirm.title')}
        message={pending?.message}
        confirmLabel={t('admin.esport.delete')}
        cancelLabel={t('admin.esport.cancel')}
        closeLabel={t('common.close')}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Schedule / edit match modal                                         */
/* ------------------------------------------------------------------ */

function MatchFormModal({
  open,
  match,
  teams,
  seasons,
  onClose,
  onSaved,
  t,
  errMsg,
}: {
  open: boolean;
  match: any;
  teams: any[];
  seasons: any[];
  onClose: () => void;
  onSaved: () => Promise<void>;
  t: (k: string) => string;
  errMsg: (e: any) => string;
}) {
  const [form, setForm] = useState<MatchForm>(emptyMatchForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      match
        ? {
            stage: match.stage || 'scrim',
            type: match.type || 'friendly',
            format: match.format || '',
            seasonId: match.seasonId || '',
            teamAId: match.teamA?.id || '',
            teamBId: match.teamB?.id || '',
            scheduledAt: match.scheduledAt ? match.scheduledAt.slice(0, 16) : '',
            streamUrl: match.streamUrl || '',
            vodUrl: match.vodUrl || '',
            notes: match.notes || '',
          }
        : emptyMatchForm,
    );
  }, [open, match]);

  const sameTeams =
    !!form.teamAId && !!form.teamBId && form.teamAId === form.teamBId;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sameTeams) return;
    setSaving(true);
    try {
      const payload = {
        stage: form.stage,
        type: form.stage === 'scrim' ? form.type : 'official',
        format: form.format || null,
        teamAId: form.teamAId,
        teamBId: form.teamBId,
        seasonId: form.seasonId || undefined,
        scheduledAt: form.scheduledAt || undefined,
        streamUrl: form.streamUrl.trim() || null,
        vodUrl: form.vodUrl.trim() || null,
        notes: form.notes.trim() || undefined,
      };
      if (match) await api.esport.updateMatch(match.id, payload);
      else await api.esport.createMatch(payload);
      toast.success(t('admin.esport.saved'));
      onClose();
      await onSaved();
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeLabel={t('common.close')}
      title={match ? t('admin.matches.edit') : t('admin.matches.new')}
      icon={<Swords size={20} />}
      headerVariant={match ? 'plain' : 'gradient'}
    >
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-ink-2 mb-1">{t('admin.matches.stage')}</label>
            <select
              className={inputCls}
              value={form.stage}
              onChange={(e) => setForm({ ...form, stage: e.target.value as MatchStage })}
            >
              {MATCH_STAGES.map((x) => (
                <option key={x} value={x}>
                  {t('matches.stage.' + x)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-ink-2 mb-1">{t('admin.matches.type')}</label>
            <select
              className={inputCls}
              value={form.stage === 'scrim' ? form.type : 'official'}
              disabled={form.stage !== 'scrim'}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {TYPES.filter((x) => (form.stage === 'scrim' ? x !== 'official' : x === 'official')).map((x) => (
                <option key={x} value={x}>
                  {t('matchType.' + x)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-ink-2 mb-1">{t('admin.matches.format')}</label>
            <select
              className={inputCls}
              value={form.format}
              onChange={(e) => setForm({ ...form, format: e.target.value })}
            >
              <option value="">{t('admin.matches.noFormat')}</option>
              {MATCH_FORMATS.map((x) => (
                <option key={x} value={x}>
                  {x.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink-2 mb-1">{t('admin.matches.date')}</label>
            <input
              type="datetime-local"
              className={inputCls}
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-ink-2 mb-1">{t('admin.matches.season')}</label>
            <select
              className={inputCls}
              value={form.seasonId}
              onChange={(e) => setForm({ ...form, seasonId: e.target.value })}
            >
              <option value="">{t('admin.matches.noSeason')}</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink-2 mb-1">{t('admin.matches.teamA')}</label>
            <select
              className={inputCls}
              value={form.teamAId}
              onChange={(e) => setForm({ ...form, teamAId: e.target.value })}
              required
            >
              <option value="">{t('admin.matches.selectTeam')}</option>
              {teams.map((tm) => (
                <option key={tm.id} value={tm.id}>
                  {tm.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-ink-2 mb-1">{t('admin.matches.teamB')}</label>
            <select
              className={inputCls}
              value={form.teamBId}
              onChange={(e) => setForm({ ...form, teamBId: e.target.value })}
              required
            >
              <option value="">{t('admin.matches.selectTeam')}</option>
              {teams.map((tm) => (
                <option key={tm.id} value={tm.id}>
                  {tm.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {sameTeams && (
          <p className="text-xs text-accent-red">{t('admin.matches.pickTwo')}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-ink-2 mb-1">{t('admin.matches.streamUrl')}</label>
            <input
              type="url"
              placeholder="https://"
              className={inputCls}
              value={form.streamUrl}
              onChange={(e) => setForm({ ...form, streamUrl: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-ink-2 mb-1">{t('admin.matches.vodUrl')}</label>
            <input
              type="url"
              placeholder="https://"
              className={inputCls}
              value={form.vodUrl}
              onChange={(e) => setForm({ ...form, vodUrl: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-ink-2 mb-1">{t('admin.matches.notes')}</label>
          <textarea
            className={`${inputCls} min-h-[70px] resize-y`}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button size="sm" type="submit" disabled={saving || sameTeams}>
            <Check size={16} /> {match ? t('admin.esport.save') : t('admin.matches.schedule')}
          </Button>
          <Button size="sm" variant="ghost" type="button" onClick={onClose}>
            {t('admin.esport.cancel')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Result modal                                                        */
/* ------------------------------------------------------------------ */

type GameRow = { winnerTeamId: string; duration: string; mvpUserId: string; screenshot: string };

const emptyGame = (): GameRow => ({ winnerTeamId: '', duration: '', mvpUserId: '', screenshot: '' });

type RosterEntry = { userId: string; teamId: string; name: string };

function ResultModal({
  match,
  onClose,
  onSaved,
  t,
  errMsg,
}: {
  match: any;
  onClose: () => void;
  onSaved: () => Promise<void>;
  t: (k: string, p?: Record<string, string | number>) => string;
  errMsg: (e: any) => string;
}) {
  const [scoreA, setScoreA] = useState('0');
  const [scoreB, setScoreB] = useState('0');
  const [winner, setWinner] = useState('');
  const [format, setFormat] = useState('');
  const [games, setGames] = useState<GameRow[]>([]);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [newShot, setNewShot] = useState('');
  const [vodUrl, setVodUrl] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [mvpUserId, setMvpUserId] = useState('');
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!match) return;
    setScoreA(String(match.scoreA ?? 0));
    setScoreB(String(match.scoreB ?? 0));
    setWinner(match.winnerTeamId || '');
    setFormat(match.format || '');
    setGames(
      (Array.isArray(match.games) ? match.games : []).map((g: any) => ({
        winnerTeamId: g.winnerTeamId || '',
        duration: g.duration != null ? formatDuration(g.duration) || '' : '',
        mvpUserId: g.mvpUserId || '',
        screenshot: g.screenshot || '',
      })),
    );
    setScreenshots(Array.isArray(match.screenshots) ? match.screenshots : []);
    setNewShot('');
    setVodUrl(match.vodUrl || '');
    setStreamUrl(match.streamUrl || '');
    setMvpUserId(match.mvpUserId || '');
    // MVP picker: rosters of both teams + players already recorded on the match.
    let cancelled = false;
    (async () => {
      try {
        const [ta, tb, players] = await Promise.all([
          api.esport.team(match.teamA?.id),
          api.esport.team(match.teamB?.id),
          api.esport.matchPlayers(match.id),
        ]);
        if (cancelled) return;
        const list: RosterEntry[] = [];
        const seen = new Set<string>();
        const push = (userId: string, teamId: string, name: string) => {
          if (!userId || seen.has(userId)) return;
          seen.add(userId);
          list.push({ userId, teamId, name });
        };
        for (const [team, teamId] of [
          [ta, match.teamA?.id],
          [tb, match.teamB?.id],
        ] as const)
          for (const m of team?.members || [])
            push(m.userId, teamId, m.user?.displayName || m.user?.username || m.userId);
        for (const p of players?.players || [])
          push(p.userId, p.teamId, p.user?.displayName || p.user?.username || p.userId);
        setRoster(list);
      } catch {
        if (!cancelled) setRoster([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [match]);

  const limit = maxGames(format);
  const needed = Math.ceil(limit / 2);

  // Series score derived from the games (drives the score inputs).
  const derived = useMemo(() => {
    let a = 0;
    let b = 0;
    for (const g of games) {
      if (g.winnerTeamId && g.winnerTeamId === match?.teamA?.id) a++;
      else if (g.winnerTeamId && g.winnerTeamId === match?.teamB?.id) b++;
    }
    return { a, b, winner: a > b ? match?.teamA?.id : b > a ? match?.teamB?.id : '' };
  }, [games, match]);
  const hasGames = games.length > 0;
  const overflow = derived.a > needed || derived.b > needed;

  useEffect(() => {
    if (!hasGames) return;
    setScoreA(String(derived.a));
    setScoreB(String(derived.b));
  }, [hasGames, derived.a, derived.b]);

  const changeFormat = (f: string) => {
    setFormat(f);
    const max = maxGames(f);
    setGames((rows) => rows.slice(0, max));
  };

  const updateGame = (i: number, patch: Partial<GameRow>) =>
    setGames((rows) => rows.map((g, j) => (j === i ? { ...g, ...patch } : g)));

  const addShot = () => {
    const url = newShot.trim();
    if (!url || screenshots.includes(url) || screenshots.length >= 10) return;
    setScreenshots([...screenshots, url]);
    setNewShot('');
  };

  const rosterOf = (teamId?: string) => roster.filter((r) => !teamId || r.teamId === teamId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!match) return;
    if (overflow) {
      toast.error(t('admin.matches.gamesOverflow', { n: needed }));
      return;
    }
    setSaving(true);
    try {
      await api.esport.setMatchResult(match.id, {
        scoreA: Number(scoreA),
        scoreB: Number(scoreB),
        winnerTeamId: winner || undefined,
        format: format || null,
        games: games.map((g) => ({
          winnerTeamId: g.winnerTeamId || null,
          duration: parseDuration(g.duration),
          mvpUserId: g.mvpUserId || null,
          screenshot: g.screenshot.trim() || null,
        })),
        screenshots,
        vodUrl: vodUrl.trim() || null,
        streamUrl: streamUrl.trim() || null,
        mvpUserId: mvpUserId || null,
      });
      toast.success(t('admin.esport.saved'));
      onClose();
      await onSaved();
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const sectionCls = 'rounded-lg border border-line-subtle p-3 space-y-3';
  const legendCls = 'eyebrow flex items-center gap-2';

  return (
    <Modal
      open={!!match}
      onClose={onClose}
      closeLabel={t('common.close')}
      title={t('admin.matches.result')}
      icon={<Trophy size={20} />}
      size="xl"
    >
      {match && (
        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-ink-1">
            <span className="truncate">{match.teamA?.name}</span>
            <span className="text-ink-3">{t('admin.matches.vs')}</span>
            <span className="truncate">{match.teamB?.name}</span>
          </div>

          {/* Score */}
          <div className={sectionCls}>
            <div className={legendCls}>
              <Trophy size={13} /> {t('admin.matches.result')}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-ink-2 mb-1">{t('admin.matches.format')}</label>
                <select className={inputCls} value={format} onChange={(e) => changeFormat(e.target.value)}>
                  <option value="">{t('admin.matches.noFormat')}</option>
                  {MATCH_FORMATS.map((x) => (
                    <option key={x} value={x}>
                      {x.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-ink-2 mb-1">{t('admin.matches.scoreA')}</label>
                <input
                  type="number"
                  min="0"
                  className={inputCls}
                  value={scoreA}
                  disabled={hasGames}
                  onChange={(e) => setScoreA(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-ink-2 mb-1">{t('admin.matches.scoreB')}</label>
                <input
                  type="number"
                  min="0"
                  className={inputCls}
                  value={scoreB}
                  disabled={hasGames}
                  onChange={(e) => setScoreB(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-ink-2 mb-1">{t('admin.matches.winner')}</label>
                <select className={inputCls} value={winner} onChange={(e) => setWinner(e.target.value)}>
                  <option value="">{t('admin.matches.autoWinner')}</option>
                  {match.teamA && <option value={match.teamA.id}>{match.teamA.name}</option>}
                  {match.teamB && <option value={match.teamB.id}>{match.teamB.name}</option>}
                </select>
              </div>
            </div>
            {hasGames && <p className="text-xs text-ink-3">{t('admin.matches.scoreFromGames')}</p>}
            {overflow && <p className="text-xs text-accent-red">{t('admin.matches.gamesOverflow', { n: needed })}</p>}
            {hasGames && winner && derived.winner && winner !== derived.winner && (
              <p className="text-xs text-accent-red">{t('admin.matches.winnerMismatch')}</p>
            )}
          </div>

          {/* Games */}
          <div className={sectionCls}>
            <div className="flex items-center justify-between">
              <div className={legendCls}>
                <Swords size={13} /> {t('admin.matches.games')}
                <span className="font-normal normal-case text-ink-3">
                  {games.length}/{limit}
                </span>
              </div>
              <Button
                size="sm"
                variant="secondary"
                type="button"
                disabled={games.length >= limit}
                onClick={() => setGames([...games, emptyGame()])}
              >
                <Plus size={14} /> {t('admin.matches.addGame')}
              </Button>
            </div>
            {games.length === 0 ? (
              <p className="text-xs text-ink-3">{t('admin.matches.noGames')}</p>
            ) : (
              <div className="space-y-2">
                {games.map((g, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-2 md:grid-cols-[auto_1fr_6rem_1fr_1fr_auto] items-center gap-2 rounded-lg border border-line-subtle p-2"
                  >
                    <span className="text-xs font-bold text-ink-2 md:w-8">G{i + 1}</span>
                    <select
                      className={smallInput}
                      value={g.winnerTeamId}
                      onChange={(e) => updateGame(i, { winnerTeamId: e.target.value })}
                      aria-label={t('admin.matches.gameWinner')}
                    >
                      <option value="">{t('admin.matches.gameWinner')}</option>
                      <option value={match.teamA?.id}>{match.teamA?.name}</option>
                      <option value={match.teamB?.id}>{match.teamB?.name}</option>
                    </select>
                    <input
                      className={smallInput}
                      placeholder="mm:ss"
                      value={g.duration}
                      onChange={(e) => updateGame(i, { duration: e.target.value })}
                      aria-label={t('admin.matches.gameDuration')}
                    />
                    <select
                      className={smallInput}
                      value={g.mvpUserId}
                      onChange={(e) => updateGame(i, { mvpUserId: e.target.value })}
                      aria-label={t('admin.matches.gameMvp')}
                    >
                      <option value="">{t('admin.matches.gameMvp')}</option>
                      {rosterOf(g.winnerTeamId || undefined).map((r) => (
                        <option key={r.userId} value={r.userId}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="url"
                      className={smallInput}
                      placeholder={t('admin.matches.gameScreenshot')}
                      value={g.screenshot}
                      onChange={(e) => updateGame(i, { screenshot: e.target.value })}
                    />
                    <button
                      type="button"
                      className="justify-self-end text-ink-3 hover:text-accent-red"
                      title={t('admin.esport.delete')}
                      onClick={() => setGames(games.filter((_, j) => j !== i))}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MVP + links */}
          <div className={sectionCls}>
            <div className={legendCls}>
              <Star size={13} /> {t('admin.matches.mvp')} & {t('admin.matches.links')}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-ink-2 mb-1">{t('admin.matches.matchMvp')}</label>
                <select className={inputCls} value={mvpUserId} onChange={(e) => setMvpUserId(e.target.value)}>
                  <option value="">{t('admin.matches.noMvp')}</option>
                  {[match.teamA, match.teamB].map(
                    (team: any) =>
                      team && (
                        <optgroup key={team.id} label={team.name}>
                          {rosterOf(team.id).map((r) => (
                            <option key={r.userId} value={r.userId}>
                              {r.name}
                            </option>
                          ))}
                        </optgroup>
                      ),
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs text-ink-2 mb-1">{t('admin.matches.vodUrl')}</label>
                <input type="url" placeholder="https://" className={inputCls} value={vodUrl} onChange={(e) => setVodUrl(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-ink-2 mb-1">{t('admin.matches.streamUrl')}</label>
                <input type="url" placeholder="https://" className={inputCls} value={streamUrl} onChange={(e) => setStreamUrl(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Screenshots */}
          <div className={sectionCls}>
            <div className={legendCls}>
              <Camera size={13} /> {t('admin.matches.screenshots')}
              <span className="font-normal normal-case text-ink-3">{screenshots.length}/10</span>
            </div>
            <ImageUpload
              purpose="match"
              targetId={match.id}
              value=""
              addOnly
              disabled={screenshots.length >= 10}
              onChange={(url) => url && setScreenshots((list) => (list.includes(url) || list.length >= 10 ? list : [...list, url]))}
            />
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://"
                className={inputCls}
                value={newShot}
                onChange={(e) => setNewShot(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addShot();
                  }
                }}
              />
              <Button size="sm" variant="secondary" type="button" onClick={addShot} disabled={screenshots.length >= 10}>
                <Plus size={14} /> {t('admin.matches.addScreenshot')}
              </Button>
            </div>
            {screenshots.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {screenshots.map((url) => (
                  <div key={url} className="group relative aspect-video overflow-hidden rounded-lg border border-line-subtle">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setScreenshots(screenshots.filter((u) => u !== url))}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      title={t('admin.esport.delete')}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button size="sm" type="submit" disabled={saving || overflow}>
              <Check size={16} /> {t('admin.esport.save')}
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={onClose}>
              {t('admin.esport.cancel')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Per-player stats modal                                              */
/* ------------------------------------------------------------------ */

type PlayerRow = {
  userId: string;
  teamId: string;
  name: string;
  avatar?: string | null;
  included: boolean;
  hero: string;
  role: string;
  kills: string;
  deaths: string;
  assists: string;
  isMvp: boolean;
};

function buildRows(teamId: string, members: any[], existing: any[]): PlayerRow[] {
  const byUser = new Map(existing.map((p) => [p.userId, p]));
  const rows: PlayerRow[] = members.map((m) => {
    const p = byUser.get(m.userId);
    return {
      userId: m.userId,
      teamId,
      name: m.user?.displayName || m.user?.username || m.userId,
      avatar: m.user?.avatar || null,
      included: !!p,
      hero: p?.hero || '',
      role: p?.role || m.role || '',
      kills: String(p?.kills ?? 0),
      deaths: String(p?.deaths ?? 0),
      assists: String(p?.assists ?? 0),
      isMvp: !!p?.isMvp,
    };
  });
  // Players recorded on the match but no longer in the roster stay editable.
  const known = new Set(rows.map((r) => r.userId));
  for (const p of existing) {
    if (known.has(p.userId)) continue;
    rows.push({
      userId: p.userId,
      teamId,
      name: p.user?.displayName || p.user?.username || p.userId,
      avatar: p.user?.avatar || null,
      included: true,
      hero: p.hero || '',
      role: p.role || '',
      kills: String(p.kills ?? 0),
      deaths: String(p.deaths ?? 0),
      assists: String(p.assists ?? 0),
      isMvp: !!p.isMvp,
    });
  }
  return rows;
}

function MatchPlayersModal({
  match,
  onClose,
  t,
  errMsg,
}: {
  match: any;
  onClose: () => void;
  t: (k: string, p?: Record<string, string | number>) => string;
  errMsg: (e: any) => string;
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [heroes, setHeroes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [rowsA, setRowsA] = useState<PlayerRow[]>([]);
  const [rowsB, setRowsB] = useState<PlayerRow[]>([]);

  useEffect(() => {
    if (!match) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [teamA, teamB, players, hs, us] = await Promise.all([
          api.esport.team(match.teamA?.id),
          api.esport.team(match.teamB?.id),
          api.esport.matchPlayers(match.id),
          api.heroes.list(),
          api.users.list(),
        ]);
        if (cancelled) return;
        setHeroes(Array.isArray(hs) ? hs : []);
        setUsers(Array.isArray(us) ? us : []);
        setRowsA(buildRows(match.teamA?.id, teamA?.members || [], players?.teamA || []));
        setRowsB(buildRows(match.teamB?.id, teamB?.members || [], players?.teamB || []));
      } catch (e: any) {
        toast.error(errMsg(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match]);

  const heroNames = heroes.map((h) => h.name);

  const update = (side: 'A' | 'B', userId: string, patch: Partial<PlayerRow>) => {
    const setter = side === 'A' ? setRowsA : setRowsB;
    setter((rows) => rows.map((r) => (r.userId === userId ? { ...r, ...patch } : r)));
  };

  // Only one MVP for the whole match: setting one clears the others.
  const setMvp = (side: 'A' | 'B', userId: string, value: boolean) => {
    const clear = (rows: PlayerRow[]) =>
      rows.map((r) => ({ ...r, isMvp: r.userId === userId ? value : false }));
    setRowsA(clear);
    setRowsB(clear);
    if (value) update(side, userId, { included: true });
  };

  const included = [...rowsA, ...rowsB].filter((r) => r.included);
  const usedIds = new Set([...rowsA, ...rowsB].map((r) => r.userId));

  // Players outside the roster (substitutes, guests) can still be recorded.
  const addPlayer = (side: 'A' | 'B', teamId: string, userId: string) => {
    const u = users.find((x) => x.id === userId);
    if (!u || usedIds.has(userId)) return;
    const row: PlayerRow = {
      userId,
      teamId,
      name: u.displayName || u.username,
      avatar: u.avatar || null,
      included: true,
      hero: '',
      role: '',
      kills: '0',
      deaths: '0',
      assists: '0',
      isMvp: false,
    };
    (side === 'A' ? setRowsA : setRowsB)((rows) => [...rows, row]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!match) return;
    if (included.filter((r) => r.isMvp).length > 1) {
      toast.error(t('admin.matches.oneMvp'));
      return;
    }
    setSaving(true);
    try {
      const heroIds = new Map(heroes.map((h) => [h.name, h.id]));
      await api.esport.setMatchPlayers(
        match.id,
        included.map((r) => ({
          userId: r.userId,
          teamId: r.teamId,
          hero: r.hero || undefined,
          heroId: r.hero ? heroIds.get(r.hero) : undefined,
          role: r.role || undefined,
          kills: Number(r.kills) || 0,
          deaths: Number(r.deaths) || 0,
          assists: Number(r.assists) || 0,
          isMvp: r.isMvp,
        })),
      );
      toast.success(t('admin.matches.playersSaved'));
      onClose();
    } catch (err: any) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const renderTeam = (side: 'A' | 'B', team: any, rows: PlayerRow[]) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <TeamBadge team={team} />
        <span className="text-xs text-ink-2">
          {t('admin.matches.playersCount', { n: rows.filter((r) => r.included).length })}
        </span>
      </div>
      <select
        className={`${smallInput} mb-2`}
        value=""
        onChange={(e) => addPlayer(side, team?.id, e.target.value)}
      >
        <option value="">{t('admin.matches.addPlayer')}</option>
        {users
          .filter((u) => !usedIds.has(u.id))
          .map((u) => (
            <option key={u.id} value={u.id}>
              {u.displayName || u.username}
            </option>
          ))}
      </select>
      {rows.length === 0 ? (
        <p className="text-xs text-ink-3 py-2">{t('admin.matches.noRoster')}</p>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full min-w-[560px] text-sm num">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-eyebrow text-ink-3">
                <th className="text-left font-medium px-1 py-1">{t('admin.matches.played')}</th>
                <th className="text-left font-medium px-1 py-1">{t('admin.matches.hero')}</th>
                <th className="text-left font-medium px-1 py-1">{t('admin.matches.role')}</th>
                <th className="text-center font-medium px-1 py-1 w-16">{t('admin.matches.kills')}</th>
                <th className="text-center font-medium px-1 py-1 w-16">{t('admin.matches.deaths')}</th>
                <th className="text-center font-medium px-1 py-1 w-16">{t('admin.matches.assists')}</th>
                <th className="text-center font-medium px-1 py-1 w-14">{t('admin.matches.mvp')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.userId}
                  className={`border-t border-line-subtle ${r.included ? '' : 'opacity-60'}`}
                >
                  <td className="px-1 py-1.5">
                    <label className="flex items-center gap-2 cursor-pointer min-w-0">
                      <input
                        type="checkbox"
                        checked={r.included}
                        onChange={(e) =>
                          update(side, r.userId, {
                            included: e.target.checked,
                            isMvp: e.target.checked ? r.isMvp : false,
                          })
                        }
                      />
                      <span className="truncate max-w-[140px] font-medium text-ink-1">{r.name}</span>
                    </label>
                  </td>
                  <td className="px-1 py-1.5">
                    <select
                      className={smallInput}
                      value={r.hero}
                      disabled={!r.included}
                      onChange={(e) => update(side, r.userId, { hero: e.target.value })}
                    >
                      <option value="">{t('admin.matches.noHero')}</option>
                      {r.hero && !heroNames.includes(r.hero) && <option value={r.hero}>{r.hero}</option>}
                      {heroes.map((h) => (
                        <option key={h.id} value={h.name}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-1 py-1.5">
                    <select
                      className={smallInput}
                      value={r.role}
                      disabled={!r.included}
                      onChange={(e) => update(side, r.userId, { role: e.target.value })}
                    >
                      <option value="">{t('admin.matches.noRole')}</option>
                      {LANES.map((l) => (
                        <option key={l} value={l}>
                          {t('lane.' + l)}
                        </option>
                      ))}
                    </select>
                  </td>
                  {(['kills', 'deaths', 'assists'] as const).map((f) => (
                    <td key={f} className="px-1 py-1.5">
                      <input
                        type="number"
                        min="0"
                        className={`${smallInput} text-center`}
                        value={r[f]}
                        disabled={!r.included}
                        onChange={(e) => update(side, r.userId, { [f]: e.target.value } as any)}
                      />
                    </td>
                  ))}
                  <td className="px-1 py-1.5 text-center">
                    <button
                      type="button"
                      title={t('admin.matches.mvp')}
                      disabled={!r.included}
                      onClick={() => setMvp(side, r.userId, !r.isMvp)}
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                        r.isMvp
                          ? 'bg-accent-gold/15 text-accent-gold'
                          : 'text-ink-3 hover:text-accent-gold disabled:hover:text-ink-3'
                      }`}
                    >
                      <Star size={16} fill={r.isMvp ? 'currentColor' : 'none'} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <Modal
      open={!!match}
      onClose={onClose}
      closeLabel={t('common.close')}
      title={t('admin.matches.playersTitle')}
      icon={<Users size={20} />}
      size="xl"
    >
      {match && (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-xs text-ink-2">{t('admin.matches.playersHint')}</p>
          {match.status !== 'completed' && (
            <p className="text-xs rounded-lg border border-accent-gold/40 bg-accent-gold/10 px-3 py-2 text-accent-gold">
              {t('admin.matches.playersPending')}
            </p>
          )}

          {loading ? (
            <LoadingSpinner size="md" className="py-10" />
          ) : (
            <div className="space-y-5">
              {renderTeam('A', match.teamA, rowsA)}
              {renderTeam('B', match.teamB, rowsB)}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button size="sm" type="submit" disabled={saving || loading}>
              <Check size={16} /> {t('admin.esport.save')}
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={onClose}>
              {t('admin.esport.cancel')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
