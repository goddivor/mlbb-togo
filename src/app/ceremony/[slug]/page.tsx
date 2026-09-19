'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Crown, Download, Maximize2, Minimize2, Play, Trophy, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui';
import { api, avatarSrc } from '@/lib/api';
import { useT } from '@/lib/i18n';
import {
  CriteriaStats,
  PlayerAvatar,
  TeamChip,
  TrophyVisual,
  categoryLabel,
  type AwardItem,
  type PodiumEntry,
  type SeasonAwards,
  type Sponsor,
} from '@/components/awards/shared';
import type { TFn } from '@/components/seasons/shared';

/**
 * Ceremony / presentation mode (#48): full-screen, forced dark, step-by-step
 * reveal of the regular podium (3 -> 1), the playoffs podium, the MVP and
 * the awards per role. Keyboard / click navigation, progress dots,
 * fullscreen toggle and a canvas export of the final podium.
 */

type Step =
  | { kind: 'intro' }
  | { kind: 'podium'; scope: 'regular' | 'playoffs'; reveal: number; entries: PodiumEntry[] }
  | { kind: 'award'; award: AwardItem }
  | { kind: 'sponsors'; sponsors: Sponsor[] }
  | { kind: 'end'; entries: PodiumEntry[]; scope: 'regular' | 'playoffs' | null; mvp: AwardItem | null };

function buildSteps(data: SeasonAwards): Step[] {
  const steps: Step[] = [{ kind: 'intro' }];
  const podiumSteps = (scope: 'regular' | 'playoffs', entries: PodiumEntry[]) => {
    const sorted = [...entries].sort((a, b) => b.placement - a.placement); // 3, 2, 1
    sorted.forEach((_, i) => steps.push({ kind: 'podium', scope, reveal: i + 1, entries: sorted }));
  };
  if (data.podiums.regular.length) podiumSteps('regular', data.podiums.regular);
  if (data.podiums.playoffs.length) podiumSteps('playoffs', data.podiums.playoffs);
  if (data.mvp) steps.push({ kind: 'award', award: data.mvp });
  for (const a of data.awards.filter((x) => x.category !== 'mvp')) steps.push({ kind: 'award', award: a });
  if (data.sponsors.length) steps.push({ kind: 'sponsors', sponsors: data.sponsors });
  const finalScope = data.podiums.playoffs.length ? 'playoffs' : data.podiums.regular.length ? 'regular' : null;
  steps.push({
    kind: 'end',
    scope: finalScope,
    entries: finalScope ? data.podiums[finalScope] : [],
    mvp: data.mvp,
  });
  return steps;
}

const PLACE_COLORS: Record<number, string> = { 1: '#facc15', 2: '#cbd5e1', 3: '#d97706' };

export default function CeremonyPage() {
  const t = useT();
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const [data, setData] = useState<SeasonAwards | null>(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    api.awards
      .season(slug)
      .then((d: SeasonAwards | null) => alive && setData(d && d.season ? d : null))
      .catch(() => alive && setData(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [slug]);

  const steps = useMemo(() => (data ? buildSteps(data) : []), [data]);
  const total = steps.length;
  const step = steps[index];

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => {
        const next = Math.min(Math.max(i + delta, 0), Math.max(total - 1, 0));
        if (next !== i) setDir(delta > 0 ? 1 : -1);
        return next;
      });
    },
    [total],
  );

  // Keyboard navigation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter' || e.key === 'PageDown') {
        e.preventDefault();
        go(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'Backspace') {
        e.preventDefault();
        go(-1);
      } else if (e.key === 'Home') setIndex(0);
      else if (e.key === 'End') setIndex(Math.max(total - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, total]);

  // Fullscreen state tracking.
  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await (stageRef.current ?? document.documentElement).requestFullscreen();
    } catch {
      /* unsupported (iOS Safari): ignore */
    }
  };

  const exportImage = async () => {
    if (!data) return;
    const end = steps.find((s) => s.kind === 'end') as Extract<Step, { kind: 'end' }> | undefined;
    try {
      const url = await drawPodiumImage({
        title: data.season.name,
        subtitle: end?.scope ? t('awards.podium.' + end.scope) : t('ceremony.finalPodium'),
        entries: end?.entries ?? [],
        mvp: end?.mvp ?? null,
        mvpLabel: t('ceremony.mvp'),
        accent: data.season.color || '#3c50e0',
      });
      const a = document.createElement('a');
      a.href = url;
      a.download = `podium-${data.season.slug || data.season.id}.png`;
      a.click();
      toast.success(t('ceremony.exported'));
    } catch {
      toast.error(t('ceremony.exportFailed'));
      window.print();
    }
  };

  const accent = data?.season.color || '#3c50e0';

  return (
    <div
      ref={stageRef}
      className="ceremony fixed inset-0 z-[60] bg-[#05070d] text-white overflow-hidden select-none"
      style={{ ['--accent' as any]: accent }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[32rem] w-[32rem] rounded-full blur-3xl opacity-30" style={{ background: accent }} />
      <div className="pointer-events-none absolute -bottom-52 -right-20 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-20 bg-yellow-400" />

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 print:hidden">
        <Link
          href={data?.season.slug ? `/hall-of-fame` : '/awards'}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> <span className="hidden sm:inline">{t('ceremony.exit')}</span>
        </Link>
        <div className="text-xs text-gray-500 truncate">{data?.season.name}</div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={exportImage}
            title={t('ceremony.export')}
            className="p-2 rounded-lg text-gray-300 hover:bg-white/10 transition-colors"
            disabled={!data}
          >
            <Download size={18} />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            title={fullscreen ? t('ceremony.exitFullscreen') : t('ceremony.fullscreen')}
            className="p-2 rounded-lg text-gray-300 hover:bg-white/10 transition-colors"
          >
            {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* Stage (click = next) */}
      <div
        className="absolute inset-0 flex items-center justify-center px-4 sm:px-10 pt-14 pb-24 cursor-pointer"
        onClick={() => go(1)}
        role="presentation"
      >
        {loading ? (
          <LoadingSpinner size="lg" />
        ) : !data ? (
          <p className="text-gray-400">{t('ceremony.notFound')}</p>
        ) : (
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={index}
              custom={dir}
              initial={{ opacity: 0, x: 40 * dir, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -40 * dir, scale: 0.98 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-full max-w-5xl"
            >
              {step && <StepView step={step} data={data} t={t} onStart={() => go(1)} onExport={exportImage} />}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Bottom bar: prev / dots / next */}
      {data && total > 1 && (
        <div className="absolute bottom-0 inset-x-0 z-20 flex items-center justify-between gap-3 px-4 sm:px-6 py-4 print:hidden">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={index === 0}
            className="p-2 rounded-full border border-white/15 text-gray-300 hover:bg-white/10 disabled:opacity-30 transition-colors"
            aria-label={t('ceremony.prev')}
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-full">
              {steps.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setDir(i > index ? 1 : -1);
                    setIndex(i);
                  }}
                  aria-label={t('ceremony.step', { n: i + 1, total })}
                  className={`h-2 rounded-full transition-all ${
                    i === index ? 'w-6 bg-yellow-400' : i < index ? 'w-2 bg-white/60' : 'w-2 bg-white/20'
                  } ${s.kind === 'award' && s.award.category === 'mvp' ? 'ring-2 ring-yellow-400/40' : ''}`}
                />
              ))}
            </div>
            <p className="text-[11px] text-gray-500 hidden sm:block">
              {t('ceremony.step', { n: index + 1, total })} · {t('ceremony.hint')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={index >= total - 1}
            className="p-2 rounded-full border border-white/15 text-gray-300 hover:bg-white/10 disabled:opacity-30 transition-colors"
            aria-label={t('ceremony.next')}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

function StepView({
  step,
  data,
  t,
  onStart,
  onExport,
}: {
  step: Step;
  data: SeasonAwards;
  t: TFn;
  onStart: () => void;
  onExport: () => void;
}) {
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  switch (step.kind) {
    case 'intro':
      return (
        <div className="text-center space-y-6">
          <motion.p
            initial={{ opacity: 0, letterSpacing: '0.1em' }}
            animate={{ opacity: 1, letterSpacing: '0.35em' }}
            transition={{ duration: 0.8 }}
            className="text-xs sm:text-sm font-semibold uppercase text-yellow-400"
          >
            {t('ceremony.kicker')}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black drop-shadow"
          >
            {data.season.name}
          </motion.h1>
          {data.season.theme && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xl sm:text-2xl font-semibold"
              style={{ color: 'var(--accent)' }}
            >
              {data.season.theme}
            </motion.p>
          )}
          {data.season.slogan && <p className="text-gray-400 italic">« {data.season.slogan} »</p>}
          {data.podiums.regular.length + data.podiums.playoffs.length + data.awards.length === 0 && (
            <p className="text-sm text-gray-500 max-w-md mx-auto">{t('ceremony.empty')}</p>
          )}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            type="button"
            onClick={(e) => {
              stop(e);
              onStart();
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-black font-bold bg-gradient-to-r from-yellow-300 to-amber-500 hover:brightness-110 transition"
          >
            <Play size={18} /> {t('ceremony.start')}
          </motion.button>
        </div>
      );

    case 'podium':
      return (
        <div className="space-y-8">
          <div className="text-center">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.35em] text-gray-400">{t('ceremony.' + step.scope)}</p>
            <h2 className="text-3xl sm:text-5xl font-black inline-flex items-center gap-3 mt-2">
              <Trophy className="text-yellow-400" size={36} /> {t('awards.podium.' + step.scope)}
            </h2>
          </div>
          <PodiumReveal entries={step.entries} reveal={step.reveal} t={t} />
        </div>
      );

    case 'award':
      return <AwardReveal award={step.award} t={t} />;

    case 'sponsors':
      return (
        <div className="text-center space-y-8">
          <h2 className="text-3xl sm:text-5xl font-black">{t('ceremony.sponsors')}</h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {step.sponsors.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 * i, type: 'spring', stiffness: 200 }}
                className="rounded-2xl bg-white p-4 flex items-center justify-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.logo} alt={s.name || ''} className="h-16 sm:h-24 max-w-[14rem] object-contain" />
              </motion.div>
            ))}
          </div>
        </div>
      );

    case 'end':
      return (
        <div className="space-y-8 text-center">
          <motion.h2 initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-4xl sm:text-6xl font-black">
            {t('ceremony.end')}
          </motion.h2>
          <p className="text-gray-400">{t('ceremony.endSub')}</p>
          {step.entries.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
                {t('ceremony.finalPodium')} · {step.scope ? t('awards.podium.' + step.scope) : ''}
              </p>
              <PodiumReveal entries={[...step.entries].sort((a, b) => b.placement - a.placement)} reveal={3} t={t} compact />
            </div>
          )}
          {step.mvp && (
            <div className="inline-flex items-center gap-3 rounded-2xl border border-yellow-400/40 bg-yellow-500/10 px-4 py-3">
              <PlayerAvatar user={step.mvp.user} size="md" className="ring-yellow-400/60" />
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-[0.25em] text-yellow-400 inline-flex items-center gap-1">
                  <Crown size={11} /> {t('ceremony.mvp')}
                </p>
                <p className="font-bold">{step.mvp.user ? step.mvp.user.displayName || step.mvp.user.username : t('awards.noPlayer')}</p>
              </div>
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-3 print:hidden">
            <button
              type="button"
              onClick={(e) => {
                stop(e);
                onExport();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-black font-bold bg-gradient-to-r from-yellow-300 to-amber-500 hover:brightness-110 transition"
            >
              <Download size={16} /> {t('ceremony.export')}
            </button>
            <Link
              href="/hall-of-fame"
              onClick={stop}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20 text-gray-200 hover:bg-white/10 transition"
            >
              <X size={16} /> {t('ceremony.exit')}
            </Link>
          </div>
        </div>
      );
  }
}

/** Podium with `reveal` entries visible (entries sorted 3 -> 1). */
function PodiumReveal({ entries, reveal, t, compact = false }: { entries: PodiumEntry[]; reveal: number; t: TFn; compact?: boolean }) {
  // Visual order: 2 - 1 - 3 on the stage.
  const order = [2, 1, 3].map((p) => entries.find((e) => e.placement === p)).filter(Boolean) as PodiumEntry[];
  const revealed = new Set(entries.slice(0, reveal).map((e) => e.placement));
  const heights: Record<number, string> = compact
    ? { 1: 'h-24', 2: 'h-16', 3: 'h-12' }
    : { 1: 'h-40 sm:h-56', 2: 'h-28 sm:h-40', 3: 'h-20 sm:h-28' };
  const labels: Record<number, string> = { 1: t('ceremony.place1'), 2: t('ceremony.place2'), 3: t('ceremony.place3') };
  return (
    <div className={`grid grid-cols-3 items-end gap-3 sm:gap-6 mx-auto ${compact ? 'max-w-xl' : 'max-w-3xl'}`}>
      {order.map((e) => {
        const on = revealed.has(e.placement);
        return (
          <div key={e.placement} className="flex flex-col items-center gap-3 min-w-0">
            <AnimatePresence>
              {on && (
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.7 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                  className="flex flex-col items-center gap-2 min-w-0 w-full"
                >
                  {e.team.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={e.team.image}
                      alt={e.team.name}
                      className={`${compact ? 'h-12 w-12' : 'h-20 w-20 sm:h-28 sm:w-28'} rounded-full object-cover ring-4`}
                      style={{ ['--tw-ring-color' as any]: PLACE_COLORS[e.placement] }}
                    />
                  ) : (
                    <div
                      className={`${compact ? 'h-12 w-12 text-lg' : 'h-20 w-20 sm:h-28 sm:w-28 text-3xl'} rounded-full bg-white/10 flex items-center justify-center font-black ring-4`}
                      style={{ ['--tw-ring-color' as any]: PLACE_COLORS[e.placement] }}
                    >
                      {e.team.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <p className={`${compact ? 'text-sm' : 'text-base sm:text-2xl'} font-black text-center truncate w-full`}>{e.team.name}</p>
                  <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em]" style={{ color: PLACE_COLORS[e.placement] }}>
                    {labels[e.placement]}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            {!on && <div className={`${compact ? 'h-12' : 'h-20 sm:h-28'} flex items-center justify-center text-4xl text-white/20 font-black`}>?</div>}
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.5 }}
              style={{ originY: 1, background: on ? `linear-gradient(to top, ${PLACE_COLORS[e.placement]}55, ${PLACE_COLORS[e.placement]})` : 'rgba(255,255,255,0.06)' }}
              className={`w-full ${heights[e.placement]} rounded-t-2xl flex items-start justify-center pt-3 text-2xl sm:text-4xl font-black ${on ? 'text-black' : 'text-white/30'}`}
            >
              {e.placement}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

function AwardReveal({ award, t }: { award: AwardItem; t: TFn }) {
  const isMvp = award.category === 'mvp';
  const name = award.user ? award.user.displayName || award.user.username : award.team?.name || t('awards.noPlayer');
  return (
    <div className="flex flex-col items-center text-center gap-6">
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-xs sm:text-sm font-semibold uppercase tracking-[0.35em] ${isMvp ? 'text-yellow-400' : 'text-gray-400'}`}
      >
        {isMvp ? t('awards.mvpKicker') : t('ceremony.awards')}
      </motion.p>
      <motion.h2 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="text-3xl sm:text-5xl font-black">
        {categoryLabel(t, award)}
      </motion.h2>
      <motion.div
        initial={{ opacity: 0, scale: 0.5, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 180, damping: 14 }}
        className="relative"
      >
        <div className={`absolute inset-0 rounded-full blur-3xl opacity-40 ${isMvp ? 'bg-yellow-400' : 'bg-white/40'}`} />
        <PlayerAvatar user={award.user} size="xl" className={`relative ${isMvp ? 'ring-4 ring-yellow-400' : 'ring-4 ring-white/40'}`} />
        <TrophyVisual category={award.category} imageUrl={award.imageUrl} size="md" className="absolute -bottom-3 -right-3" />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="space-y-2 max-w-2xl w-full">
        <p className="text-3xl sm:text-5xl md:text-6xl font-black break-words">{name}</p>
        <div className="flex justify-center">
          <TeamChip team={award.team} t={t} className="text-sm sm:text-base" />
        </div>
        {award.description && <p className="text-gray-300 max-w-xl mx-auto">{award.description}</p>}
        {award.criteria && (
          <div className="pt-3 max-w-lg mx-auto">
            <CriteriaStats criteria={award.criteria} t={t} compact />
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Canvas export
// ---------------------------------------------------------------------------

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function drawCircleImage(ctx: CanvasRenderingContext2D, src: string | null | undefined, fallback: string, cx: number, cy: number, r: number, ring: string) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = '#1f2937';
  ctx.fill();
  ctx.clip();
  const img = src ? await loadImage(src) : null;
  if (img) {
    ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(r)}px Inter, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fallback, cx, cy + 2);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = 6;
  ctx.strokeStyle = ring;
  ctx.stroke();
}

/** Renders the final podium (+ MVP) to a PNG data URL. Throws when the canvas is tainted. */
async function drawPodiumImage(opts: {
  title: string;
  subtitle: string;
  entries: PodiumEntry[];
  mvp: AwardItem | null;
  mvpLabel: string;
  accent: string;
}): Promise<string> {
  const W = 1600;
  const H = 900;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');

  // Background.
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0b0f1a');
  bg.addColorStop(1, '#05070d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 120, 20, W / 2, 120, 700);
  glow.addColorStop(0, opts.accent + '66');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Titles.
  ctx.textAlign = 'center';
  ctx.fillStyle = '#facc15';
  ctx.font = '600 26px Inter, Arial, sans-serif';
  ctx.fillText(opts.subtitle.toUpperCase(), W / 2, 90);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 64px Inter, Arial, sans-serif';
  ctx.fillText(opts.title, W / 2, 165);

  // Podium (2 - 1 - 3).
  const order = [2, 1, 3].map((p) => opts.entries.find((e) => e.placement === p)).filter(Boolean) as PodiumEntry[];
  const colW = 360;
  const gap = 40;
  const totalW = order.length * colW + (order.length - 1) * gap;
  const startX = (W - totalW) / 2;
  const baseY = 780;
  const heights: Record<number, string | number> = { 1: 260, 2: 190, 3: 140 };
  for (let i = 0; i < order.length; i++) {
    const e = order[i];
    const x = startX + i * (colW + gap);
    const h = Number(heights[e.placement] ?? 140);
    const color = PLACE_COLORS[e.placement] || '#94a3b8';
    const grad = ctx.createLinearGradient(0, baseY - h, 0, baseY);
    grad.addColorStop(0, color);
    grad.addColorStop(1, color + '55');
    ctx.fillStyle = grad;
    roundRect(ctx, x, baseY - h, colW, h, 24);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = '900 56px Inter, Arial, sans-serif';
    ctx.fillText(String(e.placement), x + colW / 2, baseY - h + 70);
    // Team.
    await drawCircleImage(ctx, e.team.image, (e.team.name?.[0] || '?').toUpperCase(), x + colW / 2, baseY - h - 130, 70, color);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 34px Inter, Arial, sans-serif';
    ctx.fillText(e.team.name, x + colW / 2, baseY - h - 30, colW - 20);
  }

  // MVP ribbon.
  if (opts.mvp) {
    const name = opts.mvp.user ? opts.mvp.user.displayName || opts.mvp.user.username : opts.mvp.team?.name || '';
    const rx = W - 460;
    const ry = 230;
    ctx.fillStyle = 'rgba(250, 204, 21, 0.12)';
    roundRect(ctx, rx, ry, 400, 110, 22);
    ctx.fill();
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    await drawCircleImage(ctx, avatarSrc(opts.mvp.user?.avatar), (name[0] || '?').toUpperCase(), rx + 60, ry + 55, 38, '#facc15');
    ctx.textAlign = 'left';
    ctx.fillStyle = '#facc15';
    ctx.font = '600 18px Inter, Arial, sans-serif';
    ctx.fillText(opts.mvpLabel.toUpperCase(), rx + 115, ry + 42);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 30px Inter, Arial, sans-serif';
    ctx.fillText(name, rx + 115, ry + 80, 270);
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '500 20px Inter, Arial, sans-serif';
  ctx.fillText('MLBB Togo', W - 40, H - 30);

  return canvas.toDataURL('image/png');
}
