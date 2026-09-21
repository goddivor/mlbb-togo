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
import { Badge, Button, Card, SectionTitle, StatCard, Table, Td, Th, Textarea, Input, ProgressBar, type Accent } from '@/components/ui';
import { FormPills, TeamAvatar } from '@/components/standings/bits';
import MarkdownContent from '@/components/forum/MarkdownContent';
import { useCan } from '@/lib/permissions';
import type { LeagueOverview, RecomputeResult } from './types';

/** Widget header: icon + display title on the left, optional action on the right. */
export function WidgetTitle({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <SectionTitle
      className="mb-4"
      size="sm"
      title={
        <span className="inline-flex items-center gap-2">
          <span className="text-primary">{icon}</span> {title}
        </span>
      }
      action={action}
    />
  );
}

const linkCls = 'inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline';

/** Small metric tile of the KPI row (StatCard, optionally linked). */
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
  const accents: Record<NonNullable<typeof tone>, Accent> = { default: 'cyan', warning: 'gold', danger: 'red', success: 'green' };
  const accent = accents[tone];
  const valueCls = { default: '', warning: 'text-accent-gold', danger: 'text-accent-red', success: 'text-accent-green' }[tone];
  const card = (
    <StatCard
      label={label}
      hint={hint}
      accent={accent}
      value={<span className={cn('num', valueCls)}>{value}</span>}
      className={cn('h-full !px-4 !py-4', href && 'transition-[border-color,box-shadow] duration-base ease-out hover:border-line-strong hover:shadow-elev-2')}
    />
  );
  return href ? (
    <Link href={href} className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
      {card}
    </Link>
  ) : (
    card
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
  const { can, canOpen } = useCan();
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
              item.done ? 'border-accent-green/30 bg-accent-green/5' : 'border-line-subtle bg-surface-2/60',
            )}
          >
            {item.done ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-accent-green" />
            ) : (
              <Circle size={18} className="mt-0.5 shrink-0 text-ink-3" />
            )}
            <div className="min-w-0 flex-1">
              <p className={cn('text-sm font-medium', item.done ? 'text-ink-2 line-through' : 'text-ink-1')}>
                {t(`admin.league.checklist.${item.key}`)}
              </p>
              {!item.done && (
                <p className="text-xs text-ink-3 num">
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
            {!item.done && canOpen(item.href) && (
              <Link href={item.href} className={cn(linkCls, 'shrink-0')}>
                {t('admin.league.checklist.go')} <ArrowRight size={12} />
              </Link>
            )}
          </li>
        ))}
      </ul>
      {checklist.closable && can('admin.seasons') && (
        <div className="mt-4 flex flex-col gap-2 border-t border-line-subtle pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-2">
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
          <Link href="/dashboard/standings" target="_blank" className={linkCls}>
            {t('admin.league.standings.full')} <ExternalLink size={12} />
          </Link>
        }
      />
      {standings.frozen && (
        <p className="mb-2 inline-flex items-center gap-1 text-[11px] text-ink-3">
          <Lock size={11} /> {t('admin.league.standings.frozen')}
        </p>
      )}
      {standings.top.length === 0 ? (
        <p className="text-sm text-ink-2">{t('admin.league.standings.empty')}</p>
      ) : (
        <div className="-mx-2 overflow-x-auto">
          <Table>
            <thead>
              <tr className="border-b border-line-subtle">
                <Th className="w-8">#</Th>
                <Th>{t('seasons.standings.team')}</Th>
                <Th align="right">{t('seasons.standings.played')}</Th>
                <Th align="right">{t('seasons.standings.wins')}</Th>
                <Th align="right">{t('seasons.standings.losses')}</Th>
                <Th align="right">{t('admin.league.standings.points')}</Th>
                <Th align="right" className="hidden sm:table-cell">
                  {t('admin.league.standings.form')}
                </Th>
              </tr>
            </thead>
            <tbody>
              {standings.top.map((r) => (
                <tr key={r.teamId} className="border-b border-line-subtle last:border-b-0">
                  <Td className="py-2 text-ink-3">{r.rank}</Td>
                  <Td className="py-2">
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <TeamAvatar team={r.team} size={24} />
                      <span className="truncate font-medium">{r.team.name}</span>
                      {r.qualified && (
                        <span className="h-1.5 w-1.5 rounded-full bg-accent-green" title={t('admin.league.standings.qualified')} />
                      )}
                    </span>
                  </Td>
                  <Td align="right" className="py-2">{r.played}</Td>
                  <Td align="right" className="py-2 text-accent-green">{r.wins}</Td>
                  <Td align="right" className="py-2 text-accent-red">{r.losses}</Td>
                  <Td align="right" className="py-2 font-semibold">{r.points}</Td>
                  <Td align="right" className="hidden py-2 sm:table-cell">
                    <FormPills form={r.form} t={t} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
      {season.slug && <p className="mt-3 text-[11px] text-ink-3">{t('admin.league.standings.hint')}</p>}
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
          <Link href="/dashboard/forum" target="_blank" className={linkCls}>
            {t('admin.league.announce.feed')} <ExternalLink size={12} />
          </Link>
        }
      />
      <form onSubmit={submit} className="space-y-3">
        <Input
          className="!py-2 text-sm"
          value={title}
          maxLength={200}
          placeholder={t('admin.league.announce.titlePlaceholder')}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
          required
        />
        {preview ? (
          <div className="min-h-[7rem] rounded border border-line-subtle bg-surface-2/60 p-3">
            {content.trim() ? (
              <MarkdownContent content={content} format="markdown" />
            ) : (
              <p className="text-xs text-ink-3">{t('admin.league.announce.previewEmpty')}</p>
            )}
          </div>
        ) : (
          <Textarea
            className="!py-2 min-h-[7rem] font-mono text-xs"
            value={content}
            rows={5}
            placeholder={t('admin.league.announce.contentPlaceholder')}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
            required
          />
        )}
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-ink-2">
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
  const { can } = useCan();
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
      <p className="text-xs text-ink-2">{t('admin.league.recompute.hint')}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {can('league.recompute') && (
          <Button size="sm" variant="outline" onClick={run} disabled={running} loading={running}>
            <RefreshCw size={14} /> {t('admin.league.recompute.action')}
          </Button>
        )}
        <span className="text-[11px] text-ink-3 num">
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
  const { canOpen } = useCan();
  const { sponsors } = overview;
  const manage = canOpen('/admin/sponsors');
  return (
    <Card className="!p-5">
      <WidgetTitle
        icon={<Handshake size={16} />}
        title={t('admin.league.sponsors.title')}
        action={
          manage ? (
            <Link href="/admin/sponsors" className={linkCls}>
              {t('admin.league.manage')} <ArrowRight size={12} />
            </Link>
          ) : undefined
        }
      />
      {manage && sponsors.requestsNew > 0 && (
        <Link
          href="/admin/sponsors?tab=requests"
          className="mb-3 flex items-center justify-between rounded border border-accent-gold/40 bg-accent-gold/10 px-3 py-2 text-xs font-medium text-accent-gold hover:bg-accent-gold/15"
        >
          {t('admin.league.sponsors.requests', { n: sponsors.requestsNew })} <ArrowRight size={12} />
        </Link>
      )}
      {sponsors.total === 0 ? (
        <p className="text-sm text-ink-2">{t('admin.league.sponsors.empty')}</p>
      ) : (
        <div className="space-y-3">
          {sponsors.tiers.map((tier) => {
            const list = sponsors.byTier[tier] ?? [];
            if (!list.length) return null;
            return (
              <div key={tier}>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">
                  {t('sponsors.tier.' + tier)} <span className="num">({list.length})</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {list.map((s) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line-subtle bg-surface-2 px-2 py-1 text-xs text-ink-1"
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
  const { canOpen } = useCan();
  const { stream } = overview;
  const state = stream.live ? 'live' : stream.connected ? 'connected' : stream.configured ? 'configured' : 'missing';
  const variant = { live: 'live', connected: 'green', configured: 'blue', missing: 'outline' }[state];
  return (
    <Card className="!p-5">
      <WidgetTitle
        icon={<Radio size={16} />}
        title={t('admin.league.stream.title')}
        action={
          canOpen('/admin/stream') ? (
            <Link href="/admin/stream" className={linkCls}>
              {t('admin.league.manage')} <ArrowRight size={12} />
            </Link>
          ) : undefined
        }
      />
      <div className="flex items-center gap-3">
        <Badge variant={variant} size="md">
          {t('admin.league.stream.' + state)}
        </Badge>
        <div className="min-w-0 text-xs text-ink-2">
          {stream.channel && <p className="truncate">{stream.channel}</p>}
          {stream.live && stream.liveTitle && <p className="truncate font-medium text-ink-1">{stream.liveTitle}</p>}
        </div>
      </div>
    </Card>
  );
}

export function AwardsWidget({ overview }: { overview: LeagueOverview }) {
  const t = useT();
  const { canOpen } = useCan();
  const { awards, podiums, season } = overview;
  const pct = awards.total ? Math.round((awards.filled / awards.total) * 100) : 0;
  return (
    <Card className="!p-5">
      <WidgetTitle
        icon={<Award size={16} />}
        title={t('admin.league.awards.title')}
        action={
          canOpen('/admin/awards') ? (
            <Link href={`/admin/awards?season=${encodeURIComponent(season.id)}`} className={linkCls}>
              {t('admin.league.manage')} <ArrowRight size={12} />
            </Link>
          ) : undefined
        }
      />
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-2">{t('admin.league.awards.coverage')}</span>
        <span className="font-display font-semibold num text-ink-1">
          {awards.filled}/{awards.total}
        </span>
      </div>
      <ProgressBar className="mt-2" value={pct} accent={pct >= 100 ? 'green' : 'gold'} label={t('admin.league.awards.coverage')} />
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <Badge variant={podiums.regular ? 'green' : 'outline'} size="sm">
          {t('admin.league.awards.podiumRegular')} · {t(podiums.regular ? 'admin.league.awards.set' : 'admin.league.awards.unset')}
        </Badge>
        <Badge variant={podiums.playoffs ? 'green' : 'outline'} size="sm">
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
