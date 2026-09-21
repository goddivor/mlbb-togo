'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { RefreshCw, Scale, UserSearch } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, avatarSrc } from '@/lib/api';
import { cn } from '@/lib/helpers';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { Badge, Button, Card, EmptyState, Input, LoadingSpinner, SectionTitle, StatTile, Textarea } from '@/components/ui';
import ConfirmModal from '@/components/ui/ConfirmModal';
import AvatarFrame from '@/components/game/AvatarFrame';
import PlayerTitle from '@/components/gamification/PlayerTitle';
import {
  CountdownPill,
  countdownLabel,
  fmtDate,
  frameLabel,
  useNow,
  type Collection,
} from '@/components/gamification/rewards/shared';
import UserPicker, { type PickedUser } from './UserPicker';

/** One member: collection, XP correction (mandatory reason), recalculation. */
export default function PlayerTab() {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const now = useNow();
  const [picked, setPicked] = useState<PickedUser[]>([]);
  const [data, setData] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const user = picked[0] ?? null;

  const load = useCallback(async (id: string) => {
    setLoading(true);
    try {
      setData((await api.rewards.admin.userCollection(id)) as Collection);
    } catch (e: any) {
      setData(null);
      toast.error(e?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    setData(null);
    setAmount('');
    setReason('');
    if (user) load(user.id);
  }, [user, load]);

  const amountNum = Number(amount);
  const amountValid = amount.trim() !== '' && Number.isInteger(amountNum) && amountNum !== 0 && Math.abs(amountNum) <= 1_000_000;
  const reasonValid = reason.trim().length >= 3 && reason.trim().length <= 500;

  const correct = async () => {
    if (!user || !amountValid || !reasonValid) return;
    setSaving(true);
    try {
      const res: any = await api.rewards.admin.xpCorrection({ userId: user.id, amount: amountNum, reason: reason.trim() });
      toast.success(
        t('rewards.admin.xp.done', {
          before: Number(res?.previousXp ?? 0).toLocaleString(),
          after: Number(res?.xp ?? 0).toLocaleString(),
          level: res?.level ?? '—',
        }),
      );
      setConfirming(false);
      setAmount('');
      setReason('');
      await load(user.id);
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const recalculate = async () => {
    if (!user) return;
    setRecalculating(true);
    try {
      const res: any = await api.rewards.admin.recalculate(user.id);
      toast.success(
        t('rewards.admin.recalc.done', { achievements: res?.achievementsUnlocked ?? 0, frames: res?.framesGranted ?? 0 }),
      );
      await load(user.id);
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setRecalculating(false);
    }
  };

  const owned = data ? data.frames.flatMap((f) => f.entries.filter((e) => e.active).map((e) => ({ f, e }))) : [];
  const expired = data ? data.frames.flatMap((f) => f.entries.filter((e) => !e.active).map((e) => ({ f, e }))) : [];
  const name = user?.displayName || user?.username || '';

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle title={t('rewards.admin.player.title')} description={t('rewards.admin.player.desc')} size="sm" className="mb-4" />
        <div className="max-w-md">
          <UserPicker id="player-user" value={picked} onChange={setPicked} />
        </div>
      </Card>

      {!user ? (
        <EmptyState icon={<UserSearch size={26} />} title={t('rewards.admin.player.empty')} className="!min-h-0 py-12" />
      ) : loading || !data ? (
        <LoadingSpinner size="lg" className="py-16" />
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
            <Card>
              <div className="flex flex-col items-center gap-5 sm:flex-row">
                <AvatarFrame
                  frame={data.equippedFrame}
                  name={name}
                  src={user.avatar ? avatarSrc(user.avatar, 200) : null}
                  rank={user.gameRank}
                  avatarSize={72}
                />
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <Link href={`/dashboard/players/${user.id}`} className="font-display text-xl font-bold text-ink-1 hover:text-primary">
                    {name}
                  </Link>
                  <PlayerTitle id={data.equippedTitle} className="block" />
                  <p className="mt-1 text-xs text-ink-3">
                    {data.equippedFrame
                      ? frameLabel(t, owned.find((o) => o.e.key === data.equippedFrame)?.f.name, lang, data.equippedFrame.split(':')[1])
                      : t('rewards.collection.rankFrame')}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <StatTile label={t('progress.level')} value={data.level} accent="violet" align="center" />
                  <StatTile label={t('frames.title')} value={owned.length} accent="cyan" align="center" />
                  <StatTile label={t('rewards.tab.titles')} value={data.titles.filter((x) => x.unlocked).length} accent="gold" align="center" />
                </div>
              </div>
            </Card>

            <Card>
              <SectionTitle title={t('rewards.admin.player.owned', { n: owned.length })} size="sm" className="mb-4" />
              {owned.length === 0 ? (
                <p className="text-sm text-ink-3">{t('rewards.admin.player.noFrames')}</p>
              ) : (
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {owned.map(({ f, e }) => {
                    const left = countdownLabel(t, e.expiresAt, now);
                    return (
                      <li
                        key={e.key}
                        className={cn(
                          'flex items-center gap-3 rounded-lg border p-2.5',
                          data.equippedFrame === e.key ? 'border-primary/50 bg-primary/5' : 'border-line-subtle',
                        )}
                      >
                        <AvatarFrame frame={e.key} name={name} size={48} showBadge={false} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink-1">{frameLabel(t, f.name, lang, e.variant)}</p>
                          <p className="truncate text-[11px] text-ink-3">
                            {t(`rewards.source.${e.source}`)} · {fmtDate(e.unlockedAt, lang)}
                          </p>
                          {left && <CountdownPill label={left} className="mt-1" />}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              {expired.length > 0 && (
                <>
                  <p className="eyebrow mb-2 mt-5">{t('rewards.collection.expired')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {expired.map(({ f, e }) => (
                      <Badge key={e.key} variant="outline" size="sm">
                        {frameLabel(t, f.name, lang, e.variant)} · {fmtDate(e.expiredAt, lang)}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <SectionTitle
                eyebrow={t('rewards.admin.xp.eyebrow')}
                title={t('rewards.admin.xp.title')}
                description={t('rewards.admin.xp.desc')}
                size="sm"
                className="mb-4"
              />
              <div className="space-y-4">
                <Input
                  type="number"
                  step={1}
                  label={t('rewards.admin.xp.amount')}
                  value={amount}
                  onChange={(e: any) => setAmount(e.target.value)}
                  placeholder="-500"
                  error={amount && !amountValid ? t('rewards.admin.xp.amountError') : undefined}
                />
                <Textarea
                  label={t('rewards.admin.xp.reason')}
                  value={reason}
                  onChange={(e: any) => setReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder={t('rewards.admin.xp.reasonPlaceholder')}
                  error={reason && !reasonValid ? t('rewards.admin.xp.reasonError') : undefined}
                />
                <Button className="w-full" onClick={() => setConfirming(true)} disabled={!amountValid || !reasonValid}>
                  <Scale size={15} />
                  {t('rewards.admin.xp.submit')}
                </Button>
              </div>
            </Card>

            <Card>
              <SectionTitle title={t('rewards.admin.recalc.title')} description={t('rewards.admin.recalc.desc')} size="sm" className="mb-4" />
              <Button variant="secondary" className="w-full" onClick={recalculate} loading={recalculating}>
                <RefreshCw size={15} />
                {t('rewards.admin.recalc.submit')}
              </Button>
            </Card>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={correct}
        variant="warning"
        loading={saving}
        title={t('rewards.admin.xp.confirmTitle')}
        message={t('rewards.admin.xp.confirmMessage', { amount: amountValid ? (amountNum > 0 ? `+${amountNum}` : amountNum) : '', name })}
        confirmLabel={t('rewards.admin.xp.submit')}
        cancelLabel={t('common.cancel')}
        closeLabel={t('common.close')}
      />
    </div>
  );
}
