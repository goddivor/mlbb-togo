'use client';

import { useCallback, useState } from 'react';
import { AlertCircle, Sparkles, Cpu } from 'lucide-react';
import { ApiError, mlbbImg } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';
import { Badge, Button, Card } from '@/components/ui';
import { cn } from '@/lib/helpers';
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
    <div className="flex items-start gap-2 rounded border border-accent-red/40 bg-accent-red/10 p-3 text-sm text-accent-red">
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
  const accent = pct >= 70 ? 'bg-accent-green' : pct >= 40 ? 'bg-accent-cyan' : 'bg-accent-gold';
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{label}</span>
        <span className="font-display text-xs font-bold num text-ink-1">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
        <div className={cn('h-full rounded-full transition-[width] duration-slow ease-out', accent)} style={{ width: `${pct}%` }} />
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
    <Card hover className="group relative flex flex-col gap-3 overflow-hidden !p-4">
      <span aria-hidden="true" className="absolute -right-8 -top-8 h-16 w-16 rotate-45 bg-primary/10 transition-colors group-hover:bg-primary/20" />
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded cut-corners-sm bg-surface-2 ring-1 ring-inset ring-line-subtle">
          {img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mlbbImg(img, 112)} alt={hero.name} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-base font-bold tracking-tight2 text-ink-1">{hero.name}</p>
          <div className="mt-1 flex items-center gap-1">
            {(hero.roles?.length ? hero.roles : [hero.role]).slice(0, 3).map((r) => (
              <RoleIcon key={r} role={r} size={14} />
            ))}
            <span className="text-xs text-ink-2">{t(`role.${String(hero.role).toLowerCase()}`)}</span>
          </div>
        </div>
      </div>
      <p className="text-sm text-ink-2">{hero.reason}</p>
      {hero.against && hero.against.length > 0 && (
        <p className="text-xs text-ink-2">
          <span className="font-medium text-ink-1">{t('ai.counter.against')}:</span> {hero.against.join(', ')}
        </p>
      )}
      <ScoreBar value={score} label={scoreLabel} />
    </Card>
  );
}
