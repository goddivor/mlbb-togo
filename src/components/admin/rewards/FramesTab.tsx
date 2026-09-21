'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Gem, Gift } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { Badge, Button, Card, EmptyState, LoadingSpinner, StatTile } from '@/components/ui';
import AvatarFrame from '@/components/game/AvatarFrame';
import { FRAME_TIERS, FRAME_TIER_COLORS, type FrameShape } from '@/components/game/frames';
import { Segmented, localName, type FrameDefDto } from '@/components/gamification/rewards/shared';
import GrantFrameModal from './GrantFrameModal';

type AdminFrame = FrameDefDto & { holders: number; everHolders: number };
type ShapeFilter = 'all' | FrameShape;
type StatusFilter = 'all' | 'permanent' | 'temporary';

/** Frames gallery by tier with holder counts and "grant to a member". */
export default function FramesTab() {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const [frames, setFrames] = useState<AdminFrame[]>([]);
  const [loading, setLoading] = useState(true);
  const [shape, setShape] = useState<ShapeFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [granting, setGranting] = useState<AdminFrame | null>(null);

  const load = useCallback(
    () =>
      api.rewards.admin
        .frames()
        .then((l: any) => setFrames(Array.isArray(l) ? l : []))
        .catch(() => setFrames([])),
    [],
  );

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const groups = useMemo(() => {
    const visible = frames.filter(
      (f) =>
        (shape === 'all' || f.shape === shape) &&
        (status === 'all' || (status === 'temporary' ? f.temporary : !f.temporary)),
    );
    return FRAME_TIERS.map((tier) => ({ tier, frames: visible.filter((f) => f.tier === tier) })).filter((g) => g.frames.length);
  }, [frames, shape, status]);

  if (loading) return <LoadingSpinner size="lg" className="py-16" />;

  const active = frames.reduce((n, f) => n + f.holders, 0);
  const temporary = frames.filter((f) => f.temporary).length;

  return (
    <div className="space-y-4">
      <Card className="!p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label={t('frames.title')} value={frames.length} />
          <StatTile label={t('rewards.admin.kpi.square')} value={frames.filter((f) => f.shape === 'square').length} accent="violet" />
          <StatTile label={t('rewards.admin.kpi.temporary')} value={temporary} accent="gold" />
          <StatTile label={t('rewards.admin.kpi.activeGrants')} value={active} accent="cyan" />
        </div>
      </Card>

      <Card>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Segmented<ShapeFilter>
            label={t('frames.shape.label')}
            value={shape}
            onChange={setShape}
            options={(['all', 'circle', 'square'] as ShapeFilter[]).map((s) => ({ id: s, label: t(`frames.shape.${s}`) }))}
          />
          <Segmented<StatusFilter>
            label={t('rewards.admin.status.label')}
            value={status}
            onChange={setStatus}
            options={(['all', 'permanent', 'temporary'] as StatusFilter[]).map((s) => ({ id: s, label: t(`rewards.admin.status.${s}`) }))}
          />
        </div>

        {groups.length === 0 ? (
          <EmptyState icon={<Gem size={26} />} title={t('rewards.collection.none')} className="!min-h-0 py-10" />
        ) : (
          <div className="space-y-8">
            {groups.map((g) => (
              <section key={g.tier}>
                <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-eyebrow text-ink-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FRAME_TIER_COLORS[g.tier] }} aria-hidden="true" />
                  {t(`frames.tier.${g.tier}`)}
                  <span className="font-normal normal-case tracking-normal text-ink-3 num">· {g.frames.length}</span>
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {g.frames.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-3 rounded-lg border border-line-subtle bg-surface-1 p-3 dark:bg-surface-2/40"
                    >
                      <AvatarFrame frame={f.id} name={localName(f.name, lang)} size={72} showBadge={false} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-1">{localName(f.name, lang)}</p>
                        <p className="truncate text-[11px] text-ink-3">
                          {f.level ? t('frames.level', { n: f.level }) : t(`rewards.source.${f.source}`)}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1">
                          {f.temporary && (
                            <Badge variant="gold" size="sm">
                              {t('frames.temporary')}
                            </Badge>
                          )}
                          {f.variantBySeason && (
                            <Badge variant="blue" size="sm">
                              {t('rewards.admin.perSeason')}
                            </Badge>
                          )}
                          <span className="text-[11px] text-ink-2 num">
                            {t('rewards.admin.holdersShort', { n: f.holders, all: f.everHolders })}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setGranting(f)}
                        title={t('rewards.admin.grant.title')}
                        aria-label={`${t('rewards.admin.grant.title')} · ${localName(f.name, lang)}`}
                      >
                        <Gift size={16} className="text-primary" />
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </Card>

      <GrantFrameModal frame={granting} onClose={() => setGranting(null)} onDone={load} />
    </div>
  );
}
