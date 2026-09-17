'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CalendarDays, Flag, Lock, Sparkles, Trophy } from 'lucide-react';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import { LoadingSpinner, EmptyState } from '@/components/ui';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import type { Season } from '@/store/useSeasonStore';
import { SeasonStatusBadge, SeasonPodium, seasonPeriod, fmtSeasonDate } from '@/components/seasons/shared';

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

  const accent = season?.color || '#3c50e0';
  const summary = season?.summary ?? null;
  const period = season ? seasonPeriod(season, lang) : null;

  return (
    <div className="relative min-h-screen">
      <LandingHeader />
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-20 space-y-10">
        <Link href="/seasons" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} /> {t('seasons.backToList')}
        </Link>

        {loading ? (
          <LoadingSpinner size="lg" className="py-24" />
        ) : !season ? (
          <EmptyState icon={<CalendarDays size={28} />} title={t('seasons.notFound')} />
        ) : (
          <>
            {/* Hero */}
            <section
              className="relative overflow-hidden rounded-3xl border border-white/10"
              style={{ boxShadow: `0 0 80px -20px ${accent}` }}
            >
              {season.banner ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={season.banner} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accent}, #0b0f1a 70%)` }} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
              <div className="relative p-6 sm:p-10 md:p-14 flex flex-col gap-4 min-h-[16rem] justify-end">
                <div className="flex flex-wrap items-center gap-2">
                  <SeasonStatusBadge status={season.status} t={t} size="md" className="bg-white/10 backdrop-blur" />
                  {season.number != null && (
                    <span className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
                      {t('seasons.numberLabel', { n: season.number })}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl sm:text-5xl font-black text-white drop-shadow">{season.name}</h1>
                {season.theme && (
                  <p className="inline-flex items-center gap-2 text-lg sm:text-2xl font-semibold" style={{ color: accent }}>
                    <Sparkles size={20} /> {season.theme}
                  </p>
                )}
                {season.slogan && <p className="text-white/80 italic max-w-2xl">« {season.slogan} »</p>}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-white/70">
                  {period && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={14} /> {period}
                    </span>
                  )}
                  {season.playoffsStartDate && (
                    <span className="inline-flex items-center gap-1.5">
                      <Flag size={14} /> {t('seasons.playoffsFrom', { date: fmtSeasonDate(season.playoffsStartDate, lang) || '' })}
                    </span>
                  )}
                  {season.closedAt && (
                    <span className="inline-flex items-center gap-1.5">
                      <Lock size={14} /> {t('seasons.closedOn', { date: fmtSeasonDate(season.closedAt, lang) || '' })}
                    </span>
                  )}
                </div>
              </div>
            </section>

            {season.description && (
              <p className="text-gray-300 whitespace-pre-line max-w-3xl">{season.description}</p>
            )}

            {/* Frozen summary */}
            {season.status === 'closed' ? (
              summary ? (
                <section className="space-y-8">
                  <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 mb-2">{t('seasons.summary.kicker')}</p>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white inline-flex items-center gap-2">
                      <Trophy className="text-yellow-400" size={24} /> {t('seasons.summary.podium')}
                    </h2>
                    <p className="text-xs text-gray-500 mt-2">
                      {t('seasons.frozenAt', { date: fmtSeasonDate(summary.frozenAt, lang) || '' })} ·{' '}
                      {t('admin.seasons.summary.matches', { n: summary.matches.completed, total: summary.matches.total })}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-10">
                    <SeasonPodium podium={summary.podium} t={t} />
                  </div>

                  {summary.standings.length > 0 && (
                    <div className="overflow-x-auto rounded-2xl border border-white/10">
                      <table className="w-full text-sm">
                        <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                          <tr>
                            <th className="px-3 py-2.5 text-left">#</th>
                            <th className="px-3 py-2.5 text-left">{t('seasons.standings.team')}</th>
                            <th className="px-3 py-2.5 text-right">{t('seasons.standings.played')}</th>
                            <th className="px-3 py-2.5 text-right">{t('seasons.standings.wins')}</th>
                            <th className="px-3 py-2.5 text-right">{t('seasons.standings.losses')}</th>
                            <th className="px-3 py-2.5 text-right hidden sm:table-cell">{t('seasons.standings.winRate')}</th>
                            <th className="px-3 py-2.5 text-right">{t('seasons.standings.diff')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.standings.map((r) => (
                            <tr key={r.teamId} className="border-t border-white/10 hover:bg-white/[0.03]">
                              <td className="px-3 py-2.5 text-gray-400 tabular-nums">{r.rank}</td>
                              <td className="px-3 py-2.5">
                                <span className="inline-flex items-center gap-2 font-medium text-white">
                                  {r.team.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={r.team.image} alt="" className="h-6 w-6 rounded-full object-cover" />
                                  ) : (
                                    <span className="h-6 w-6 rounded-full bg-white/10 text-[10px] flex items-center justify-center">
                                      {r.team.name?.[0]}
                                    </span>
                                  )}
                                  {r.team.name}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-right tabular-nums">{r.played}</td>
                              <td className="px-3 py-2.5 text-right tabular-nums text-green-400">{r.wins}</td>
                              <td className="px-3 py-2.5 text-right tabular-nums text-red-400">{r.losses}</td>
                              <td className="px-3 py-2.5 text-right tabular-nums hidden sm:table-cell">{r.winRate}%</td>
                              <td className="px-3 py-2.5 text-right tabular-nums">{r.scoreDiff > 0 ? `+${r.scoreDiff}` : r.scoreDiff}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              ) : (
                <EmptyState icon={<Trophy size={28} />} title={t('seasons.podium.empty')} />
              )
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-gray-400 text-sm">
                {season.status === 'upcoming' ? t('seasons.summary.upcoming') : t('seasons.summary.inProgress')}
              </div>
            )}
          </>
        )}
      </main>
      <LandingFooter />
    </div>
  );
}
