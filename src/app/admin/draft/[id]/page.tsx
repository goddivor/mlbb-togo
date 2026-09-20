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
import { Card, Button, Badge, EmptyState, PageHeader, SectionTitle, Skeleton, StatTile } from '@/components/ui';
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <Skeleton lines={4} />
        </Card>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/draft')}>
          <ArrowLeft size={16} /> {t('admin.draft.back')}
        </Button>
        <Card>
          <EmptyState className="!min-h-0 py-8" title={t('admin.draft.noTournaments')} />
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
      {/* Header */}
      <PageHeader
        eyebrow={t('nav.section.esport')}
        breadcrumb={t('admin.draft.title')}
        title={
          <span className="inline-flex flex-wrap items-center gap-2">
            {tournament.name}
            <Badge variant="neon" size="sm">
              {tournament.category}
            </Badge>
            <Badge variant={statusVariant[status] || 'default'} size="sm" dot>
              {t('draft.status.' + status)}
            </Badge>
          </span>
        }
        subtitle={tournament.description || undefined}
        variant="purple"
        action={
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/draft')}>
            <ArrowLeft size={16} /> {t('admin.draft.back')}
          </Button>
        }
      />

      {/* Key figures + divisibility reminder */}
      <Card className="!p-4 sm:!p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-6">
            <StatTile label={t('admin.draft.registrations')} value={regCount} accent="cyan" />
            <StatTile
              label={t('admin.draft.teams')}
              value={Math.floor(regCount / teamSize)}
              accent={regCount > 0 ? (divisible ? 'green' : 'red') : undefined}
            />
          </div>
          <div className="flex items-start gap-2 text-sm text-ink-2">
            <Info size={16} className="mt-0.5 shrink-0 text-primary" />
            <span>{t('admin.draft.divisibility', { size: teamSize })}</span>
          </div>
        </div>
      </Card>

      {/* Registration control + registrants */}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <SectionTitle
            title={
              <span className="inline-flex items-center gap-2">
                <Users size={20} className="text-primary" /> {t('admin.draft.registrations')}
              </span>
            }
          />
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
          <span className="inline-flex items-center gap-1.5 text-sm text-ink-2 num">
            <ListChecks size={16} /> {t('draft.registeredCount', { count: regCount })}
          </span>
          {regCount > 0 && (
            <Badge variant={divisible ? 'green' : 'red'} size="sm">
              {regCount} % {teamSize} = {regCount % teamSize}
            </Badge>
          )}
        </div>

        {registrations.length === 0 ? (
          <EmptyState className="!min-h-0 py-6" title={t('draft.registeredCount', { count: 0 })} />
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {registrations.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-line-subtle bg-surface-2/60 px-3 py-2"
              >
                <span className="min-w-0 truncate text-sm font-medium text-ink-1">
                  {r.name}
                </span>
                {r.preferredRole && (
                  <Badge variant="outline" size="sm">
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
            <SectionTitle
              title={
                <span className="inline-flex items-center gap-2">
                  <Play size={20} className="text-primary" /> {t('admin.draft.teams')}
                </span>
              }
            />
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
            <SectionTitle
              className="mb-4"
              title={
                <span className="inline-flex items-center gap-2">
                  <Users size={20} className="text-primary" /> {t('admin.draft.teams')}
                </span>
              }
            />
            {bracket.teams.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-3">—</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {bracket.teams.map((tm) => (
                  <div
                    key={tm.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 ${
                      tm.eliminated
                        ? 'border-accent-red/40 opacity-70'
                        : 'border-line-subtle bg-surface-2/60'
                    }`}
                  >
                    {tm.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={tm.icon}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-lg bg-surface-3 object-cover"
                      />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-3 font-display font-bold text-ink-3 num">
                        {tm.seed ?? '?'}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-1">
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
            <SectionTitle className="mb-4" title={t('draft.bracket')} />
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
