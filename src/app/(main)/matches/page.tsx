'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Flame, ListChecks, Swords, Trophy } from 'lucide-react';
import { PageHeader, SectionCard, Skeleton, StatCard, Tabs } from '@/components/ui';
import MatchCalendar, { CalendarView, monthRange } from '@/components/matches/MatchCalendar';
import MatchResults, { ResultsFilter } from '@/components/matches/MatchResults';
import { EsportMatch, MatchStage, displayStatus } from '@/components/matches/shared';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { useSelectedSeason } from '@/store/useSeasonStore';

type StageTab = 'all' | MatchStage;
type View = 'calendar' | 'results';

const VIEW_KEY = 'mlbb-matches-view';
const CAL_VIEW_KEY = 'mlbb-matches-calendar-view';

function readPref<T extends string>(key: string, allowed: T[], fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = localStorage.getItem(key) as T | null;
    return v && allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

function savePref(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

export default function MatchesPage() {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang) as string;
  const { seasonId, season, ready } = useSelectedSeason();

  const [stage, setStage] = useState<StageTab>('all');
  const [view, setView] = useState<View>('calendar');
  const [calView, setCalView] = useState<CalendarView>('grid');
  const [filter, setFilter] = useState<ResultsFilter>({ teamId: '', status: '' });

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const [matches, setMatches] = useState<EsportMatch[]>([]);
  const [calendar, setCalendar] = useState<EsportMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [calLoading, setCalLoading] = useState(false);

  // Restore view preferences after mount (avoids hydration mismatch).
  useEffect(() => {
    setView(readPref<View>(VIEW_KEY, ['calendar', 'results'], 'calendar'));
    setCalView(readPref<CalendarView>(CAL_VIEW_KEY, ['grid', 'list'], window.innerWidth < 640 ? 'list' : 'grid'));
  }, []);

  const changeView = (v: View) => {
    setView(v);
    savePref(VIEW_KEY, v);
  };
  const changeCalView = (v: CalendarView) => {
    setCalView(v);
    savePref(CAL_VIEW_KEY, v);
  };

  // Full list of the selection (results view + counters).
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    api.esport
      .matches({ seasonId: seasonId || undefined, stage: stage === 'all' ? undefined : stage })
      .then((l: any) => {
        if (!cancelled) setMatches(Array.isArray(l) ? l : []);
      })
      .catch(() => {
        if (!cancelled) setMatches([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, seasonId, stage]);

  // Month window for the calendar view (API groups by day; we regroup by
  // local day on the client to respect the viewer's timezone).
  useEffect(() => {
    if (!ready || view !== 'calendar') return;
    let cancelled = false;
    setCalLoading(true);
    const { from, to } = monthRange(year, month);
    api.esport
      .matchesCalendar({
        seasonId: seasonId || undefined,
        stage: stage === 'all' ? undefined : stage,
        from: from.toISOString(),
        to: to.toISOString(),
      })
      .then((res: any) => {
        if (cancelled) return;
        const days = Array.isArray(res?.days) ? res.days : [];
        setCalendar(days.flatMap((d: any) => (Array.isArray(d.matches) ? d.matches : [])));
      })
      .catch(() => {
        if (!cancelled) setCalendar([]);
      })
      .finally(() => {
        if (!cancelled) setCalLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, view, seasonId, stage, year, month]);

  const counters = useMemo(() => {
    const c = { total: matches.length, live: 0, upcoming: 0, completed: 0 };
    for (const m of matches) {
      const s = displayStatus(m);
      if (s === 'live') c.live++;
      else if (s === 'scheduled') c.upcoming++;
      else if (s === 'completed') c.completed++;
    }
    return c;
  }, [matches]);

  const stageTabs = [
    { id: 'all', label: t('matches.stage.all') },
    { id: 'scrim', label: t('matches.stage.scrim') },
    { id: 'league', label: t('matches.stage.league') },
    { id: 'playoff', label: t('matches.stage.playoff') },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={season ? season.name : t('nav.section.esport')}
        icon={<Swords size={20} />}
        title={t('matches.title')}
        subtitle={season ? t('matches.subtitleSeason', { season: season.name }) : t('matches.subtitle')}
      >
        <StatCard icon={<Swords size={18} />} label={t('matches.stage.' + stage)} value={counters.total} hint={t('matches.counters.total', { n: counters.total })} />
        <StatCard icon={<Flame size={18} />} accent="red" label={t('matches.status.live')} value={counters.live} hint={t('matches.counters.live', { n: counters.live })} />
        <StatCard icon={<CalendarDays size={18} />} accent="cyan" label={t('matches.status.scheduled')} value={counters.upcoming} hint={t('matches.counters.upcoming', { n: counters.upcoming })} />
        <StatCard icon={<Trophy size={18} />} accent="green" label={t('matches.status.completed')} value={counters.completed} hint={t('matches.counters.completed', { n: counters.completed })} />
      </PageHeader>

      <SectionCard className="!p-0">
        <div className="flex flex-col gap-3 px-3 pt-2 sm:px-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="overflow-x-auto overflow-y-hidden">
            <Tabs variant="underline" tabs={stageTabs} active={stage} onChange={(id: string) => setStage(id as StageTab)} className="min-w-max whitespace-nowrap border-b-0" />
          </div>
          <div className="pb-2">
            <Tabs
              size="sm"
              tabs={[
                { id: 'calendar', label: t('matches.view.calendar'), icon: CalendarDays },
                { id: 'results', label: t('matches.view.results'), icon: ListChecks },
              ]}
              active={view}
              onChange={(id: string) => changeView(id as View)}
            />
          </div>
        </div>
      </SectionCard>

      {!ready || (loading && matches.length === 0 && view === 'results') ? (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
        </div>
      ) : view === 'calendar' ? (
        <MatchCalendar
          matches={calendar}
          year={year}
          month={month}
          onMonthChange={(y, m) => {
            setYear(y);
            setMonth(m);
          }}
          view={calView}
          onViewChange={changeCalView}
          t={t}
          lang={lang}
          loading={calLoading}
        />
      ) : (
        <MatchResults matches={matches} filter={filter} onFilterChange={setFilter} t={t} lang={lang} />
      )}
    </div>
  );
}
