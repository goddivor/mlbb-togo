'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Trophy, Calendar, Users, Play, ExternalLink, Medal, Swords, Target, ArrowRight, MapPin, Coins,
} from 'lucide-react';
import {
  Card, Badge, Button, Tabs, PageHeader, EmptyState, ProgressBar, Skeleton, StatCard,
} from '@/components/ui';
import Modal from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useStore';
import { useT } from '@/lib/i18n';
import { cn, formatDate } from '@/lib/helpers';
import { fadeUp, stagger, still } from '@/lib/motion';
import { TOURNAMENT_STATUS_VARIANT, TeamLogo } from '@/components/tournaments/tournament-utils';
import toast from 'react-hot-toast';

const TABS = ['all', 'upcoming', 'ongoing', 'completed'] as const;

export default function Tournaments() {
  const t = useT();
  const reduce = useReducedMotion();
  const myId = useAuthStore((s: any) => s.user?.id);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [myTeams, setMyTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [registerFor, setRegisterFor] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const loadTournaments = () =>
    api.tournaments.list().then((l: any) => setTournaments(Array.isArray(l) ? l : []));

  useEffect(() => {
    Promise.all([
      loadTournaments(),
      api.esport.teams('esport').then((l: any) => (Array.isArray(l) ? l : [])),
    ])
      .then(([, teams]) => {
        setMyTeams(
          (teams as any[]).filter((tm) =>
            (tm.members || []).some(
              (m: any) => (m.user?.id === myId || m.userId === myId) && m.isCaptain,
            ),
          ),
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId]);

  const countBy = (status: string) => tournaments.filter((x: any) => x.status === status).length;
  const registeredTotal = tournaments.reduce(
    (acc: number, x: any) => acc + (x.registeredTeams || []).length,
    0,
  );
  const filtered = tournaments.filter((x: any) => (activeTab === 'all' ? true : x.status === activeTab));
  const tournament = selectedId ? tournaments.find((x: any) => x.id === selectedId) : null;
  const bannerArt = tournaments.find((x: any) => x.banner)?.banner as string | undefined;

  const registeredIds = (x: any) => new Set((x?.registeredTeams || []).map((r: any) => r.id));
  const myRegistered = (x: any) => myTeams.find((mt) => registeredIds(x).has(mt.id));

  const register = async (tournamentId: string, teamId: string) => {
    setBusy(true);
    try {
      await api.tournaments.register(tournamentId, teamId);
      await loadTournaments();
      setRegisterFor(null);
      toast.success(t('tournaments.toast.registered'));
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const unregister = async (tournamentId: string, teamId: string) => {
    setBusy(true);
    try {
      await api.tournaments.unregister(tournamentId, teamId);
      await loadTournaments();
      toast.success(t('tournaments.toast.unregistered'));
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const tabs = TABS.map((id) => ({
    id,
    label: id === 'all' ? t('tournaments.tab.all') : t(`tournament.status.${id}`),
    count: id === 'all' ? tournaments.length : countBy(id),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Trophy size={20} />}
        eyebrow={t('tournaments.eyebrow')}
        title={t('tournaments.title')}
        subtitle={t('tournaments.subtitle')}
        variant="gold"
        banner={bannerArt}
      >
        <StatCard label={t('tournaments.kpi.total')} value={tournaments.length} icon={<Trophy size={18} />} accent="gold" />
        <StatCard label={t('tournaments.kpi.upcoming')} value={countBy('upcoming')} icon={<Calendar size={18} />} accent="cyan" />
        <StatCard label={t('tournaments.kpi.ongoing')} value={countBy('ongoing')} icon={<Swords size={18} />} accent="red" />
        <StatCard label={t('tournaments.kpi.teams')} value={registeredTotal} icon={<Users size={18} />} accent="violet" />
      </PageHeader>

      <div className="overflow-x-auto whitespace-nowrap">
        <Tabs variant="underline" tabs={tabs} active={activeTab} onChange={setActiveTab} className="min-w-max" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {[0, 1].map((i) => (
              <Card key={i}>
                <Skeleton className="mb-3 h-5 w-24" />
                <Skeleton className="mb-4 h-7 w-2/3" />
                <Skeleton lines={2} />
              </Card>
            ))}
          </div>
          <Card>
            <Skeleton lines={5} />
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <motion.div
            className="space-y-4 lg:col-span-2"
            variants={reduce ? still : stagger(0.05)}
            initial="hidden"
            animate="visible"
          >
            {filtered.map((tour: any) => {
              const regTeams = tour.registeredTeams || [];
              const isSelected = selectedId === tour.id;
              return (
                <motion.div key={tour.id} variants={reduce ? still : fadeUp}>
                  <Card
                    hover
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedId(tour.id);
                      }
                    }}
                    className={cn(
                      'relative cursor-pointer overflow-hidden',
                      isSelected && 'border-primary/60 shadow-glow-cyan'
                    )}
                    onClick={() => setSelectedId(tour.id)}
                  >
                    {tour.banner && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={tour.banner}
                        alt=""
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 right-0 w-1/2 object-cover opacity-20 [mask-image:linear-gradient(90deg,transparent,black)]"
                      />
                    )}
                    <div className="relative">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <Badge variant={TOURNAMENT_STATUS_VARIANT[tour.status] || 'default'} size="sm">
                              {t(`tournament.status.${tour.status}`) || tour.status}
                            </Badge>
                            {tour.format && <Badge variant="purple" size="sm">{tour.format}</Badge>}
                            {myRegistered(tour) && (
                              <Badge variant="green" size="sm" dot>
                                {t('draft.registered')}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-display text-xl font-bold tracking-tight2 text-ink-1">{tour.name}</h3>
                        </div>
                        {tour.prizePool && (
                          <div className="shrink-0 text-right">
                            <p className="font-display text-lg font-bold leading-none num text-accent-gold">{tour.prizePool}</p>
                            <p className="mt-1 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">
                              {t('tournament.prizePool')}
                            </p>
                          </div>
                        )}
                      </div>

                      {tour.description && <p className="mb-4 text-sm text-ink-2">{tour.description}</p>}

                      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-2">
                        {(tour.startDate || tour.endDate) && (
                          <span className="inline-flex items-center gap-1.5 num">
                            <Calendar size={14} className="text-ink-3" />
                            {formatDate(tour.startDate)}
                            {tour.endDate ? ` → ${formatDate(tour.endDate)}` : ''}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 num">
                          <Users size={14} className="text-ink-3" />
                          {t('tournament.teamsCount', { count: regTeams.length, max: tour.maxTeams })}
                        </span>
                        {tour.organizer && (
                          <span className="inline-flex items-center gap-1.5">
                            <Swords size={14} className="text-ink-3" />
                            {tour.organizer}
                          </span>
                        )}
                        {tour.city && (
                          <span className="inline-flex items-center gap-1.5 capitalize">
                            <MapPin size={14} className="text-ink-3" />
                            {tour.city}
                          </span>
                        )}
                      </div>

                      <ProgressBar
                        value={regTeams.length}
                        max={tour.maxTeams || 1}
                        accent={tour.status === 'ongoing' ? 'red' : 'gold'}
                        className="mb-4 h-1.5"
                        label={t('tournaments.kpi.teams')}
                      />

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center">
                          <div className="flex -space-x-1.5">
                            {regTeams.slice(0, 5).map((team: any) => (
                              <TeamLogo
                                key={team.id}
                                name={team.name}
                                logo={team.logo}
                                size="sm"
                                className="h-7 w-7 ring-2 ring-surface-1"
                              />
                            ))}
                          </div>
                          {regTeams.length > 5 && (
                            <span className="ml-2 text-xs font-semibold num text-ink-3">+{regTeams.length - 5}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {tour.streamUrl && (
                            <a href={tour.streamUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm">
                                <Play size={14} /> {t('tournaments.stream')}
                              </Button>
                            </a>
                          )}
                          <Link href={`/dashboard/tournaments/${tour.id}`} onClick={(e) => e.stopPropagation()}>
                            <Button variant="secondary" size="sm">
                              {t('tournament.viewDetails')} <ArrowRight size={14} />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}

            {filtered.length === 0 && (
              <EmptyState
                icon={<Trophy size={28} />}
                title={t('tournaments.empty.title')}
                description={t('tournaments.empty.desc')}
                className="min-h-[40vh]"
              />
            )}
          </motion.div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            {tournament ? (
              <Card accent="gold" className="overflow-hidden">
                <p className="eyebrow mb-2 !text-accent-gold">{t('tournaments.detail.eyebrow')}</p>
                <h3 className="mb-5 font-display text-xl font-bold tracking-tight2 text-ink-1">{tournament.name}</h3>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
                  {tournament.format && (
                    <div>
                      <dt className="mb-1 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{t('tournament.format')}</dt>
                      <dd><Badge variant="neon" size="sm">{tournament.format}</Badge></dd>
                    </div>
                  )}
                  {tournament.organizer && (
                    <div>
                      <dt className="mb-1 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{t('tournament.organizer')}</dt>
                      <dd className="text-sm font-medium text-ink-1">{tournament.organizer}</dd>
                    </div>
                  )}
                  {(tournament.startDate || tournament.endDate) && (
                    <div className="col-span-2">
                      <dt className="mb-1 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{t('tournament.dates')}</dt>
                      <dd className="text-sm num text-ink-1">
                        {formatDate(tournament.startDate)}
                        {tournament.endDate ? ` → ${formatDate(tournament.endDate)}` : ''}
                      </dd>
                    </div>
                  )}
                  {tournament.prizePool && (
                    <div className="col-span-2">
                      <dt className="mb-1 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{t('tournament.prizePool')}</dt>
                      <dd className="inline-flex items-center gap-2 font-display text-2xl font-bold num text-accent-gold">
                        <Coins size={20} /> {tournament.prizePool}
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="mt-5">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">
                    {t('tournaments.registeredTeams')}{' '}
                    <span className="num text-ink-2">({(tournament.registeredTeams || []).length})</span>
                  </p>
                  <ul className="space-y-1.5">
                    {(tournament.registeredTeams || []).map((team: any) => (
                      <li key={team.id} className="flex items-center gap-2.5 rounded bg-surface-2/70 px-2.5 py-2">
                        <TeamLogo name={team.name} logo={team.logo} size="sm" />
                        <span className="truncate text-sm font-medium text-ink-1">{team.name}</span>
                      </li>
                    ))}
                    {(tournament.registeredTeams || []).length === 0 && (
                      <li className="text-xs text-ink-3">{t('tournaments.noTeams')}</li>
                    )}
                  </ul>
                </div>

                <div className="mt-5 space-y-2">
                  <Link href={`/dashboard/tournaments/${tournament.id}`} className="block">
                    <Button className="w-full">
                      <Trophy size={16} /> {t('tournament.viewDetails')}
                    </Button>
                  </Link>

                  {tournament.status !== 'completed' && (
                    myRegistered(tournament) ? (
                      <Button
                        variant="danger"
                        className="w-full"
                        loading={busy}
                        onClick={() => unregister(tournament.id, myRegistered(tournament).id)}
                      >
                        {t('tournaments.unregister')}
                      </Button>
                    ) : myTeams.length > 0 ? (
                      <Button variant="secondary" className="w-full" onClick={() => setRegisterFor(tournament)}>
                        <Target size={16} /> {t('tournaments.register')}
                      </Button>
                    ) : (
                      <p className="rounded bg-surface-2/70 p-3 text-center text-xs text-ink-2">
                        {t('tournaments.captainOnly')}
                      </p>
                    )
                  )}

                  {tournament.streamUrl && (
                    <a href={tournament.streamUrl} target="_blank" rel="noreferrer" className="block">
                      <Button variant="outline" className="w-full">
                        <ExternalLink size={16} /> {t('tournament.match.watch')}
                      </Button>
                    </a>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="flex flex-col items-center justify-center border-dashed py-10 text-center">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded cut-corners bg-surface-2 text-ink-3 ring-1 ring-inset ring-line-subtle">
                  <Medal size={22} />
                </span>
                <p className="max-w-[220px] text-sm text-ink-2">{t('tournaments.selectHint')}</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Team registration picker */}
      <Modal
        open={!!registerFor}
        onClose={() => setRegisterFor(null)}
        title={t('tournaments.registerModal.title')}
        icon={<Target size={20} />}
        size="sm"
      >
        <div className="space-y-2">
          <p className="mb-2 text-sm text-ink-2">{t('tournaments.registerModal.hint')}</p>
          {myTeams.map((tm) => (
            <button
              key={tm.id}
              type="button"
              disabled={busy}
              onClick={() => register(registerFor.id, tm.id)}
              className="flex w-full items-center gap-3 rounded border border-line-subtle bg-surface-1 p-3 text-left transition-colors duration-fast hover:border-primary disabled:opacity-60"
            >
              <TeamLogo name={tm.name} logo={tm.image} size="md" />
              <span className="text-sm font-medium text-ink-1">{tm.name}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
