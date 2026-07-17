'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScrollText, Search, Ban, Trash2, Trophy, FileText, Shield, Crown, Edit } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader, SectionCard, Select, EmptyState } from '@/components/ui';
import { useT } from '@/lib/i18n';

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

const actionLabelKeys: Record<string, string> = {
  user_ban: 'admin.logs.action.user_ban', user_unban: 'admin.logs.action.user_unban', user_delete: 'admin.logs.action.user_delete',
  user_promote: 'admin.logs.action.user_promote', tournament_create: 'admin.logs.action.tournament_create', tournament_delete: 'admin.logs.action.tournament_delete',
  post_delete: 'admin.logs.action.post_delete', team_delete: 'admin.logs.action.team_delete', team_edit: 'admin.logs.action.team_edit',
};

export default function AdminLogs() {
  const t = useT();
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const actionLabel = (a: string) => (actionLabelKeys[a] ? t(actionLabelKeys[a]) : a);

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
      <PageHeader
        icon={<ScrollText size={28} />}
        title={t('admin.logs.title')}
        subtitle={`${filtered.length} ${t('admin.logs.entries')}`}
        variant="default"
      />

      {/* Filtres */}
      <SectionCard className="!p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-bodydark2 z-10" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('admin.logs.searchPlaceholder')} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stroke bg-gray-2 text-black placeholder-bodydark2 focus:border-primary focus:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white" />
          </div>
          <Select value={actionFilter} onChange={(e: any) => setActionFilter(e.target.value)} className="sm:w-64">
            <option value="all">{t('admin.logs.allActions')}</option>
            {uniqueActions.map((a: any) => <option key={a} value={a}>{actionLabel(a)}</option>)}
          </Select>
        </div>
      </SectionCard>

      {/* Liste des logs */}
      <div className="space-y-3">
        {filtered.map((log: any, i: number) => {
          const config = actionIcons[log.action] || { icon: FileText, color: 'text-gray-400', bg: 'bg-gray-500/20' };
          const Icon = config.icon;
          return (
            <motion.div key={log.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-sm shadow-default p-4 flex items-center gap-4 transition-colors hover:border-primary">
              <div className={`p-3 rounded-lg ${config.bg}`}><Icon size={18} className={config.color} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-black dark:text-white font-medium">{actionLabel(log.action)}</p>
                <p className="text-body dark:text-bodydark text-sm truncate">{t('admin.logs.by')} <span className="text-primary">{log.admin}</span> → {log.target}</p>
                <p className="text-bodydark2 text-xs mt-1">{log.details}</p>
              </div>
              <p className="text-bodydark2 text-xs whitespace-nowrap">{(log.timestamp || '').split('T')[0]}</p>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <EmptyState icon={<ScrollText size={28} />} title={t('admin.logs.emptyTitle')} description={t('admin.logs.emptyDescription')} />
        )}
      </div>
    </div>
  );
}
