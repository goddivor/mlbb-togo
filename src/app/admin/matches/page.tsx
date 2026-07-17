'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Check, Trophy, Swords } from 'lucide-react';
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
