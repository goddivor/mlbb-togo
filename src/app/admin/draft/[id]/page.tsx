'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Play,
  RefreshCw,
  DoorOpen,
  DoorClosed,
  Send,
  UserX,
  Users,
  Info,
  ListChecks,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Card, Button, Badge, LoadingSpinner } from '@/components/ui';
import DraftBracket from '@/components/draft/DraftBracket';
import toast from 'react-hot-toast';

const TEAM_SIZE: Record<string, number> = { '1v1': 1, '3v3': 3, '5v5': 5 };

const statusVariant: Record<string, string> = {
  draft: 'default',
  registration: 'green',
  closed: 'gold',
  drafted: 'blue',
  ongoing: 'purple',
  completed: 'default',
};

export default function AdminDraftManagePage() {
  const t = useT();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [bracket, setBracket] = useState<{ teams: any[]; matches: any[] }>({ teams: [], matches: [] });
  const [busy, setBusy] = useState<string | null>(null);

  const errMsg = (e: any) => e?.message || t('admin.draft.error');

  const reload = useCallback(async () => {
    try {
      const list = await api.draft.admin.list();
      const tn = (Array.isArray(list) ? list : []).find((x: any) => x.id === id) || null;
      setTournament(tn);

      const [regs, brk] = await Promise.all([
        api.draft.admin.registrations(id).catch(() => []),
        tn && ['drafted', 'ongoing', 'completed'].includes(tn.status)
          ? api.draft.bracket(id).catch(() => ({ teams: [], matches: [] }))
          : Promise.resolve({ teams: [], matches: [] }),
      ]);
      setRegistrations(Array.isArray(regs) ? regs : []);
      setBracket(brk && brk.teams ? brk : { teams: [], matches: [] });
    } catch (e: any) {
      toast.error(errMsg(e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await reload();
      setLoading(false);
    })();
  }, [reload]);

  // Run a mutating admin action, then refresh everything.
  const run = async (key: string, fn: () => Promise<any>, successKey?: string) => {
    setBusy(key);
    try {
      await fn();
      if (successKey) toast.success(t(successKey));
      await reload();
    } catch (e: any) {
      toast.error(errMsg(e));
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="py-24" />;

  if (!tournament) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/draft')}>
          <ArrowLeft size={16} /> {t('admin.draft.back')}
        </Button>
        <Card>
          <p className="py-8 text-center text-sm text-body dark:text-bodydark">
            {t('admin.draft.noTournaments')}
          </p>
        </Card>
      </div>
    );
  }

  const status: string = tournament.status;
  const teamSize = TEAM_SIZE[tournament.category] || tournament.teamSize || 5;
  const regCount = registrations.length;
  const divisible = regCount > 0 && regCount % teamSize === 0;
  const hasBracket = ['drafted', 'ongoing', 'completed'].includes(status);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push('/admin/draft')}>
        <ArrowLeft size={16} /> {t('admin.draft.back')}
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-title-md2 font-bold text-black dark:text-white">{tournament.name}</h2>
            <Badge variant="neon" size="sm">
              {tournament.category}
            </Badge>
            <Badge variant={statusVariant[status] || 'default'} size="sm">
              {t('draft.status.' + status)}
            </Badge>
          </div>
          {tournament.description && (
            <p className="mt-1 text-sm text-body dark:text-bodydark">{tournament.description}</p>
          )}
        </div>
      </div>

      {/* Divisibility reminder */}
      <div className="flex items-start gap-2 rounded-lg border border-stroke bg-gray-2 p-3 text-sm text-body dark:border-strokedark dark:bg-meta-4 dark:text-bodydark">
        <Info size={16} className="mt-0.5 shrink-0 text-primary" />
        <span>{t('admin.draft.divisibility', { size: teamSize })}</span>
      </div>

      {/* Registration control + registrants */}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
            <Users size={20} className="text-primary" /> {t('admin.draft.registrations')}
          </h3>
          <div className="flex items-center gap-2">
            {(status === 'draft' || status === 'closed') && (
              <Button
                size="sm"
                onClick={() => run('open', () => api.draft.admin.open(id), 'admin.draft.opened')}
                loading={busy === 'open'}
                disabled={!!busy}
              >
                <DoorOpen size={16} /> {t('admin.draft.openReg')}
              </Button>
            )}
            {status === 'registration' && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => run('close', () => api.draft.admin.close(id), 'admin.draft.closed')}
                loading={busy === 'close'}
                disabled={!!busy}
              >
                <DoorClosed size={16} /> {t('admin.draft.closeReg')}
              </Button>
            )}
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm text-body dark:text-bodydark">
            <ListChecks size={16} /> {t('draft.registeredCount', { count: regCount })}
          </span>
          {regCount > 0 && (
            <Badge variant={divisible ? 'green' : 'red'} size="sm">
              {regCount} % {teamSize} = {regCount % teamSize}
            </Badge>
          )}
        </div>

        {registrations.length === 0 ? (
          <p className="py-6 text-center text-sm text-bodydark2">
            {t('draft.registeredCount', { count: 0 })}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {registrations.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-stroke px-3 py-2 dark:border-strokedark"
              >
                <span className="min-w-0 truncate text-sm font-medium text-black dark:text-white">
                  {r.name}
                </span>
                {r.preferredRole && (
                  <Badge variant="default" size="sm">
                    {t('draft.role.' + r.preferredRole)}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Draft actions */}
      {(status === 'closed' || status === 'drafted') && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
              <Play size={20} className="text-primary" /> {t('admin.draft.teams')}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {status === 'closed' && (
                <Button
                  size="sm"
                  onClick={() =>
                    run('draft', () => api.draft.admin.runDraft(id), 'admin.draft.drafted')
                  }
                  loading={busy === 'draft'}
                  disabled={!!busy}
                >
                  <Play size={16} /> {t('admin.draft.runDraft')}
                </Button>
              )}
              {status === 'drafted' && (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      run('draft', () => api.draft.admin.runDraft(id), 'admin.draft.drafted')
                    }
                    loading={busy === 'draft'}
                    disabled={!!busy}
                  >
                    <RefreshCw size={16} /> {t('admin.draft.rerunDraft')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      run('publish', () => api.draft.admin.publish(id), 'admin.draft.published')
                    }
                    loading={busy === 'publish'}
                    disabled={!!busy}
                  >
                    <Send size={16} /> {t('admin.draft.publish')}
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Teams + bracket */}
      {hasBracket && (
        <>
          <Card>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
              <Users size={20} className="text-primary" /> {t('admin.draft.teams')}
            </h3>
            {bracket.teams.length === 0 ? (
              <p className="py-6 text-center text-sm text-bodydark2">—</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {bracket.teams.map((tm) => (
                  <div
                    key={tm.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 ${
                      tm.eliminated
                        ? 'border-danger/40 opacity-70'
                        : 'border-stroke dark:border-strokedark'
                    }`}
                  >
                    {tm.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={tm.icon}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-lg bg-gray-2 object-cover dark:bg-meta-4"
                      />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-2 text-bodydark2 dark:bg-meta-4">
                        {tm.seed ?? '?'}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-black dark:text-white">
                        {tm.name}
                      </p>
                      {tm.complete === false && (
                        <Badge variant="red" size="sm" className="mt-1">
                          {t('draft.incompleteTeam')}
                        </Badge>
                      )}
                    </div>
                    {tm.complete === false && !tm.eliminated && (
                      <div className="flex shrink-0 flex-col gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            run('second', () => api.draft.admin.secondPhase(id))
                          }
                          loading={busy === 'second'}
                          disabled={!!busy}
                        >
                          {t('admin.draft.secondPhase')}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() =>
                            run(`elim-${tm.id}`, () => api.draft.admin.eliminate(id, tm.id))
                          }
                          loading={busy === `elim-${tm.id}`}
                          disabled={!!busy}
                        >
                          <UserX size={14} /> {t('admin.draft.eliminate')}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
              {t('draft.bracket')}
            </h3>
            <DraftBracket
              teams={bracket.teams}
              matches={bracket.matches}
              onSetWinner={(matchId, teamId) =>
                run(`win-${matchId}`, () => api.draft.admin.setWinner(id, matchId, teamId))
              }
            />
          </Card>
        </>
      )}
    </div>
  );
}
