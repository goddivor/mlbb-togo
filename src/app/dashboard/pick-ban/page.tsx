'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Save, Swords, Bookmark, CheckCircle2, Shield, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Button, EmptyState, PageHeader, SectionTitle, Skeleton, StatCard, Card } from '@/components/ui';
import ConfirmModal from '@/components/ui/ConfirmModal';
import PickBanBoard, { type BoardMove } from '@/components/pickban/PickBanBoard';
import PickBanList, { type DraftSummary } from '@/components/pickban/PickBanList';
import CreateDraftModal from '@/components/pickban/CreateDraftModal';
import ModeSwitch from '@/components/pickban/ModeSwitch';
import {
  applyAction,
  emptyDraft,
  playedMoves,
  totalSteps,
  undoAction,
  type DraftState,
  type PickBanHero,
  type PickBanMode,
} from '@/lib/pickban';

const LOCAL_KEY = 'pickban-local-draft';

function loadLocal(): DraftState | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.mode !== 'ranked' && parsed?.mode !== 'tournament') return null;
    return parsed as DraftState;
  } catch {
    return null;
  }
}

export default function PickBanPage() {
  const t = useT();
  const router = useRouter();
  const [heroes, setHeroes] = useState<PickBanHero[]>([]);
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [local, setLocal] = useState<DraftState>(() => emptyDraft('ranked'));
  const [createOpen, setCreateOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [toDelete, setToDelete] = useState<DraftSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const saved = loadLocal();
    if (saved) setLocal(saved);
    (async () => {
      try {
        const [h, d] = await Promise.all([api.pickban.heroes(), api.pickban.list()]);
        setHeroes(Array.isArray(h) ? h : []);
        setDrafts(Array.isArray(d) ? d : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateLocal = useCallback((next: DraftState) => {
    setLocal(next);
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
    } catch {
      // Persistence is a convenience only.
    }
  }, []);

  const onMove = (move: BoardMove) => {
    const next = applyAction(local, { heroId: move.hero.id, heroName: move.hero.name, lane: move.lane });
    if (next) updateLocal(next);
  };

  // Creates a draft on the API, optionally replaying the local moves into it.
  const createDraft = async (data: { name: string; mode: PickBanMode }, replay: DraftState | null) => {
    try {
      const draft = await api.pickban.create(data);
      if (replay) {
        for (const m of playedMoves(replay)) {
          await api.pickban.step(draft.id, {
            action: m.action,
            team: m.team,
            heroId: m.heroId,
            lane: m.lane,
          });
        }
        updateLocal(emptyDraft(replay.mode));
        toast.success(t('pickban.saved'));
      } else {
        toast.success(t('pickban.created'));
      }
      router.push(`/dashboard/pick-ban/${draft.shareCode}`);
    } catch (err: any) {
      toast.error(err?.message || t('pickban.error'));
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.pickban.remove(toDelete.id);
      setDrafts((prev) => prev.filter((d) => d.id !== toDelete.id));
      toast.success(t('pickban.deleted'));
      setToDelete(null);
    } catch (err: any) {
      toast.error(err?.message || t('pickban.error'));
    } finally {
      setDeleting(false);
    }
  };

  const completedCount = drafts.filter(
    (d) => d.status === 'completed' || d.currentStep >= totalSteps(d.mode),
  ).length;
  const localTotal = totalSteps(local.mode);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Swords size={20} />}
        eyebrow={t('pickban.eyebrow')}
        title={t('pickban.title')}
        subtitle={t('pickban.subtitle')}
        action={
          <Button onClick={() => setCreateOpen(true)} className="shrink-0 gap-1.5 whitespace-nowrap">
            <Plus size={16} />
            {t('pickban.new')}
          </Button>
        }
      >
        <StatCard label={t('pickban.kpi.saved')} value={loading ? '—' : drafts.length} icon={<Bookmark size={18} />} accent="cyan" />
        <StatCard label={t('pickban.kpi.completed')} value={loading ? '—' : completedCount} icon={<CheckCircle2 size={18} />} accent="green" />
        <StatCard
          label={t('pickban.kpi.local')}
          value={
            <>
              {Math.min(local.currentStep, localTotal)}
              <span className="text-base text-ink-3">/{localTotal}</span>
            </>
          }
          hint={t(`pickban.${local.mode}`)}
          icon={<Zap size={18} />}
          accent="violet"
        />
        <StatCard label={t('pickban.kpi.heroes')} value={loading ? '—' : heroes.length} icon={<Shield size={18} />} accent="gold" />
      </PageHeader>

      {loading ? (
        <div className="space-y-4">
          <Card>
            <Skeleton lines={2} />
          </Card>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <Card className="lg:col-span-3"><Skeleton lines={6} /></Card>
            <Card className="lg:col-span-6"><Skeleton lines={8} /></Card>
            <Card className="lg:col-span-3"><Skeleton lines={6} /></Card>
          </div>
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <SectionTitle
              title={t('pickban.localTitle')}
              description={t('pickban.saveHint')}
              action={
                <ModeSwitch
                  value={local.mode}
                  onChange={(mode) => updateLocal(emptyDraft(mode))}
                  size="sm"
                />
              }
            />
            <PickBanBoard
              state={local}
              heroes={heroes}
              onMove={onMove}
              onUndo={() => updateLocal(undoAction(local))}
              onReset={() => updateLocal(emptyDraft(local.mode))}
              toolbar={
                <Button
                  size="sm"
                  disabled={local.currentStep === 0}
                  onClick={() => setSaveOpen(true)}
                  className="gap-1.5"
                >
                  <Save size={15} />
                  {t('pickban.save')}
                </Button>
              }
            />
          </section>

          <section className="space-y-4">
            <SectionTitle title={t('pickban.myDrafts')} />
            {drafts.length === 0 ? (
              <EmptyState
                icon={<Swords size={26} />}
                title={t('pickban.empty')}
                className="min-h-0 rounded-lg border border-dashed border-line-subtle py-10"
              />
            ) : (
              <PickBanList drafts={drafts} onDelete={setToDelete} />
            )}
          </section>
        </>
      )}

      <CreateDraftModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={async (data) => {
          setCreateOpen(false);
          await createDraft(data, null);
        }}
      />
      <CreateDraftModal
        open={saveOpen}
        defaultMode={local.mode}
        lockMode
        title={t('pickban.save')}
        onClose={() => setSaveOpen(false)}
        onCreate={async (data) => {
          setSaveOpen(false);
          await createDraft({ name: data.name, mode: local.mode }, local);
        }}
      />
      <ConfirmModal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title={t('pickban.delete')}
        message={t('pickban.confirmDelete')}
        confirmLabel={t('pickban.delete')}
        cancelLabel={t('common.cancel')}
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
