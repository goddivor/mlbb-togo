'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { CalendarClock, ClipboardList, Megaphone, RotateCcw, Send, Trophy, Users } from 'lucide-react';
import { api, avatarSrc } from '@/lib/api';
import { useT } from '@/lib/i18n';
import {
  Badge,
  Button,
  Card,
  PageHeader,
  SectionCard,
  Select,
  EmptyState,
  Skeleton,
  StatCard,
  Tabs,
  Textarea,
} from '@/components/ui';
import { fadeUp, stagger, still } from '@/lib/motion';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import RoleIcon from '@/components/game/RoleIcon';
import RoleSelect from '@/components/game/RoleSelect';
import RankBadge, { hasRankBadge } from '@/components/game/RankBadge';
import toast from 'react-hot-toast';

const LANES = ['roam', 'jungle', 'mid', 'exp', 'gold'];

/**
 * Rank ladder, mirrored from decodeRank() on the API: each entry is the highest
 * in-game level of that tier, which is exactly what the `rankLevel` filter
 * expects ("campaigns a player of that tier qualifies for").
 */
const RANK_TIERS: { level: number; label: string }[] = [
  { level: 10, label: 'Warrior' },
  { level: 25, label: 'Elite' },
  { level: 45, label: 'Master' },
  { level: 75, label: 'Grandmaster' },
  { level: 105, label: 'Epic' },
  { level: 135, label: 'Legend' },
  { level: 160, label: 'Mythic' },
  { level: 185, label: 'Mythic Honor' },
  { level: 235, label: 'Mythic Glory' },
  { level: 300, label: 'Mythic Immortal' },
];

const AVAILABILITY = ['casual', 'regular', 'competitive'];

/** Status pill colours, aligned with the life cycle served by /recruitment/meta. */
const STATUS_VARIANT: Record<string, string> = {
  pending: 'gold',
  shortlisted: 'blue',
  accepted: 'green',
  rejected: 'red',
  withdrawn: 'default',
};

/** Statuses that still have an answer coming: the campaign is "already applied to". */
const ACTIVE_STATUSES = ['pending', 'shortlisted'];

type Filters = { role: string; rankLevel: string; availability: string };

const EMPTY_FILTERS: Filters = { role: '', rankLevel: '', availability: '' };

export default function RecruitmentPage() {
  const t = useT();
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<'campaigns' | 'mine'>('campaigns');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [myApps, setMyApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apply, setApply] = useState<any | null>(null);
  const [applyForm, setApplyForm] = useState({ role: '', message: '', availability: '' });
  const [sending, setSending] = useState(false);
  const [toWithdraw, setToWithdraw] = useState<any | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const fmtDate = useCallback(
    (value?: string | null) =>
      value ? new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '',
    [],
  );

  const load = useCallback(async (f: Filters) => {
    try {
      const [list, mine] = await Promise.all([
        api.recruitment.listOpen({
          role: f.role || undefined,
          rankLevel: f.rankLevel ? Number(f.rankLevel) : undefined,
          availability: f.availability || undefined,
        }),
        // status=all: the tracking tab shows the whole history, not only the
        // applications still waiting for an answer.
        api.recruitment.mine({ status: 'all' }),
      ]);
      setCampaigns(Array.isArray(list) ? list : []);
      setMyApps(Array.isArray(mine) ? mine : []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load(filters);
      setLoading(false);
    })();
  }, [filters, load]);

  const appliedIds = useMemo(
    () => new Set(myApps.filter((a) => ACTIVE_STATUSES.includes(a.status)).map((a) => a.recruitmentId)),
    [myApps],
  );

  const hasFilters = filters.role !== '' || filters.rankLevel !== '' || filters.availability !== '';

  const openApply = (c: any) => {
    setApply(c);
    setApplyForm({ role: c.slots?.[0]?.role || '', message: '', availability: c.availability || '' });
  };

  const submitApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apply) return;
    setSending(true);
    try {
      await api.recruitment.apply(apply.id, {
        role: applyForm.role || undefined,
        message: applyForm.message.trim() || undefined,
        availability: applyForm.availability || undefined,
      });
      toast.success(t('recruitment.applySent'));
      setApply(null);
      await load(filters);
    } catch (err: any) {
      toast.error(err?.message || t('common.error'));
    } finally {
      setSending(false);
    }
  };

  const confirmWithdraw = async () => {
    if (!toWithdraw) return;
    setWithdrawing(true);
    try {
      await api.recruitment.withdraw(toWithdraw.id);
      toast.success(t('recruitment.withdrawDone'));
      setToWithdraw(null);
      await load(filters);
    } catch (err: any) {
      toast.error(err?.message || t('common.error'));
    } finally {
      setWithdrawing(false);
    }
  };

  const slotRoles = useMemo(() => (apply?.slots || []).map((s: any) => s.role), [apply]);

  const openSlots = useMemo(
    () => campaigns.reduce((n, c) => n + (c.slots || []).reduce((m: number, s: any) => m + (Number(s.quantity) || 1), 0), 0),
    [campaigns],
  );
  const activeApps = useMemo(() => myApps.filter((a) => ACTIVE_STATUSES.includes(a.status)).length, [myApps]);
  const listVariants = reduce ? still : stagger(0.04);
  const itemVariants = reduce ? still : fadeUp;

  const teamAvatar = (team: any, size: string) =>
    team.image ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatarSrc(team.image)} alt={team.name} referrerPolicy="no-referrer" className={`${size} shrink-0 rounded-md border border-line-subtle object-cover`} />
    ) : (
      <div className={`${size} flex shrink-0 items-center justify-center rounded-md cut-corners-sm bg-gradient-to-br from-accent-violet to-primary font-display font-bold text-on-primary`}>
        {team.name?.[0]?.toUpperCase() || 'T'}
      </div>
    );

  const skeletonGrid = (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 shrink-0 rounded-md" />
            <Skeleton lines={2} className="flex-1" />
          </div>
          <Skeleton lines={3} className="mt-4" />
        </Card>
      ))}
    </div>
  );

  const statusBadge = (status: string) => (
    <Badge variant={STATUS_VARIANT[status] ?? 'default'} size="sm">
      {t('recruitment.status.' + status)}
    </Badge>
  );

  const requirementBadges = (c: any) => (
    <>
      {c.minRankLabel && (
        <Badge variant="gold" size="sm" className="gap-1">
          {hasRankBadge(c.minRankLabel) && <RankBadge rank={c.minRankLabel} size={14} />}
          {t('recruitment.minRank')} : {c.minRankLabel}
        </Badge>
      )}
      {c.availability && (
        <Badge variant="blue" size="sm" className="gap-1">
          <CalendarClock size={12} /> {t('recruitment.availability.' + c.availability)}
        </Badge>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('recruitment.eyebrow')}
        icon={<Megaphone size={22} />}
        title={t('recruitment.title')}
        subtitle={t('recruitment.subtitle')}
        variant="purple"
      >
        <StatCard label={t('recruitment.kpi.campaigns')} value={campaigns.length} icon={<Megaphone size={18} />} accent="violet" />
        <StatCard label={t('recruitment.kpi.slots')} value={openSlots} icon={<Users size={18} />} accent="cyan" />
        <StatCard label={t('recruitment.kpi.active')} value={activeApps} icon={<ClipboardList size={18} />} accent="gold" />
      </PageHeader>

      <div className="overflow-x-auto whitespace-nowrap">
        <Tabs
          variant="underline"
          tabs={[
            { id: 'campaigns', label: t('recruitment.tab.campaigns'), icon: Megaphone, count: campaigns.length },
            { id: 'mine', label: t('recruitment.tab.mine'), icon: ClipboardList, count: myApps.length },
          ]}
          active={tab}
          onChange={(id: any) => setTab(id)}
        />
      </div>
      {tab === 'mine' && myApps.length > 0 && (
        <p className="text-sm text-ink-2">{t('recruitment.mineHint')}</p>
      )}

      {tab === 'campaigns' && (
        <>
          {/* Advanced filters: lane, rank, availability */}
          <SectionCard className="!p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilters((f) => ({ ...f, role: '' }))}
                className={`rounded border px-3 py-1.5 text-xs font-semibold transition-colors duration-fast ${filters.role === '' ? 'border-primary bg-primary/10 text-primary' : 'border-line-subtle bg-surface-2 text-ink-2 hover:border-line-strong hover:text-ink-1'}`}
              >
                {t('recruitment.filterAll')}
              </button>
              {LANES.map((l) => (
                <button
                  key={l}
                  onClick={() => setFilters((f) => ({ ...f, role: l }))}
                  className={`inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-semibold transition-colors duration-fast ${filters.role === l ? 'border-primary bg-primary/10 text-primary' : 'border-line-subtle bg-surface-2 text-ink-2 hover:border-line-strong hover:text-ink-1'}`}
                >
                  <RoleIcon role={l} size={14} /> {t('lane.' + l)}
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Select
                label={t('recruitment.filterRank')}
                value={filters.rankLevel}
                onChange={(e: any) => setFilters((f) => ({ ...f, rankLevel: e.target.value }))}
                options={[
                  { value: '', label: t('recruitment.filterAnyRank') },
                  ...RANK_TIERS.map((r) => ({ value: String(r.level), label: r.label })),
                ]}
              />
              <Select
                label={t('recruitment.filterAvailability')}
                value={filters.availability}
                onChange={(e: any) => setFilters((f) => ({ ...f, availability: e.target.value }))}
                options={[
                  { value: '', label: t('recruitment.filterAnyAvailability') },
                  ...AVAILABILITY.map((a) => ({ value: a, label: t('recruitment.availability.' + a) })),
                ]}
              />
              <div className="flex items-end justify-between gap-3">
                <span className="num pb-3 text-sm text-ink-2">
                  {t('recruitment.resultCount', { count: campaigns.length })}
                </span>
                {hasFilters && (
                  <Button size="sm" variant="ghost" onClick={() => setFilters(EMPTY_FILTERS)}>
                    <RotateCcw size={14} /> {t('recruitment.filtersReset')}
                  </Button>
                )}
              </div>
            </div>
          </SectionCard>

          {loading ? (
            skeletonGrid
          ) : campaigns.length === 0 ? (
            <EmptyState icon={<Megaphone size={28} />} title={t('recruitment.none')} />
          ) : (
            <motion.div variants={listVariants} initial="hidden" animate="visible" className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {campaigns.map((c) => {
                const team = c.team || {};
                const applied = appliedIds.has(c.id);
                return (
                  <motion.div key={c.id} variants={itemVariants} className="flex">
                  <Card hover accent={applied ? 'green' : 'violet'} className="flex w-full flex-col !p-5">
                    <Link href={`/teams/${c.teamId}`} className="mb-4 flex items-center gap-3">
                      {teamAvatar(team, 'h-12 w-12')}
                      <div className="min-w-0">
                        <p className="truncate font-display text-base font-bold tracking-tight2 text-ink-1">{team.name}</p>
                        <p className="text-xs text-ink-3">{t('recruitment.recruits')}</p>
                      </div>
                    </Link>

                    <div className="mb-3 flex flex-wrap gap-2">
                      {(c.slots || []).map((s: any) => (
                        <Badge key={s.role} variant="purple" size="md" className="gap-1">
                          <RoleIcon role={s.role} size={14} /> {t('lane.' + s.role)}
                          {s.quantity > 1 && <span className="ml-0.5 opacity-80">×{s.quantity}</span>}
                        </Badge>
                      ))}
                    </div>

                    <div className="mb-3 flex flex-wrap gap-2">
                      {c.minRankLabel || c.availability ? (
                        requirementBadges(c)
                      ) : (
                        <Badge size="sm">{t('recruitment.minRankAny')}</Badge>
                      )}
                    </div>

                    {c.message && <p className="mb-3 whitespace-pre-line text-sm text-ink-2">{c.message}</p>}

                    <div className="mt-auto border-t border-line-subtle pt-3">
                      {applied ? (
                        <Badge variant="green" size="md" dot>{t('recruitment.applied')}</Badge>
                      ) : (
                        <Button size="sm" onClick={() => openApply(c)}>
                          <Send size={14} /> {t('recruitment.apply')}
                        </Button>
                      )}
                    </div>
                  </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </>
      )}

      {/* Application tracking, candidate side */}
      {tab === 'mine' && (
        loading ? (
          skeletonGrid
        ) : myApps.length === 0 ? (
          <EmptyState icon={<ClipboardList size={28} />} title={t('recruitment.mineNone')} description={t('recruitment.mineHint')} />
        ) : (
          <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-3">
            {myApps.map((a) => {
              const team = a.team || {};
              const closed = a.recruitment && a.recruitment.status !== 'open';
              const accent = ({ accepted: 'green', rejected: 'red', shortlisted: 'cyan', pending: 'gold' } as const)[a.status as string];
              return (
                <motion.div key={a.id} variants={itemVariants}>
                <Card hover accent={accent} className="!p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link href={`/teams/${a.teamId}`} className="flex min-w-0 items-center gap-3">
                      {teamAvatar(team, 'h-10 w-10')}
                      <span className="truncate font-display text-base font-bold tracking-tight2 text-ink-1">{team.name}</span>
                    </Link>

                    {a.role ? (
                      <Badge variant="purple" size="sm" className="gap-1">
                        <RoleIcon role={a.role} size={12} /> {t('lane.' + a.role)}
                      </Badge>
                    ) : (
                      <Badge size="sm">{t('recruitment.noRole')}</Badge>
                    )}

                    {a.availability && (
                      <Badge variant="blue" size="sm" className="gap-1">
                        <CalendarClock size={12} /> {t('recruitment.availability.' + a.availability)}
                      </Badge>
                    )}

                    <div className="ml-auto flex items-center gap-2">
                      {closed && <Badge size="sm">{t('recruitment.campaignClosed')}</Badge>}
                      {statusBadge(a.status)}
                      {a.canWithdraw && (
                        <Button size="sm" variant="ghost" onClick={() => setToWithdraw(a)}>
                          {t('recruitment.withdraw')}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-3 num">
                    <span>{t('recruitment.sentOn', { date: fmtDate(a.createdAt) })}</span>
                    {a.decidedAt && <span>{t('recruitment.updatedOn', { date: fmtDate(a.decidedAt) })}</span>}
                  </div>

                  {a.message && (
                    <p className="mt-2 whitespace-pre-line text-sm text-ink-2">{a.message}</p>
                  )}

                  {a.decisionNote && (
                    <p className="mt-2 rounded bg-surface-2 p-3 text-sm text-ink-2">
                      <span className="font-medium text-ink-1">{t('recruitment.decisionNote')} : </span>
                      {a.decisionNote}
                    </p>
                  )}
                </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )
      )}

      {/* Application modal */}
      <Modal
        open={!!apply}
        onClose={() => setApply(null)}
        closeLabel={t('common.close')}
        icon={<Send size={18} />}
        title={t('recruitment.applyTitle')}
        subtitle={apply?.team?.name || ''}
      >
        <form onSubmit={submitApply} className="space-y-4">
          {apply && (apply.minRankLabel || apply.availability) && (
            <div className="flex flex-wrap items-center gap-2 rounded bg-surface-2 p-3">
              <Trophy size={14} className="text-accent-gold" />
              {requirementBadges(apply)}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-1">{t('recruitment.applyRole')}</label>
            <RoleSelect
              value={applyForm.role}
              onChange={(v) => setApplyForm({ ...applyForm, role: v })}
              options={slotRoles.length ? slotRoles : LANES}
              noneLabel={t('admin.esport.noRole')}
              labelFor={(l) => t('lane.' + l)}
            />
          </div>
          <Select
            label={t('recruitment.applyAvailability')}
            value={applyForm.availability}
            onChange={(e: any) => setApplyForm({ ...applyForm, availability: e.target.value })}
            options={[
              { value: '', label: t('recruitment.availabilityNone') },
              ...AVAILABILITY.map((a) => ({ value: a, label: t('recruitment.availability.' + a) })),
            ]}
          />
          <Textarea
            label={t('recruitment.applyMessage')}
            value={applyForm.message}
            onChange={(e: any) => setApplyForm({ ...applyForm, message: e.target.value })}
          />
          <div className="flex gap-2 pt-1">
            <Button size="sm" type="submit" loading={sending} disabled={sending}>
              <Send size={15} /> {t('recruitment.applySubmit')}
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setApply(null)}>
              {t('admin.esport.cancel')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!toWithdraw}
        onClose={() => setToWithdraw(null)}
        onConfirm={confirmWithdraw}
        variant="danger"
        title={t('recruitment.withdrawTitle')}
        message={t('recruitment.withdrawConfirm')}
        confirmLabel={t('recruitment.withdraw')}
        cancelLabel={t('admin.esport.cancel')}
        closeLabel={t('common.close')}
        loading={withdrawing}
      />
    </div>
  );
}
