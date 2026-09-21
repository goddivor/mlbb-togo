'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, Link2, Share2, Swords, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useAuthStore } from '@/store/useStore';
import { Badge, Button, EmptyState, PageHeader, Skeleton, Card } from '@/components/ui';
import ConfirmModal from '@/components/ui/ConfirmModal';
import PickBanBoard, { type BoardMove } from '@/components/pickban/PickBanBoard';
import type { DraftState, PickBanHero } from '@/lib/pickban';

interface Draft extends DraftState {
  id: string;
  name: string;
  shareCode: string;
  ownerId: string;
  status: string;
}

export default function PickBanDraftPage() {
  const t = useT();
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const code = String(params?.code ?? '');
  const user = useAuthStore((s: any) => s.user);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [heroes, setHeroes] = useState<PickBanHero[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!code) return;
    (async () => {
      setLoading(true);
      try {
        const [d, h] = await Promise.all([api.pickban.getByCode(code), api.pickban.heroes()]);
        setDraft(d);
        setHeroes(Array.isArray(h) ? h : []);
      } catch {
        setDraft(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  const isOwner = !!draft && !!user && draft.ownerId === user.id;

  const run = async (fn: () => Promise<Draft>) => {
    setBusy(true);
    try {
      setDraft(await fn());
    } catch (err: any) {
      toast.error(err?.message || t('pickban.error'));
    } finally {
      setBusy(false);
    }
  };

  const onMove = (move: BoardMove) =>
    run(() =>
      api.pickban.step(draft!.id, {
        action: move.action,
        team: move.team,
        heroId: move.hero.id,
        lane: move.lane,
      }),
    );

  const shareUrl = () => `${window.location.origin}/pick-ban/${draft?.shareCode}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      toast.success(t('pickban.copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('pickban.error'));
    }
  };

  const share = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: draft?.name, url: shareUrl() });
        return;
      } catch {
        // User cancelled or share unsupported: fall back to copy.
      }
    }
    await copyLink();
  };

  const remove = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      await api.pickban.remove(draft.id);
      toast.success(t('pickban.deleted'));
      router.push('/pick-ban');
    } catch (err: any) {
      toast.error(err?.message || t('pickban.error'));
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow={t('pickban.eyebrow')} title={t('pickban.title')} breadcrumb={t('header.pickban')} />
        <Card>
          <Skeleton lines={2} />
        </Card>
        <div className="grid grid-cols-2 gap-4">
          <Card><Skeleton lines={6} /></Card>
          <Card><Skeleton lines={6} /></Card>
        </div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow={t('pickban.eyebrow')} title={t('pickban.title')} breadcrumb={t('header.pickban')} />
        <EmptyState
          icon={<Swords size={26} />}
          title={t('pickban.notFound')}
          description={t('pickban.notFoundHint')}
          action={
            <Link href="/pick-ban">
              <Button variant="outline" className="gap-1.5">
                <ArrowLeft size={15} />
                {t('pickban.back')}
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('pickban.eyebrow')}
        title={draft.name}
        breadcrumb={t('header.pickban')}
        variant={draft.mode === 'ranked' ? 'cyan' : 'purple'}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span className="num">{t('pickban.draft', { code: draft.shareCode })}</span>
            <Badge size="sm" variant={draft.mode === 'ranked' ? 'blue' : 'purple'}>
              {t(`pickban.${draft.mode}`)}
            </Badge>
            {!isOwner && (
              <Badge size="sm" variant="default">
                {t('pickban.sharedBy')}
              </Badge>
            )}
          </span>
        }
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link href="/pick-ban">
              <Button size="sm" variant="ghost" className="gap-1.5">
                <ArrowLeft size={15} />
                <span className="hidden sm:inline">{t('pickban.back')}</span>
              </Button>
            </Link>
            <Button size="sm" variant="outline" onClick={copyLink} className="gap-1.5">
              {copied ? <Check size={15} /> : <Link2 size={15} />}
              {copied ? t('pickban.copied') : t('pickban.copy')}
            </Button>
            <Button size="sm" variant="secondary" onClick={share} className="gap-1.5">
              <Share2 size={15} />
              {t('pickban.share')}
            </Button>
            {isOwner && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => setConfirmDelete(true)}
                className="gap-1.5"
                aria-label={t('pickban.delete')}
              >
                <Trash2 size={15} />
                <span className="hidden sm:inline">{t('pickban.delete')}</span>
              </Button>
            )}
          </div>
        }
      />

      <PickBanBoard
        state={draft}
        heroes={heroes}
        readOnly={!isOwner}
        busy={busy}
        onMove={onMove}
        onUndo={() => run(() => api.pickban.undo(draft.id))}
        onReset={() => run(() => api.pickban.reset(draft.id))}
      />

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        title={t('pickban.delete')}
        message={t('pickban.confirmDelete')}
        confirmLabel={t('pickban.delete')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        loading={busy}
      />
    </div>
  );
}
