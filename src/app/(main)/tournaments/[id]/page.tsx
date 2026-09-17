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
  Star,
  GitBranch,
  ListChecks,
  Play,
} from 'lucide-react';
import {
  Card,
  Badge,
  Button,
  Tabs,
  SectionCard,
  EmptyState,
  LoadingSpinner,
  Avatar,
} from '@/components/ui';
import Modal from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { formatDate, formatDateTime } from '@/lib/helpers';
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

  if (loading) return <LoadingSpinner size="lg" className="py-24" />;

  if (!data) {
    return (
      <div className="space-y-6">
        <Link href="/tournaments">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} /> {t('tournament.back')}
          </Button>
        </Link>
        <EmptyState icon={<Trophy size={28} />} title={t('tournament.notFound')} />
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
    { id: 'participants', label: `${t('tournament.tab.participants')} (${participants.length})` },
    { id: 'results', label: t('tournament.tab.results') },
    { id: 'schedule', label: t('tournament.tab.schedule') },
    { id: 'live', label: liveMatch ? `🔴 ${t('tournament.tab.live')}` : t('tournament.tab.live') },
  ];

  return (
    <div className="space-y-6">
      <Link href="/tournaments" className="inline-block">
        <Button variant="ghost" size="sm">
          <ArrowLeft size={16} /> {t('tournament.back')}
        </Button>
      </Link>

      {/* Header / banner */}
      <Card className="!p-0 overflow-hidden">
        <div className="relative h-40 w-full bg-gradient-to-r from-neon-blue/30 via-neon-purple/30 to-neon-gold/30 sm:h-52">
          {tournament.banner && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tournament.banner} alt="" className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/10" />
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 inline-flex flex-wrap items-center gap-2 rounded-lg bg-black/50 px-2 py-1 backdrop-blur-sm">
                <Badge variant={TOURNAMENT_STATUS_VARIANT[status] || 'default'} size="sm">
                  {t(`tournament.status.${status}`)}
                </Badge>
                {tournament.format && (
                  <Badge variant="purple" size="sm">{tournament.format}</Badge>
                )}
                {liveMatch && (
                  <Badge variant="red" size="sm">
                    <Radio size={10} className="animate-pulse" /> {t('tournament.match.status.live')}
                  </Badge>
                )}
              </div>
              <h1 className="truncate text-2xl font-bold text-white sm:text-3xl">{tournament.name}</h1>
            </div>
            {tournament.prizePool && (
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-white/70">{t('tournament.prizePool')}</p>
                <p className="text-xl font-bold text-warning sm:text-2xl">{tournament.prizePool}</p>
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
          <div>
            <p className="mb-1 flex items-center gap-1 text-xs text-body dark:text-bodydark">
              <Calendar size={12} /> {t('tournament.dates')}
            </p>
            <p className="text-sm font-medium text-black dark:text-white">
              {tournament.startDate ? formatDate(tournament.startDate) : '—'}
              {tournament.endDate ? ` → ${formatDate(tournament.endDate)}` : ''}
            </p>
          </div>
          <div>
            <p className="mb-1 flex items-center gap-1 text-xs text-body dark:text-bodydark">
              <Users size={12} /> {t('tournament.tab.participants')}
            </p>
            <p className="text-sm font-medium text-black dark:text-white">
              {t('tournament.teamsCount', { count: participants.length, max: tournament.maxTeams })}
            </p>
          </div>
          <div>
            <p className="mb-1 flex items-center gap-1 text-xs text-body dark:text-bodydark">
              <Swords size={12} /> {t('tournament.organizer')}
            </p>
            <p className="truncate text-sm font-medium text-black dark:text-white">
              {tournament.organizer || '—'}
            </p>
          </div>
          <div>
            <p className="mb-1 flex items-center gap-1 text-xs text-body dark:text-bodydark">
              <Trophy size={12} /> {t('tournament.champion')}
            </p>
            {champion ? (
              <p className="flex items-center gap-2 text-sm font-semibold text-black dark:text-white">
                <TeamLogo name={champion.name} logo={champion.logo} size="sm" />
                <span className="truncate">{champion.name}</span>
              </p>
            ) : (
              <p className="text-sm text-bodydark2">—</p>
            )}
          </div>
        </div>
        {tournament.description && (
          <p className="border-t border-stroke px-4 py-3 text-sm text-body dark:border-strokedark dark:text-bodydark">
            {tournament.description}
          </p>
        )}
      </Card>

      <SectionCard className="!p-4">
        <div className="overflow-x-auto">
          <Tabs tabs={tabs} active={tab} onChange={(v: any) => setTab(v)} className="whitespace-nowrap" />
        </div>
      </SectionCard>

      {/* Bracket */}
      {tab === 'bracket' && (
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
              <GitBranch size={18} className="text-primary" /> {t('tournament.tab.bracket')}
            </h3>
            {highlight && (
              <Button variant="ghost" size="sm" onClick={() => setHighlight(null)}>
                {t('tournament.bracket.clearHighlight')}
              </Button>
            )}
          </div>
          {allMatches.length > 0 && (
            <p className="mb-3 text-xs text-bodydark2">{t('tournament.bracket.hint')}</p>
          )}
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
              <EmptyState icon={<GitBranch size={28} />} title={t('tournament.bracket.empty')} />
            }
          />
        </Card>
      )}

      {/* Participants */}
      {tab === 'participants' && (
        <Card>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
            <Users size={18} className="text-primary" /> {t('tournament.tab.participants')}
          </h3>
          {participants.length === 0 ? (
            <EmptyState icon={<Users size={28} />} title={t('tournament.participants.empty')} />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {participants.map((p) => {
                const inner = (
                  <>
                    <TeamLogo name={p.name} logo={p.logo} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-black dark:text-white">{p.name}</p>
                        {p.champion && (
                          <Badge variant="gold" size="sm">
                            <Crown size={10} /> {t('tournament.participants.champion')}
                          </Badge>
                        )}
                        {p.eliminated && !p.champion && (
                          <Badge variant="red" size="sm">{t('tournament.participants.eliminated')}</Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-body dark:text-bodydark">
                        {t('tournament.participants.seed', { n: p.seed })}
                        {' · '}
                        {t('tournament.participants.members', { count: p.membersCount })}
                        {' · '}
                        {t('tournament.participants.wins', { count: p.wins })}
                      </p>
                      {p.captain && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-bodydark2">
                          <Crown size={10} className="text-warning" /> {t('tournament.participants.captain')} :{' '}
                          <span className="truncate text-black dark:text-white">{p.captain.name}</span>
                        </p>
                      )}
                    </div>
                  </>
                );
                const cls = `flex items-center gap-3 rounded-lg border bg-white p-3 dark:bg-boxdark ${
                  p.champion ? 'border-warning/60' : 'border-stroke dark:border-strokedark'
                }`;
                return p.exists ? (
                  <Link key={p.id} href={`/teams/${p.id}`} className={`${cls} transition hover:border-primary`}>
                    {inner}
                  </Link>
                ) : (
                  <div key={p.id} className={cls}>{inner}</div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Results + MVP */}
      {tab === 'results' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {results.length === 0 ? (
              <Card>
                <EmptyState icon={<ListChecks size={28} />} title={t('tournament.results.empty')} />
              </Card>
            ) : (
              [...results].reverse().map((r) => (
                <Card key={r.round}>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-bodydark2">
                    {t(roundLabelKey(r.key), { n: r.round })}
                  </h3>
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
            <Card className="border-warning/40">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
                <Trophy size={18} className="text-warning" /> {t('tournament.champion')}
              </h3>
              {champion ? (
                <Link href={`/teams/${champion.id}`} className="flex items-center gap-3">
                  <TeamLogo name={champion.name} logo={champion.logo} size="lg" />
                  <span className="text-base font-bold text-black dark:text-white">{champion.name}</span>
                </Link>
              ) : (
                <p className="text-sm text-bodydark2">—</p>
              )}
            </Card>
            <Card className="border-primary/40">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
                <Star size={18} className="text-primary" /> {t('tournament.mvp.title')}
              </h3>
              {mvp ? (
                <div className="flex items-center gap-3">
                  <Avatar name={mvp.name} src={mvp.avatar} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold text-black dark:text-white">{mvp.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {hasRankBadge(mvp.rank) && <RankBadge rank={mvp.rank} size={22} />}
                      {mvp.role && <Badge variant="default" size="sm">{mvp.role}</Badge>}
                    </div>
                    <Link href={`/players/${mvp.userId}`} className="mt-1 inline-block text-xs text-primary hover:underline">
                      {t('tournament.mvp.viewProfile')}
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-bodydark2">{t('tournament.mvp.empty')}</p>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Schedule */}
      {tab === 'schedule' && (
        <Card>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
            <Calendar size={18} className="text-primary" /> {t('tournament.tab.schedule')}
          </h3>
          {schedule.length === 0 ? (
            <EmptyState icon={<Calendar size={28} />} title={t('tournament.schedule.empty')} />
          ) : (
            <div className="space-y-5">
              {upcoming.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-bodydark2">
                    {t('tournament.schedule.upcoming')}
                  </p>
                  <div className="space-y-2">
                    {upcoming.map((m) => (
                      <MatchSummary key={m.id} match={m} roundKey={roundKeyOf.get(m.round)} onClick={() => setSelected(m)} />
                    ))}
                  </div>
                </div>
              )}
              {past.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-bodydark2">
                    {t('tournament.schedule.past')}
                  </p>
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
          <div className="flex items-center justify-between gap-2 border-b border-stroke p-4 dark:border-strokedark">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-black dark:text-white">
              <Radio size={18} className={liveMatch ? 'animate-pulse text-danger' : 'text-bodydark2'} />{' '}
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
                <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-gaming-darker text-center">
                  <WifiOff size={40} className="text-gray-500" />
                  <p className="text-sm text-gray-400">{t('tournament.live.noStream')}</p>
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
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-gaming-darker text-center">
              <WifiOff size={40} className="text-gray-500" />
              <p className="text-sm font-medium text-gray-300">{t('tournament.live.none')}</p>
              <p className="text-xs text-gray-500">{t('tournament.live.noneHint')}</p>
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
              <div className="rounded-lg bg-gray-2 p-3 dark:bg-meta-4">
                <p className="mb-1 text-xs text-body dark:text-bodydark">{t('tournament.match.scheduledAt')}</p>
                <p className="font-medium text-black dark:text-white">
                  {selected.scheduledAt ? formatDateTime(selected.scheduledAt) : t('tournament.match.notScheduled')}
                </p>
              </div>
              <div className="rounded-lg bg-gray-2 p-3 dark:bg-meta-4">
                <p className="mb-1 text-xs text-body dark:text-bodydark">{t('tournament.match.winner')}</p>
                <p className="font-medium text-black dark:text-white">
                  {selected.winnerTeamId
                    ? (selected.winnerTeamId === selected.teamAId ? selected.teamA?.name : selected.teamB?.name) || '—'
                    : '—'}
                </p>
              </div>
            </div>
            {(!selected.teamAId || !selected.teamBId) && selected.status !== 'bye' && (
              <p className="text-xs text-bodydark2">{t('tournament.match.tbd')}</p>
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
