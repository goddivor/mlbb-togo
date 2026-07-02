'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Inbox, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Badge, Button } from '@/components/ui';

const STATUS_VARIANT: Record<string, any> = {
  pending: 'default',
  in_review: 'neon',
  approved: 'green',
  rejected: 'red',
};

export default function MyRequestsPage() {
  const t = useT();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.teamRequests
      .mine()
      .then((r: any) => setRequests(Array.isArray(r) ? r : []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <Link
        href="/teams"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-4"
      >
        <ArrowLeft size={16} /> {t('teams.back')}
      </Link>

      <div className="flex items-center gap-2 mb-6">
        <Inbox size={22} className="text-neon-blue" />
        <h1 className="text-2xl font-bold text-white">{t('requests.mine')}</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 rounded-full border-2 border-gaming-border border-t-neon-blue animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">{t('requests.none')}</p>
          <Link href="/teams">
            <Button size="sm">
              <Plus size={16} /> {t('requests.propose')}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r, i) => {
            let dateLabel = '';
            if (r.createdAt) {
              const d = new Date(r.createdAt);
              if (!isNaN(d.getTime())) dateLabel = d.toLocaleDateString();
            }
            return (
              <motion.div
                key={r.id ?? i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="rounded-xl border border-gaming-border bg-gaming-surface/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-white truncate">{r.proposedName}</p>
                    </div>
                    {r.message && <p className="text-sm text-gray-400 mt-1 whitespace-pre-line">{r.message}</p>}
                    {dateLabel && <p className="text-xs text-gray-500 mt-2">{dateLabel}</p>}
                  </div>
                  <Badge variant={STATUS_VARIANT[r.status] || 'default'} size="sm">
                    {t('requests.status.' + r.status)}
                  </Badge>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
