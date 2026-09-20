'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Award, CalendarDays, Presentation, Swords, Trophy } from 'lucide-react';
import PublicShell from '@/components/landing/PublicShell';
import { Button, Card, DataTable, EmptyState, SectionTitle, Skeleton, StatCard, type DataColumn } from '@/components/ui';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import type { Season } from '@/store/useSeasonStore';
import { SeasonHero, SeasonPodium, fmtSeasonDate } from '@/components/seasons/shared';

type StandingRow = NonNullable<Season['summary']>['standings'][number];

/**
 * Public season page: theme, dates and, once closed, the frozen summary
 * (podium + final standings). The Hall of Fame (#47) will enrich this.
 */
export default function SeasonDetailPage() {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    setLoading(true);
    api.esport
      .season(slug)
      .then((s: any) => {
        if (alive) setSeason(s && s.id ? s : null);
      })
      .catch(() => {
        if (alive) setSeason(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  const summary = season?.summary ?? null;
  const champion = summary?.podium.find((p) => p.placement === 1)?.team ?? null;

  const columns: DataColumn<StandingRow>[] = [
    { key: 'rank', header: '#', width: 'w-12', render: (r) => <span className="font-display font-bold text-ink-3">{r.rank}</span> },
    {
      key: 'team',
      header: t('seasons.standings.team'),
      render: (r) => (
        <Link href={`/teams/${r.team.id}`} className="inline-flex items-center gap-2.5 font-semibold text-ink-1 hover:text-primary">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded cut-corners-sm bg-surface-2 ring-1 ring-inset ring-line-subtle">
            {r.team.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.team.image} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold text-ink-2">{r.team.name?.[0]}</span>
            )}
          </span>
          <span className="truncate">{r.team.name}</span>
        </Link>
      ),
    },
    { key: 'played', header: t('seasons.standings.played'), align: 'right', render: (r) => r.played },
    { key: 'wins', header: t('seasons.standings.wins'), align: 'right', render: (r) => <span className="font-semibold text-accent-green">{r.wins}</span> },
    { key: 'losses', header: t('seasons.standings.losses'), align: 'right', render: (r) => <span className="font-semibold text-accent-red">{r.losses}</span> },
    { key: 'winRate', header: t('seasons.standings.winRate'), align: 'right', hideBelow: 'sm', render: (r) => `${r.winRate}%` },
    {
      key: 'scoreDiff',
      header: t('seasons.standings.diff'),
      align: 'right',
      render: (r) => <span className={r.scoreDiff > 0 ? 'text-accent-green' : r.scoreDiff < 0 ? 'text-accent-red' : 'text-ink-2'}>{r.scoreDiff > 0 ? `+${r.scoreDiff}` : r.scoreDiff}</span>,
    },
  ];

  return (
    <PublicShell>
      <div className="mx-auto max-w-7xl space-y-10 px-4 pb-20 sm:px-6">
        <Link href="/seasons" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 transition-colors hover:text-ink-1">
          <ArrowLeft size={16} /> {t('seasons.backToList')}
        </Link>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-[22rem] w-full rounded-lg" />
            <Skeleton lines={3} />
          </div>
        ) : !season ? (
          <EmptyState icon={<CalendarDays size={28} />} title={t('seasons.notFound')} />
        ) : (
          <>
            <SeasonHero
              season={season}
              t={t}
              lang={lang}
              actions={
                season.status === 'closed' && season.slug ? (
                  <>
                    <Link href={`/awards?season=${season.slug}`}>
                      <Button variant="primary">
                        <Award size={16} /> {t('awards.title')}
                      </Button>
                    </Link>
                    <Link href={`/ceremony/${season.slug}`}>
                      <Button variant="outline" className="!border-white/30 !text-white hover:!border-white">
                        <Presentation size={16} /> {t('awards.ceremony')}
                      </Button>
                    </Link>
                  </>
                ) : undefined
              }
              aside={
                champion ? (
                  <div className="flex items-center gap-3 rounded-md border border-accent-gold/40 bg-black/50 px-4 py-3 backdrop-blur">
                    <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded cut-corners-sm tier-gold">
                      {champion.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={champion.image} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                      ) : (
                        <span className="font-display font-bold">{champion.name?.[0]}</span>
                      )}
                    </span>
                    <div>
                      <p className="eyebrow !text-accent-gold inline-flex items-center gap-1">
                        <Trophy size={11} /> {t('hof.champion')}
                      </p>
                      <p className="font-display font-bold text-white">{champion.name}</p>
                    </div>
                  </div>
                ) : undefined
              }
            />

            {season.description && <p className="max-w-3xl whitespace-pre-line text-ink-2">{season.description}</p>}

            {/* Frozen summary */}
            {season.status === 'closed' ? (
              summary ? (
                <div className="space-y-10">
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <StatCard label={t('league.kpi.teams')} value={summary.standings.length} accent="cyan" icon={<Trophy size={18} />} />
                    <StatCard
                      label={t('seasons.kpi.matches')}
                      value={summary.matches.completed}
                      hint={t('league.kpi.of', { n: summary.matches.total })}
                      accent="violet"
                      icon={<Swords size={18} />}
                    />
                    <StatCard label={t('seasons.summary.frozen')} value={<span className="text-xl sm:text-2xl">{fmtSeasonDate(summary.frozenAt, lang) || '—'}</span>} accent="gold" icon={<CalendarDays size={18} />} />
                    <StatCard label={t('hof.champion')} value={<span className="block whitespace-normal break-words text-lg leading-tight sm:text-2xl">{champion?.name ?? '—'}</span>} accent="gold" icon={<Award size={18} />} />
                  </div>

                  <section>
                    <SectionTitle
                      eyebrow={t('seasons.summary.kicker')}
                      title={<span className="inline-flex items-center gap-2"><Trophy size={20} className="text-accent-gold" /> {t('seasons.summary.podium')}</span>}
                      description={t('seasons.frozenAt', { date: fmtSeasonDate(summary.frozenAt, lang) || '' })}
                      className="mb-5"
                    />
                    <Card glow className="p-6 sm:p-10">
                      <SeasonPodium podium={summary.podium} t={t} linkTeams />
                    </Card>
                  </section>

                  {summary.standings.length > 0 && (
                    <section>
                      <SectionTitle title={t('seasons.standings.title')} className="mb-5" />
                      <DataTable columns={columns} rows={summary.standings} rowKey={(r) => r.teamId} />
                    </section>
                  )}
                </div>
              ) : (
                <EmptyState icon={<Trophy size={28} />} title={t('seasons.podium.empty')} />
              )
            ) : (
              <Card className="text-center text-sm text-ink-2">
                {season.status === 'upcoming' ? t('seasons.summary.upcoming') : t('seasons.summary.inProgress')}
              </Card>
            )}
          </>
        )}
      </div>
    </PublicShell>
  );
}
