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
  1: 'tier-gold',
  2: 'tier-silver',
  3: 'tier-bronze',
};

export function HonourCard({ h, t }: { h: any; t: TFn }) {
  const p = h.placement ?? null;
  const style = (p && PLACEMENT_STYLE[p]) || 'bg-accent-cyan/10 text-accent-cyan';
  const Icon = p === 1 ? Trophy : p ? Medal : Award;
  const label = placementLabel(p, t);
  return (
    <div className={`flex items-start gap-3 rounded-lg border bg-surface-1 p-3 shadow-elev-1 dark:bg-gradient-to-b dark:from-surface-2/50 dark:to-surface-1 ${p === 1 ? 'border-accent-gold/40' : 'border-line-subtle'}`}>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded cut-corners-sm ${style}`}><Icon size={20} /></div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate font-display text-sm font-bold text-ink-1">{h.title}</p>
          {h.year && <span className="text-xs num text-ink-3">{h.year}</span>}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {label && <Badge variant={p === 1 ? 'gold' : 'default'} size="sm">{label}</Badge>}
          <Badge variant={h.source === 'derived' ? 'purple' : 'blue'} size="sm">
            {h.source === 'derived' ? t('teams.honours.derived') : t('teams.honours.manual')}
          </Badge>
        </div>
        {h.record && (
          <p className="mt-1 text-xs num text-ink-2">
            {t('teams.honours.record', { w: h.record.wins, l: h.record.losses, p: h.record.played })}
          </p>
        )}
        {h.description && <p className="mt-1 whitespace-pre-line text-xs text-ink-2">{h.description}</p>}
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
