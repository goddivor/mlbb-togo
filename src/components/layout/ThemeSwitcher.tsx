'use client';

import { useEffect, useRef, useState } from 'react';
import { Palette, Check, Sparkles, Zap, Crown, Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/useStore';
import { useT } from '@/lib/i18n';

const PALETTES: { id: string; labelKey: string; icon: any; color: string }[] = [
  { id: 'default', labelKey: 'theme.default', icon: Sparkles, color: '#3C50E0' },
  { id: 'neon', labelKey: 'theme.neon', icon: Zap, color: '#00d4ff' },
  { id: 'gold', labelKey: 'theme.gold', icon: Crown, color: '#d4a843' },
  { id: 'night', labelKey: 'theme.night', icon: Moon, color: '#c4a868' },
];

export default function ThemeSwitcher() {
  const t = useT();
  const palette = useThemeStore((s: any) => s.palette);
  const setPalette = useThemeStore((s: any) => s.setPalette);
  const theme = useThemeStore((s: any) => s.theme);
  const toggleTheme = useThemeStore((s: any) => s.toggleTheme);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Re-apply the saved palette class on mount (in case of client navigation).
  useEffect(() => {
    if (palette && palette !== 'default') setPalette(palette);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('theme.display')}
        aria-expanded={open}
        className="header-btn"
      >
        <Palette size={17} />
      </button>

      {open && (
        <div className="header-menu absolute right-0 mt-2.5 w-56 overflow-hidden">
          {/* Light / dark toggle */}
          <div className="border-b border-line-subtle p-1.5">
            <button
              type="button"
              onClick={() => toggleTheme()}
              className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-sm text-ink-2 transition-colors duration-fast hover:bg-surface-2"
            >
              <span className="flex items-center gap-2 text-ink-1">
                {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                {theme === 'dark' ? t('theme.dark') : t('theme.light')}
              </span>
              <span
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                  theme === 'dark' ? 'bg-primary' : 'bg-stroke'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                    theme === 'dark' ? 'left-[18px]' : 'left-0.5'
                  }`}
                />
              </span>
            </button>
          </div>
          <p className="px-4 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-eyebrow text-ink-3">{t('theme.display')}</p>
          <ul className="pb-1.5">
            {PALETTES.map((p) => {
              const Icon = p.icon;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setPalette(p.id);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-ink-2 transition-colors duration-fast hover:bg-surface-2"
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded cut-corners-sm"
                      style={{ background: `${p.color}1f`, color: p.color }}
                    >
                      <Icon size={14} />
                    </span>
                    <span className="flex-1 text-ink-1">{t(p.labelKey)}</span>
                    {(palette || 'default') === p.id && <Check size={15} className="text-primary" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
