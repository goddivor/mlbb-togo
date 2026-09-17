'use client';

import { useMemo } from 'react';
import { CalendarDays, Clock, Award } from 'lucide-react';
import { Badge, EmptyState } from '@/components/ui';
import { useLangStore } from '@/store/useStore';
import { TeamChip, fmtDate, fmtTime, type TFn } from './shared';

function dayKey(value: any) {
  if (!value) return 'none';
  const d = new Date(value);
  if (isNaN(d.getTime())) return 'none';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function TeamSchedule({ schedule, t }: { schedule: any[]; t: TFn }) {
  const lang = useLangStore((s: any) => s.lang);
  const list = Array.isArray(schedule) ? schedule : [];

  const groups = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const m of list) {
      const k = dayKey(m.date);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(m);
    }
    // Backend already sorts by date asc with undated matches last.
    return Array.from(map.entries());
  }, [list]);

  if (list.length === 0) return <EmptyState icon={<CalendarDays size={28} />} title={t('teams.schedule.empty')} />;

  return (
    <div className="space-y-5">
      {groups.map(([key, items]) => {
        const first = items[0];
        const heading = key === 'none'
          ? t('teams.schedule.noDate')
          : fmtDate(first.date, lang, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
        return (
          <div key={key}>
            <div className="mb-2 flex items-center gap-2">
              <CalendarDays size={15} className="text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wide text-body dark:text-bodydark">{heading}</span>
            </div>
            <div className="space-y-2">
              {items.map((m) => (
                <div key={m.id} className="flex flex-col gap-2 rounded-sm border border-stroke bg-white p-3 shadow-default dark:border-strokedark dark:bg-boxdark sm:flex-row sm:items-center">
                  <div className="flex w-20 shrink-0 items-center gap-1.5 text-sm font-semibold text-black dark:text-white">
                    <Clock size={14} className="text-primary" />
                    {m.date ? fmtTime(m.date, lang) : '--:--'}
                  </div>
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="text-xs text-bodydark2">{t('teams.schedule.vs')}</span>
                    <TeamChip team={m.opponent} size={8} />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={m.isHome ? 'blue' : 'default'} size="sm">{m.isHome ? t('teams.schedule.home') : t('teams.schedule.away')}</Badge>
                    <Badge variant="purple" size="sm">{t('matchType.' + (m.type || 'friendly'))}</Badge>
                    {m.season && <Badge variant="gold" size="sm" className="gap-1"><Award size={11} /> {m.season}</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
