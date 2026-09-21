'use client';

import Link from 'next/link';
import { avatarSrc } from '@/lib/api';

export type TFn = (key: string, params?: Record<string, string | number>) => string;

export const RESULT_STYLES: Record<string, string> = {
  W: 'bg-accent-green/15 text-accent-green ring-1 ring-inset ring-accent-green/30',
  L: 'bg-accent-red/15 text-accent-red ring-1 ring-inset ring-accent-red/30',
  D: 'bg-accent-gold/15 text-accent-gold ring-1 ring-inset ring-accent-gold/30',
};

export const RESULT_BORDER: Record<string, string> = {
  W: 'border-l-accent-green',
  L: 'border-l-accent-red',
  D: 'border-l-accent-gold',
};

export function localeOf(lang: string) {
  return lang === 'en' ? 'en-GB' : 'fr-FR';
}

export function fmtDate(value: any, lang: string, opts?: Intl.DateTimeFormatOptions) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(localeOf(lang), opts ?? { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtTime(value: any, lang: string) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(localeOf(lang), { hour: '2-digit', minute: '2-digit' });
}

/** Small W / L / D pill, optionally with the full label. */
export function ResultBadge({ result, t, full = false, className = '' }: { result: string; t: TFn; full?: boolean; className?: string }) {
  const r = RESULT_STYLES[result] ? result : 'D';
  return (
    <span
      title={t('teams.result.' + r)}
      className={`inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded cut-corners-sm px-1.5 text-xs font-bold num ${RESULT_STYLES[r]} ${className}`}
    >
      {full ? t('teams.result.' + r) : r}
    </span>
  );
}

/** Team crest + name, linking to the public team page. */
export function TeamChip({ team, className = '', size = 8 }: { team: any; className?: string; size?: 6 | 8 | 10 }) {
  const name = team?.name || '?';
  const dim = size === 6 ? 'h-6 w-6 text-[10px]' : size === 10 ? 'h-10 w-10 text-sm' : 'h-8 w-8 text-xs';
  const inner = (
    <>
      {team?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarSrc(team.image, 64)} alt={name} referrerPolicy="no-referrer" className={`${dim} shrink-0 rounded cut-corners-sm object-cover ring-1 ring-inset ring-line-subtle`} />
      ) : (
        <span className={`${dim} flex shrink-0 items-center justify-center rounded cut-corners-sm bg-surface-3 font-bold text-ink-2`}>{name[0]?.toUpperCase() || 'T'}</span>
      )}
      <span className="truncate text-sm font-medium text-ink-1">{name}</span>
    </>
  );
  if (!team?.id) return <span className={`inline-flex min-w-0 items-center gap-2 ${className}`}>{inner}</span>;
  return (
    <Link href={`/dashboard/teams/${team.id}`} className={`inline-flex min-w-0 items-center gap-2 hover:text-primary ${className}`}>
      {inner}
    </Link>
  );
}

export function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-3">
      <h3 className="eyebrow">{children}</h3>
      {hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}
