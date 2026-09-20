'use client';

import { useEffect, useMemo, useState } from 'react';
import { PenSquare, Plus, X, ImageIcon, Lock } from 'lucide-react';
import { Button, Input, Select, Textarea } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import { useT } from '@/lib/i18n';
import { api } from '@/lib/api';
import { cn } from '@/lib/helpers';
import toast from 'react-hot-toast';
import MarkdownContent from './MarkdownContent';
import {
  FEED_CATEGORIES,
  STAFF_ONLY_CATEGORIES,
  MAX_POST_IMAGES,
  isHttpUrl,
  type FeedCategory,
} from './constants';

export default function PostComposerModal({
  open,
  onClose,
  onCreated,
  isStaff,
  defaultCategory,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (post: any) => void;
  isStaff: boolean;
  defaultCategory?: string;
}) {
  const t = useT();
  const [category, setCategory] = useState<FeedCategory>('community');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState('');
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [sponsorId, setSponsorId] = useState('');
  const [isSponsored, setIsSponsored] = useState(false);
  const [saving, setSaving] = useState(false);

  const allowedCategories = useMemo(
    () => FEED_CATEGORIES.filter((c) => isStaff || !STAFF_ONLY_CATEGORIES.includes(c)),
    [isStaff],
  );

  useEffect(() => {
    if (!open) return;
    const wanted = (defaultCategory ?? 'community') as FeedCategory;
    setCategory(allowedCategories.includes(wanted) ? wanted : 'community');
    setMode('write');
    if (isStaff) {
      api.esport.sponsors().then((l: any) => setSponsors(Array.isArray(l) ? l : []));
    }
  }, [open, defaultCategory, allowedCategories, isStaff]);

  const reset = () => {
    setTitle('');
    setContent('');
    setImages([]);
    setImageInput('');
    setSponsorId('');
    setIsSponsored(false);
  };

  const addImage = () => {
    const url = imageInput.trim();
    if (!url) return;
    if (!isHttpUrl(url)) {
      toast.error(t('comm.composer.invalidImage'));
      return;
    }
    if (images.length >= MAX_POST_IMAGES) {
      toast.error(t('comm.composer.imagesMax', { max: MAX_POST_IMAGES }));
      return;
    }
    setImages((l) => [...l, url]);
    setImageInput('');
  };

  const submit = async () => {
    if (!title.trim()) return toast.error(t('comm.composer.titleRequired'));
    if (!content.trim()) return toast.error(t('comm.composer.contentRequired'));
    setSaving(true);
    try {
      const payload: any = {
        category,
        title: title.trim(),
        content: content.trim(),
        contentFormat: 'markdown',
        images,
      };
      if (isStaff && (isSponsored || sponsorId)) {
        payload.isSponsored = true;
        if (sponsorId) payload.sponsorId = sponsorId;
      }
      const post = await api.posts.create(payload);
      toast.success(t('comm.composer.published'));
      onCreated(post);
      reset();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const tabClass = (active: boolean) =>
    cn(
      'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
      active ? 'bg-primary text-on-primary' : 'text-ink-2 hover:bg-surface-2 hover:text-ink-1',
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('comm.newPost')}
      icon={<PenSquare size={20} />}
      size="lg"
      closeLabel={t('comm.composer.cancel')}
    >
      <div className="space-y-4">
        <Select
          label={t('comm.composer.category')}
          value={category}
          onChange={(e: any) => setCategory(e.target.value)}
        >
          {allowedCategories.map((c) => (
            <option key={c} value={c}>{t(`comm.cat.${c}`)}</option>
          ))}
        </Select>
        {!isStaff && (
          <p className="-mt-2 flex items-center gap-1 text-xs text-ink-3">
            <Lock size={12} />
            {t('comm.cat.announcement')} / {t('comm.cat.stream')} : {t('comm.staffOnly')}
          </p>
        )}

        <Input
          label={t('comm.composer.title')}
          value={title}
          maxLength={200}
          onChange={(e: any) => setTitle(e.target.value)}
          placeholder={t('comm.composer.titlePlaceholder')}
        />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-ink-1">{t('comm.composer.content')}</span>
            <div className="flex gap-1 rounded-md border border-line-subtle bg-surface-2/70 p-0.5">
              <button type="button" className={tabClass(mode === 'write')} onClick={() => setMode('write')}>
                {t('comm.composer.write')}
              </button>
              <button type="button" className={tabClass(mode === 'preview')} onClick={() => setMode('preview')}>
                {t('comm.composer.preview')}
              </button>
            </div>
          </div>
          {mode === 'write' ? (
            <Textarea
              value={content}
              onChange={(e: any) => setContent(e.target.value)}
              placeholder={t('comm.composer.contentPlaceholder')}
              rows={8}
            />
          ) : (
            <div className="min-h-[12rem] rounded-lg border border-line-subtle bg-surface-2 p-4">
              {content.trim() ? (
                <MarkdownContent content={content} format="markdown" />
              ) : (
                <p className="text-sm text-ink-3">{t('comm.composer.previewEmpty')}</p>
              )}
            </div>
          )}
          <p className="mt-1.5 text-xs text-ink-3">{t('comm.composer.markdownHint')}</p>
        </div>

        <div>
          <span className="mb-2 block text-ink-1">
            {t('comm.composer.images')}{' '}
            <span className="text-xs text-ink-3">({t('comm.composer.imagesMax', { max: MAX_POST_IMAGES })})</span>
          </span>
          <div className="flex gap-2">
            <Input
              value={imageInput}
              onChange={(e: any) => setImageInput(e.target.value)}
              placeholder={t('comm.composer.imagePlaceholder')}
              onKeyDown={(e: any) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addImage();
                }
              }}
              className="!py-2.5"
            />
            <Button variant="outline" onClick={addImage} disabled={images.length >= MAX_POST_IMAGES} title={t('comm.composer.addImage')}>
              <Plus size={16} />
              <ImageIcon size={16} />
            </Button>
          </div>
          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {images.map((src, i) => (
                <div key={`${src}-${i}`} className="group relative h-20 overflow-hidden rounded-lg border border-line-subtle bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((l) => l.filter((_, j) => j !== i))}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-80 transition-opacity hover:opacity-100"
                    aria-label={t('comm.admin.delete')}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {isStaff && (
          <div className="rounded-lg border border-dashed border-accent-gold/40 bg-accent-gold/5 p-3">
            <label className="mb-2 flex cursor-pointer items-center gap-2 text-sm text-ink-1">
              <input
                type="checkbox"
                checked={isSponsored}
                onChange={(e) => {
                  setIsSponsored(e.target.checked);
                  if (!e.target.checked) setSponsorId('');
                }}
                className="h-4 w-4 accent-accent-gold"
              />
              {t('comm.composer.markSponsored')}
            </label>
            {isSponsored && (
              <Select value={sponsorId} onChange={(e: any) => setSponsorId(e.target.value)}>
                <option value="">{t('comm.composer.noSponsor')}</option>
                {sponsors.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name || s.url || s.id}</option>
                ))}
              </Select>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">{t('comm.composer.cancel')}</Button>
          <Button onClick={submit} loading={saving} className="flex-1">{t('comm.composer.publish')}</Button>
        </div>
      </div>
    </Modal>
  );
}
