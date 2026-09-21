'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import AvatarFrame from '@/components/game/AvatarFrame';
import { FRAMES, FRAME_TIER_COLORS, framesByTier, type FrameInfo, type FrameShape } from '@/components/game/frames';
import { cn } from '@/lib/helpers';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';

/* Dev-only showcase of the 64 avatar frames (issue #123), mirroring
   tools/rewards-proposal/frames-preview.html. */

const CDN = 'https://akmweb.youngjoygame.com/web/svnres/img/mlbb/community/';
const DEMO_AVATARS = [
  `${CDN}100_af4312bae7aa443129b46a17b4dce3a6.png`,
  `${CDN}100_ae8ca46da01da69619a6c03dc7069921.png`,
  `${CDN}100_23660115389f8f5a6e7cee37cde10671.png`,
  `${CDN}100_0a256a99be4eb87ce385515666707d17.png`,
];
const SIZES = [32, 40, 56, 64, 96, 128];
/** Demo variant for the per-season frames. */
const DEMO_VARIANT: Record<string, string> = { champion_saison: 'S2', mvp_saison: 'S3' };

const STAGE: CSSProperties = { background: 'radial-gradient(120% 90% at 50% 20%, #1b2540 0%, #0d1322 70%)' };

type ShapeFilter = 'all' | FrameShape;

export default function FramesShowcase() {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang) as 'fr' | 'en';
  const [shape, setShape] = useState<ShapeFilter>('all');

  const groups = useMemo(() => framesByTier(shape === 'all' ? FRAMES : FRAMES.filter((f) => f.shape === shape)), [shape]);
  const tmpLabel = (f: FrameInfo) =>
    f.temporary ? (f.temporary.days == null ? t('frames.tmp.season') : t('frames.tmp.days', { n: f.temporary.days })) : '';
  const ref = (f: FrameInfo) => (DEMO_VARIANT[f.id] ? `${f.id}:${DEMO_VARIANT[f.id]}` : f.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-2">
          {FRAMES.length} frames: 128 px and 40 px, grouped by tier. Season frames show a demo variant.
        </p>
        <div role="group" aria-label={t('frames.shape.label')} className="inline-flex overflow-hidden rounded-lg border border-line-strong">
          {(['all', 'circle', 'square'] as ShapeFilter[]).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={shape === s}
              onClick={() => setShape(s)}
              className={cn(
                'px-3 py-2 font-display text-xs font-semibold uppercase tracking-wider transition-colors',
                s !== 'all' && 'border-l border-line-strong',
                shape === s ? 'bg-primary text-white' : 'text-ink-2 hover:text-ink-1',
              )}
            >
              {t(`frames.shape.${s}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Sizes and rank badge placement (circle: bottom centre, square: bottom right). */}
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          { label: 'Circular + rank', frame: 'souverain_aube', rank: 'Mythic Glory' },
          { label: 'Square + rank', frame: 'mythe_dragons', rank: 'Legend' },
          { label: 'No frame (RankFrame fallback)', frame: null, rank: 'Epic' },
        ].map((row, i) => (
          <div key={row.label} className="rounded-xl border border-line-subtle p-4" style={STAGE}>
            <p className="mb-3 font-display text-xs font-semibold uppercase tracking-wider text-slate-300">{row.label}</p>
            <div className="flex flex-wrap items-end gap-4">
              {SIZES.map((s) => (
                <AvatarFrame key={s} frame={row.frame} size={s} name="Kodjo TG" src={DEMO_AVATARS[i]} rank={row.rank} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {groups.map(({ tier, frames }) => {
        const tc = FRAME_TIER_COLORS[tier];
        return (
          <section key={tier} className="space-y-4" aria-labelledby={`frames-${tier}`}>
            <div className="flex items-center gap-3">
              <span className="h-3.5 w-3.5 rotate-45 rounded-sm" style={{ background: tc, boxShadow: `0 0 12px ${tc}` }} />
              <h3 id={`frames-${tier}`} className="font-display text-lg font-bold text-ink-1">
                {t(`frames.tier.${tier}`)}
              </h3>
              <span className="font-display text-xs font-semibold uppercase tracking-wider text-ink-3">
                {t(frames.length > 1 ? 'frames.countMany' : 'frames.countOne', { n: frames.length })}
              </span>
              <span className="h-px flex-1 opacity-50" style={{ background: `linear-gradient(90deg, ${tc}, transparent)` }} />
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-3.5 md:grid-cols-[repeat(auto-fill,minmax(230px,1fr))]">
              {frames.map((f, i) => (
                <article key={f.id} className="flex flex-col overflow-hidden rounded-xl border border-line-subtle bg-surface-1">
                  <div className="relative grid place-items-center px-5 py-6" style={STAGE}>
                    <AvatarFrame frame={ref(f)} size={128} name={f.name.fr} src={DEMO_AVATARS[i % DEMO_AVATARS.length]} showBadge={false} />
                    {f.temporary && (
                      <span
                        className="absolute left-2.5 top-2.5 whitespace-nowrap rounded-full border px-2 py-1 font-display text-[10.5px] font-semibold leading-none"
                        style={{ background: 'rgba(10,14,25,.75)', borderColor: 'rgba(242,181,68,.6)', color: '#f6c453' }}
                        title={t('frames.temporary')}
                      >
                        ⏳ {tmpLabel(f)}
                      </span>
                    )}
                  </div>
                  <div className="grid flex-1 content-start gap-2 p-3.5">
                    <div>
                      <h4 className="font-display text-base font-bold leading-tight text-ink-1">{f.name[lang] ?? f.name.fr}</h4>
                      <p className="text-xs text-ink-3">
                        {lang === 'en' ? f.name.fr : f.name.en} · <code>{ref(f)}</code>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 font-display text-[10.5px] font-semibold uppercase tracking-wider">
                      <span className="rounded border px-1.5 py-1" style={{ color: tc, borderColor: tc }}>
                        {f.level != null ? t('frames.level', { n: f.level }) : t(`frames.category.${f.category}`)}
                      </span>
                      <span className="rounded border border-line-strong px-1.5 py-1 text-ink-2">{t(`frames.shapeOne.${f.shape}`)}</span>
                      <span className="rounded border border-line-strong px-1.5 py-1 text-ink-2">{t(`frames.anim.${f.animation}`)}</span>
                      {f.temporary && (
                        <span className="rounded border border-accent-gold/60 px-1.5 py-1 text-accent-gold">{t('frames.temporary')}</span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2.5 rounded-lg border border-line-subtle bg-surface-2 px-2.5 py-1.5">
                      <AvatarFrame frame={ref(f)} size={40} name="Kodjo TG" src={null} rank="Mythic" />
                      <span className="min-w-0">
                        <b className="block truncate text-[13px] font-semibold text-ink-1">Kodjo_TG</b>
                        <small className="block text-[11px] text-ink-3">40 px</small>
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
