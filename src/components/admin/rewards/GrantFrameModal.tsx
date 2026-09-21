'use client';

import { useEffect, useState } from 'react';
import { Gift } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, avatarSrc } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { Button, Input } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import AvatarFrame from '@/components/game/AvatarFrame';
import { localName, type FrameDefDto } from '@/components/gamification/rewards/shared';
import UserPicker, { type PickedUser } from './UserPicker';

const SEASON = /^S\d{1,3}$/;

/** "Grant to a member": member, season variant (season frames), optional duration. */
export default function GrantFrameModal({
  frame,
  onClose,
  onDone,
}: {
  frame: FrameDefDto | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  const [users, setUsers] = useState<PickedUser[]>([]);
  const [variant, setVariant] = useState('');
  const [days, setDays] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!frame) return;
    setUsers([]);
    setVariant('');
    setDays('');
  }, [frame]);

  const daysNum = days.trim() ? Number(days) : null;
  const daysValid = daysNum === null || (Number.isInteger(daysNum) && daysNum >= 1 && daysNum <= 3650);
  const variantValid = !frame?.variantBySeason || SEASON.test(variant.trim());
  const canSubmit = !!frame && users.length === 1 && daysValid && variantValid;

  const submit = async () => {
    if (!frame || !canSubmit) return;
    setSaving(true);
    try {
      const res: any = await api.rewards.admin.grant({
        userId: users[0].id,
        frameId: frame.id,
        ...(frame.variantBySeason ? { variant: variant.trim() } : {}),
        ...(daysNum ? { days: daysNum } : {}),
      });
      toast.success(t(`rewards.admin.grant.done.${res?.action ?? 'create'}`, { name: users[0].username }));
      onDone();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const preview = frame ? (frame.variantBySeason && variantValid ? `${frame.id}:${variant.trim()}` : frame.id) : null;

  return (
    <Modal
      open={!!frame}
      onClose={saving ? () => {} : onClose}
      size="md"
      icon={<Gift size={20} />}
      title={t('rewards.admin.grant.title')}
      subtitle={frame ? localName(frame.name, lang) : undefined}
      closeLabel={t('common.close')}
    >
      {frame && (
        <div className="space-y-5">
          <div className="flex items-center gap-4 rounded-lg border border-line-subtle bg-surface-2/50 p-3">
            <AvatarFrame
              frame={preview}
              name={users[0]?.displayName || users[0]?.username || localName(frame.name, lang)}
              src={users[0]?.avatar ? avatarSrc(users[0].avatar, 144) : null}
              size={72}
              showBadge={false}
            />
            <div className="min-w-0 text-sm">
              <p className="font-semibold text-ink-1">{localName(frame.name, lang)}</p>
              <p className="text-xs text-ink-3">
                {frame.temporary ? t('rewards.admin.grant.defaultTemp') : t('rewards.admin.grant.defaultPermanent')}
              </p>
            </div>
          </div>

          <UserPicker id="grant-user" label={t('rewards.admin.grant.member')} value={users} onChange={setUsers} />

          {frame.variantBySeason && (
            <Input
              label={t('rewards.admin.grant.variant')}
              value={variant}
              onChange={(e: any) => setVariant(e.target.value.toUpperCase())}
              placeholder="S1"
              error={variant && !variantValid ? t('rewards.admin.grant.variantError') : undefined}
            />
          )}

          <Input
            type="number"
            min={1}
            max={3650}
            label={t('rewards.admin.grant.days')}
            value={days}
            onChange={(e: any) => setDays(e.target.value)}
            placeholder={t('rewards.admin.grant.daysPlaceholder')}
            error={!daysValid ? t('rewards.admin.grant.daysError') : undefined}
          />

          <div className="flex flex-col-reverse gap-2 border-t border-line-subtle pt-4 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={submit} loading={saving} disabled={!canSubmit}>
              <Gift size={15} />
              {t('rewards.admin.grant.submit')}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
