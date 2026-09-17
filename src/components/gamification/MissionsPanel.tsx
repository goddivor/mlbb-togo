'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import { ProgressBar } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { GamificationIcon } from './icons';

export interface MissionItem {
  id: string;
  period: 'daily' | 'weekly';
  icon: string;
  target: number;
  reward: number;
  progress: number;
  completed: boolean;
  resetsAt: string;
}

function useCountdown(target: string | undefined, t: (k: string, p?: any) => string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  if (!target) return '';
  const ms = Math.max(0, new Date(target).getTime() - now);
  const minutes = Math.floor(ms / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days >= 1) return `${t('progress.time.days', { n: days })} ${t('progress.time.hours', { n: hours % 24 })}`;
  if (hours >= 1) return `${t('progress.time.hours', { n: hours })} ${t('progress.time.minutes', { n: minutes % 60 })}`;
  return t('progress.time.minutes', { n: minutes });
}

function MissionGroup({ period, items }: { period: 'daily' | 'weekly'; items: MissionItem[] }) {
  const t = useT();
  const countdown = useCountdown(items[0]?.resetsAt, t);
  const done = items.filter((m) => m.completed).length;
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3">
        <h4 className="font-semibold text-black dark:text-white">
          {t(`progress.missions.${period}`)}{' '}
          <span className="text-xs font-normal text-body dark:text-bodydark">
            {done}/{items.length}
          </span>
        </h4>
        <span className="inline-flex items-center gap-1 text-xs text-body dark:text-bodydark">
          <Clock size={12} /> {t('progress.missions.resetIn', { time: countdown })}
        </span>
      </div>
      <div className="space-y-2">
        {items.map((m) => (
          <div
            key={m.id}
            className={`flex items-center gap-3 rounded-sm border p-3 ${
              m.completed
                ? 'border-success/40 bg-success/5'
                : 'border-stroke bg-white dark:border-strokedark dark:bg-boxdark'
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                m.completed ? 'bg-success text-white' : 'bg-gray text-body dark:bg-meta-4 dark:text-bodydark'
              }`}
            >
              {m.completed ? <CheckCircle2 size={18} /> : <GamificationIcon name={m.icon} size={16} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-black dark:text-white truncate">
                  {t(`mission.${m.id}`)}
                </p>
                <span className="shrink-0 text-xs font-semibold text-warning">
                  {t('progress.reward', { xp: m.reward })}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <ProgressBar value={m.progress} max={m.target} className="flex-1" />
                <span className="text-xs text-body dark:text-bodydark tabular-nums">
                  {m.completed ? t('progress.missions.done') : `${m.progress}/${m.target}`}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MissionsPanel({ items }: { items: MissionItem[] }) {
  const daily = items.filter((m) => m.period === 'daily');
  const weekly = items.filter((m) => m.period === 'weekly');
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <MissionGroup period="daily" items={daily} />
      <MissionGroup period="weekly" items={weekly} />
    </div>
  );
}
