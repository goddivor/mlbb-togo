'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, CalendarPlus, Copy, Lock, Pencil, Plus, Repeat, Trash2, Users2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { Badge, Button, Card, EmptyState, LoadingSpinner, SectionTitle } from '@/components/ui';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { getFrame } from '@/components/game/frames';
import FrameThumb from '@/components/gamification/rewards/FrameThumb';
import { localName } from '@/components/gamification/rewards/shared';
import EventFormModal from './EventFormModal';
import type { AdminAchievement } from './AchievementsTab';
import { STATUS_VARIANT, conditionDef, type AdminRewardEvent } from './events';

type Pending = { kind: 'close' | 'delete'; event: AdminRewardEvent } | null;

/** Reward events (catalogue §6.5): list, create / edit, close now, next edition, eligibility counter. */
export default function EventsTab() {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const [events, setEvents] = useState<AdminRewardEvent[]>([]);
  const [achievements, setAchievements] = useState<AdminAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ event: AdminRewardEvent | null } | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [eligible, setEligible] = useState<Record<string, { eligible: number; scanned: number }>>({});

  const load = useCallback(
    () =>
      api.rewards.admin
        .events()
        .then((l: any) => setEvents(Array.isArray(l) ? l : []))
        .catch(() => setEvents([])),
    [],
  );

  useEffect(() => {
    Promise.all([
      load(),
      api.rewards.admin
        .achievements()
        .then((r: any) => setAchievements(Array.isArray(r?.achievements) ? r.achievements : []))
        .catch(() => setAchievements([])),
    ]).finally(() => setLoading(false));
  }, [load]);

  const fmt = (d: string) =>
    new Date(d).toLocaleString(lang === 'en' ? 'en-GB' : 'fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    });

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setBusy(null);
    }
  };

  const seedDefaults = () =>
    run('defaults', async () => {
      const res: any = await api.rewards.admin.seedDefaultEvents();
      const n = Array.isArray(res?.created) ? res.created.length : 0;
      toast.success(n ? t('rewards.admin.ev.defaultsDone', { n }) : t('rewards.admin.ev.defaultsNone'));
      await load();
    });

  const duplicate = (e: AdminRewardEvent) =>
    run(`dup:${e.id}`, async () => {
      await api.rewards.admin.duplicateEvent(e.id);
      toast.success(t('rewards.admin.ev.duplicated'));
      await load();
    });

  const countEligible = (e: AdminRewardEvent) =>
    run(`elig:${e.id}`, async () => {
      const res: any = await api.rewards.admin.eventEligible(e.id);
      setEligible((m) => ({ ...m, [e.id]: { eligible: Number(res?.eligible ?? 0), scanned: Number(res?.scanned ?? 0) } }));
    });

  const confirm = () => {
    if (!pending) return;
    const { kind, event } = pending;
    run(`${kind}:${event.id}`, async () => {
      if (kind === 'close') {
        const res: any = await api.rewards.admin.closeEvent(event.id);
        toast.success(t('rewards.admin.ev.closed', { n: Number(res?.awarded ?? 0) }));
      } else {
        await api.rewards.admin.deleteEvent(event.id);
        toast.success(t('rewards.admin.ev.deleted'));
      }
      setPending(null);
      await load();
    });
  };

  if (loading) return <LoadingSpinner size="lg" className="py-16" />;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <SectionTitle title={t('rewards.admin.ev.title')} description={t('rewards.admin.ev.desc')} size="sm" />
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="secondary" onClick={seedDefaults} loading={busy === 'defaults'}>
              <CalendarPlus size={15} />
              {t('rewards.admin.ev.defaults')}
            </Button>
            <Button onClick={() => setEditing({ event: null })}>
              <Plus size={15} />
              {t('rewards.admin.ev.new')}
            </Button>
          </div>
        </div>
      </Card>

      {events.length === 0 ? (
        <EmptyState icon={<CalendarClock size={26} />} title={t('rewards.admin.ev.empty')} className="!min-h-0 py-12" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {events.map((e) => {
            const frame = e.rewards?.frameId ? getFrame(e.rewards.frameId) : null;
            const elig = eligible[e.id];
            return (
              <Card key={e.id} className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-line-subtle bg-surface-2">
                    {frame ? (
                      <FrameThumb frame={e.rewards.frameId} size={48} label={localName(frame.name, lang)} />
                    ) : (
                      <CalendarClock size={22} className="text-ink-3" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-display text-base font-bold text-ink-1">{e.name}</h3>
                      <Badge variant={STATUS_VARIANT[e.status] ?? 'default'} size="sm">
                        {t(`rewards.admin.ev.status.${e.status}`)}
                      </Badge>
                      {e.recurrence === 'yearly' && (
                        <Badge variant="outline" size="sm">
                          <Repeat size={11} aria-hidden="true" />
                          {t('rewards.admin.ev.yearly')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-ink-3">
                      <code>{e.slug}</code>
                    </p>
                    <p className="mt-1 text-sm text-ink-2">
                      {t('rewards.admin.ev.window', { from: fmt(e.startsAt), to: fmt(e.endsAt) })}
                    </p>
                  </div>
                </div>

                <ul className="flex flex-wrap gap-1.5">
                  {e.conditions.map((c, i) => (
                    <li key={i} className="rounded bg-surface-2 px-2 py-1 text-xs text-ink-2">
                      {i > 0 && e.conditionMode === 'any' && (
                        <span className="mr-1 font-semibold uppercase text-ink-3">{t('rewards.event.or')}</span>
                      )}
                      {t(`rewards.event.cond.${c.type}`)}
                      {!conditionDef(c.type).single && <span className="num font-semibold text-ink-1"> × {c.count}</span>}
                      {c.scope && <span className="text-ink-3"> ({c.scope.slice(-6)})</span>}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2">
                  {e.rewards?.achievementId && (
                    <span>
                      {t('rewards.admin.ev.form.achievement')} :{' '}
                      <strong className="text-ink-1">{t(`achievement.${e.rewards.achievementId}`)}</strong>
                    </span>
                  )}
                  {frame && (
                    <span>
                      {localName(frame.name, lang)}
                      {e.rewards.frameDays ? ` · ${t('rewards.event.frameDays', { n: e.rewards.frameDays })}` : ''}
                    </span>
                  )}
                  {e.rewards?.xp > 0 && <span className="num font-semibold text-accent-gold">+{e.rewards.xp} XP</span>}
                  <span className="inline-flex items-center gap-1">
                    <Users2 size={12} aria-hidden="true" />
                    {t('rewards.admin.ev.awarded', { n: e.awarded ?? 0 })}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-line-subtle pt-3">
                  <button
                    type="button"
                    onClick={() => countEligible(e)}
                    className="mr-auto inline-flex items-center gap-1.5 text-xs text-ink-2 hover:text-primary"
                    disabled={busy === `elig:${e.id}`}
                  >
                    <Users2 size={13} aria-hidden="true" />
                    {t('rewards.admin.ev.eligible')} :{' '}
                    <strong className="num text-ink-1">
                      {elig
                        ? t('rewards.admin.ev.eligibleValue', elig)
                        : busy === `elig:${e.id}`
                          ? '…'
                          : t('rewards.admin.ev.eligibleCheck')}
                    </strong>
                  </button>
                  {e.status !== 'closed' && (
                    <Button size="sm" variant="secondary" onClick={() => setEditing({ event: e })}>
                      <Pencil size={13} />
                      {t('rewards.admin.ev.edit')}
                    </Button>
                  )}
                  {e.status !== 'closed' && e.status !== 'draft' && (
                    <Button size="sm" variant="secondary" onClick={() => setPending({ kind: 'close', event: e })}>
                      <Lock size={13} />
                      {t('rewards.admin.ev.close')}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => duplicate(e)} loading={busy === `dup:${e.id}`}>
                    <Copy size={13} />
                    {t('rewards.admin.ev.duplicate')}
                  </Button>
                  {e.status === 'draft' && (
                    <Button size="sm" variant="ghost" onClick={() => setPending({ kind: 'delete', event: e })}>
                      <Trash2 size={13} />
                      {t('rewards.admin.ev.delete')}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <EventFormModal
        open={!!editing}
        event={editing?.event ?? null}
        achievements={achievements}
        onClose={() => setEditing(null)}
        onSaved={load}
      />

      <ConfirmModal
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={confirm}
        danger={pending?.kind === 'delete'}
        loading={!!pending && busy === `${pending.kind}:${pending.event.id}`}
        title={pending?.kind === 'delete' ? t('rewards.admin.ev.deleteTitle') : t('rewards.admin.ev.closeTitle')}
        message={
          pending
            ? t(pending.kind === 'delete' ? 'rewards.admin.ev.deleteConfirm' : 'rewards.admin.ev.closeConfirm', {
                name: pending.event.name,
              })
            : ''
        }
        confirmLabel={pending?.kind === 'delete' ? t('rewards.admin.ev.delete') : t('rewards.admin.ev.close')}
        cancelLabel={t('rewards.admin.ev.form.cancel')}
      />
    </div>
  );
}
