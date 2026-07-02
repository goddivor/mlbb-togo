'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import RoleIcon from './RoleIcon';

export default function RoleSelect({
  value,
  onChange,
  options,
  noneLabel,
  labelFor,
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  noneLabel: string;
  labelFor: (role: string) => string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg bg-gaming-surface border border-gaming-border text-gray-200 hover:border-neon-blue transition-colors disabled:opacity-50"
      >
        {value ? <RoleIcon role={value} size={14} /> : null}
        <span>{value ? labelFor(value) : noneLabel}</span>
        <ChevronDown size={12} className="text-gray-400" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 min-w-[11rem] max-h-64 overflow-y-auto rounded-lg border border-gaming-border bg-gaming-card shadow-2xl py-1">
          <button
            type="button"
            onClick={() => pick('')}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-gaming-surface transition-colors ${
              !value ? 'text-neon-blue' : 'text-gray-300'
            }`}
          >
            {noneLabel}
          </button>
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => pick(o)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-gaming-surface transition-colors ${
                value === o ? 'text-neon-blue' : 'text-gray-200'
              }`}
            >
              <RoleIcon role={o} size={16} /> {labelFor(o)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
