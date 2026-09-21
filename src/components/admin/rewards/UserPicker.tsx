'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { api, avatarSrc } from '@/lib/api';
import { cn } from '@/lib/helpers';
import { useT } from '@/lib/i18n';
import { Avatar, SpinLoader } from '@/components/ui';

export interface PickedUser {
  id: string;
  username: string;
  displayName?: string | null;
  avatar?: string | null;
  gameRank?: string | null;
  equippedFrame?: string | null;
}

const inputCls =
  'w-full rounded border border-line-strong bg-surface-1 py-2.5 pl-9 pr-3 text-sm text-ink-1 placeholder:text-ink-3 outline-none transition-[border-color,box-shadow] duration-base focus:border-primary focus:ring-2 focus:ring-primary/25 dark:bg-surface-0/60';

/**
 * Member search (public `/search`, by username, 2 characters minimum).
 * Single mode replaces the selection; multiple mode keeps up to `max` chips.
 */
export default function UserPicker({
  value,
  onChange,
  multiple = false,
  max = 10,
  label,
  id,
}: {
  value: PickedUser[];
  onChange: (users: PickedUser[]) => void;
  multiple?: boolean;
  max?: number;
  label?: string;
  id?: string;
}) {
  const t = useT();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PickedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let alive = true;
    setLoading(true);
    const timer = window.setTimeout(() => {
      api.search
        .all(q, 8)
        .then((r: any) => alive && setResults(Array.isArray(r?.users) ? r.users : []))
        .catch(() => alive && setResults([]))
        .finally(() => alive && setLoading(false));
    }, 250);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const pick = (u: PickedUser) => {
    if (multiple) {
      if (value.some((v) => v.id === u.id) || value.length >= max) return;
      onChange([...value, u]);
    } else {
      onChange([u]);
      setOpen(false);
    }
    setQuery('');
  };

  const full = multiple && value.length >= max;

  return (
    <div ref={box} className="w-full">
      {label && (
        <label htmlFor={id} className="mb-2 block text-sm font-medium text-ink-1">
          {label}
        </label>
      )}
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {value.map((u) => (
            <span
              key={u.id}
              className="inline-flex items-center gap-1.5 rounded border border-line-subtle bg-surface-2 py-1 pl-1 pr-1.5 text-xs font-semibold text-ink-1"
            >
              <Avatar name={u.displayName || u.username} src={u.avatar ? avatarSrc(u.avatar, 48) : undefined} size="xs" />
              {u.displayName || u.username}
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v.id !== u.id))}
                aria-label={t('rewards.admin.picker.remove', { name: u.username })}
                className="rounded p-0.5 text-ink-3 hover:bg-surface-3 hover:text-ink-1"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      {!full && (
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            id={id}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={t('rewards.admin.picker.placeholder')}
            autoComplete="off"
            className={inputCls}
          />
          {loading && <SpinLoader className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3" />}
          {open && query.trim().length >= 2 && !loading && (
            <ul className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-md border border-line-strong bg-surface-1 py-1 shadow-elev-3">
              {results.length === 0 ? (
                <li className="px-3 py-2 text-sm text-ink-3">{t('rewards.admin.picker.none')}</li>
              ) : (
                results.map((u) => {
                  const taken = value.some((v) => v.id === u.id);
                  return (
                    <li key={u.id}>
                      <button
                        type="button"
                        disabled={taken}
                        onClick={() => pick(u)}
                        className={cn(
                          'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink-1 transition-colors duration-fast hover:bg-surface-2',
                          taken && 'cursor-default opacity-50',
                        )}
                      >
                        <Avatar name={u.displayName || u.username} src={u.avatar ? avatarSrc(u.avatar, 48) : undefined} size="xs" />
                        <span className="min-w-0 flex-1 truncate">
                          {u.displayName || u.username}
                          <span className="ml-1.5 text-xs text-ink-3">@{u.username}</span>
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>
      )}
      {multiple && (
        <p className="mt-1.5 text-[11px] text-ink-3 num">{t('rewards.admin.picker.count', { n: value.length, max })}</p>
      )}
    </div>
  );
}
