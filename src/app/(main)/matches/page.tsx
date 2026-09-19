'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Flame, ListChecks, Swords, Trophy } from 'lucide-react';
import { LoadingSpinner, PageHeader, SectionCard, Tabs } from '@/components/ui';
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
        icon={<Swords size={28} />}
        title={t('matches.title')}
        subtitle={season ? t('matches.subtitleSeason', { season: season.name }) : t('matches.subtitle')}
        variant="blue"
      />

      <SectionCard className="!p-3 sm:!p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="overflow-x-auto">
            <Tabs tabs={stageTabs} active={stage} onChange={(id: string) => setStage(id as StageTab)} />
          </div>
          <Tabs
            tabs={[
              { id: 'calendar', label: t('matches.view.calendar'), icon: CalendarDays },
              { id: 'results', label: t('matches.view.results'), icon: ListChecks },
            ]}
            active={view}
            onChange={(id: string) => changeView(id as View)}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-2 px-2.5 py-1 text-body dark:bg-meta-4 dark:text-bodydark">
            <Swords size={12} /> {t('matches.counters.total', { n: counters.total })}
          </span>
          {counters.live > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2.5 py-1 font-semibold text-danger">
              <Flame size={12} /> {t('matches.counters.live', { n: counters.live })}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-primary">
            <CalendarDays size={12} /> {t('matches.counters.upcoming', { n: counters.upcoming })}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-success">
            <Trophy size={12} /> {t('matches.counters.completed', { n: counters.completed })}
          </span>
        </div>
      </SectionCard>

      {!ready || (loading && matches.length === 0 && view === 'results') ? (
        <LoadingSpinner size="lg" className="py-24" />
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
