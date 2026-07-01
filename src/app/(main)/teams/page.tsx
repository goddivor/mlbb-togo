'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Shield, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';

interface EsportTeam {
  id: string;
  name: string;
  image?: string | null;
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
  const [preview, setPreview] = useState<EsportTeam | null>(null);

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
              <p className="text-sm text-gray-400 mt-0.5">{org.description}</p>
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
            <motion.button
              key={tm.id}
              type="button"
              onClick={() => tm.image && setPreview(tm)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.4) }}
              className="group text-left rounded-xl border border-gaming-border bg-gaming-surface/40 overflow-hidden hover:border-neon-blue transition-colors"
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
              </div>
              <div className="flex items-center gap-2 p-3">
                <Shield size={16} style={{ color: accent }} className="shrink-0" />
                <p className="text-sm font-semibold text-white truncate">{tm.name}</p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {preview && preview.image && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreview(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl w-full rounded-2xl overflow-hidden border border-gaming-border bg-gaming-darker"
            >
              <button
                type="button"
                onClick={() => setPreview(null)}
                aria-label={t('common.close')}
                className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/80 transition-colors"
              >
                <X size={20} />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.image}
                alt={preview.name}
                referrerPolicy="no-referrer"
                className="w-full max-h-[75vh] object-contain bg-black"
              />
              <div className="flex items-center gap-2 p-4">
                <Shield size={18} style={{ color: accent }} />
                <p className="font-bold text-white">{preview.name}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
