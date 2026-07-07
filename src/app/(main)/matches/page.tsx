'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Swords, Star, Trophy } from 'lucide-react';
import { Card, Badge, Tabs, PageHeader, SectionCard, EmptyState, LoadingSpinner } from '@/components/ui';
import { api, avatarSrc } from '@/lib/api';
import { formatDate } from '@/lib/helpers';

const TYPE_LABEL: Record<string, string> = {
  friendly: 'Amical',
  training: 'Entraînement',
  official: 'Officiel',
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'À venir',
  live: 'En direct',
  completed: 'Terminé',
};

export default function Matches() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);

  useEffect(() => {
    api.esport
      .matches()
      .then((l: any) => setMatches(Array.isArray(l) ? l : []))
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = matches.filter((m: any) => {
    if (activeTab === 'completed') return m.status === 'completed';
    if (activeTab === 'upcoming') return m.status !== 'completed';
    return true;
  });

  const match = selectedMatch ? matches.find((m: any) => m.id === selectedMatch) : null;

  const teamName = (t: any) => t?.name || '?';

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Swords size={28} />}
        title="Matchs"
        subtitle="Historique et suivi des matchs e-sport"
        variant="blue"
      />

      <SectionCard className="!p-4">
        <Tabs
          tabs={[
            { id: 'all', label: 'Tous' },
            { id: 'completed', label: 'Terminés' },
            { id: 'upcoming', label: 'À venir' },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
      </SectionCard>

      {loading ? (
        <LoadingSpinner size="lg" className="py-24" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {filtered.map((m: any, index: number) => {
              const done = m.status === 'completed';
              const aWon = done && m.winner?.id === m.teamA?.id;
              const bWon = done && m.winner?.id === m.teamB?.id;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.06, 0.4) }}
                >
                  <Card
                    className={`cursor-pointer ${selectedMatch === m.id ? 'border-primary shadow-lg' : ''}`}
                    onClick={() => setSelectedMatch(m.id)}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <Badge variant={done ? 'green' : 'neon'} size="sm">
                        {STATUS_LABEL[m.status] || m.status}
                      </Badge>
                      <span className="text-xs text-body dark:text-bodydark">
                        {m.scheduledAt ? formatDate(m.scheduledAt) : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex-1 text-center">
                        <p className={`mb-1 font-bold ${aWon ? 'text-success' : 'text-black dark:text-white'}`}>
                          {teamName(m.teamA)}
                        </p>
                        <p className={`text-3xl font-black ${aWon ? 'text-success' : done && !aWon ? 'text-danger' : 'text-primary'}`}>
                          {m.scoreA ?? 0}
                        </p>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="rounded-sm bg-gray-2 px-4 py-2 text-xs font-black text-body dark:bg-meta-4 dark:text-bodydark">
                          VS
                        </div>
                      </div>

                      <div className="flex-1 text-center">
                        <p className={`mb-1 font-bold ${bWon ? 'text-success' : 'text-black dark:text-white'}`}>
                          {teamName(m.teamB)}
                        </p>
                        <p className={`text-3xl font-black ${bWon ? 'text-success' : done && !bWon ? 'text-danger' : 'text-meta-5'}`}>
                          {m.scoreB ?? 0}
                        </p>
                      </div>
                    </div>

                    <div className="text-center mt-4">
                      <Badge variant="purple" size="sm">{TYPE_LABEL[m.type] || m.type}</Badge>
                    </div>
                  </Card>
                </motion.div>
              );
            })}

            {filtered.length === 0 && (
              <EmptyState
                icon={<Swords size={28} />}
                title="Aucun match"
                description="Aucun match ne correspond à ce filtre pour le moment."
              />
            )}
          </div>

          <div>
            {match ? (
              <Card>
                <h3 className="mb-4 text-lg font-bold text-black dark:text-white">Détails du match</h3>

                <div className="mb-4 flex items-center justify-between rounded-sm bg-gray-2 p-3 dark:bg-meta-4">
                  <div className="flex items-center gap-2 min-w-0">
                    {match.teamA?.logo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarSrc(match.teamA.logo, 48)} alt="" className="h-8 w-8 rounded-sm object-cover" />
                    )}
                    <span className="truncate text-sm font-medium text-black dark:text-white">{teamName(match.teamA)}</span>
                  </div>
                  <span className="px-3 text-lg font-black text-black dark:text-white">
                    {match.scoreA ?? 0} – {match.scoreB ?? 0}
                  </span>
                  <div className="flex items-center gap-2 min-w-0 justify-end">
                    <span className="truncate text-sm font-medium text-black dark:text-white">{teamName(match.teamB)}</span>
                    {match.teamB?.logo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarSrc(match.teamB.logo, 48)} alt="" className="h-8 w-8 rounded-sm object-cover" />
                    )}
                  </div>
                </div>

                {match.winner && (
                  <div className="mb-4 flex items-center gap-3 rounded-sm border border-warning/20 bg-warning/10 p-3">
                    <Trophy size={20} className="text-warning" />
                    <span className="font-bold text-black dark:text-white">{teamName(match.winner)}</span>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-body dark:text-bodydark">Type</span>
                    <span className="text-black dark:text-white">{TYPE_LABEL[match.type] || match.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body dark:text-bodydark">Statut</span>
                    <span className="text-black dark:text-white">{STATUS_LABEL[match.status] || match.status}</span>
                  </div>
                  {match.scheduledAt && (
                    <div className="flex justify-between">
                      <span className="text-body dark:text-bodydark">Date</span>
                      <span className="text-black dark:text-white">{formatDate(match.scheduledAt)}</span>
                    </div>
                  )}
                </div>

                {match.notes && (
                  <p className="mt-4 border-t border-stroke pt-4 text-sm text-body dark:border-strokedark dark:text-bodydark">
                    {match.notes}
                  </p>
                )}
              </Card>
            ) : (
              <Card>
                <div className="py-8 text-center">
                  <Star className="mx-auto mb-3 h-10 w-10 text-bodydark2" />
                  <p className="text-sm text-body dark:text-bodydark">
                    Sélectionnez un match pour voir les détails
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
