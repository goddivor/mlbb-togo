'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Badge, Button, Input } from '@/components/ui';
import { useT } from '@/lib/i18n';
import ModeSwitch from './ModeSwitch';
import type { PickBanMode } from '@/lib/pickban';

export default function CreateDraftModal({
  open,
  onClose,
  onCreate,
  defaultMode = 'ranked',
  lockMode = false,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; mode: PickBanMode }) => Promise<void>;
  defaultMode?: PickBanMode;
  // When saving a local draft the mode is fixed by the moves already played.
  lockMode?: boolean;
  title?: string;
}) {
  const t = useT();
  const [name, setName] = useState('');
  const [mode, setMode] = useState<PickBanMode>(defaultMode);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreate({ name: name.trim(), mode: lockMode ? defaultMode : mode });
      setName('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title ?? t('pickban.new')} size="sm" closeLabel={t('common.cancel')}>
      <form onSubmit={submit} className="space-y-5">
        <Input
          label={t('pickban.name')}
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          placeholder={t('pickban.namePlaceholder')}
          maxLength={60}
          autoFocus
        />
        <div>
          <p className="mb-2.5 block text-black dark:text-white">{t('pickban.mode')}</p>
          {lockMode ? (
            <Badge variant={defaultMode === 'ranked' ? 'blue' : 'purple'}>{t(`pickban.${defaultMode}`)}</Badge>
          ) : (
            <ModeSwitch value={mode} onChange={setMode} />
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={loading}>
            {t('pickban.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
