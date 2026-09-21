'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { Button, EmptyState } from '@/components/ui';
import MatchCard from './MatchCard';
import { EsportMatch, TFn, TeamLogo, displayStatus, fmtDay, fmtTime, localDayKey, localeOf } from './shared';

export type CalendarView = 'grid' | 'list';

/** First day of the week is Monday (fr) : index 0 = Monday. */
function mondayIndex(d: Date) {
  return (d.getDay() + 6) % 7;
}

export function monthRange(year: number, month: number) {
  const from = new Date(year, month, 1, 0, 0, 0, 0);
  const to = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { from, to };
}

export function monthLabel(year: number, month: number, lang: string) {
  return new Date(year, month, 1).toLocaleDateString(localeOf(lang), { month: 'long', year: 'numeric' });
}

/**
 * Month calendar of matches: a 7-column grid (desktop) or a day-grouped list
 * (mobile / toggle). Matches are grouped by local day.
 */
export default function MatchCalendar({
  matches,
  year,
  month,
  onMonthChange,
  view,
  onViewChange,
  t,
  lang,
  loading = false,
}: {
  matches: EsportMatch[];
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
  view: CalendarView;
  onViewChange: (v: CalendarView) => void;
  t: TFn;
  lang: string;
  loading?: boolean;
}) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, EsportMatch[]>();
    for (const m of matches) {
      if (!m.scheduledAt) continue;
      const d = new Date(m.scheduledAt);
      if (isNaN(d.getTime())) continue;
      const key = localDayKey(d);
      const list = map.get(key) ?? [];
      list.push(m);
      map.set(key, list);
    }
    for (const list of map.values())
      list.sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());
    return map;
  }, [matches]);

  const days = useMemo(() => Array.from(byDay.keys()).sort(), [byDay]);
  const todayKey = localDayKey(new Date());

  const prev = () => {
    setSelectedDay(null);
    onMonthChange(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1);
  };
  const next = () => {
    setSelectedDay(null);
    onMonthChange(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1);
  };
  const today = () => {
    const d = new Date();
    setSelectedDay(null);
    onMonthChange(d.getFullYear(), d.getMonth());
  };

  // Grid cells: leading blanks + every day of the month.
  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const count = new Date(year, month + 1, 0).getDate();
    const lead = mondayIndex(first);
    const out: (Date | null)[] = [];
    for (let i = 0; i < lead; i++) out.push(null);
    for (let d = 1; d <= count; d++) out.push(new Date(year, month, d));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [year, month]);

  const weekdays = useMemo(() => {
    const base = new Date(2024, 0, 1); // a Monday
    return Array.from({ length: 7 }, (_, i) =>
      new Date(base.getFullYear(), base.getMonth(), base.getDate() + i).toLocaleDateString(localeOf(lang), {
        weekday: 'short',
      }),
    );
  }, [lang]);

  const selected = selectedDay ? byDay.get(selectedDay) ?? [] : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={prev} title={t('matches.calendar.prev')}>
            <ChevronLeft size={16} />
          </Button>
          <h3 className="min-w-[10rem] text-center font-display text-base font-bold capitalize tracking-tight2 text-ink-1">
            {monthLabel(year, month, lang)}
          </h3>
          <Button size="sm" variant="ghost" onClick={next} title={t('matches.calendar.next')}>
            <ChevronRight size={16} />
          </Button>
          <Button size="sm" variant="secondary" onClick={today}>
            {t('matches.calendar.today')}
          </Button>
        </div>
        <div className="ml-auto inline-flex rounded-md border border-line-subtle bg-surface-2/70 p-1">
          {(['grid', 'list'] as CalendarView[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onViewChange(v)}
              title={t('matches.calendar.view.' + v)}
              aria-pressed={view === v}
              className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-semibold transition-colors duration-fast ${
                view === v
                  ? 'bg-primary text-on-primary'
                  : 'text-ink-2 hover:text-ink-1'
              }`}
            >
              {v === 'grid' ? <LayoutGrid size={14} /> : <List size={14} />}
              <span className="hidden sm:inline">{t('matches.calendar.view.' + v)}</span>
            </button>
          ))}
        </div>
      </div>

      {view === 'grid' ? (
        <div className={`overflow-hidden rounded-lg border border-line-subtle bg-surface-1 shadow-elev-1 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <div className="grid grid-cols-7 border-b border-line-subtle bg-surface-2 text-center text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">
            {weekdays.map((w) => (
              <div key={w} className="py-2">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((d, i) => {
              if (!d)
                return <div key={`b${i}`} className="min-h-[3.5rem] border-b border-r border-line-subtle bg-surface-2/30 sm:min-h-[6rem]" />;
              const key = localDayKey(d);
              const list = byDay.get(key) ?? [];
              const isToday = key === todayKey;
              const isSel = key === selectedDay;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDay(isSel ? null : key)}
                  className={`flex min-h-[3.5rem] flex-col border-b border-r border-line-subtle p-1 text-left transition-colors duration-fast sm:min-h-[6rem] sm:p-1.5 ${
                    isSel ? 'bg-primary/10' : 'hover:bg-surface-2/60'
                  }`}
                >
                  <span
                    className={`mb-1 inline-flex h-6 w-6 items-center justify-center rounded cut-corners-sm font-display text-xs font-bold num ${
                      isToday ? 'bg-primary text-on-primary shadow-glow-cyan' : 'text-ink-1'
                    }`}
                  >
                    {d.getDate()}
                  </span>
                  {/* Mobile: dots. Desktop: mini rows with crests. */}
                  {list.length > 0 && (
                    <>
                      <span className="flex flex-wrap gap-0.5 sm:hidden">
                        {list.slice(0, 4).map((m) => (
                          <span
                            key={m.id}
                            className={`h-1.5 w-1.5 rounded-full ${
                              displayStatus(m) === 'live'
                                ? 'bg-accent-red'
                                : m.status === 'completed'
                                  ? 'bg-accent-green'
                                  : 'bg-primary'
                            }`}
                          />
                        ))}
                      </span>
                      <span className="hidden flex-col gap-1 sm:flex">
                        {list.slice(0, 3).map((m) => (
                          <span
                            key={m.id}
                            className={`flex items-center gap-1 rounded px-1 py-0.5 text-[11px] font-semibold num leading-tight ${
                              displayStatus(m) === 'live'
                                ? 'bg-accent-red/10 text-accent-red'
                                : m.status === 'completed'
                                  ? 'bg-accent-green/10 text-accent-green'
                                  : 'bg-primary/10 text-primary'
                            }`}
                          >
                            <TeamLogo team={m.teamA} size="sm" className="!h-4 !w-4 !text-[8px]" />
                            <TeamLogo team={m.teamB} size="sm" className="!h-4 !w-4 !text-[8px]" />
                            <span className="truncate">
                              {m.status === 'completed' ? `${m.scoreA}-${m.scoreB}` : fmtTime(m.scheduledAt!, lang)}
                            </span>
                          </span>
                        ))}
                        {list.length > 3 && (
                          <span className="text-[10px] num text-ink-3">+{list.length - 3}</span>
                        )}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : days.length === 0 ? (
        <EmptyState icon={<CalendarDays size={28} />} title={t('matches.calendar.empty')} description={t('matches.calendar.emptyHint')} />
      ) : (
        <div className="space-y-5">
          {days.map((key) => {
            const list = byDay.get(key)!;
            const isToday = key === todayKey;
            return (
              <section key={key}>
                <h4 className="mb-2 flex items-center gap-2 font-display text-sm font-bold capitalize text-ink-1">
                  <span
                    className={`inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded cut-corners-sm px-1.5 text-xs num ${
                      isToday ? 'bg-primary text-on-primary' : 'bg-surface-3 text-ink-2'
                    }`}
                  >
                    {new Date(key + 'T00:00:00').getDate()}
                  </span>
                  {fmtDay(key + 'T00:00:00', lang, { weekday: 'long', year: 'numeric' })}
                  <span className="font-sans text-xs font-normal text-ink-3">
                    · {t('matches.calendar.count', { n: list.length })}
                  </span>
                </h4>
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {list.map((m) => (
                    <MatchCard key={m.id} match={m} t={t} lang={lang} compact />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {view === 'grid' && selectedDay && (
        <div>
          <h4 className="mb-2 flex items-center justify-between font-display text-sm font-bold capitalize text-ink-1">
            <span>{fmtDay(selectedDay + 'T00:00:00', lang, { weekday: 'long', year: 'numeric' })}</span>
            <span className="font-sans text-xs font-normal text-ink-3">{t('matches.calendar.count', { n: selected.length })}</span>
          </h4>
          {selected.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line-strong p-4 text-center text-sm text-ink-2">
              {t('matches.calendar.noneThatDay')}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {selected.map((m) => (
                <MatchCard key={m.id} match={m} t={t} lang={lang} compact />
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'grid' && !selectedDay && days.length > 0 && (
        <p className="text-center text-xs text-ink-3">
          {t('matches.calendar.hint', { n: matches.length })}{' '}
          <Link href="#" onClick={(e) => { e.preventDefault(); onViewChange('list'); }} className="text-primary hover:underline">
            {t('matches.calendar.view.list')}
          </Link>
        </p>
      )}
    </div>
  );
}
