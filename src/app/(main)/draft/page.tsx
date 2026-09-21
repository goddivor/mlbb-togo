'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Gamepad2, Users, ArrowRight, DoorOpen, UserCheck, Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { fadeUp, stagger, still } from '@/lib/motion';
import { Card, Button, PageHeader, Badge, EmptyState, Skeleton, StatCard } from '@/components/ui';

const statusVariant: Record<string, string> = {
  draft: 'default',
  registration: 'green',
  closed: 'default',
  drafted: 'blue',
  ongoing: 'purple',
  completed: 'gold',
};

const STATUS_ACCENT: Record<string, 'cyan' | 'violet' | 'gold' | 'red' | 'green' | undefined> = {
  registration: 'green',
  drafted: 'cyan',
  ongoing: 'violet',
  completed: 'gold',
};

export default function DraftBoardPage() {
  const t = useT();
  const reduce = useReducedMotion();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await api.draft.list();
        setTournaments(Array.isArray(data) ? data : []);
      } catch {
        setTournaments([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openCount = tournaments.filter((x) => x.status === 'registration').length;
  const mineCount = tournaments.filter((x) => x.registered).length;
  const playersCount = tournaments.reduce((acc, x) => acc + (x.registeredCount ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Gamepad2 size={20} />}
        eyebrow={t('draft.eyebrow')}
        title={t('draft.title')}
        subtitle={t('draft.subtitle')}
        variant="purple"
      >
        <StatCard label={t('draft.kpi.total')} value={tournaments.length} icon={<Trophy size={18} />} accent="violet" />
        <StatCard label={t('draft.kpi.open')} value={openCount} icon={<DoorOpen size={18} />} accent="green" />
        <StatCard label={t('draft.kpi.players')} value={playersCount} icon={<Users size={18} />} accent="cyan" />
        <StatCard label={t('draft.kpi.mine')} value={mineCount} icon={<UserCheck size={18} />} accent="gold" />
      </PageHeader>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <Skeleton className="mb-3 h-6 w-2/3" />
              <Skeleton lines={3} />
            </Card>
          ))}
        </div>
      ) : tournaments.length === 0 ? (
        <EmptyState icon={<Gamepad2 size={28} />} title={t('draft.empty')} className="min-h-[40vh]" />
      ) : (
        <motion.div
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
          variants={reduce ? still : stagger(0.05)}
          initial="hidden"
          animate="visible"
        >
          {tournaments.map((tour) => (
            <motion.div key={tour.id} variants={reduce ? still : fadeUp} className="h-full">
              <Card hover accent={STATUS_ACCENT[tour.status]} className="flex h-full flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant={statusVariant[tour.status] || 'default'} size="sm" pulse={tour.status === 'ongoing'}>
                        {t('draft.status.' + tour.status)}
                      </Badge>
                      {tour.category && (
                        <Badge variant="outline" size="sm">
                          {tour.category}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-display text-xl font-bold tracking-tight2 text-ink-1">{tour.name}</h3>
                  </div>
                  {tour.registered && (
                    <Badge variant="green" size="sm" dot className="shrink-0">
                      {t('draft.registered')}
                    </Badge>
                  )}
                </div>

                {tour.description && <p className="line-clamp-3 text-sm text-ink-2">{tour.description}</p>}

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-line-subtle pt-4">
                  <p className="inline-flex items-center gap-1.5 text-sm num text-ink-2">
                    <Users size={15} className="text-ink-3" />
                    <span className="font-display text-lg font-bold leading-none text-ink-1">{tour.registeredCount ?? 0}</span>
                    {t('draft.kpi.players').toLowerCase()}
                  </p>
                  <Link href={`/draft/${tour.id}`} className="shrink-0">
                    <Button size="sm" variant="secondary" className="whitespace-nowrap">
                      {t('draft.viewBracket')} <ArrowRight size={15} />
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
