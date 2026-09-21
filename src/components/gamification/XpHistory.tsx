'use client';

import { History } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { useLangStore } from '@/store/useStore';

export interface XpEventItem {
  id: string;
  type: string;
  amount: number;
  createdAt: string;
}

export default function XpHistory({ items }: { items: XpEventItem[] }) {
  const t = useT();
  const lang = useLangStore((s: any) => s.lang);
  if (!items.length) {
    return (
      <p className="flex items-center gap-2 text-sm text-ink-2">
        <History size={16} /> {t('progress.history.empty')}
      </p>
    );
  }
  const fmt = (d: string) =>
    new Date(d).toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  return (
    <ul className="divide-y divide-line-subtle">
      {items.map((e) => (
        <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink-1 truncate">{t(`xp.type.${e.type}`)}</p>
            <p className="text-xs text-ink-3 num">{fmt(e.createdAt)}</p>
          </div>
          <span className="shrink-0 num text-sm font-semibold text-accent-green">+{e.amount} XP</span>
        </li>
      ))}
    </ul>
  );
}
