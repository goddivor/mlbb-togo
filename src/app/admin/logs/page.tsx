'use client';

import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ScrollText, Search, Ban, Trash2, Trophy, FileText, Shield, Crown, Edit, Plug, Images } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader, Card, Select, EmptyState } from '@/components/ui';
import { fadeUp, stagger, still } from '@/lib/motion';
import { useT } from '@/lib/i18n';

const actionIcons: Record<string, any> = {
  user_ban: { icon: Ban, color: 'text-accent-gold', bg: 'bg-accent-gold/15' },
  user_unban: { icon: Ban, color: 'text-accent-green', bg: 'bg-accent-green/10' },
  user_delete: { icon: Trash2, color: 'text-accent-red', bg: 'bg-accent-red/10' },
  user_promote: { icon: Crown, color: 'text-accent-gold', bg: 'bg-accent-gold/15' },
  tournament_create: { icon: Trophy, color: 'text-accent-cyan', bg: 'bg-accent-cyan/10' },
  tournament_delete: { icon: Trash2, color: 'text-accent-red', bg: 'bg-accent-red/10' },
  post_delete: { icon: FileText, color: 'text-accent-red', bg: 'bg-accent-red/10' },
  team_delete: { icon: Shield, color: 'text-accent-red', bg: 'bg-accent-red/10' },
  team_edit: { icon: Edit, color: 'text-accent-cyan', bg: 'bg-accent-cyan/10' },
  'integration.update': { icon: Plug, color: 'text-accent-violet', bg: 'bg-accent-violet/10' },
  'integration.remove': { icon: Plug, color: 'text-accent-red', bg: 'bg-accent-red/10' },
  'media.approve': { icon: Images, color: 'text-accent-green', bg: 'bg-accent-green/10' },
  'media.reject': { icon: Images, color: 'text-accent-gold', bg: 'bg-accent-gold/10' },
  'media.delete': { icon: Images, color: 'text-accent-red', bg: 'bg-accent-red/10' },
};

const actionLabelKeys: Record<string, string> = {
  user_ban: 'admin.logs.action.user_ban', user_unban: 'admin.logs.action.user_unban', user_delete: 'admin.logs.action.user_delete',
  user_promote: 'admin.logs.action.user_promote', tournament_create: 'admin.logs.action.tournament_create', tournament_delete: 'admin.logs.action.tournament_delete',
  post_delete: 'admin.logs.action.post_delete', team_delete: 'admin.logs.action.team_delete', team_edit: 'admin.logs.action.team_edit',
  'integration.update': 'admin.logs.action.integration.update',
  'integration.remove': 'admin.logs.action.integration.remove',
  'media.approve': 'admin.logs.action.media.approve',
  'media.reject': 'admin.logs.action.media.reject',
  'media.delete': 'admin.logs.action.media.delete',
};

export default function AdminLogs() {
  const t = useT();
  const reduce = useReducedMotion();
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
        eyebrow={t('nav.section.community')}
        title={t('admin.logs.title')}
        subtitle={<span className="num">{`${filtered.length} ${t('admin.logs.entries')}`}</span>}
        variant="default"
      />

      {/* Filters */}
      <Card className="!p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-ink-3" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.logs.searchPlaceholder')}
              className="w-full rounded border border-line-strong bg-surface-1 py-2.5 pl-10 pr-4 text-sm text-ink-1 placeholder:text-ink-3 outline-none transition-[border-color,box-shadow] duration-base focus:border-primary focus:ring-2 focus:ring-primary/25 dark:bg-surface-0/60"
            />
          </div>
          <Select value={actionFilter} onChange={(e: any) => setActionFilter(e.target.value)} className="!py-2.5 sm:w-64">
            <option value="all">{t('admin.logs.allActions')}</option>
            {uniqueActions.map((a: any) => <option key={a} value={a}>{actionLabel(a)}</option>)}
          </Select>
        </div>
      </Card>

      {/* Log list */}
      <motion.div className="space-y-2" variants={reduce ? still : stagger()} initial="hidden" animate="visible">
        {filtered.map((log: any) => {
          const config = actionIcons[log.action] || { icon: FileText, color: 'text-ink-2', bg: 'bg-surface-3' };
          const Icon = config.icon;
          return (
            <motion.div key={log.id} variants={reduce ? still : fadeUp}>
              <Card className="flex items-center gap-4 !p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded cut-corners-sm ${config.bg}`}>
                  <Icon size={18} className={config.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink-1">{actionLabel(log.action)}</p>
                  <p className="truncate text-sm text-ink-2">{t('admin.logs.by')} <span className="text-primary">{log.admin}</span> {'\u2192'} {log.target}</p>
                  {log.details && <p className="mt-1 text-xs text-ink-3">{log.details}</p>}
                </div>
                <p className="whitespace-nowrap text-xs text-ink-3 num">{(log.timestamp || '').split('T')[0]}</p>
              </Card>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <EmptyState icon={<ScrollText size={28} />} title={t('admin.logs.emptyTitle')} description={t('admin.logs.emptyDescription')} />
        )}
      </motion.div>
    </div>
  );
}
