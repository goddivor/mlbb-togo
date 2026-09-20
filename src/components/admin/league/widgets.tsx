'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Circle,
  ExternalLink,
  Handshake,
  ListOrdered,
  Lock,
  Megaphone,
  Radio,
  RefreshCw,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/helpers';
import { Badge, Button, Card } from '@/components/ui';
import { FormPills, TeamAvatar } from '@/components/standings/bits';
import MarkdownContent from '@/components/forum/MarkdownContent';
import type { LeagueOverview, RecomputeResult } from './types';

const inputCls =
  'w-full px-3 py-2 text-sm rounded-lg border border-stroke bg-gray-2 text-black placeholder-bodydark2 focus:outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white';

export function WidgetTitle({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-black dark:text-white">
        <span className="text-primary">{icon}</span> {title}
      </h3>
      {action}
    </div>
  );
}

/** Small metric tile of the KPI row. */
export function Kpi({
  label,
  value,
  hint,
  tone = 'default',
  href,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: 'default' | 'warning' | 'danger' | 'success';
  href?: string;
}) {
  const toneCls = {
    default: 'text-black dark:text-white',
    warning: 'text-warning',
    danger: 'text-danger',
    success: 'text-success',
  }[tone];
  const body = (
    <>
      <p className={cn('text-2xl font-bold tabular-nums leading-tight', toneCls)}>{value}</p>
      <p className="mt-1 text-xs font-medium text-body dark:text-bodydark">{label}</p>
      {hint && <p className="mt-0.5 text-[11px] text-bodydark2">{hint}</p>}
    </>
  );
  const cls = 'rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark';
  return href ? (
    <Link href={href} className={cn(cls, 'block transition-colors hover:border-primary')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Closing checklist with deep links into the dedicated admin pages. */
export function ChecklistWidget({
  overview,
  onClose,
}: {
  overview: LeagueOverview;
  onClose: () => void;
}) {
  const t = useT();
  const { checklist, awards } = overview;
  const done = checklist.items.filter((i) => i.done).length;
  return (
    <Card className="!p-5">
      <WidgetTitle
        icon={<CheckCircle2 size={16} />}
        title={t('admin.league.checklist.title')}
        action={
          <Badge variant={checklist.ready ? 'green' : 'gold'} size="sm">
            {done}/{checklist.items.length}
          </Badge>
        }
      />
      <ul className="space-y-2">
        {checklist.items.map((item) => (
          <li
            key={item.key}
            className={cn(
              'flex items-start gap-3 rounded-lg border px-3 py-2.5',
              item.done
                ? 'border-success/30 bg-success/5'
                : 'border-stroke bg-gray-2 dark:border-strokedark dark:bg-meta-4',
            )}
          >
            {item.done ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" />
            ) : (
              <Circle size={18} className="mt-0.5 shrink-0 text-bodydark2" />
            )}
            <div className="min-w-0 flex-1">
              <p className={cn('text-sm font-medium', item.done ? 'text-body dark:text-bodydark line-through' : 'text-black dark:text-white')}>
                {t(`admin.league.checklist.${item.key}`)}
              </p>
              {!item.done && (
                <p className="text-xs text-bodydark2">
                  {t(`admin.league.checklist.${item.key}Hint`, { n: item.remaining })}
                </p>
              )}
              {item.key === 'awards' && !item.done && awards.missing.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {awards.missing.map((c) => (
                    <Badge key={c} variant="gold" size="sm">
                      {t('awards.category.' + c)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            {!item.done && (
              <Link
                href={item.href}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                {t('admin.league.checklist.go')} <ArrowRight size={12} />
              </Link>
            )}
          </li>
        ))}
      </ul>
      {checklist.closable && (
        <div className="mt-4 flex flex-col gap-2 border-t border-stroke pt-4 dark:border-strokedark sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-body dark:text-bodydark">
            {checklist.ready ? t('admin.league.checklist.readyHint') : t('admin.league.checklist.notReadyHint')}
          </p>
          <Button size="sm" variant={checklist.ready ? 'danger' : 'outline'} onClick={onClose}>
            <Lock size={14} /> {t('admin.seasons.lifecycle.close')}
          </Button>
        </div>
      )}
    </Card>
  );
}

export function StandingsWidget({ overview }: { overview: LeagueOverview }) {
  const t = useT();
  const { standings, season } = overview;
  return (
    <Card className="!p-5">
      <WidgetTitle
        icon={<ListOrdered size={16} />}
        title={t('admin.league.standings.title')}
        action={
          <Link href="/standings" target="_blank" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            {t('admin.league.standings.full')} <ExternalLink size={12} />
          </Link>
        }
      />
      {standings.frozen && (
        <p className="mb-2 text-[11px] text-bodydark2 inline-flex items-center gap-1">
          <Lock size={11} /> {t('admin.league.standings.frozen')}
        </p>
      )}
      {standings.top.length === 0 ? (
        <p className="text-sm text-body dark:text-bodydark">{t('admin.league.standings.empty')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-bodydark2">
              <tr>
                <th className="py-1.5 pr-2 text-left">#</th>
                <th className="py-1.5 pr-2 text-left">{t('seasons.standings.team')}</th>
                <th className="py-1.5 px-2 text-right">{t('seasons.standings.played')}</th>
                <th className="py-1.5 px-2 text-right">{t('seasons.standings.wins')}</th>
                <th className="py-1.5 px-2 text-right">{t('seasons.standings.losses')}</th>
                <th className="py-1.5 px-2 text-right">{t('admin.league.standings.points')}</th>
                <th className="py-1.5 pl-2 text-right hidden sm:table-cell">{t('admin.league.standings.form')}</th>
              </tr>
            </thead>
            <tbody>
              {standings.top.map((r) => (
                <tr key={r.teamId} className="border-t border-stroke dark:border-strokedark">
                  <td className="py-2 pr-2 tabular-nums text-body dark:text-bodydark">{r.rank}</td>
                  <td className="py-2 pr-2">
                    <span className="inline-flex items-center gap-2 min-w-0">
                      <TeamAvatar team={r.team} size={24} />
                      <span className="truncate font-medium text-black dark:text-white">{r.team.name}</span>
                      {r.qualified && <span className="h-1.5 w-1.5 rounded-full bg-success" title={t('admin.league.standings.qualified')} />}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums">{r.played}</td>
                  <td className="py-2 px-2 text-right tabular-nums text-success">{r.wins}</td>
                  <td className="py-2 px-2 text-right tabular-nums text-danger">{r.losses}</td>
                  <td className="py-2 px-2 text-right tabular-nums font-semibold text-black dark:text-white">{r.points}</td>
                  <td className="py-2 pl-2 text-right hidden sm:table-cell">
                    <FormPills form={r.form} t={t} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {season.slug && (
        <p className="mt-3 text-[11px] text-bodydark2">{t('admin.league.standings.hint')}</p>
      )}
    </Card>
  );
}

/** Quick announcement (title + markdown) published on the feed. */
export function AnnounceWidget({ onPublished }: { onPublished: () => void }) {
  const t = useT();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pin, setPin] = useState(false);
  const [preview, setPreview] = useState(false);
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSending(true);
    try {
      await api.admin.league.announce({ title: title.trim(), content, contentFormat: 'markdown', pin });
      toast.success(t('admin.league.announce.done'));
      setTitle('');
      setContent('');
      setPin(false);
      setPreview(false);
      onPublished();
    } catch (err: any) {
      toast.error(err?.message || t('admin.esport.errorGeneric'));
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="!p-5">
      <WidgetTitle
        icon={<Megaphone size={16} />}
        title={t('admin.league.announce.title')}
        action={
          <Link href="/forum" target="_blank" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            {t('admin.league.announce.feed')} <ExternalLink size={12} />
          </Link>
        }
      />
      <form onSubmit={submit} className="space-y-3">
        <input
          className={inputCls}
          value={title}
          maxLength={200}
          placeholder={t('admin.league.announce.titlePlaceholder')}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        {preview ? (
          <div className="min-h-[7rem] rounded-lg border border-stroke bg-gray-2 p-3 dark:border-strokedark dark:bg-meta-4">
            {content.trim() ? (
              <MarkdownContent content={content} format="markdown" />
            ) : (
              <p className="text-xs text-bodydark2">{t('admin.league.announce.previewEmpty')}</p>
            )}
          </div>
        ) : (
          <textarea
            className={cn(inputCls, 'min-h-[7rem] font-mono text-xs')}
            value={content}
            rows={5}
            placeholder={t('admin.league.announce.contentPlaceholder')}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        )}
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-xs text-body dark:text-bodydark cursor-pointer">
            <input type="checkbox" className="accent-primary" checked={pin} onChange={(e) => setPin(e.target.checked)} />
            {t('admin.league.announce.pin')}
          </label>
          <button
            type="button"
            className="text-xs font-medium text-primary hover:underline"
            onClick={() => setPreview((v) => !v)}
          >
            {preview ? t('admin.league.announce.edit') : t('admin.league.announce.preview')}
          </button>
          <span className="flex-1" />
          <Button size="sm" type="submit" disabled={sending || !title.trim() || !content.trim()} loading={sending}>
            <Send size={14} /> {t('admin.league.announce.publish')}
          </Button>
        </div>
      </form>
    </Card>
  );
}

/** "Recompute stats" action with the result of the last run. */
export function RecomputeWidget({
  overview,
  seasonKey,
  onDone,
}: {
  overview: LeagueOverview;
  seasonKey: string | null;
  onDone: () => void;
}) {
  const t = useT();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RecomputeResult | null>(null);
  const last = result ?? overview.lastRecompute;

  const run = async () => {
    setRunning(true);
    try {
      const r = (await api.admin.league.recompute(seasonKey)) as RecomputeResult;
      setResult(r);
      toast.success(t('admin.league.recompute.done', { matches: r.matches, players: r.players }));
      onDone();
    } catch (err: any) {
      toast.error(err?.message || t('admin.esport.errorGeneric'));
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card className="!p-5">
      <WidgetTitle icon={<RefreshCw size={16} />} title={t('admin.league.recompute.title')} />
      <p className="text-xs text-body dark:text-bodydark">{t('admin.league.recompute.hint')}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button size="sm" variant="outline" onClick={run} disabled={running} loading={running}>
          <RefreshCw size={14} /> {t('admin.league.recompute.action')}
        </Button>
        <span className="text-[11px] text-bodydark2">
          {last
            ? t('admin.league.recompute.last', {
                date: new Date(last.at).toLocaleString(),
                matches: last.matches,
                by: last.by || '—',
              })
            : t('admin.league.recompute.never')}
        </span>
      </div>
    </Card>
  );
}

export function SponsorsWidget({ overview }: { overview: LeagueOverview }) {
  const t = useT();
  const { sponsors } = overview;
  return (
    <Card className="!p-5">
      <WidgetTitle
        icon={<Handshake size={16} />}
        title={t('admin.league.sponsors.title')}
        action={
          <Link href="/admin/sponsors" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            {t('admin.league.manage')} <ArrowRight size={12} />
          </Link>
        }
      />
      {sponsors.requestsNew > 0 && (
        <Link
          href="/admin/sponsors?tab=requests"
          className="mb-3 flex items-center justify-between rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs font-medium text-warning hover:bg-warning/15"
        >
          {t('admin.league.sponsors.requests', { n: sponsors.requestsNew })} <ArrowRight size={12} />
        </Link>
      )}
      {sponsors.total === 0 ? (
        <p className="text-sm text-body dark:text-bodydark">{t('admin.league.sponsors.empty')}</p>
      ) : (
        <div className="space-y-3">
          {sponsors.tiers.map((tier) => {
            const list = sponsors.byTier[tier] ?? [];
            if (!list.length) return null;
            return (
              <div key={tier}>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-bodydark2">
                  {t('sponsors.tier.' + tier)} · {list.length}
                </p>
                <div className="flex flex-wrap gap-2">
                  {list.map((s) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-stroke bg-gray-2 px-2 py-1 text-xs text-black dark:border-strokedark dark:bg-meta-4 dark:text-white"
                    >
                      {s.logo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.logo} alt={s.name ?? ''} className="h-5 w-5 rounded-full object-cover" referrerPolicy="no-referrer" />
                      )}
                      {s.name || (!s.logo ? '?' : null)}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export function StreamWidget({ overview }: { overview: LeagueOverview }) {
  const t = useT();
  const { stream } = overview;
  const state = stream.live ? 'live' : stream.connected ? 'connected' : stream.configured ? 'configured' : 'missing';
  const variant = { live: 'red', connected: 'green', configured: 'blue', missing: 'default' }[state];
  return (
    <Card className="!p-5">
      <WidgetTitle
        icon={<Radio size={16} />}
        title={t('admin.league.stream.title')}
        action={
          <Link href="/admin/stream" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            {t('admin.league.manage')} <ArrowRight size={12} />
          </Link>
        }
      />
      <div className="flex items-center gap-3">
        <Badge variant={variant} size="md">
          {state === 'live' && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
            </span>
          )}
          {t('admin.league.stream.' + state)}
        </Badge>
        <div className="min-w-0 text-xs text-body dark:text-bodydark">
          {stream.channel && <p className="truncate">{stream.channel}</p>}
          {stream.live && stream.liveTitle && <p className="truncate font-medium text-black dark:text-white">{stream.liveTitle}</p>}
        </div>
      </div>
    </Card>
  );
}

export function AwardsWidget({ overview }: { overview: LeagueOverview }) {
  const t = useT();
  const { awards, podiums, season } = overview;
  const pct = awards.total ? Math.round((awards.filled / awards.total) * 100) : 0;
  return (
    <Card className="!p-5">
      <WidgetTitle
        icon={<Award size={16} />}
        title={t('admin.league.awards.title')}
        action={
          <Link href={`/admin/awards?season=${encodeURIComponent(season.id)}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            {t('admin.league.manage')} <ArrowRight size={12} />
          </Link>
        }
      />
      <div className="flex items-center justify-between text-sm">
        <span className="text-body dark:text-bodydark">{t('admin.league.awards.coverage')}</span>
        <span className="font-semibold tabular-nums text-black dark:text-white">
          {awards.filled}/{awards.total}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-2 dark:bg-meta-4">
        <div className={cn('h-full rounded-full', pct >= 100 ? 'bg-success' : 'bg-warning')} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <Badge variant={podiums.regular ? 'green' : 'default'} size="sm">
          {t('admin.league.awards.podiumRegular')} · {t(podiums.regular ? 'admin.league.awards.set' : 'admin.league.awards.unset')}
        </Badge>
        <Badge variant={podiums.playoffs ? 'green' : 'default'} size="sm">
          {t('admin.league.awards.podiumPlayoffs')} · {t(podiums.playoffs ? 'admin.league.awards.set' : 'admin.league.awards.unset')}
        </Badge>
        {awards.custom > 0 && (
          <Badge variant="purple" size="sm">
            {t('admin.league.awards.custom', { n: awards.custom })}
          </Badge>
        )}
      </div>
    </Card>
  );
}
