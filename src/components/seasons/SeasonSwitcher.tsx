'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Check, ChevronDown, Layers } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { useSelectedSeason, isLiveSeason, type Season } from '@/store/useSeasonStore';
import { seasonShortLabel } from './shared';

/**
 * Global season selector. Drop it in a header (`variant="header"`), inline
 * in a filter bar (`variant="inline"`) or in the admin control room
 * (`variant="admin"`: no "all seasons" entry, browse link to /admin/seasons).
 * Pages read the choice through `useSelectedSeason()`.
 */
export default function SeasonSwitcher({
  variant = 'header',
  allowAll,
  className = '',
}: {
  variant?: 'header' | 'inline' | 'admin';
  /** Offer the "all seasons" (no filter) entry (never for the admin variant). */
  allowAll?: boolean;
  className?: string;
}) {
  const t = useT();
  const isAdmin = variant === 'admin';
  const offerAll = isAdmin ? false : allowAll ?? true;
  const browseHref = isAdmin ? '/admin/seasons' : '/dashboard/seasons';
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = useSelectedSeason();
  const { selection, setSelection, seasons, current, ready } = selected;
  // The admin variant has no "all" entry: a persisted "all" falls back to the current season.
  const season = isAdmin && selection === 'all' ? current : selected.season;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const label = !ready
    ? '…'
    : selection === 'all' && !isAdmin
      ? t('seasons.switcher.all')
      : season
        ? seasonShortLabel(season)
        : t('seasons.switcher.none');

  const dot = (s: Season | null) => (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${
        isLiveSeason(s) ? 'bg-accent-green' : s?.status === 'closed' ? 'bg-ink-3' : 'bg-primary'
      }`}
      style={s?.color ? { backgroundColor: s.color } : undefined}
    />
  );

  // Header: compact pill matching the icon buttons; inline/admin: field-like trigger.
  const triggerCls =
    variant === 'header'
      ? 'flex h-9 w-full items-center gap-2 rounded-md border border-line-subtle bg-surface-2/60 px-3 text-[13px] font-medium text-ink-2 transition-[color,border-color,background-color] duration-fast ease-out hover:border-line-strong hover:bg-surface-2 hover:text-ink-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'
      : 'flex items-center gap-2 py-2 pl-3 pr-3 text-sm rounded border border-line-strong bg-surface-1 text-ink-1 hover:border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25';

  const choose = (v: string) => {
    setSelection(v);
    setOpen(false);
  };

  const rowCls = (active: boolean) =>
    `w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors duration-fast ${
      active ? 'text-primary bg-primary/10' : 'text-ink-2 hover:bg-surface-2 hover:text-ink-1'
    }`;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={triggerCls}
        aria-label={t('seasons.switcher.label')}
        title={season?.name || t('seasons.switcher.label')}
      >
        {variant === 'header' ? (
          season ? dot(season) : <CalendarDays size={14} className="shrink-0 text-ink-3" />
        ) : (
          <CalendarDays size={14} />
        )}
        <span className="max-w-[9rem] flex-1 truncate">{label}</span>
        {variant !== 'header' && season && dot(season)}
        <ChevronDown size={14} className={`shrink-0 text-ink-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="header-menu absolute right-0 top-full mt-1.5 w-64 overflow-hidden z-50"
          >
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3 border-b border-line-subtle">
              {t('seasons.switcher.label')}
            </div>
            <div className="max-h-72 overflow-y-auto">
              <button
                type="button"
                onClick={() => choose('current')}
                className={rowCls(selection === 'current' || (isAdmin && selection === 'all'))}
              >
                {dot(current)}
                <span className="flex-1 truncate">
                  {t('seasons.switcher.current')}
                  {current && <span className="text-ink-3"> · {seasonShortLabel(current)}</span>}
                </span>
                {(selection === 'current' || (isAdmin && selection === 'all')) && <Check size={14} />}
              </button>
              {offerAll && (
                <button type="button" onClick={() => choose('all')} className={rowCls(selection === 'all')}>
                  <Layers size={12} className="text-ink-3" />
                  <span className="flex-1">{t('seasons.switcher.all')}</span>
                  {selection === 'all' && <Check size={14} />}
                </button>
              )}
              {seasons.length > 0 && <div className="my-1 border-t border-line-subtle" />}
              {seasons.map((s) => (
                <button key={s.id} type="button" onClick={() => choose(s.id)} className={rowCls(selection === s.id)}>
                  {dot(s)}
                  <span className="flex-1 min-w-0">
                    <span className="block truncate">{s.name}</span>
                    <span className="block text-[11px] text-ink-3 truncate">
                      {t('seasons.status.' + s.status)}
                      {s.theme ? ` · ${s.theme}` : ''}
                    </span>
                  </span>
                  {selection === s.id && <Check size={14} />}
                </button>
              ))}
            </div>
            <Link
              href={browseHref}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-xs font-semibold text-primary border-t border-line-subtle hover:bg-primary/5 transition-colors"
            >
              {t(isAdmin ? 'seasons.switcher.manage' : 'seasons.switcher.browse')}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
