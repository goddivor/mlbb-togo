'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gamepad2, Users, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Card, Button, PageHeader, Badge, EmptyState, LoadingSpinner } from '@/components/ui';

const statusVariant: Record<string, string> = {
  draft: 'default',
  registration: 'green',
  closed: 'default',
  drafted: 'blue',
  ongoing: 'purple',
  completed: 'gold',
};

export default function DraftBoardPage() {
  const t = useT();
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

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Gamepad2 size={28} />}
        title={t('draft.title')}
        subtitle={t('draft.subtitle')}
        variant="purple"
      />

      {loading ? (
        <LoadingSpinner size="lg" className="py-24" />
      ) : tournaments.length === 0 ? (
        <EmptyState icon={<Gamepad2 size={28} />} title={t('draft.empty')} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tournaments.map((tour) => (
            <Card key={tour.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-black dark:text-white">{tour.name}</h3>
                {tour.registered && (
                  <Badge variant="green" size="sm">
                    {t('draft.registered')}
                  </Badge>
                )}
              </div>

              {tour.description && (
                <p className="text-sm text-body dark:text-bodydark line-clamp-3">{tour.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                {tour.category && (
                  <Badge variant="blue" size="sm">
                    {tour.category}
                  </Badge>
                )}
                <Badge variant={statusVariant[tour.status] || 'default'} size="sm">
                  {t('draft.status.' + tour.status)}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                <Users size={15} />
                {t('draft.registeredCount', { count: tour.registeredCount ?? 0 })}
              </div>

              <div className="mt-auto pt-1">
                <Link href={`/draft/${tour.id}`}>
                  <Button size="sm" variant="secondary" className="w-full">
                    {t('draft.viewBracket')} <ArrowRight size={15} />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
