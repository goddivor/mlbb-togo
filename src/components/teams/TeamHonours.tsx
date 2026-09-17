'use client';

import { Trophy, Medal, Award } from 'lucide-react';
import { Badge, EmptyState } from '@/components/ui';
import type { TFn } from './shared';

function placementLabel(p: number | null | undefined, t: TFn) {
  if (!p) return null;
  if (p === 1) return t('teams.honours.champion');
  if (p === 2) return t('teams.honours.runnerUp');
  if (p === 3) return t('teams.honours.third');
  return t('teams.honours.place', { n: p });
}

const PLACEMENT_STYLE: Record<number, string> = {
  1: 'bg-warning/15 text-warning',
  2: 'bg-bodydark/25 text-body dark:text-bodydark1',
  3: 'bg-[#b87333]/15 text-[#b87333]',
};

export function HonourCard({ h, t }: { h: any; t: TFn }) {
  const p = h.placement ?? null;
  const style = (p && PLACEMENT_STYLE[p]) || 'bg-primary/10 text-primary';
  const Icon = p === 1 ? Trophy : p ? Medal : Award;
  const label = placementLabel(p, t);
  return (
    <div className="flex items-start gap-3 rounded-sm border border-stroke bg-white p-3 shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${style}`}><Icon size={20} /></div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-black dark:text-white">{h.title}</p>
          {h.year && <span className="text-xs text-bodydark2">{h.year}</span>}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {label && <Badge variant={p === 1 ? 'gold' : 'default'} size="sm">{label}</Badge>}
          <Badge variant={h.source === 'derived' ? 'purple' : 'blue'} size="sm">
            {h.source === 'derived' ? t('teams.honours.derived') : t('teams.honours.manual')}
          </Badge>
        </div>
        {h.record && (
          <p className="mt-1 text-xs text-body dark:text-bodydark">
            {t('teams.honours.record', { w: h.record.wins, l: h.record.losses, p: h.record.played })}
          </p>
        )}
        {h.description && <p className="mt-1 whitespace-pre-line text-xs text-body dark:text-bodydark">{h.description}</p>}
      </div>
    </div>
  );
}

export default function TeamHonours({ honours, t }: { honours: any[]; t: TFn }) {
  const list = Array.isArray(honours) ? honours : [];
  if (list.length === 0) return <EmptyState icon={<Trophy size={28} />} title={t('teams.honours.empty')} />;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {list.map((h) => <HonourCard key={h.id} h={h} t={t} />)}
    </div>
  );
}
