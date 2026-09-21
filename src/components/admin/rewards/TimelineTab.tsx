'use client';

import { useEffect, useState } from 'react';
import { Tag, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/helpers';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { Card, EmptyState, LoadingSpinner, StatTile } from '@/components/ui';
import AvatarFrame from '@/components/game/AvatarFrame';
import { FRAME_TIER_COLORS, type FrameTier } from '@/components/game/frames';
import { localName, type FrameDefDto } from '@/components/gamification/rewards/shared';
import { titleLabel } from '@/components/gamification/titles';
import SidePanel from './SidePanel';

interface Step {
  level: number;
  xp: number;
  badgeTier: FrameTier;
  reached: number;
  frames: (FrameDefDto & { holders: number })[];
  titles: { id: string; level: number; name: { fr: string; en: string }; holders: number }[];
}

interface Timeline {
  maxLevel: number;
  members: number;
  steps: Step[];
}

/** Readable text colour on a tier colour (dark on light tiers such as silver). */
function onColor(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? '#0b1020' : '#ffffff';
}

/** Levels 1 → 200: rewarded steps with their frame / title, click for details. */
export default function TimelineTab() {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const [data, setData] = useState<Timeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Step | null>(null);

  useEffect(() => {
    api.rewards.admin
      .timeline()
      .then((d: any) => setData(d?.steps ? d : null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" className="py-16" />;
  if (!data) return <EmptyState icon={<Tag size={26} />} title={t('rewards.admin.loadError')} className="!min-h-0 py-12" />;

  const frameCount = data.steps.reduce((n, s) => n + s.frames.length, 0);
  const titleCount = data.steps.reduce((n, s) => n + s.titles.length, 0);

  return (
    <div className="space-y-4">
      <Card className="!p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label={t('rewards.admin.kpi.members')} value={data.members} />
          <StatTile label={t('rewards.admin.kpi.steps')} value={data.steps.length} accent="violet" />
          <StatTile label={t('rewards.admin.kpi.levelFrames')} value={frameCount} accent="cyan" />
          <StatTile label={t('rewards.admin.kpi.titles')} value={titleCount} accent="gold" />
        </div>
      </Card>

      <Card className="!p-0">
        <p className="border-b border-line-subtle px-5 py-3 text-xs text-ink-3">{t('rewards.admin.timeline.hint', { max: data.maxLevel })}</p>
        <div className="overflow-x-auto px-5 pb-5 pt-4">
          <ol className="relative flex min-w-max items-stretch gap-3">
            <span aria-hidden="true" className="absolute left-0 right-0 top-[18px] h-px bg-line-strong" />
            {data.steps.map((s) => {
              const color = FRAME_TIER_COLORS[s.badgeTier] ?? '#888';
              return (
                <li key={s.level} className="relative w-32 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelected(s)}
                    className="group flex h-full w-full flex-col items-center gap-2 rounded-lg text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  >
                    <span
                      className="relative z-10 rounded-full px-2.5 py-1 font-display text-xs font-bold shadow-elev-1 num"
                      style={{ backgroundColor: color, color: onColor(color) }}
                    >
                      {t('progress.levelShort')} {s.level}
                    </span>
                    <span
                      className={cn(
                        'flex w-full flex-1 flex-col items-center gap-2 rounded-lg border border-line-subtle bg-surface-1 p-2.5 transition-colors duration-fast group-hover:border-primary/50 dark:bg-surface-2/40',
                      )}
                    >
                      <span className="text-[10px] text-ink-3 num">{s.xp.toLocaleString()} XP</span>
                      {s.frames.length > 0 && (
                        <span className="flex items-center justify-center gap-1">
                          {s.frames.map((f) => (
                            <AvatarFrame key={f.id} frame={f.id} name={localName(f.name, lang)} size={40} showBadge={false} />
                          ))}
                        </span>
                      )}
                      {s.frames.map((f) => (
                        <span key={f.id} className="line-clamp-1 text-[11px] font-semibold text-ink-1">
                          {localName(f.name, lang)}
                        </span>
                      ))}
                      {s.titles.map((ti) => (
                        <span key={ti.id} className="inline-flex items-center gap-1 rounded bg-accent-violet/10 px-1.5 py-0.5 text-[10px] font-semibold italic text-accent-violet">
                          <Tag size={10} aria-hidden="true" />
                          {titleLabel(ti.id, lang) ?? localName(ti.name, lang)}
                        </span>
                      ))}
                      <span className="mt-auto inline-flex items-center gap-1 text-[10px] text-ink-3 num">
                        <Users size={10} aria-hidden="true" />
                        {s.reached}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </Card>

      <SidePanel
        open={!!selected}
        onClose={() => setSelected(null)}
        closeLabel={t('common.close')}
        title={selected ? t('frames.level', { n: selected.level }) : ''}
      >
        {selected && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="XP" value={selected.xp.toLocaleString()} accent="cyan" />
              <StatTile
                label={t('rewards.admin.timeline.reached')}
                value={`${selected.reached} / ${data.members}`}
                accent="violet"
              />
              <StatTile label={t('rewards.admin.timeline.badge')} value={t(`frames.tier.${selected.badgeTier}`)} accent="gold" />
            </div>
            {selected.frames.map((f) => (
              <div key={f.id} className="flex flex-col items-center gap-3 rounded-lg border border-line-subtle bg-surface-2/40 p-5 text-center">
                <AvatarFrame frame={f.id} name={localName(f.name, lang)} size={128} showBadge={false} />
                <p className="font-display text-base font-bold text-ink-1">{localName(f.name, lang)}</p>
                <p className="text-xs text-ink-3">
                  {t(`frames.shapeOne.${f.shape}`)} · {t(`frames.anim.${f.animation}`)}
                </p>
                <p className="text-sm text-ink-2">{t('rewards.admin.holders', { n: f.holders })}</p>
              </div>
            ))}
            {selected.titles.map((ti) => (
              <div key={ti.id} className="rounded-lg border border-line-subtle bg-surface-2/40 p-4">
                <p className="eyebrow mb-1">{t('rewards.tab.titles')}</p>
                <p className="font-display text-base font-bold italic text-accent-violet">{titleLabel(ti.id, lang) ?? localName(ti.name, lang)}</p>
                <p className="mt-1 text-sm text-ink-2">{t('rewards.admin.holders', { n: ti.holders })}</p>
              </div>
            ))}
          </div>
        )}
      </SidePanel>
    </div>
  );
}
