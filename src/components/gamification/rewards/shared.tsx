'use client';

import { useEffect, useState } from 'react';
import { Hourglass } from 'lucide-react';
import { cn } from '@/lib/helpers';
import { seasonOfVariant, type FrameInfo, type FrameShape } from '@/components/game/frames';

/* Shapes of the /rewards API (#122) used by the collection and the admin page. */

export interface FramePeriod {
  from: string;
  to: string | null;
}

export interface FrameEntry {
  frameId: string;
  variant: string;
  key: string;
  source: string;
  sourceRef: string | null;
  unlockedAt: string;
  expiresAt: string | null;
  expiredAt: string | null;
  active: boolean;
  timesGranted: number;
  history: FramePeriod[];
}

export interface FrameDefDto {
  id: string;
  name: { fr: string; en: string };
  shape: FrameShape;
  tier: string;
  source: 'level' | 'achievement' | 'award' | 'admin' | 'event' | 'ranking';
  level: number | null;
  achievement: string | null;
  awards: string[] | null;
  animation: string;
  variantBySeason: boolean;
  temporary: boolean;
  expiry: { days: number } | { until: 'next_champion' } | null;
  secret: boolean;
}

export interface CollectionFrame extends FrameDefDto {
  owned: boolean;
  entries: FrameEntry[];
}

export interface CollectionTitle {
  id: string;
  level: number;
  name: { fr: string; en: string };
  unlocked: boolean;
}

export interface Collection {
  level: number;
  equippedFrame: string | null;
  fallbackFrame: string | null;
  equippedTitle: string | null;
  frames: CollectionFrame[];
  titles: CollectionTitle[];
}

export type TFn = (key: string, params?: Record<string, string | number>) => string;

export function localName(name: { fr: string; en: string } | undefined, lang: string): string {
  if (!name) return '';
  return lang === 'en' ? name.en : name.fr;
}

/** Frame name plus its season (`Champion de saison · Saison 2`). */
export function frameLabel(
  t: TFn,
  name: { fr: string; en: string } | undefined,
  lang: string,
  variant?: string | null,
): string {
  const season = seasonOfVariant(variant);
  const base = localName(name, lang);
  return season ? `${base} · ${t('rewards.season', { n: season })}` : base;
}

/**
 * Unlock condition in clear: level frames from their level, achievements from
 * the achievement name when it is translated, otherwise the catalogue hint
 * (French) or a generic sentence per source (English).
 */
export function unlockHint(t: TFn, lang: string, def: FrameDefDto, info: FrameInfo | null): string {
  if (def.secret) return t('rewards.hint.secret');
  if (def.level) return t('rewards.hint.level', { n: def.level });
  if (def.achievement) {
    const key = `achievement.${def.achievement}`;
    const name = t(key);
    if (name !== key) return t('rewards.hint.achievement', { name });
  }
  if (lang !== 'en' && info?.unlockHint) return info.unlockHint;
  return t(`rewards.hint.source.${def.source}`);
}

export function fmtDate(value: string | Date | null | undefined, lang: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Remaining time label (`5 j 4 h`, `3 h`, `12 min`), null once elapsed. */
export function countdownLabel(t: TFn, expiresAt: string | null | undefined, now: number): string | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - now;
  if (!(ms > 0)) return null;
  const minutes = Math.floor(ms / 60_000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return t('rewards.countdown.dh', { d: days, h: hours });
  if (hours > 0) return t('rewards.countdown.h', { h: hours });
  return t('rewards.countdown.m', { m: Math.max(1, minutes) });
}

/** Current time refreshed every `ms` (countdowns). */
export function useNow(ms = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return now;
}

/** Hourglass pill for a temporary frame. */
export function CountdownPill({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded bg-accent-gold/15 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-accent-gold ring-1 ring-inset ring-accent-gold/30 num',
        className,
      )}
    >
      <Hourglass size={11} aria-hidden="true" />
      {label}
    </span>
  );
}

/** Segmented filter (same look as the frames showcase). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex max-w-full overflow-x-auto rounded border border-line-strong">
      {options.map((o, i) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            'shrink-0 whitespace-nowrap px-3 py-1.5 text-xs font-semibold transition-colors duration-fast',
            i > 0 && 'border-l border-line-strong',
            value === o.id ? 'bg-primary text-on-primary' : 'text-ink-2 hover:bg-surface-2 hover:text-ink-1',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
