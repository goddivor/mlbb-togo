'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ExternalLink,
  GitBranch,
  Play,
  RefreshCw,
  Trash2,
  Users,
  UserPlus,
  X,
  Radio,
  Star,
  Swords,
  Calendar,
  Search,
  Info,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Card, Button, Badge, LoadingSpinner, Input, Select, Avatar } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import EliminationBracket from '@/components/tournaments/EliminationBracket';
import MatchSummary, { DetailedMatch } from '@/components/tournaments/MatchSummary';
import { TOURNAMENT_STATUS_VARIANT, TeamLogo, roundLabelKey } from '@/components/tournaments/tournament-utils';
import toast from 'react-hot-toast';

type Pending = { title: string; message: string; action: () => Promise<any>; success: string } | null;

// Convert an ISO date to the value expected by <input type="datetime-local">.
function toLocalInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminTournamentManagePage() {
  const t = useT();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [esportTeams, setEsportTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [seeding, setSeeding] = useState<'random' | 'order'>('random');
  const [pending, setPending] = useState<Pending>(null);
  const [addTeamOpen, setAddTeamOpen] = useState(false);
  const [mvpOpen, setMvpOpen] = useState(false);
  const [mvpQuery, setMvpQuery] = useState('');

  // Match modal state.
  const [selected, setSelected] = useState<DetailedMatch | null>(null);
  const [scoreA, setScoreA] = useState('0');
  const [scoreB, setScoreB] = useState('0');
  const [winner, setWinner] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [streamUrl, setStreamUrl] = useState('');

  const errMsg = (e: any) => e?.message || t('common.error');

  const reload = useCallback(async () => {
    try {
      const d = await api.tournaments.details(id);
      setData(d && d.tournament ? d : null);
    } catch (e: any) {
      toast.error(errMsg(e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([
        reload(),
        api.esport.teams().then((l: any) => setEsportTeams(Array.isArray(l) ? l : [])).catch(() => {}),
        api.users.adminList().then((l: any) => setUsers(Array.isArray(l) ? l : [])).catch(() => {}),
      ]);
      setLoading(false);
    })();
  }, [reload]);

  // Keep the selected match in sync after a reload.
  const allMatches: DetailedMatch[] = useMemo(
    () => (data ? data.bracket.rounds.flatMap((r: any) => r.matches) : []),
    [data],
  );
  useEffect(() => {
    if (!selected) return;
    const fresh = allMatches.find((m) => m.id === selected.id);
    if (fresh) setSelected(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMatches]);

  const roundKeyOf = useMemo(() => {
    const m = new Map<number, string>();
    data?.bracket.rounds.forEach((r: any) => m.set(r.round, r.key));
    return m;
  }, [data]);

  const bracketTeams = useMemo(
    () => (data?.participants || []).map((p: any) => ({ id: p.id, name: p.name, icon: p.logo, seed: p.seed })),
    [data],
  );

  const run = async (key: string, fn: () => Promise<any>, success?: string) => {
    setBusy(key);
    try {
      await fn();
      if (success) toast.success(success);
      await reload();
    } catch (e: any) {
      toast.error(errMsg(e));
    } finally {
      setBusy(null);
    }
  };

  const openMatch = (m: DetailedMatch) => {
    setSelected(m);
    setScoreA(String(m.scoreA ?? 0));
    setScoreB(String(m.scoreB ?? 0));
    setWinner(m.winnerTeamId || '');
    setScheduledAt(toLocalInput(m.scheduledAt));
    setStreamUrl(m.streamUrl || '');
  };

  const saveResult = () => {
    if (!selected) return;
    const a = parseInt(scoreA, 10);
    const b = parseInt(scoreB, 10);
    run(
      'result',
      () =>
        api.tournaments.setMatchResult(id, selected.id, {
          scoreA: Number.isFinite(a) ? a : 0,
          scoreB: Number.isFinite(b) ? b : 0,
          winnerTeamId: winner || undefined,
        }),
      t('admin.tournaments.match.saved'),
    );
  };

  const saveSchedule = () => {
    if (!selected) return;
    run(
      'schedule',
      () =>
        api.tournaments.scheduleMatch(id, selected.id, {
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          streamUrl: streamUrl.trim() || null,
        }),
      t('admin.tournaments.match.saved'),
    );
  };

  const setStatus = (status: string) => {
    if (!selected) return;
    run('status', () => api.tournaments.setMatchStatus(id, selected.id, status), t('admin.tournaments.match.saved'));
  };

  if (loading) return <LoadingSpinner size="lg" className="py-24" />;

  if (!data) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/tournaments')}>
          <ArrowLeft size={16} /> {t('admin.tournaments.back')}
        </Button>
        <Card>
          <p className="py-8 text-center text-sm text-body dark:text-bodydark">{t('tournament.notFound')}</p>
        </Card>
      </div>
    );
  }

  const { tournament, participants, mvp, liveMatch } = data;
  const hasBracket = allMatches.length > 0;
  const registeredIds = new Set(participants.map((p: any) => p.id));
  const availableTeams = esportTeams.filter((tm) => !registeredIds.has(tm.id));
  const filteredUsers = users
    .filter((u) => {
      const q = mvpQuery.trim().toLowerCase();
      if (!q) return true;
      return [u.username, u.displayName, u.gameNickname].some((v) => v && String(v).toLowerCase().includes(q));
    })
    .slice(0, 12);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/tournaments')}>
          <ArrowLeft size={16} /> {t('admin.tournaments.back')}
        </Button>
        <Link href={`/tournaments/${id}`} target="_blank">
          <Button variant="ghost" size="sm">
            <ExternalLink size={14} /> {t('admin.tournaments.viewPublic')}
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-title-md2 font-bold text-black dark:text-white">{tournament.name}</h2>
            <Badge variant={TOURNAMENT_STATUS_VARIANT[tournament.status] || 'default'} size="sm">
              {t(`tournament.status.${tournament.status}`)}
            </Badge>
            {tournament.format && <Badge variant="purple" size="sm">{tournament.format}</Badge>}
            {liveMatch && (
              <Badge variant="red" size="sm">
                <Radio size={10} className="animate-pulse" /> {t('admin.tournaments.live')}
              </Badge>
            )}
          </div>
          {tournament.description && (
            <p className="mt-1 text-sm text-body dark:text-bodydark">{tournament.description}</p>
          )}
        </div>
      </div>

      {/* Registered teams */}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
            <Users size={20} className="text-primary" /> {t('admin.tournaments.registered')}
            <Badge variant="default" size="sm">
              {participants.length}/{tournament.maxTeams}
            </Badge>
          </h3>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setAddTeamOpen(true)}
            disabled={!!busy || participants.length >= tournament.maxTeams}
          >
            <UserPlus size={16} /> {t('admin.tournaments.addTeam')}
          </Button>
        </div>
        {participants.length === 0 ? (
          <p className="py-6 text-center text-sm text-bodydark2">{t('tournament.participants.empty')}</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {participants.map((p: any) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 rounded-lg border p-3 ${
                  p.champion ? 'border-warning/60' : p.eliminated ? 'border-stroke opacity-70 dark:border-strokedark' : 'border-stroke dark:border-strokedark'
                }`}
              >
                <TeamLogo name={p.name} logo={p.logo} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-black dark:text-white">{p.name}</p>
                  <p className="text-xs text-body dark:text-bodydark">
                    {t('tournament.participants.seed', { n: p.seed })} · {t('tournament.participants.wins', { count: p.wins })}
                  </p>
                </div>
                {!hasBracket && (
                  <Button
                    size="sm"
                    variant="danger"
                    title={t('admin.tournaments.removeTeam')}
                    disabled={!!busy}
                    onClick={() =>
                      run(`rm-${p.id}`, () => api.tournaments.unregister(id, p.id), t('admin.tournaments.teamRemoved'))
                    }
                  >
                    <X size={12} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Bracket controls */}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
            <GitBranch size={20} className="text-primary" /> {t('admin.tournaments.bracket')}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={seeding}
              onChange={(e) => setSeeding(e.target.value as any)}
              className="rounded-lg border border-stroke bg-gray-2 px-3 py-2 text-sm text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white"
              aria-label={t('admin.tournaments.seeding')}
            >
              <option value="random">{t('admin.tournaments.seeding.random')}</option>
              <option value="order">{t('admin.tournaments.seeding.order')}</option>
            </select>
            {hasBracket ? (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!!busy || participants.length < 2}
                  onClick={() =>
                    setPending({
                      title: t('admin.tournaments.regenerate'),
                      message: t('admin.tournaments.regenerateConfirm'),
                      action: () => api.tournaments.generateBracket(id, seeding),
                      success: t('admin.tournaments.generated'),
                    })
                  }
                >
                  <RefreshCw size={16} /> {t('admin.tournaments.regenerate')}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={!!busy}
                  onClick={() =>
                    setPending({
                      title: t('admin.tournaments.reset'),
                      message: t('admin.tournaments.resetConfirm'),
                      action: () => api.tournaments.resetBracket(id),
                      success: t('admin.tournaments.resetDone'),
                    })
                  }
                >
                  <Trash2 size={16} /> {t('admin.tournaments.reset')}
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                disabled={!!busy || participants.length < 2}
                loading={busy === 'generate'}
                onClick={() =>
                  run('generate', () => api.tournaments.generateBracket(id, seeding), t('admin.tournaments.generated'))
                }
              >
                <Play size={16} /> {t('admin.tournaments.generate')}
              </Button>
            )}
          </div>
        </div>

        {participants.length < 2 && !hasBracket ? (
          <div className="flex items-start gap-2 rounded-lg border border-stroke bg-gray-2 p-3 text-sm text-body dark:border-strokedark dark:bg-meta-4 dark:text-bodydark">
            <Info size={16} className="mt-0.5 shrink-0 text-primary" />
            <span>{t('admin.tournaments.minTeams')}</span>
          </div>
        ) : hasBracket ? (
          <>
            <p className="mb-3 text-xs text-bodydark2">{t('admin.tournaments.bracketHint')}</p>
            <EliminationBracket
              teams={bracketTeams}
              matches={allMatches}
              showDetails
              selectedMatchId={selected?.id}
              onSelectMatch={(m) => openMatch(m as DetailedMatch)}
              roundLabel={(round, total) =>
                t(roundLabelKey(roundKeyOf.get(round) || (round === total ? 'final' : 'round')), { n: round })
              }
            />
          </>
        ) : (
          <p className="py-6 text-center text-sm text-bodydark2">{t('tournament.bracket.empty')}</p>
        )}
      </Card>

      {/* Live + MVP */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
            <Radio size={20} className={liveMatch ? 'animate-pulse text-danger' : 'text-primary'} />{' '}
            {t('admin.tournaments.live')}
          </h3>
          {liveMatch ? (
            <MatchSummary match={liveMatch} roundKey={roundKeyOf.get(liveMatch.round)} onClick={() => openMatch(liveMatch)} />
          ) : (
            <p className="py-4 text-center text-sm text-bodydark2">{t('admin.tournaments.noLive')}</p>
          )}
        </Card>
        <Card>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
              <Star size={20} className="text-warning" /> {t('admin.tournaments.mvp')}
            </h3>
            <div className="flex items-center gap-2">
              {mvp && (
                <Button
                  size="sm"
                  variant="danger"
                  disabled={!!busy}
                  onClick={() => run('mvp', () => api.tournaments.setMvp(id, null), t('admin.tournaments.mvpSaved'))}
                >
                  <X size={14} /> {t('admin.tournaments.mvpClear')}
                </Button>
              )}
              <Button size="sm" variant="secondary" disabled={!!busy} onClick={() => setMvpOpen(true)}>
                <Search size={14} /> {t('admin.tournaments.mvpSet')}
              </Button>
            </div>
          </div>
          {mvp ? (
            <div className="flex items-center gap-3">
              <Avatar name={mvp.name} src={mvp.avatar} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-black dark:text-white">{mvp.name}</p>
                <p className="text-xs text-body dark:text-bodydark">{mvp.rank} · {mvp.role}</p>
              </div>
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-bodydark2">{t('tournament.mvp.empty')}</p>
          )}
        </Card>
      </div>

      {/* Add team modal */}
      <Modal
        open={addTeamOpen}
        onClose={() => setAddTeamOpen(false)}
        title={t('admin.tournaments.addTeam')}
        icon={<UserPlus size={20} />}
        size="sm"
        closeLabel={t('common.close')}
      >
        <p className="mb-3 text-sm text-body dark:text-bodydark">{t('admin.tournaments.addTeamPick')}</p>
        {availableTeams.length === 0 ? (
          <p className="py-4 text-center text-sm text-bodydark2">{t('admin.tournaments.noTeamLeft')}</p>
        ) : (
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {availableTeams.map((tm) => (
              <button
                key={tm.id}
                type="button"
                disabled={!!busy}
                onClick={() =>
                  run(`add-${tm.id}`, () => api.tournaments.register(id, tm.id), t('admin.tournaments.teamAdded')).then(
                    () => setAddTeamOpen(false),
                  )
                }
                className="flex w-full items-center gap-3 rounded-lg border border-stroke bg-white p-3 text-left hover:border-primary disabled:opacity-60 dark:border-strokedark dark:bg-boxdark-2"
              >
                <TeamLogo name={tm.name} logo={tm.image} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-black dark:text-white">{tm.name}</span>
                <Badge variant="default" size="sm">{tm.type}</Badge>
              </button>
            ))}
          </div>
        )}
      </Modal>

      {/* MVP picker modal */}
      <Modal
        open={mvpOpen}
        onClose={() => setMvpOpen(false)}
        title={t('admin.tournaments.mvp')}
        icon={<Star size={20} />}
        size="sm"
        closeLabel={t('common.close')}
      >
        <Input
          placeholder={t('admin.tournaments.mvpSearch')}
          value={mvpQuery}
          onChange={(e: any) => setMvpQuery(e.target.value)}
          autoFocus
        />
        <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <p className="py-4 text-center text-sm text-bodydark2">{t('admin.tournaments.mvpNone')}</p>
          ) : (
            filteredUsers.map((u) => {
              const name = u.displayName || u.gameNickname || u.username;
              return (
                <button
                  key={u.id}
                  type="button"
                  disabled={!!busy}
                  onClick={() =>
                    run('mvp', () => api.tournaments.setMvp(id, u.id), t('admin.tournaments.mvpSaved')).then(() =>
                      setMvpOpen(false),
                    )
                  }
                  className="flex w-full items-center gap-3 rounded-lg border border-stroke bg-white p-2 text-left hover:border-primary disabled:opacity-60 dark:border-strokedark dark:bg-boxdark-2"
                >
                  <Avatar name={name} src={u.avatar} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-black dark:text-white">{name}</span>
                  {u.username !== name && <span className="text-xs text-bodydark2">@{u.username}</span>}
                </button>
              );
            })
          )}
        </div>
      </Modal>

      {/* Match management modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={t('admin.tournaments.match.title')}
        icon={<Swords size={20} />}
        size="lg"
        closeLabel={t('common.close')}
      >
        {selected && (
          <div className="space-y-5">
            <MatchSummary match={selected} roundKey={roundKeyOf.get(selected.round)} />

            {selected.status === 'bye' ? (
              <p className="text-sm text-bodydark2">{t('tournament.match.status.bye')}</p>
            ) : (
              <>
                {/* Result */}
                <section className="space-y-3 rounded-lg border border-stroke p-4 dark:border-strokedark">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-black dark:text-white">
                    <Swords size={16} className="text-primary" /> {t('admin.tournaments.match.result')}
                  </h4>
                  {!selected.teamAId || !selected.teamBId ? (
                    <p className="text-sm text-bodydark2">{t('admin.tournaments.match.incomplete')}</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          type="number"
                          min={0}
                          label={selected.teamA?.name || 'A'}
                          value={scoreA}
                          onChange={(e: any) => setScoreA(e.target.value)}
                        />
                        <Input
                          type="number"
                          min={0}
                          label={selected.teamB?.name || 'B'}
                          value={scoreB}
                          onChange={(e: any) => setScoreB(e.target.value)}
                        />
                      </div>
                      <Select
                        label={t('admin.tournaments.match.winner')}
                        value={winner}
                        onChange={(e: any) => setWinner(e.target.value)}
                        options={[
                          { value: '', label: t('admin.tournaments.match.winnerAuto') },
                          { value: selected.teamAId, label: selected.teamA?.name || 'A' },
                          { value: selected.teamBId, label: selected.teamB?.name || 'B' },
                        ]}
                      />
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button size="sm" loading={busy === 'result'} disabled={!!busy} onClick={saveResult}>
                          {t('admin.tournaments.match.saveResult')}
                        </Button>
                      </div>
                    </>
                  )}
                </section>

                {/* Schedule */}
                <section className="space-y-3 rounded-lg border border-stroke p-4 dark:border-strokedark">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-black dark:text-white">
                    <Calendar size={16} className="text-primary" /> {t('admin.tournaments.match.schedule')}
                  </h4>
                  <Input
                    type="datetime-local"
                    label={t('admin.tournaments.match.date')}
                    value={scheduledAt}
                    onChange={(e: any) => setScheduledAt(e.target.value)}
                  />
                  <Input
                    type="url"
                    label={t('admin.tournaments.match.streamUrl')}
                    placeholder="https://www.youtube.com/watch?v=…"
                    value={streamUrl}
                    onChange={(e: any) => setStreamUrl(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button size="sm" variant="secondary" loading={busy === 'schedule'} disabled={!!busy} onClick={saveSchedule}>
                      {t('admin.tournaments.match.saveSchedule')}
                    </Button>
                  </div>
                </section>

                {/* Status */}
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {selected.status === 'live' ? (
                    <Button size="sm" variant="secondary" disabled={!!busy} onClick={() => setStatus(selected.scheduledAt ? 'scheduled' : 'pending')}>
                      <Radio size={14} /> {t('admin.tournaments.match.unsetLive')}
                    </Button>
                  ) : (
                    selected.status !== 'finished' && (
                      <Button size="sm" variant="danger" disabled={!!busy || !selected.teamAId || !selected.teamBId} onClick={() => setStatus('live')}>
                        <Radio size={14} /> {t('admin.tournaments.match.setLive')}
                      </Button>
                    )
                  )}
                  {selected.status === 'finished' ? (
                    <Button size="sm" variant="secondary" disabled={!!busy} onClick={() => setStatus(selected.scheduledAt ? 'scheduled' : 'pending')}>
                      {t('admin.tournaments.match.reopen')}
                    </Button>
                  ) : (
                    selected.winnerTeamId && (
                      <Button size="sm" disabled={!!busy} onClick={() => setStatus('finished')}>
                        {t('admin.tournaments.match.markFinished')}
                      </Button>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={async () => {
          if (!pending) return;
          const p = pending;
          setPending(null);
          await run('confirm', p.action, p.success);
        }}
        title={pending?.title}
        message={pending?.message}
        confirmLabel={pending?.title}
        cancelLabel={t('common.cancel')}
        variant="warning"
        loading={busy === 'confirm'}
      />
    </div>
  );
}
