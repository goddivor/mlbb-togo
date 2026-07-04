'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Swords, Star, BarChart3,
} from 'lucide-react';
import { Card, Badge, Tabs, PageHeader, SectionCard, EmptyState } from '@/components/ui';
import { useMatchStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/helpers';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Filler, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

export default function Matches() {
  const { matches, setMatches } = useMatchStore();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedMatch, setSelectedMatch] = useState<any>(null);

  useEffect(() => {
    api.matches.list().then(setMatches);
  }, [setMatches]);

  const filtered = matches.filter((m: any) => {
    if (activeTab === 'completed') return m.status === 'completed';
    if (activeTab === 'upcoming') return m.status === 'upcoming';
    return true;
  });

  const match = selectedMatch ? matches.find((m: any) => m.id === selectedMatch) : null;

  const performanceChart = {
    labels: ['Game 1', 'Game 2', 'Game 3', 'Game 4', 'Game 5', 'Game 6', 'Game 7', 'Game 8'],
    datasets: [
      {
        label: 'KDA',
        data: [5.2, 3.8, 7.1, 4.5, 6.3, 8.2, 4.1, 7.8],
        borderColor: '#00d4ff',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#00d4ff',
      },
      {
        label: 'Damage',
        data: [45, 38, 62, 41, 55, 70, 35, 65],
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#a855f7',
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#9ca3af', font: { size: 11 } } },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#6b7280', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#6b7280', font: { size: 11 } },
      },
    },
  };

  return (
    <div className="space-y-6">

      <PageHeader
        icon={<Swords size={28} />}
        title="Matchs"
        subtitle="Historique et suivi des matchs"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-4">
          {filtered.map((m: any, index: number) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`cursor-pointer ${selectedMatch === m.id ? 'border-primary shadow-lg' : ''}`}
                onClick={() => setSelectedMatch(m.id)}
              >
                <div className="mb-4 flex items-center justify-between">
                  <Badge variant={m.status === 'completed' ? 'green' : 'neon'} size="sm">
                    {m.status === 'completed' ? '✅ Terminé' : '📅 À venir'}
                  </Badge>
                  <span className="text-xs text-body dark:text-bodydark">{formatDate(m.date)} • {m.tournament}</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 text-center">
                    <p className="mb-1 font-bold text-black dark:text-white">{m.team1.name}</p>
                    <p className={`text-3xl font-black ${
                      m.status === 'completed' && m.team1.score > m.team2.score ? 'text-success' :
                      m.status === 'completed' && m.team1.score < m.team2.score ? 'text-danger' :
                      'text-primary'
                    }`}>
                      {m.team1.score}
                    </p>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="rounded-sm bg-gray-2 px-4 py-2 text-xs font-black text-body dark:bg-meta-4 dark:text-bodydark">
                      VS
                    </div>
                    {m.duration && (
                      <span className="mt-1 text-xs text-body dark:text-bodydark">{m.duration}</span>
                    )}
                  </div>

                  <div className="flex-1 text-center">
                    <p className="mb-1 font-bold text-black dark:text-white">{m.team2.name}</p>
                    <p className={`text-3xl font-black ${
                      m.status === 'completed' && m.team2.score > m.team1.score ? 'text-success' :
                      m.status === 'completed' && m.team2.score < m.team1.score ? 'text-danger' :
                      'text-meta-5'
                    }`}>
                      {m.team2.score}
                    </p>
                  </div>
                </div>

                {m.mvp && (
                  <div className="mt-4 flex items-center justify-center gap-2 border-t border-stroke pt-4 dark:border-strokedark">
                    <Star size={14} className="text-warning" />
                    <span className="text-xs text-body dark:text-bodydark">MVP: <span className="font-medium text-warning">{m.mvp}</span></span>
                  </div>
                )}

                <div className="text-center mt-2">
                  <Badge variant="purple" size="sm">{m.format}</Badge>
                </div>
              </Card>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <EmptyState
              icon={<Swords size={28} />}
              title="Aucun match"
              description="Aucun match ne correspond à ce filtre."
            />
          )}
        </div>

        <div>
          {match ? (
            <Card>
              <h3 className="mb-4 text-lg font-bold text-black dark:text-white">
                Détails du match
              </h3>

              {match.games.length > 0 && (
                <div className="mb-6">
                  <p className="mb-3 text-xs text-body dark:text-bodydark">Games ({match.format})</p>
                  <div className="space-y-2">
                    {match.games.map((game: any) => (
                      <div key={game.number} className="flex items-center justify-between rounded-sm bg-gray-2 p-2 dark:bg-meta-4">
                        <span className="text-sm text-body dark:text-bodydark">Game {game.number}</span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={game.winner === match.team1.id ? 'green' : 'red'}
                            size="sm"
                          >
                            {game.winner === match.team1.id ? match.team1.name : match.team2.name}
                          </Badge>
                          <span className="text-xs text-body dark:text-bodydark">{game.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <p className="mb-2 text-xs text-body dark:text-bodydark">MVP</p>
                <div className="flex items-center gap-3 rounded-sm border border-warning/20 bg-warning/10 p-3">
                  <Star size={20} className="text-warning" />
                  <span className="font-bold text-black dark:text-white">{match.mvp}</span>
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs text-body dark:text-bodydark">Performance</p>
                <div className="h-48">
                  <Line data={performanceChart} options={chartOptions} />
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="py-8 text-center">
                <BarChart3 className="mx-auto mb-3 h-10 w-10 text-bodydark2" />
                <p className="text-sm text-body dark:text-bodydark">
                  Sélectionnez un match pour voir les détails
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
