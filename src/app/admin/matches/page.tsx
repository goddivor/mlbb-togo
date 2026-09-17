'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Check, Trophy, Swords, Users, Star } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import {
  Badge,
  Button,
  PageHeader,
  EmptyState,
  LoadingSpinner,
} from '@/components/ui';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import toast from 'react-hot-toast';

const TYPES = ['friendly', 'training', 'official'];
const LANES = ['roam', 'jungle', 'mid', 'exp', 'gold'];

const inputCls =
  'w-full px-3 py-2 text-sm rounded-lg border border-stroke bg-gray-2 text-black focus:outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white';

type Pending = { message: string; action: () => Promise<any> } | null;

type MatchForm = {
  type: string;
  seasonId: string;
  teamAId: string;
  teamBId: string;
  scheduledAt: string;
  notes: string;
};

const emptyMatchForm: MatchForm = {
  type: 'friendly',
  seasonId: '',
  teamAId: '',
  teamBId: '',
  scheduledAt: '',
  notes: '',
};

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
          className="w-8 h-8 rounded-lg object-cover border border-stroke shrink-0 dark:border-strokedark"
        />
      ) : (
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-xs font-bold text-white shrink-0">
          {team.name?.[0]?.toUpperCase() || 'T'}
        </div>
      )}
      <span className="text-sm font-semibold text-black dark:text-white truncate">{team.name}</span>
    </div>
  );
}

export default function AdminMatchesPage() {
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);

  const errMsg = (e: any) => e?.message || t('admin.esport.errorGeneric');

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

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Swords size={28} />}
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

      {loading ? (
        <LoadingSpinner size="lg" className="py-24" />
      ) : matches.length === 0 ? (
        <EmptyState icon={<Swords size={28} />} title={t('admin.matches.none')} />
      ) : (
        <div className="space-y-3">
          {matches.map((m) => (
            <div
              key={m.id}
              className="rounded-sm border border-stroke bg-white shadow-default p-3 sm:p-4 dark:border-strokedark dark:bg-boxdark"
            >
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <Badge variant="default" size="sm">
                  {t('matchType.' + m.type)}
                </Badge>
                <Badge variant={statusVariant(m.status)} size="sm">
                  {t('matchStatus.' + m.status)}
                </Badge>
                {m.seasonId && seasonName(m.seasonId) && (
                  <span className="inline-flex items-center gap-1 text-xs text-body dark:text-bodydark">
                    <Trophy size={12} /> {seasonName(m.seasonId)}
                  </span>
                )}
                {m.scheduledAt && (
                  <span className="text-xs text-bodydark2">
                    {new Date(m.scheduledAt).toLocaleString()}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <TeamBadge team={m.teamA} />
                </div>

                <div className="flex flex-col items-center px-2 shrink-0">
                  {m.status === 'completed' ? (
                    <span className="text-lg font-bold text-black dark:text-white tabular-nums">
                      {m.scoreA} - {m.scoreB}
                    </span>
                  ) : (
                    <Swords size={18} className="text-bodydark2" />
                  )}
                </div>

                <div className="flex-1 min-w-0 flex justify-end text-right">
                  <TeamBadge team={m.teamB} />
                </div>
              </div>

              {m.status === 'completed' && m.winner?.name && (
                <div className="mt-2 text-center text-xs">
                  <span className="inline-flex items-center gap-1 font-bold text-warning">
                    <Trophy size={12} /> {m.winner.name}
                  </span>
                </div>
              )}

              <div className="mt-3 flex items-center justify-end gap-2">
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
            </div>
          ))}
        </div>
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
            type: match.type || 'friendly',
            seasonId: match.seasonId || '',
            teamAId: match.teamA?.id || '',
            teamBId: match.teamB?.id || '',
            scheduledAt: match.scheduledAt ? match.scheduledAt.slice(0, 16) : '',
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
        type: form.type,
        teamAId: form.teamAId,
        teamBId: form.teamBId,
        seasonId: form.seasonId || undefined,
        scheduledAt: form.scheduledAt || undefined,
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-body dark:text-bodydark mb-1">{t('admin.matches.type')}</label>
            <select
              className={inputCls}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {TYPES.map((x) => (
                <option key={x} value={x}>
                  {t('matchType.' + x)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-body dark:text-bodydark mb-1">{t('admin.matches.season')}</label>
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
            <label className="block text-xs text-body dark:text-bodydark mb-1">{t('admin.matches.teamA')}</label>
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
            <label className="block text-xs text-body dark:text-bodydark mb-1">{t('admin.matches.teamB')}</label>
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
          <p className="text-xs text-danger">{t('admin.matches.pickTwo')}</p>
        )}

        <div>
          <label className="block text-xs text-body dark:text-bodydark mb-1">{t('admin.matches.date')}</label>
          <input
            type="datetime-local"
            className={inputCls}
            value={form.scheduledAt}
            onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs text-body dark:text-bodydark mb-1">{t('admin.matches.notes')}</label>
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
  t: (k: string) => string;
  errMsg: (e: any) => string;
}) {
  const [scoreA, setScoreA] = useState('0');
  const [scoreB, setScoreB] = useState('0');
  const [winner, setWinner] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!match) return;
    setScoreA(String(match.scoreA ?? 0));
    setScoreB(String(match.scoreB ?? 0));
    setWinner(match.winnerTeamId || '');
  }, [match]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!match) return;
    setSaving(true);
    try {
      await api.esport.setMatchResult(match.id, {
        scoreA: Number(scoreA),
        scoreB: Number(scoreB),
        winnerTeamId: winner || undefined,
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

  return (
    <Modal
      open={!!match}
      onClose={onClose}
      closeLabel={t('common.close')}
      title={t('admin.matches.result')}
      icon={<Trophy size={20} />}
    >
      {match && (
        <form onSubmit={submit} className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-black dark:text-white">
            <span className="truncate">{match.teamA?.name}</span>
            <span className="text-bodydark2">{t('admin.matches.vs')}</span>
            <span className="truncate">{match.teamB?.name}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-body dark:text-bodydark mb-1">{t('admin.matches.scoreA')}</label>
              <input
                type="number"
                min="0"
                className={inputCls}
                value={scoreA}
                onChange={(e) => setScoreA(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-body dark:text-bodydark mb-1">{t('admin.matches.scoreB')}</label>
              <input
                type="number"
                min="0"
                className={inputCls}
                value={scoreB}
                onChange={(e) => setScoreB(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-body dark:text-bodydark mb-1">{t('admin.matches.winner')}</label>
            <select
              className={inputCls}
              value={winner}
              onChange={(e) => setWinner(e.target.value)}
            >
              <option value="">{t('admin.matches.autoWinner')}</option>
              {match.teamA && <option value={match.teamA.id}>{match.teamA.name}</option>}
              {match.teamB && <option value={match.teamB.id}>{match.teamB.name}</option>}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button size="sm" type="submit" disabled={saving}>
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

const smallInput =
  'w-full px-2 py-1.5 text-sm rounded-lg border border-stroke bg-gray-2 text-black focus:outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white';

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
        <span className="text-xs text-body dark:text-bodydark">
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
        <p className="text-xs text-bodydark2 py-2">{t('admin.matches.noRoster')}</p>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-body dark:text-bodydark">
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
                  className={`border-t border-stroke dark:border-strokedark ${r.included ? '' : 'opacity-60'}`}
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
                      <span className="truncate max-w-[140px] font-medium text-black dark:text-white">{r.name}</span>
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
                          ? 'bg-warning/15 text-warning'
                          : 'text-bodydark2 hover:text-warning disabled:hover:text-bodydark2'
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
          <p className="text-xs text-body dark:text-bodydark">{t('admin.matches.playersHint')}</p>
          {match.status !== 'completed' && (
            <p className="text-xs rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-warning">
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
