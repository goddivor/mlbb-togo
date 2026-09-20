'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Trophy,
  Calendar,
  Users,
  Swords,
  Crown,
  Radio,
  ExternalLink,
  WifiOff,
  GitBranch,
  ListChecks,
  Play,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Card,
  Badge,
  Button,
  Tabs,
  EmptyState,
  Avatar,
  PageHeader,
  Skeleton,
} from '@/components/ui';
import Modal from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { cn, formatDate, formatDateTime } from '@/lib/helpers';
import { fadeUp, stagger, still } from '@/lib/motion';
import EliminationBracket from '@/components/tournaments/EliminationBracket';
import MatchSummary, { DetailedMatch } from '@/components/tournaments/MatchSummary';
import {
  TOURNAMENT_STATUS_VARIANT,
  TeamLogo,
  roundLabelKey,
  streamEmbedUrl,
} from '@/components/tournaments/tournament-utils';
import RankBadge, { hasRankBadge } from '@/components/game/RankBadge';

type Details = {
  tournament: any;
  participants: any[];
  bracket: { totalRounds: number; rounds: { round: number; key: string; matches: DetailedMatch[] }[] };
  results: { round: number; key: string; matches: DetailedMatch[] }[];
  champion: any;
  mvp: any;
  schedule: DetailedMatch[];
  liveMatch: DetailedMatch | null;
};

const TABS = ['bracket', 'participants', 'results', 'schedule', 'live'] as const;

export default function TournamentDetailPage() {
  const t = useT();
  const reduce = useReducedMotion();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Details | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<(typeof TABS)[number]>('bracket');
  const [selected, setSelected] = useState<DetailedMatch | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);

  const load = useCallback(
    () =>
      api.tournaments
        .details(id)
        .then((d: any) => setData(d && d.tournament ? d : null))
        .catch(() => setData(null)),
    [id],
  );

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  // Poll while a match is live so the score/stream stays fresh.
  useEffect(() => {
    if (!data?.liveMatch) return;
    const timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, [data?.liveMatch, load]);

  const allMatches = useMemo(
    () => (data ? data.bracket.rounds.flatMap((r) => r.matches) : []),
    [data],
  );
  const roundKeyOf = useMemo(() => {
    const m = new Map<number, string>();
    data?.bracket.rounds.forEach((r) => m.set(r.round, r.key));
    return m;
  }, [data]);
  const bracketTeams = useMemo(
    () =>
      (data?.participants || []).map((p) => ({ id: p.id, name: p.name, icon: p.logo, seed: p.seed })),
    [data],
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-2/3 max-w-md" />
        <Card className="!p-5">
          <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} lines={2} />
            ))}
          </div>
        </Card>
        <Card>
          <Skeleton lines={4} />
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Link href="/tournaments">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} /> {t('tournament.back')}
          </Button>
        </Link>
        <EmptyState icon={<Trophy size={28} />} title={t('tournament.notFound')} className="min-h-[40vh]" />
      </div>
    );
  }

  const { tournament, participants, results, champion, mvp, schedule, liveMatch } = data;
  const status: string = tournament.status || 'upcoming';
  const now = Date.now();
  const upcoming = schedule.filter(
    (m) => m.status !== 'finished' && (!m.scheduledAt || new Date(m.scheduledAt).getTime() >= now - 3 * 3600_000),
  );
  const past = schedule.filter((m) => !upcoming.includes(m));
  const liveEmbed = streamEmbedUrl(liveMatch?.streamUrl || tournament.streamUrl);

  const tabs = [
    { id: 'bracket', label: t('tournament.tab.bracket') },
    { id: 'participants', label: t('tournament.tab.participants'), count: participants.length },
    { id: 'results', label: t('tournament.tab.results') },
    { id: 'schedule', label: t('tournament.tab.schedule') },
    {
      id: 'live',
      label: liveMatch ? (
        <span className="inline-flex items-center gap-2 text-accent-red">
          <span className="live-dot" aria-hidden="true" /> {t('tournament.tab.live')}
        </span>
      ) : (
        t('tournament.tab.live')
      ),
    },
  ];

  const kpi = (icon: React.ReactNode, label: React.ReactNode, value: React.ReactNode) => (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded cut-corners-sm bg-accent-gold/15 text-accent-gold">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{label}</p>
        <div className="mt-1 truncate font-display text-base font-bold leading-tight num text-ink-1">{value}</div>
      </div>
    </div>
  );

  const sectionTitle = (icon: React.ReactNode, label: React.ReactNode, action?: React.ReactNode) => (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h3 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight2 text-ink-1">
        <span className="text-primary">{icon}</span> {label}
      </h3>
      {action}
    </div>
  );

  return (
    <div className="space-y-6">
      <Link href="/tournaments" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 transition-colors hover:text-primary">
        <ArrowLeft size={15} /> {t('tournament.back')}
      </Link>
      <PageHeader
        eyebrow={t('tournaments.eyebrow')}
        title={tournament.name}
        breadcrumb={t('tournaments.title')}
        variant="gold"
        banner={tournament.banner || undefined}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant={TOURNAMENT_STATUS_VARIANT[status] || 'default'} size="sm">
              {t(`tournament.status.${status}`)}
            </Badge>
            {tournament.format && <Badge variant="purple" size="sm">{tournament.format}</Badge>}
            {liveMatch && (
              <Badge variant="live" size="sm">
                {t('tournament.match.status.live')}
              </Badge>
            )}
          </span>
        }
        action={
          tournament.prizePool ? (
            <div className="text-right">
              <p className={cn('text-[10px] font-semibold uppercase tracking-eyebrow', tournament.banner ? 'text-white/70' : 'text-ink-3')}>
                {t('tournament.prizePool')}
              </p>
              <p className="font-display text-2xl font-bold leading-none num text-accent-gold">{tournament.prizePool}</p>
            </div>
          ) : undefined
        }
      />

      {/* Key facts */}
      <Card className="!p-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {kpi(
            <Calendar size={15} />,
            t('tournament.dates'),
            <>
              {tournament.startDate ? formatDate(tournament.startDate) : '—'}
              {tournament.endDate ? ` → ${formatDate(tournament.endDate)}` : ''}
            </>,
          )}
          {kpi(
            <Users size={15} />,
            t('tournament.tab.participants'),
            t('tournament.teamsCount', { count: participants.length, max: tournament.maxTeams }),
          )}
          {kpi(<Swords size={15} />, t('tournament.organizer'), tournament.organizer || '—')}
          {kpi(
            <Trophy size={15} />,
            t('tournament.champion'),
            champion ? (
              <span className="inline-flex items-center gap-2">
                <TeamLogo name={champion.name} logo={champion.logo} size="sm" />
                <span className="truncate">{champion.name}</span>
              </span>
            ) : (
              '—'
            ),
          )}
        </div>
        {tournament.description && (
          <p className="mt-5 border-t border-line-subtle pt-4 text-sm text-ink-2">{tournament.description}</p>
        )}
      </Card>

      <div className="overflow-x-auto whitespace-nowrap">
        <Tabs variant="underline" tabs={tabs} active={tab} onChange={(v: any) => setTab(v)} className="min-w-max" />
      </div>

      {/* Bracket */}
      {tab === 'bracket' && (
        <Card>
          {sectionTitle(
            <GitBranch size={18} />,
            t('tournament.tab.bracket'),
            highlight && (
              <Button variant="ghost" size="sm" onClick={() => setHighlight(null)}>
                {t('tournament.bracket.clearHighlight')}
              </Button>
            ),
          )}
          {allMatches.length > 0 && <p className="mb-4 text-xs text-ink-3">{t('tournament.bracket.hint')}</p>}
          <EliminationBracket
            teams={bracketTeams}
            matches={allMatches}
            showDetails
            selectedMatchId={selected?.id}
            highlightTeamId={highlight}
            onSelectMatch={(m) => setSelected(m as DetailedMatch)}
            onTeamClick={(teamId) => setHighlight((h) => (h === teamId ? null : teamId))}
            roundLabel={(round, total) =>
              t(roundLabelKey(roundKeyOf.get(round) || (round === total ? 'final' : 'round')), { n: round })
            }
            emptyText={
              <EmptyState icon={<GitBranch size={28} />} title={t('tournament.bracket.empty')} className="min-h-0 py-10" />
            }
          />
        </Card>
      )}

      {/* Participants */}
      {tab === 'participants' && (
        <Card>
          {sectionTitle(<Users size={18} />, t('tournament.tab.participants'))}
          {participants.length === 0 ? (
            <EmptyState icon={<Users size={28} />} title={t('tournament.participants.empty')} className="min-h-0 py-10" />
          ) : (
            <motion.div
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
              variants={reduce ? still : stagger(0.04)}
              initial="hidden"
              animate="visible"
            >
              {participants.map((p) => {
                const inner = (
                  <>
                    <TeamLogo name={p.name} logo={p.logo} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate font-display text-base font-bold tracking-tight2 text-ink-1">{p.name}</p>
                        {p.champion && (
                          <Badge variant="tier-gold" size="sm">
                            <Crown size={10} /> {t('tournament.participants.champion')}
                          </Badge>
                        )}
                        {p.eliminated && !p.champion && (
                          <Badge variant="red" size="sm">{t('tournament.participants.eliminated')}</Badge>
                        )}
                      </div>
                      <p className="mt-1 flex flex-wrap gap-x-3 text-xs num text-ink-2">
                        <span>{t('tournament.participants.seed', { n: p.seed })}</span>
                        <span>{t('tournament.participants.members', { count: p.membersCount })}</span>
                        <span>{t('tournament.participants.wins', { count: p.wins })}</span>
                      </p>
                      {p.captain && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-ink-3">
                          <Crown size={10} className="text-accent-gold" /> {t('tournament.participants.captain')} :{' '}
                          <span className="truncate text-ink-1">{p.captain.name}</span>
                        </p>
                      )}
                    </div>
                  </>
                );
                const cls = cn(
                  'flex items-center gap-3 rounded-lg border bg-surface-1 p-3 shadow-elev-1 transition-[border-color,box-shadow] duration-base dark:bg-gradient-to-b dark:from-surface-2/50 dark:to-surface-1',
                  p.champion ? 'border-accent-gold/50' : 'border-line-subtle',
                );
                return (
                  <motion.div key={p.id} variants={reduce ? still : fadeUp}>
                    {p.exists ? (
                      <Link href={`/teams/${p.id}`} className={cn(cls, 'hover:border-primary/50 hover:shadow-elev-2')}>
                        {inner}
                      </Link>
                    ) : (
                      <div className={cls}>{inner}</div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </Card>
      )}

      {/* Results + MVP */}
      {tab === 'results' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {results.length === 0 ? (
              <Card>
                <EmptyState icon={<ListChecks size={28} />} title={t('tournament.results.empty')} className="min-h-0 py-10" />
              </Card>
            ) : (
              [...results].reverse().map((r) => (
                <Card key={r.round}>
                  <p className="eyebrow mb-3">{t(roundLabelKey(r.key), { n: r.round })}</p>
                  <div className="space-y-2">
                    {r.matches.map((m) => (
                      <MatchSummary key={m.id} match={m} roundKey={r.key} onClick={() => setSelected(m)} />
                    ))}
                  </div>
                </Card>
              ))
            )}
          </div>
          <div className="space-y-4">
            <Card accent="gold">
              <p className="eyebrow mb-3 !text-accent-gold">{t('tournament.champion')}</p>
              {champion ? (
                <Link href={`/teams/${champion.id}`} className="flex items-center gap-3">
                  <TeamLogo name={champion.name} logo={champion.logo} size="lg" />
                  <span className="font-display text-lg font-bold tracking-tight2 text-ink-1">{champion.name}</span>
                </Link>
              ) : (
                <p className="text-sm text-ink-3">—</p>
              )}
            </Card>
            <Card accent="cyan">
              <p className="eyebrow mb-3">{t('tournament.mvp.title')}</p>
              {mvp ? (
                <div className="flex items-center gap-3">
                  <Avatar name={mvp.name} src={mvp.avatar} size="lg" ring />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg font-bold tracking-tight2 text-ink-1">{mvp.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {hasRankBadge(mvp.rank) && <RankBadge rank={mvp.rank} size={22} />}
                      {mvp.role && <Badge variant="default" size="sm">{mvp.role}</Badge>}
                    </div>
                    <Link href={`/players/${mvp.userId}`} className="mt-1 inline-block text-xs font-medium text-primary hover:underline">
                      {t('tournament.mvp.viewProfile')}
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-ink-3">{t('tournament.mvp.empty')}</p>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Schedule */}
      {tab === 'schedule' && (
        <Card>
          {sectionTitle(<Calendar size={18} />, t('tournament.tab.schedule'))}
          {schedule.length === 0 ? (
            <EmptyState icon={<Calendar size={28} />} title={t('tournament.schedule.empty')} className="min-h-0 py-10" />
          ) : (
            <div className="space-y-6">
              {upcoming.length > 0 && (
                <div>
                  <p className="eyebrow mb-3">{t('tournament.schedule.upcoming')}</p>
                  <div className="space-y-2">
                    {upcoming.map((m) => (
                      <MatchSummary key={m.id} match={m} roundKey={roundKeyOf.get(m.round)} onClick={() => setSelected(m)} />
                    ))}
                  </div>
                </div>
              )}
              {past.length > 0 && (
                <div>
                  <p className="eyebrow mb-3 !text-ink-3">{t('tournament.schedule.past')}</p>
                  <div className="space-y-2">
                    {past.map((m) => (
                      <MatchSummary key={m.id} match={m} roundKey={roundKeyOf.get(m.round)} onClick={() => setSelected(m)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Live */}
      {tab === 'live' && (
        <Card className="!p-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-line-subtle p-4">
            <h3 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight2 text-ink-1">
              {liveMatch ? (
                <span className="live-dot text-accent-red" aria-hidden="true" />
              ) : (
                <Radio size={18} className="text-ink-3" />
              )}
              {t('tournament.live.title')}
            </h3>
            {liveMatch?.streamUrl && (
              <a href={liveMatch.streamUrl} target="_blank" rel="noreferrer">
                <Button variant="ghost" size="sm">
                  <ExternalLink size={14} /> {t('tournament.live.open')}
                </Button>
              </a>
            )}
          </div>
          {liveMatch ? (
            <>
              {liveEmbed ? (
                <div className="aspect-video w-full bg-black">
                  <iframe
                    src={liveEmbed}
                    title={tournament.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              ) : (
                <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-surface-0 text-center">
                  <WifiOff size={40} className="text-ink-3" />
                  <p className="text-sm text-ink-2">{t('tournament.live.noStream')}</p>
                  {liveMatch.streamUrl && (
                    <a href={liveMatch.streamUrl} target="_blank" rel="noreferrer">
                      <Button size="sm">
                        <Play size={14} /> {t('tournament.live.open')}
                      </Button>
                    </a>
                  )}
                </div>
              )}
              <div className="p-4">
                <MatchSummary match={liveMatch} roundKey={roundKeyOf.get(liveMatch.round)} onClick={() => setSelected(liveMatch)} />
              </div>
            </>
          ) : (
            <div className="flex aspect-video max-h-[360px] w-full flex-col items-center justify-center gap-2 bg-surface-0 px-4 text-center">
              <WifiOff size={40} className="text-ink-3" />
              <p className="font-display text-base font-bold text-ink-1">{t('tournament.live.none')}</p>
              <p className="text-xs text-ink-3">{t('tournament.live.noneHint')}</p>
            </div>
          )}
        </Card>
      )}

      {/* Match details modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={t('tournament.match.details')}
        icon={<Swords size={20} />}
        size="md"
        closeLabel={t('common.close')}
      >
        {selected && (
          <div className="space-y-4">
            <MatchSummary match={selected} roundKey={roundKeyOf.get(selected.round)} />
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg bg-surface-2/70 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{t('tournament.match.scheduledAt')}</p>
                <p className="font-medium num text-ink-1">
                  {selected.scheduledAt ? formatDateTime(selected.scheduledAt) : t('tournament.match.notScheduled')}
                </p>
              </div>
              <div className="rounded-lg bg-surface-2/70 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{t('tournament.match.winner')}</p>
                <p className="font-medium text-ink-1">
                  {selected.winnerTeamId
                    ? (selected.winnerTeamId === selected.teamAId ? selected.teamA?.name : selected.teamB?.name) || '—'
                    : '—'}
                </p>
              </div>
            </div>
            {(!selected.teamAId || !selected.teamBId) && selected.status !== 'bye' && (
              <p className="text-xs text-ink-3">{t('tournament.match.tbd')}</p>
            )}
            {selected.streamUrl && (
              <a href={selected.streamUrl} target="_blank" rel="noreferrer" className="block">
                <Button variant="secondary" className="w-full">
                  <Play size={16} /> {t('tournament.match.watch')}
                </Button>
              </a>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
