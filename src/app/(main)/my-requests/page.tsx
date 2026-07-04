'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Inbox, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Badge, Button, PageHeader, EmptyState, LoadingSpinner } from '@/components/ui';

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
    <div className="space-y-6">
      <Link
        href="/teams"
        className="inline-flex items-center gap-1.5 text-sm text-body hover:text-black dark:text-bodydark dark:hover:text-white"
      >
        <ArrowLeft size={16} /> {t('teams.back')}
      </Link>

      <PageHeader icon={<Inbox size={28} />} title={t('requests.mine')} variant="blue" />

      {loading ? (
        <LoadingSpinner size="lg" className="py-24" />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<Inbox size={28} />}
          title={t('requests.none')}
          action={
            <Link href="/teams">
              <Button size="sm">
                <Plus size={16} /> {t('requests.propose')}
              </Button>
            </Link>
          }
        />
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
                className="rounded-sm border border-stroke bg-white shadow-default p-4 dark:border-strokedark dark:bg-boxdark"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-black dark:text-white truncate">{r.proposedName}</p>
                    </div>
                    {r.message && <p className="text-sm text-body dark:text-bodydark mt-1 whitespace-pre-line">{r.message}</p>}
                    {dateLabel && <p className="text-xs text-bodydark2 mt-2">{dateLabel}</p>}
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
