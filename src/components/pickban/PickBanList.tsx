'use client';

import Link from 'next/link';
import { ArrowRight, Trash2 } from 'lucide-react';
import { Badge, Button, Card, ProgressBar } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { totalSteps, type PickBanMode } from '@/lib/pickban';

export interface DraftSummary {
  id: string;
  name: string;
  mode: PickBanMode;
  shareCode: string;
  currentStep: number;
  status: string;
  updatedAt: string;
  blueTeam: { picks: any[]; bans: any[] };
  redTeam: { picks: any[]; bans: any[] };
}

export default function PickBanList({
  drafts,
  onDelete,
}: {
  drafts: DraftSummary[];
  onDelete: (draft: DraftSummary) => void;
}) {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {drafts.map((d) => {
        const total = totalSteps(d.mode);
        const completed = d.status === 'completed' || d.currentStep >= total;
        return (
          <Card key={d.id} hover accent={completed ? 'green' : 'cyan'} className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-display text-base font-bold tracking-tight2 text-ink-1">{d.name}</h3>
                <p className="text-xs num text-ink-3">
                  {t('pickban.draft', { code: d.shareCode })}
                </p>
              </div>
              <Badge size="sm" variant={completed ? 'green' : 'blue'} dot>
                {t(completed ? 'pickban.status.completed' : 'pickban.status.active')}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs num text-ink-2">
              <Badge size="sm" variant="outline">{t(`pickban.${d.mode}`)}</Badge>
              <span>{t('pickban.progress', { done: d.currentStep, total })}</span>
              <span>
                {t('pickban.lastUpdate', {
                  date: new Date(d.updatedAt).toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', {
                    day: 'numeric',
                    month: 'short',
                  }),
                })}
              </span>
            </div>

            <ProgressBar value={d.currentStep} max={total} className="h-1.5" accent={completed ? 'green' : undefined} />

            <div className="mt-auto flex items-center justify-between gap-2 border-t border-line-subtle pt-3">
              <div className="flex gap-3 text-xs num">
                <span className="font-semibold text-accent-cyan">
                  {t('pickban.blue')} {d.blueTeam?.picks?.length ?? 0}/5
                </span>
                <span className="font-semibold text-accent-red">
                  {t('pickban.red')} {d.redTeam?.picks?.length ?? 0}/5
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="ghost" onClick={() => onDelete(d)} aria-label={t('pickban.delete')}>
                  <Trash2 size={15} />
                </Button>
                <Link href={`/dashboard/pick-ban/${d.shareCode}`}>
                  <Button size="sm" className="gap-1">
                    {t('pickban.openBoard')}
                    <ArrowRight size={14} />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
