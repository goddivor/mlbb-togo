'use client';

import Link from 'next/link';
import { ArrowRight, Trash2 } from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
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
          <Card key={d.id} hover className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-black dark:text-white">{d.name}</h3>
                <p className="text-xs text-body dark:text-bodydark">
                  {t('pickban.draft', { code: d.shareCode })}
                </p>
              </div>
              <Badge size="sm" variant={completed ? 'green' : 'blue'}>
                {t(completed ? 'pickban.status.completed' : 'pickban.status.active')}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-body dark:text-bodydark">
              <span>{t(`pickban.${d.mode}`)}</span>
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

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-2 dark:bg-meta-4">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.round((d.currentStep / total) * 100)}%` }}
              />
            </div>

            <div className="mt-auto flex items-center justify-between gap-2 border-t border-stroke pt-3 dark:border-strokedark">
              <div className="flex gap-3 text-xs">
                <span className="font-semibold text-primary">
                  {t('pickban.blue')} {d.blueTeam?.picks?.length ?? 0}/5
                </span>
                <span className="font-semibold text-danger">
                  {t('pickban.red')} {d.redTeam?.picks?.length ?? 0}/5
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="ghost" onClick={() => onDelete(d)} aria-label={t('pickban.delete')}>
                  <Trash2 size={15} />
                </Button>
                <Link href={`/pick-ban/${d.shareCode}`}>
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
