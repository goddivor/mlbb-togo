'use client';

import { useCallback, useState } from 'react';
import { AlertCircle, Sparkles, Cpu } from 'lucide-react';
import { ApiError, mlbbImg } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { Badge, Button, SectionCard } from '@/components/ui';
import RoleIcon from '@/components/game/RoleIcon';

export type AiSource = 'llm' | 'heuristic';

export interface HeroCard {
  id: string;
  name: string;
  role: string;
  roles: string[];
  image: string | null;
  thumb: string | null;
  reason: string;
  confidence: number;
  effectiveness?: number;
  against?: string[];
}

/** Current UI locale, restricted to what the API accepts. */
export function useAiLang(): 'fr' | 'en' {
  const lang = useLangStore((s: any) => s.lang);
  return lang === 'en' ? 'en' : 'fr';
}

/** Runs one AI request with loading / error state; error keys are i18n keys. */
export function useAiRun<T>(fn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const run = useCallback(async () => {
    setLoading(true);
    setErrorKey(null);
    try {
      setData(await fn());
    } catch (err) {
      setErrorKey(err instanceof ApiError && err.status === 429 ? 'ai.quota' : 'ai.error');
    } finally {
      setLoading(false);
    }
  }, [fn]);
  return { data, loading, errorKey, run };
}

export function SourceBadge({ source }: { source: AiSource }) {
  const t = useT();
  return source === 'llm' ? (
    <Badge variant="purple" size="sm">
      <Sparkles size={12} /> {t('ai.source.llm')}
    </Badge>
  ) : (
    <Badge variant="gold" size="sm">
      <Cpu size={12} /> {t('ai.source.heuristic')}
    </Badge>
  );
}

export function ErrorBox({ errorKey }: { errorKey: string | null }) {
  const t = useT();
  if (!errorKey) return null;
  return (
    <div className="flex items-start gap-2 rounded-sm border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <span>{t(errorKey)}</span>
    </div>
  );
}

export function RunButton({
  onClick,
  loading,
  hasResult,
  labelKey,
  disabled,
}: {
  onClick: () => void;
  loading: boolean;
  hasResult: boolean;
  labelKey: string;
  disabled?: boolean;
}) {
  const t = useT();
  return (
    <Button onClick={onClick} loading={loading} disabled={disabled || loading} className="gap-2">
      {!loading && <Sparkles size={16} />}
      {loading ? t('ai.loading') : hasResult ? t('ai.rerun') : t(labelKey)}
    </Button>
  );
}

export function ScoreBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-body dark:text-bodydark">
        <span>{label}</span>
        <span className="font-semibold text-black dark:text-white">{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray dark:bg-meta-4">
        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Result card for a recommended / counter hero. */
export function HeroResultCard({ hero, scoreLabel }: { hero: HeroCard; scoreLabel: string }) {
  const t = useT();
  const img = hero.thumb || hero.image;
  const score = hero.effectiveness ?? hero.confidence;
  return (
    <SectionCard className="flex flex-col gap-3 !p-4">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-sm bg-gray dark:bg-meta-4">
          {img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mlbbImg(img, 112)} alt={hero.name} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-black dark:text-white">{hero.name}</p>
          <div className="mt-1 flex items-center gap-1">
            {(hero.roles?.length ? hero.roles : [hero.role]).slice(0, 3).map((r) => (
              <RoleIcon key={r} role={r} size={14} />
            ))}
            <span className="text-xs text-body dark:text-bodydark">{t(`role.${String(hero.role).toLowerCase()}`)}</span>
          </div>
        </div>
      </div>
      <p className="text-sm text-body dark:text-bodydark">{hero.reason}</p>
      {hero.against && hero.against.length > 0 && (
        <p className="text-xs text-body dark:text-bodydark">
          <span className="font-medium text-black dark:text-white">{t('ai.counter.against')}:</span> {hero.against.join(', ')}
        </p>
      )}
      <ScoreBar value={score} label={scoreLabel} />
    </SectionCard>
  );
}
