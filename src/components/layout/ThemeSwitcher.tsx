'use client';

import { useEffect, useRef, useState } from 'react';
import { Palette, Check, Sparkles, Zap, Crown, Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/useStore';

const PALETTES: { id: string; label: string; icon: any; color: string }[] = [
  { id: 'default', label: 'Défaut', icon: Sparkles, color: '#3C50E0' },
  { id: 'neon', label: 'Néon', icon: Zap, color: '#00d4ff' },
  { id: 'gold', label: 'Gold', icon: Crown, color: '#d4a843' },
  { id: 'night', label: 'Night', icon: Moon, color: '#c4a868' },
];

export default function ThemeSwitcher() {
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
        aria-label="Thème"
        className="flex h-12 w-12 items-center justify-center rounded-full border-[0.5px] border-stroke bg-gray text-black hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
      >
        <Palette size={18} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2.5 w-52 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          {/* Light / dark toggle */}
          <div className="border-b border-stroke px-2 pt-2 dark:border-strokedark">
            <button
              type="button"
              onClick={() => toggleTheme()}
              className="flex w-full items-center justify-between rounded-sm px-2 py-2 text-sm text-body hover:bg-gray-2 dark:text-bodydark dark:hover:bg-meta-4"
            >
              <span className="flex items-center gap-2 text-black dark:text-white">
                {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                {theme === 'dark' ? 'Sombre' : 'Clair'}
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
          <p className="px-4 py-2.5 text-xs font-medium text-bodydark2">Thème d’affichage</p>
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
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-body hover:bg-gray-2 dark:text-bodydark dark:hover:bg-meta-4"
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm"
                      style={{ background: `${p.color}1f`, color: p.color }}
                    >
                      <Icon size={14} />
                    </span>
                    <span className="flex-1 text-black dark:text-white">{p.label}</span>
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
