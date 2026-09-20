'use client';

import { useCallback, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Footprints, Shield, Sparkles, Wand2, AlertTriangle } from 'lucide-react';
import { api, mlbbImg } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { fadeUp, still } from '@/lib/motion';
import { Badge, Card } from '@/components/ui';
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
    <Card className="flex gap-3 !p-4">
      {icon && <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded cut-corners-sm bg-primary/10 text-primary">{icon}</span>}
      <div className="min-w-0">
        <p className="font-semibold text-ink-1">{name}</p>
        {reason && <p className="text-sm text-ink-2">{reason}</p>}
      </div>
    </Card>
  );
}

export default function BuildTab() {
  const t = useT();
  const reduce = useReducedMotion();
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
      <Card className="space-y-4">
        <p className="text-sm text-ink-2">{t('ai.build.intro')}</p>
        <HeroPicker heroes={heroes} loading={catalogLoading} selected={selected} onChange={setSelected} max={1} />
        <RunButton onClick={run} loading={loading} hasResult={!!data} labelKey="ai.build.cta" disabled={!heroId} />
        <ErrorBox errorKey={errorKey} />
      </Card>

      {data && (
        <motion.div className="space-y-6" variants={reduce ? still : fadeUp} initial="hidden" animate="visible">
          <Card className="flex flex-wrap items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded cut-corners-sm bg-surface-2 ring-1 ring-inset ring-line-subtle">
              {img && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mlbbImg(img, 128)} alt={data.hero.name} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-lg font-bold tracking-tight2 text-ink-1">{data.hero.name}</h3>
                <RoleIcon role={data.hero.role} size={16} />
                <SourceBadge source={data.source} />
              </div>
              {data.note && <p className="mt-1 text-sm text-ink-2">{data.note}</p>}
              {!data.metaAvailable && !data.note && (
                <p className="mt-1 flex items-center gap-1 text-xs text-accent-gold">
                  <AlertTriangle size={12} /> {t('ai.build.metaMissing')}
                </p>
              )}
            </div>
          </Card>

          <div>
            <h4 className="mb-3 font-display text-base font-bold tracking-tight2 text-ink-1">{t('ai.build.boots')}</h4>
            <ItemCard name={data.boots.name} reason={data.boots.reason} icon={<Footprints size={18} />} />
          </div>

          <div>
            <h4 className="mb-3 font-display text-base font-bold tracking-tight2 text-ink-1">{t('ai.build.core')}</h4>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {core.map((i) => (
                <ItemCard key={i.name} name={i.name} reason={i.reason} icon={<Shield size={18} />} />
              ))}
            </div>
          </div>

          {situational.length > 0 && (
            <div>
              <h4 className="mb-3 font-display text-base font-bold tracking-tight2 text-ink-1">{t('ai.build.situational')}</h4>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {situational.map((i) => (
                  <ItemCard key={i.name} name={i.name} reason={i.reason} />
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Card className="space-y-2 !p-4">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">
                <Sparkles size={14} /> {t('ai.build.emblem')}
              </p>
              <p className="font-semibold text-ink-1">{data.emblem.name}</p>
              {data.emblem.talents.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {data.emblem.talents.map((tal) => (
                    <Badge key={tal} variant="purple" size="sm">
                      {tal}
                    </Badge>
                  ))}
                </div>
              )}
              {data.emblem.reason && <p className="text-sm text-ink-2">{data.emblem.reason}</p>}
            </Card>
            <Card className="space-y-2 !p-4">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">
                <Wand2 size={14} /> {t('ai.build.spell')}
              </p>
              <p className="font-semibold text-ink-1">{data.spell.name}</p>
              {data.spell.reason && <p className="text-sm text-ink-2">{data.spell.reason}</p>}
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  );
}
