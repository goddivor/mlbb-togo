'use client';

import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Footprints, Shield, Sparkles, Wand2, AlertTriangle } from 'lucide-react';
import { api, mlbbImg } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Badge, SectionCard } from '@/components/ui';
import RoleIcon from '@/components/game/RoleIcon';
import HeroPicker, { useHeroCatalog } from './HeroPicker';
import { ErrorBox, RunButton, SourceBadge, useAiLang, useAiRun } from './shared';

interface BuildData {
  source: 'llm' | 'heuristic';
  hero: { id: string; name: string; role: string; image: string | null; thumb: string | null };
  metaAvailable: boolean;
  note: string;
  boots: { name: string; reason: string };
  items: { name: string; reason: string; priority: 'core' | 'situational' }[];
  emblem: { name: string; talents: string[]; reason: string };
  spell: { name: string; reason: string };
}

function ItemCard({ name, reason, icon }: { name: string; reason: string; icon?: React.ReactNode }) {
  return (
    <SectionCard className="flex gap-3 !p-4">
      {icon && <span className="mt-0.5 shrink-0 text-primary">{icon}</span>}
      <div className="min-w-0">
        <p className="font-semibold text-black dark:text-white">{name}</p>
        {reason && <p className="text-sm text-body dark:text-bodydark">{reason}</p>}
      </div>
    </SectionCard>
  );
}

export default function BuildTab() {
  const t = useT();
  const lang = useAiLang();
  const { heroes, loading: catalogLoading } = useHeroCatalog();
  const [selected, setSelected] = useState<string[]>([]);
  const heroId = selected[0];
  const fetcher = useCallback(() => api.ai.recommendBuild(heroId, lang) as Promise<BuildData>, [heroId, lang]);
  const { data, loading, errorKey, run } = useAiRun(fetcher);

  const core = data?.items.filter((i) => i.priority === 'core') ?? [];
  const situational = data?.items.filter((i) => i.priority === 'situational') ?? [];
  const img = data?.hero.thumb || data?.hero.image;

  return (
    <div className="space-y-6">
      <SectionCard className="space-y-4">
        <p className="text-sm text-body dark:text-bodydark">{t('ai.build.intro')}</p>
        <HeroPicker heroes={heroes} loading={catalogLoading} selected={selected} onChange={setSelected} max={1} />
        <RunButton onClick={run} loading={loading} hasResult={!!data} labelKey="ai.build.cta" disabled={!heroId} />
        <ErrorBox errorKey={errorKey} />
      </SectionCard>

      {data && (
        <motion.div className="space-y-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <SectionCard className="flex flex-wrap items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-gray dark:bg-meta-4">
              {img && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mlbbImg(img, 128)} alt={data.hero.name} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-black dark:text-white">{data.hero.name}</h3>
                <RoleIcon role={data.hero.role} size={16} />
                <SourceBadge source={data.source} />
              </div>
              {data.note && <p className="mt-1 text-sm text-body dark:text-bodydark">{data.note}</p>}
              {!data.metaAvailable && !data.note && (
                <p className="mt-1 flex items-center gap-1 text-xs text-warning">
                  <AlertTriangle size={12} /> {t('ai.build.metaMissing')}
                </p>
              )}
            </div>
          </SectionCard>

          <div>
            <h4 className="mb-3 font-semibold text-black dark:text-white">{t('ai.build.boots')}</h4>
            <ItemCard name={data.boots.name} reason={data.boots.reason} icon={<Footprints size={18} />} />
          </div>

          <div>
            <h4 className="mb-3 font-semibold text-black dark:text-white">{t('ai.build.core')}</h4>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {core.map((i) => (
                <ItemCard key={i.name} name={i.name} reason={i.reason} icon={<Shield size={18} />} />
              ))}
            </div>
          </div>

          {situational.length > 0 && (
            <div>
              <h4 className="mb-3 font-semibold text-black dark:text-white">{t('ai.build.situational')}</h4>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {situational.map((i) => (
                  <ItemCard key={i.name} name={i.name} reason={i.reason} />
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <SectionCard className="space-y-2 !p-4">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-body dark:text-bodydark">
                <Sparkles size={14} /> {t('ai.build.emblem')}
              </p>
              <p className="font-semibold text-black dark:text-white">{data.emblem.name}</p>
              {data.emblem.talents.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {data.emblem.talents.map((tal) => (
                    <Badge key={tal} variant="purple" size="sm">
                      {tal}
                    </Badge>
                  ))}
                </div>
              )}
              {data.emblem.reason && <p className="text-sm text-body dark:text-bodydark">{data.emblem.reason}</p>}
            </SectionCard>
            <SectionCard className="space-y-2 !p-4">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-body dark:text-bodydark">
                <Wand2 size={14} /> {t('ai.build.spell')}
              </p>
              <p className="font-semibold text-black dark:text-white">{data.spell.name}</p>
              {data.spell.reason && <p className="text-sm text-body dark:text-bodydark">{data.spell.reason}</p>}
            </SectionCard>
          </div>
        </motion.div>
      )}
    </div>
  );
}
