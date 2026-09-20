'use client';

import { useEffect, useState } from 'react';
import { Handshake } from 'lucide-react';
import { Button, Select } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import { useT } from '@/lib/i18n';
import { api } from '@/lib/api';
import type { FeedPost } from './PostCard';

/** Admin: attach a sponsor to a post (or remove the sponsoring). */
export default function SponsorPickerModal({
  post,
  open,
  onClose,
  onSave,
  saving,
}: {
  post: FeedPost | null;
  open: boolean;
  onClose: () => void;
  onSave: (patch: { isSponsored: boolean; sponsorId: string | null }) => void;
  saving: boolean;
}) {
  const t = useT();
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [sponsorId, setSponsorId] = useState('');

  useEffect(() => {
    if (!open) return;
    setSponsorId(post?.sponsorId ?? '');
    api.esport.sponsors().then((l: any) => setSponsors(Array.isArray(l) ? l : []));
  }, [open, post?.sponsorId]);

  const selected = sponsors.find((s) => s.id === sponsorId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('comm.admin.pickSponsor')}
      icon={<Handshake size={20} />}
      size="sm"
      closeLabel={t('comm.composer.cancel')}
    >
      <div className="space-y-4">
        <Select
          label={t('comm.composer.sponsor')}
          value={sponsorId}
          onChange={(e: any) => setSponsorId(e.target.value)}
        >
          <option value="">{t('comm.composer.noSponsor')}</option>
          {sponsors.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name || s.url || s.id}</option>
          ))}
        </Select>
        {selected?.logo && (
          <div className="flex items-center justify-center rounded-lg border border-line-subtle bg-surface-2 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected.logo} alt={selected.name ?? ''} className="h-12 object-contain" />
          </div>
        )}
        <div className="flex gap-3 pt-2">
          {post?.isSponsored && (
            <Button
              variant="outline"
              loading={saving}
              onClick={() => onSave({ isSponsored: false, sponsorId: null })}
              className="flex-1"
            >
              {t('comm.admin.unsponsor')}
            </Button>
          )}
          <Button
            loading={saving}
            onClick={() => onSave({ isSponsored: true, sponsorId: sponsorId || null })}
            className="flex-1"
          >
            {t('comm.admin.sponsor')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
