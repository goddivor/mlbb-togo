'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy, Calendar, Users, Play, ChevronRight,
  ExternalLink, Medal, Swords, Target,
} from 'lucide-react';
import { Card, Badge, Button, Tabs, PageHeader, SectionCard, EmptyState, ProgressBar } from '@/components/ui';
import { useTournamentStore, useTeamStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/helpers';

export default function Tournaments() {
  const { tournaments, setTournaments } = useTournamentStore();
  const { teams, setTeams } = useTeamStore();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedTournament, setSelectedTournament] = useState<any>(null);

  useEffect(() => {
    api.tournaments.list().then(setTournaments);
    api.teams.list().then(setTeams);
  }, [setTournaments, setTeams]);

  const filtered = tournaments.filter((t: any) => {
    if (activeTab === 'upcoming') return t.status === 'upcoming';
    if (activeTab === 'ongoing') return t.status === 'ongoing';
    if (activeTab === 'completed') return t.status === 'completed';
    return true;
  });

  const tournament = selectedTournament
    ? tournaments.find((t: any) => t.id === selectedTournament)
    : null;

  return (
    <div className="space-y-6">

      <PageHeader
        icon={<Trophy size={28} />}
        title="Tournois"
        subtitle="Participez aux tournois et montrez votre talent"
        variant="gold"
      />

      <SectionCard className="!p-4">
        <Tabs
          tabs={[
            { id: 'all', label: `Tous (${tournaments.length})` },
            { id: 'upcoming', label: 'À venir' },
            { id: 'ongoing', label: 'En cours' },
            { id: 'completed', label: 'Terminés' },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-4">
          {filtered.map((tour: any, index: number) => (
            <motion.div
              key={tour.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`cursor-pointer ${selectedTournament === tour.id ? 'border-primary shadow-lg' : ''}`}
                onClick={() => setSelectedTournament(tour.id)}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant={tour.status === 'ongoing' ? 'green' : tour.status === 'upcoming' ? 'neon' : 'default'} size="sm">
                        {tour.status === 'ongoing' ? '🔴 En cours' : tour.status === 'upcoming' ? '📅 À venir' : '✅ Terminé'}
                      </Badge>
                      <Badge variant="purple" size="sm">{tour.format}</Badge>
                    </div>
                    <h3 className="text-xl font-bold text-black dark:text-white">
                      {tour.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-warning">{tour.prizePool}</p>
                    <p className="text-xs text-body dark:text-bodydark">Prize Pool</p>
                  </div>
                </div>

                <p className="mb-4 text-sm text-body dark:text-bodydark">
                  {tour.description}
                </p>

                <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-body dark:text-bodydark">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {tour.startDate} - {tour.endDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    {tour.registeredTeams.length}/{tour.maxTeams} équipes
                  </span>
                  <span className="flex items-center gap-1">
                    <Swords size={14} />
                    {tour.organizer}
                  </span>
                </div>

                <div className="mb-4">
                  <ProgressBar value={tour.registeredTeams.length} max={tour.maxTeams} />
                  <p className="mt-1 text-xs text-body dark:text-bodydark">
                    {tour.registeredTeams.length}/{tour.maxTeams} inscrits
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {tour.registeredTeams.slice(0, 4).map((teamId: string) => {
                      const team = teams.find((t: any) => t.id === teamId);
                      return (
                        <div
                          key={teamId}
                          className="flex h-8 w-8 items-center justify-center rounded-sm border-2 border-white bg-primary text-xs font-bold text-white dark:border-boxdark"
                          title={team?.name}
                        >
                          {team?.tag || '?'}
                        </div>
                      );
                    })}
                    {tour.registeredTeams.length > 4 && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-sm border-2 border-white bg-gray-2 text-xs text-body dark:border-boxdark dark:bg-meta-4 dark:text-bodydark">
                        +{tour.registeredTeams.length - 4}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {tour.streamUrl && (
                      <Button variant="ghost" size="sm">
                        <Play size={14} />
                        Stream
                      </Button>
                    )}
                    <Button variant="secondary" size="sm">
                      Détails <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <EmptyState
              icon={<Trophy size={28} />}
              title="Aucun tournoi trouvé"
              description="Revenez bientôt pour de nouveaux tournois!"
            />
          )}
        </div>

        <div>
          {tournament ? (
            <Card>
              <h3 className="mb-4 text-lg font-bold text-black dark:text-white">
                {tournament.name}
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs text-body dark:text-bodydark">Format</p>
                  <Badge variant="neon">{tournament.format}</Badge>
                </div>

                <div>
                  <p className="mb-2 text-xs text-body dark:text-bodydark">Organisateur</p>
                  <p className="text-sm font-medium text-black dark:text-white">{tournament.organizer}</p>
                </div>

                <div>
                  <p className="mb-2 text-xs text-body dark:text-bodydark">Dates</p>
                  <p className="text-sm text-body dark:text-bodydark">
                    {formatDate(tournament.startDate)} → {formatDate(tournament.endDate)}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs text-body dark:text-bodydark">Prize Pool</p>
                  <p className="text-2xl font-bold text-warning">{tournament.prizePool}</p>
                </div>

                <div>
                  <p className="mb-2 text-xs text-body dark:text-bodydark">Équipes inscrites ({tournament.registeredTeams.length})</p>
                  <div className="space-y-2">
                    {tournament.registeredTeams.map((teamId: string) => {
                      const team = teams.find((t: any) => t.id === teamId);
                      return (
                        <div key={teamId} className="flex items-center gap-2 rounded-sm bg-gray-2 p-2 dark:bg-meta-4">
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-[10px] font-bold text-white">
                            {team?.tag}
                          </div>
                          <span className="text-sm text-black dark:text-white">{team?.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {tournament.status === 'upcoming' && (
                  <Button className="w-full">
                    <Target size={16} />
                    S&apos;inscrire
                  </Button>
                )}

                {tournament.streamUrl && (
                  <Button variant="secondary" className="w-full">
                    <ExternalLink size={16} />
                    Regarder le stream
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <Card>
              <div className="py-8 text-center">
                <Medal className="mx-auto mb-3 h-10 w-10 text-bodydark2" />
                <p className="text-sm text-body dark:text-bodydark">
                  Sélectionnez un tournoi pour voir les détails
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
