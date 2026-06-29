'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Search, Filter, Shield, Swords, Crosshair, Zap, Target, Heart } from 'lucide-react';
import { MLBB_ROLES, MLBB_HEROES } from '@/lib/constants';
import { api } from '@/lib/api';

const roleIcons: Record<string, any> = { tank: Shield, fighter: Swords, assassin: Crosshair, mage: Zap, marksman: Target, support: Heart };

const heroDescriptions: Record<string, string> = {
  Tigreal: 'Tank protecteur avec contrôle de foule', Akai: 'Tank agile avec saut', Franco: 'Tank hook master',
  Minotaur: 'Tank support avec heal', Lolita: 'Tank support avec bouclier', Gatotkaca: 'Tank lourd avec CC',
  Hylos: 'Tank mana-based', Uranus: 'Tank régénératif', Belerick: 'Tank reflect damage',
  Khufra: 'Tank anti-dash', Esmeralda: 'Tank/mage hybride', Atlas: 'Tank engage CC',
  Barats: 'Tank qui grossit', Gloo: 'Tank split', Edith: 'Tank/marksman',
  Alucard: 'Fighter lifesteal', Balmond: 'Fighter tanky', Bane: 'Fighter AoE',
  Freya: 'Fighter combo', Chou: 'Fighter CC', Sun: 'Fighter clone',
  Alpha: 'Fighter true damage', 'Lapu-Lapu': 'Fighter AoE', Jawhead: 'Fighter throw',
  Martis: 'Fighter anti-CC', Aldous: 'Fighter scaling', Leomord: 'Fighter mounted',
  Thamuz: 'Fighter DPS', Masha: 'Fighter split push', 'Yu Zhong': 'Fighter dragon',
  Paquito: 'Fighter combo', Phoveus: 'Fighter anti-dash', Aulus: 'Fighter AoE',
  Yin: 'Fighter 1v1', Julian: 'Fighter/mage', Arlott: 'Fighter dash', Cici: 'Fighter yo-yo',
  Saber: 'Assassin burst', Karina: 'Assassin reset', Fanny: 'Assassin mobility',
  Hayabusa: 'Assassin split', Natalia: 'Assassin stealth', Lancelot: 'Assassin iframe',
  Helcurt: 'Assassin silence', Gusion: 'Assassin combo', Hanzo: 'Assassin soul',
  Ling: 'Assassin wall', Benedetta: 'Assassin dash', Aamon: 'Assassin stealth',
  Joy: 'Assassin rhythm', Nolan: 'Assassin rift',
  Eudora: 'Mage burst', Alice: 'Mage sustain', Gord: 'Mage poke',
  Kagura: 'Mage combo', Cyclops: 'Mage lockdown', Vexana: 'Mage puppet',
  Aurora: 'Mage freeze', Odette: 'Mage AoE', Pharsa: 'Mage long range',
  Lylia: 'Mage bomb', 'Luo Yi': 'Mage swap', Yve: 'Mage grid',
  Valentina: 'Mage copy', Xavier: 'Mage laser', Novaria: 'Mage vision', Zhuxin: 'Mage pull',
  Miya: 'Marksman AoE', Layla: 'Marksman range', Bruno: 'Marksman crit',
  Clint: 'Marksman poke', 'Yi Sun-shin': 'Marksman global', Moskov: 'Marksman pierce',
  Karrie: 'Marksman true damage', Irithel: 'Marksman mobile', Lesley: 'Marksman sniper',
  Hanabi: 'Marksman lifesteal', Claude: 'Marksman AoE', Kimmy: 'Marksman hybrid',
  Granger: 'Marksman burst', Wanwan: 'Marksman reset', Brody: 'Marksman stack',
  Beatrix: 'Marksman multi-weapon', Melissa: 'Marksman puppet', Ixia: 'Marksman zone',
  Rafaela: 'Support speed/heal', Estes: 'Support heal', Diggie: 'Support anti-CC',
  Angela: 'Support attach', Carmilla: 'Support link', Mathilda: 'Support dash',
  Floryn: 'Support global heal', Faramis: 'Support revive',
};

const heroColors: Record<string, string> = {
  tank: 'from-blue-600 to-blue-800', fighter: 'from-red-600 to-red-800',
  assassin: 'from-purple-600 to-purple-800', mage: 'from-orange-600 to-orange-800',
  marksman: 'from-green-600 to-green-800', support: 'from-teal-600 to-teal-800',
};

const roleEmoji: Record<string, string> = {
  tank: '🛡️', fighter: '⚔️', assassin: '🗡️', mage: '🔮', marksman: '🏹', support: '💚',
};

export default function Heroes() {
  const [selectedRole, setSelectedRole] = useState('all');
  const [search, setSearch] = useState('');
  const [hoveredHero, setHoveredHero] = useState<string | null>(null);
  const [heroes, setHeroes] = useState<any[]>([]);

  useEffect(() => {
    api.heroes.list().then((data: any[]) => {
      if (Array.isArray(data) && data.length > 0) {
        // Données du backend (avec image officielle)
        setHeroes(
          data.map((h: any) => ({
            name: h.name,
            role: h.role,
            image: h.image,
            description: h.description || heroDescriptions[h.name] || `${(h.role || '').charAt(0).toUpperCase() + (h.role || '').slice(1)} hero`,
            color: heroColors[h.role] || 'from-gray-600 to-gray-800',
          })),
        );
      } else {
        // Repli : on construit la galerie depuis la liste statique des héros
        const built: any[] = [];
        Object.entries(MLBB_HEROES).forEach(([role, names]) => {
          (names as string[]).forEach((name) => {
            built.push({
              name,
              role,
              image: undefined,
              description: heroDescriptions[name] || `${role.charAt(0).toUpperCase() + role.slice(1)} hero`,
              color: heroColors[role],
            });
          });
        });
        setHeroes(built);
      }
    });
  }, []);

  const allHeroes = useMemo(() => {
    return [...heroes].sort((a, b) => a.name.localeCompare(b.name));
  }, [heroes]);

  const filtered = useMemo(() => {
    return allHeroes.filter((h) => {
      const matchSearch = h.name.toLowerCase().includes(search.toLowerCase());
      const matchRole = selectedRole === 'all' || h.role === selectedRole;
      return matchSearch && matchRole;
    });
  }, [allHeroes, search, selectedRole]);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allHeroes.length };
    MLBB_ROLES.forEach((r) => {
      counts[r.id] = allHeroes.filter((h) => h.role === r.id).length;
    });
    return counts;
  }, [allHeroes]);

  return (
    <div className="space-y-6 p-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
          <Sparkles className="text-neon-gold" size={36} /> Galerie des Héros MLBB
        </h1>
        <p className="text-gray-400 mt-2">{allHeroes.length} héros disponibles • Explorez et découvrez votre main</p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un héros..." className="w-full pl-10 pr-4 py-3 bg-gaming-card border border-gaming-border rounded-xl text-white placeholder-gray-500 focus:border-neon-blue focus:outline-none" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setSelectedRole('all')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedRole === 'all' ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30' : 'bg-gaming-card text-gray-400 border border-gaming-border hover:text-white'}`}>
          <Filter size={14} /> Tous <span className="text-xs opacity-60">({roleCounts.all})</span>
        </button>
        {MLBB_ROLES.map((role) => {
          const Icon = roleIcons[role.id] || Shield;
          return (
            <button key={role.id} onClick={() => setSelectedRole(role.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedRole === role.id ? 'border' : 'bg-gaming-card text-gray-400 border border-gaming-border hover:text-white'}`} style={selectedRole === role.id ? { backgroundColor: role.color + '20', color: role.color, borderColor: role.color + '40' } : {}}>
              <Icon size={14} /> {role.name} <span className="text-xs opacity-60">({roleCounts[role.id]})</span>
            </button>
          );
        })}
      </div>

      <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        <AnimatePresence>
          {filtered.map((hero, i) => (
            <motion.div
              key={hero.name}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: Math.min(i * 0.02, 0.5), type: 'spring', stiffness: 300, damping: 25 }}
              onMouseEnter={() => setHoveredHero(hero.name)}
              onMouseLeave={() => setHoveredHero(null)}
              className="group relative cursor-pointer"
            >
              <div className={`relative overflow-hidden rounded-xl border border-gaming-border bg-gradient-to-br ${hero.color} aspect-[3/4] transition-all duration-300 ${hoveredHero === hero.name ? 'border-white/30 shadow-lg shadow-white/10 scale-105' : 'hover:border-white/20'}`}>
                {hero.image ? (
                  <img
                    src={hero.image}
                    alt={hero.name}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl opacity-20">{roleEmoji[hero.role] || '💚'}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-bold text-sm truncate">{hero.name}</p>
                  <p className="text-gray-300 text-xs capitalize">{hero.role}</p>
                </div>
                {hoveredHero === hero.name && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/60 flex items-center justify-center p-3">
                    <p className="text-white text-xs text-center">{hero.description}</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <Sparkles size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">Aucun héros trouvé</p>
          <p className="text-gray-500 text-sm mt-1">Essayez un autre filtre</p>
        </motion.div>
      )}
    </div>
  );
}
