'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Inbox, Plus, Shield, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Badge, Button, Card, PageHeader, EmptyState, Skeleton, StatCard } from '@/components/ui';
import { fadeUp, stagger, still } from '@/lib/motion';

const STATUS_VARIANT: Record<string, any> = {
  pending: 'gold',
  in_review: 'neon',
  approved: 'green',
  rejected: 'red',
};

const STATUS_ACCENT: Record<string, 'gold' | 'cyan' | 'green' | 'red'> = {
  pending: 'gold',
  in_review: 'cyan',
  approved: 'green',
  rejected: 'red',
};

export default function MyRequestsPage() {
  const t = useT();
  const reduce = useReducedMotion();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.teamRequests
      .mine()
      .then((r: any) => setRequests(Array.isArray(r) ? r : []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, []);

  const count = (s: string) => requests.filter((r) => r.status === s).length;
  const waiting = count('pending') + count('in_review');

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/dashboard/teams" className="inline-flex items-center gap-1.5 text-sm text-ink-2 transition-colors hover:text-ink-1">
        <ArrowLeft size={16} /> {t('teams.back')}
      </Link>

      <PageHeader
        eyebrow={t('requests.eyebrow')}
        icon={<Inbox size={22} />}
        title={t('requests.mine')}
        variant="blue"
        action={
          <Link href="/dashboard/teams">
            <Button size="sm">
              <Plus size={16} /> {t('requests.propose')}
            </Button>
          </Link>
        }
      >
        <StatCard label={t('requests.kpi.total')} value={requests.length} icon={<Shield size={18} />} accent="cyan" />
        <StatCard label={t('requests.kpi.waiting')} value={waiting} icon={<Clock size={18} />} accent="gold" />
        <StatCard label={t('requests.status.approved')} value={count('approved')} icon={<CheckCircle2 size={18} />} accent="green" />
        <StatCard label={t('requests.status.rejected')} value={count('rejected')} icon={<XCircle size={18} />} accent="red" />
      </PageHeader>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="!p-4">
              <Skeleton lines={3} />
            </Card>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<Inbox size={28} />}
          title={t('requests.none')}
          description={t('requests.proposeHint')}
          action={
            <Link href="/dashboard/teams">
              <Button size="sm">
                <Plus size={16} /> {t('requests.propose')}
              </Button>
            </Link>
          }
        />
      ) : (
        <motion.div variants={reduce ? still : stagger(0.04)} initial="hidden" animate="visible" className="space-y-3">
          {requests.map((r, i) => {
            let dateLabel = '';
            if (r.createdAt) {
              const d = new Date(r.createdAt);
              if (!isNaN(d.getTime())) dateLabel = d.toLocaleDateString();
            }
            return (
              <motion.div key={r.id ?? i} variants={reduce ? still : fadeUp}>
                <Card hover accent={STATUS_ACCENT[r.status] ?? 'cyan'} className="!p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="eyebrow mb-1">{t('requests.proposedName')}</p>
                      <p className="truncate font-display text-lg font-bold tracking-tight2 text-ink-1">{r.proposedName}</p>
                      {r.message && <p className="mt-2 whitespace-pre-line text-sm text-ink-2">{r.message}</p>}
                      {dateLabel && <p className="mt-3 text-xs text-ink-3 num">{dateLabel}</p>}
                    </div>
                    <Badge variant={STATUS_VARIANT[r.status] || 'default'} size="sm" dot>
                      {t('requests.status.' + r.status)}
                    </Badge>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
