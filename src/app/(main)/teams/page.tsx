'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Shield, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';

interface EsportTeam {
  id: string;
  name: string;
  image?: string | null;
  memberCount?: number;
  isRecruiting?: boolean;
}

interface EsportOrg {
  name: string;
  logo?: string | null;
  color?: string | null;
  description?: string | null;
  teams?: EsportTeam[];
}

export default function TeamsPage() {
  const t = useT();
  const [org, setOrg] = useState<EsportOrg | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.esport
      .org()
      .then((o: any) => setOrg(o))
      .catch(() => setOrg(null))
      .finally(() => setLoading(false));
  }, []);

  const teams = org?.teams ?? [];
  const accent = org?.color || '#E9B84B';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((tm) => (tm.name || '').toLowerCase().includes(q));
  }, [teams, query]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('teams.title')}</h1>
          <p className="text-sm text-gray-400">
            {loading ? '…' : `${teams.length} ${t('teams.count')}`}
          </p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('teams.search')}
            className="pl-9 pr-3 py-2 w-full sm:w-64 text-sm rounded-lg bg-gaming-surface border border-gaming-border text-gray-200 placeholder-gray-500 focus:outline-none focus:border-neon-blue"
          />
        </div>
      </div>

      {org && (
        <div className="flex items-center gap-4 rounded-xl border border-gaming-border bg-gaming-surface/40 p-4 mb-6">
          {org.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={org.logo}
              alt={org.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-xl object-contain bg-gaming-dark p-1"
            />
          )}
          <div className="min-w-0">
            <h2 className="text-lg font-bold" style={{ color: accent }}>
              {org.name}
            </h2>
            {org.description && (
              <p className="text-sm text-gray-400 mt-0.5">{t('teams.orgDesc')}</p>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 rounded-full border-2 border-gaming-border border-t-neon-blue animate-spin" />
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-20 text-gray-500">{t('teams.empty')}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">{t('teams.none')}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tm, i) => (
            <motion.div
              key={tm.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.4) }}
            >
              <Link
                href={`/teams/${tm.id}`}
                className="group block rounded-xl border border-gaming-border bg-gaming-surface/40 overflow-hidden hover:border-neon-blue transition-colors"
              >
                <div className="relative aspect-video w-full bg-gaming-dark overflow-hidden">
                  {tm.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={tm.image}
                      alt={tm.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Shield size={40} className="text-gray-600" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-1" style={{ backgroundColor: accent }} />
                  {tm.isRecruiting && (
                    <span className="absolute top-2 right-2 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                      {t('teams.detail.recruiting')}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 p-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Shield size={16} style={{ color: accent }} className="shrink-0" />
                    <p className="text-sm font-semibold text-white truncate">{tm.name}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-400 shrink-0">
                    <Users size={13} /> {tm.memberCount ?? 0}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
