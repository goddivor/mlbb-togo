'use client';

import Link from 'next/link';
import { avatarSrc } from '@/lib/api';

export type TFn = (key: string, params?: Record<string, string | number>) => string;

export const RESULT_STYLES: Record<string, string> = {
  W: 'bg-success/15 text-success',
  L: 'bg-danger/15 text-danger',
  D: 'bg-warning/15 text-warning',
};

export const RESULT_BORDER: Record<string, string> = {
  W: 'border-l-success',
  L: 'border-l-danger',
  D: 'border-l-warning',
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
      className={`inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-md px-1.5 text-xs font-bold ${RESULT_STYLES[r]} ${className}`}
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
        <img src={avatarSrc(team.image, 64)} alt={name} referrerPolicy="no-referrer" className={`${dim} shrink-0 rounded-full border border-stroke object-cover dark:border-strokedark`} />
      ) : (
        <span className={`${dim} flex shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white`}>{name[0]?.toUpperCase() || 'T'}</span>
      )}
      <span className="truncate text-sm font-medium text-black dark:text-white">{name}</span>
    </>
  );
  if (!team?.id) return <span className={`inline-flex min-w-0 items-center gap-2 ${className}`}>{inner}</span>;
  return (
    <Link href={`/teams/${team.id}`} className={`inline-flex min-w-0 items-center gap-2 hover:text-primary ${className}`}>
      {inner}
    </Link>
  );
}

export function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-body dark:text-bodydark">{children}</h3>
      {hint && <p className="mt-0.5 text-xs text-bodydark2">{hint}</p>}
    </div>
  );
}
