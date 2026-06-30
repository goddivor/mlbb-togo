'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { api, mlbbImg } from '@/lib/api';
import HeroDetailModal from '@/components/game/HeroDetailModal';

// Rôles MLBB (valeurs telles que renvoyées par l'API officielle) + libellés FR.
const ROLES: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'Tous' },
  { key: 'Tank', label: 'Tank' },
  { key: 'Fighter', label: 'Combattant' },
  { key: 'Assassin', label: 'Assassin' },
  { key: 'Mage', label: 'Mage' },
  { key: 'Marksman', label: 'Tireur' },
  { key: 'Support', label: 'Support' },
];

export default function HeroesPage() {
  const [heroes, setHeroes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    api.mlbb
      .heroes()
      .then((d: any) => setHeroes(d?.heroes || []))
      .catch(() => setHeroes([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return heroes.filter((h) => {
      const okRole = role === 'all' || (h.roles || []).includes(role);
      const okName = !q || (h.name || '').toLowerCase().includes(q);
      return okRole && okName;
    });
  }, [heroes, role, query]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Héros</h1>
          <p className="text-sm text-gray-400">
            {loading ? 'Chargement…' : `${heroes.length} héros · données officielles Mobile Legends`}
          </p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un héros…"
            className="pl-9 pr-3 py-2 w-full sm:w-64 text-sm rounded-lg bg-gaming-surface border border-gaming-border text-gray-200 placeholder-gray-500 focus:outline-none focus:border-neon-blue"
          />
        </div>
      </div>

      {/* Onglets de rôle */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ROLES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRole(r.key)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              role === r.key
                ? 'bg-neon-blue text-white'
                : 'bg-gaming-surface text-gray-300 hover:text-white border border-gaming-border'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 rounded-full border-2 border-gaming-border border-t-neon-blue animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">Aucun héros trouvé.</div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {filtered.map((h, i) => (
            <motion.button
              key={h.heroId ?? i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.015, 0.4) }}
              onClick={() => setSelected(h.heroId)}
              className="group rounded-xl overflow-hidden border border-gaming-border bg-gaming-surface/40 hover:border-neon-blue transition-colors text-left"
            >
              <div className="aspect-square bg-gaming-dark overflow-hidden">
                {h.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mlbbImg(h.image, 160)}
                    alt={h.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-semibold text-white truncate">{h.name}</p>
                <p className="text-[10px] text-gray-400 truncate">{(h.roles || []).join(' · ')}</p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <HeroDetailModal heroId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
