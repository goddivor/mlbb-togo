'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Crown, Users } from 'lucide-react';
import { Badge, Card, EmptyState, SectionTitle, Skeleton } from '@/components/ui';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';

type TeamEntry = {
  teamId: string;
  team?: { id: string; name: string; image?: string | null; type?: string } | null;
  seasons?: { id: string; name: string; number?: number | null }[];
  roles?: string[];
  isCaptain?: boolean;
  wasSubstitute?: boolean;
  isCurrent?: boolean;
};

/**
 * Teams the player played for, season by season (#162). A player can belong to
 * several teams over time, so the list says for each one which seasons he
 * played and whether he is still in it today.
 */
export default function PlayerTeamsSection({ userId }: { userId: string }) {
  const t = useT();
  const [teams, setTeams] = useState<TeamEntry[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    api.esport
      .playerTeams(userId)
      .then((r: any) => setTeams(Array.isArray(r?.teams) ? r.teams : []))
      .catch(() => setTeams([]))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <Skeleton className="h-28 w-full rounded-lg" />;
  if (!teams) return null;

  return (
    <Card className="space-y-4">
      <SectionTitle size="sm" title={t('players.teams.title')} />
      {teams.length === 0 ? (
        <EmptyState icon={<Users size={24} />} title={t('players.teams.empty')} />
      ) : (
        <ul className="space-y-2">
          {teams.map((entry) => {
            const name = entry.team?.name ?? entry.teamId;
            const seasons = entry.seasons ?? [];
            return (
              <li key={entry.teamId}>
                <Link
                  href={`/dashboard/teams/${entry.teamId}`}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-line-subtle bg-surface-1 p-2.5 transition-colors hover:border-line-strong"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded bg-surface-2">
                    {entry.team?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={entry.team.image}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Users size={14} className="text-ink-3" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-1">{name}</span>
                  {entry.isCaptain && (
                    <Badge variant="gold" size="sm" className="gap-1">
                      <Crown size={11} /> {t('players.teams.captain')}
                    </Badge>
                  )}
                  {entry.wasSubstitute && (
                    <Badge size="sm">{t('players.teams.substitute')}</Badge>
                  )}
                  <Badge variant={entry.isCurrent ? 'green' : 'default'} size="sm">
                    {entry.isCurrent ? t('players.teams.current') : t('players.teams.past')}
                  </Badge>
                  <span className="w-full text-xs text-ink-3 sm:w-auto">
                    {seasons.length
                      ? seasons.map((s) => s.name).join(', ')
                      : t('players.teams.noSeason')}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
