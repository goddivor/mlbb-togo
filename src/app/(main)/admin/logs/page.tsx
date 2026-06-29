'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScrollText, Search, Ban, Trash2, Trophy, FileText, Shield, Crown, Edit } from 'lucide-react';
import { api } from '@/lib/api';

const actionIcons: Record<string, any> = {
  user_ban: { icon: Ban, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  user_unban: { icon: Ban, color: 'text-green-400', bg: 'bg-green-500/20' },
  user_delete: { icon: Trash2, color: 'text-red-400', bg: 'bg-red-500/20' },
  user_promote: { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  tournament_create: { icon: Trophy, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  tournament_delete: { icon: Trash2, color: 'text-red-400', bg: 'bg-red-500/20' },
  post_delete: { icon: FileText, color: 'text-red-400', bg: 'bg-red-500/20' },
  team_delete: { icon: Shield, color: 'text-red-400', bg: 'bg-red-500/20' },
  team_edit: { icon: Edit, color: 'text-blue-400', bg: 'bg-blue-500/20' },
};

const actionLabels: Record<string, string> = {
  user_ban: 'Suspension utilisateur', user_unban: 'Réactivation utilisateur', user_delete: 'Suppression utilisateur',
  user_promote: 'Promotion utilisateur', tournament_create: 'Création tournoi', tournament_delete: 'Suppression tournoi',
  post_delete: 'Suppression post', team_delete: 'Suppression équipe', team_edit: 'Modification équipe',
};

export default function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    api.admin.logs().then(setLogs);
  }, []);

  const filtered = logs.filter((l: any) => {
    const matchSearch =
      (l.target || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.admin || '').toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === 'all' || l.action === actionFilter;
    return matchSearch && matchAction;
  });

  const uniqueActions = [...new Set(logs.map((l: any) => l.action))];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3"><ScrollText className="text-orange-400" size={32} /> Logs Admin</h1>
        <p className="text-gray-400 mt-1">{filtered.length} entrées</p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher dans les logs..." className="w-full pl-10 pr-4 py-2.5 bg-gaming-card border border-gaming-border rounded-lg text-white placeholder-gray-500 focus:border-neon-blue focus:outline-none" />
        </div>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="px-4 py-2.5 bg-gaming-card border border-gaming-border rounded-lg text-white focus:border-neon-blue focus:outline-none">
          <option value="all">Toutes les actions</option>
          {uniqueActions.map((a: any) => <option key={a} value={a}>{actionLabels[a] || a}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((log: any, i: number) => {
          const config = actionIcons[log.action] || { icon: FileText, color: 'text-gray-400', bg: 'bg-gray-500/20' };
          const Icon = config.icon;
          return (
            <motion.div key={log.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="bg-gaming-card border border-gaming-border rounded-xl p-4 flex items-center gap-4 hover:border-orange-400/20 transition-all">
              <div className={`p-3 rounded-lg ${config.bg}`}><Icon size={18} className={config.color} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium">{actionLabels[log.action] || log.action}</p>
                <p className="text-gray-400 text-sm truncate">Par <span className="text-neon-blue">{log.admin}</span> → {log.target}</p>
                <p className="text-gray-500 text-xs mt-1">{log.details}</p>
              </div>
              <p className="text-gray-500 text-xs whitespace-nowrap">{(log.timestamp || '').split('T')[0]}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
