'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Crown, Hourglass, Power } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, avatarSrc } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { Button, Card, EmptyState, Input, LoadingSpinner, SectionTitle } from '@/components/ui';
import ConfirmModal from '@/components/ui/ConfirmModal';
import AvatarFrame from '@/components/game/AvatarFrame';
import { getFrame } from '@/components/game/frames';
import {
  CountdownPill,
  countdownLabel,
  fmtDate,
  frameLabel,
  useNow,
  type FrameEntry,
} from '@/components/gamification/rewards/shared';
import { previousWeekKey } from '@/lib/periods';
import UserPicker, { type PickedUser } from './UserPicker';

type TempRow = FrameEntry & { user: PickedUser | null };

const WEEK = /^\d{4}-W\d{2}$/;

/** Active temporary frames (end now) and the weekly MVP override. */
export default function TemporaryTab() {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const now = useNow();
  const [rows, setRows] = useState<TempRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState<TempRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [mvp, setMvp] = useState<PickedUser[]>([]);
  const [week, setWeek] = useState('');
  const [savingMvp, setSavingMvp] = useState(false);

  const load = useCallback(
    () =>
      api.rewards.admin
        .temporary()
        .then((l: any) => setRows(Array.isArray(l) ? l : []))
        .catch(() => setRows([])),
    [],
  );

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const endNow = async () => {
    if (!ending) return;
    setBusy(true);
    try {
      await api.rewards.admin.end({
        userId: ending.user?.id ?? '',
        frameId: ending.frameId,
        ...(ending.variant ? { variant: ending.variant } : {}),
      });
      toast.success(t('rewards.admin.temp.ended'));
      setEnding(null);
      await load();
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const weekValid = !week.trim() || WEEK.test(week.trim());

  const saveMvp = async () => {
    if (!mvp.length || !weekValid) return;
    setSavingMvp(true);
    try {
      const res: any = await api.rewards.admin.setWeeklyMvp({
        userId: mvp[0].id,
        ...(week.trim() ? { week: week.trim() } : {}),
      });
      toast.success(
        res?.changed === false
          ? t('rewards.admin.mvp.unchanged', { week: res?.period ?? '' })
          : t('rewards.admin.mvp.done', { name: mvp[0].username, week: res?.period ?? '' }),
      );
      setMvp([]);
      setWeek('');
      await load();
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setSavingMvp(false);
    }
  };

  const endingName = ending ? frameLabel(t, getFrame(ending.frameId)?.name, lang, ending.variant) : '';

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <SectionTitle
          eyebrow={t('frames.temporary')}
          title={t('rewards.admin.temp.title', { n: rows.length })}
          description={t('rewards.admin.temp.desc')}
          className="mb-5"
        />
        {loading ? (
          <LoadingSpinner size="lg" className="py-12" />
        ) : rows.length === 0 ? (
          <EmptyState icon={<Hourglass size={26} />} title={t('rewards.admin.temp.none')} className="!min-h-0 py-10" />
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => {
              const name = r.user?.displayName || r.user?.username || '—';
              const left = countdownLabel(t, r.expiresAt, now);
              return (
                <li
                  key={`${r.user?.id}-${r.key}`}
                  className="flex flex-col gap-3 rounded-lg border border-line-subtle bg-surface-1 p-3 sm:flex-row sm:items-center dark:bg-surface-2/40"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <AvatarFrame
                      frame={r.key}
                      name={name}
                      src={r.user?.avatar ? avatarSrc(r.user.avatar, 96) : null}
                      avatarSize={40}
                      rank={r.user?.gameRank}
                      showBadge={false}
                    />
                    <div className="min-w-0">
                      {r.user ? (
                        <Link href={`/dashboard/players/${r.user.id}`} className="block truncate text-sm font-semibold text-ink-1 hover:text-primary">
                          {name}
                        </Link>
                      ) : (
                        <p className="text-sm font-semibold text-ink-1">{name}</p>
                      )}
                      <p className="truncate text-xs text-ink-2">{frameLabel(t, getFrame(r.frameId)?.name, lang, r.variant)}</p>
                      <p className="text-[11px] text-ink-3 num">
                        {r.expiresAt
                          ? t('rewards.admin.temp.until', { date: fmtDate(r.expiresAt, lang) })
                          : t('rewards.countdown.nextChampion')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    {left ? <CountdownPill label={left} /> : !r.expiresAt && <CountdownPill label={t('rewards.countdown.nextChampion')} />}
                    <Button size="sm" variant="outline" onClick={() => setEnding(r)} disabled={!r.user}>
                      <Power size={14} />
                      {t('rewards.admin.temp.end')}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        <SectionTitle
          eyebrow={t('rewards.admin.mvp.eyebrow')}
          title={t('rewards.admin.mvp.title')}
          description={t('rewards.admin.mvp.desc')}
          size="sm"
          className="mb-5"
        />
        <div className="space-y-4">
          <UserPicker id="mvp-user" label={t('rewards.admin.mvp.member')} value={mvp} onChange={setMvp} />
          <Input
            label={t('rewards.admin.mvp.week')}
            value={week}
            onChange={(e: any) => setWeek(e.target.value.toUpperCase())}
            placeholder={previousWeekKey()}
            error={!weekValid ? t('rewards.admin.mvp.weekError') : undefined}
          />
          <p className="-mt-2 text-[11px] text-ink-3">{t('rewards.admin.mvp.weekHint')}</p>
          <Button className="w-full" onClick={saveMvp} loading={savingMvp} disabled={!mvp.length || !weekValid}>
            <Crown size={15} />
            {t('rewards.admin.mvp.submit')}
          </Button>
        </div>
      </Card>

      <ConfirmModal
        open={!!ending}
        onClose={() => setEnding(null)}
        onConfirm={endNow}
        variant="danger"
        loading={busy}
        title={t('rewards.admin.temp.confirmTitle')}
        message={t('rewards.admin.temp.confirmMessage', {
          frame: endingName,
          name: ending?.user?.displayName || ending?.user?.username || '',
        })}
        confirmLabel={t('rewards.admin.temp.end')}
        cancelLabel={t('common.cancel')}
        closeLabel={t('common.close')}
      />
    </div>
  );
}
