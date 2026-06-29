'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Swords, Clock, Star, TrendingUp, BarChart3,
} from 'lucide-react';
import { Card, Badge, Tabs, StatCard } from '@/components/ui';
import { useThemeStore, useMatchStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/helpers';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Filler, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

export default function Matches() {
  const { theme } = useThemeStore();
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-2xl md:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          <Swords className="inline w-8 h-8 mr-2 text-neon-blue" />
          Matchs
        </h1>
        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          Historique et suivi des matchs
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Matchs joués" value={matches.filter((m: any) => m.status === 'completed').length} icon={<Swords size={16} />} />
        <StatCard label="Victoires" value={matches.filter((m: any) => m.status === 'completed' && m.team1.score > m.team2.score).length} icon={<TrendingUp size={16} />} trend={12} />
        <StatCard label="MVP obtenus" value={matches.filter((m: any) => m.mvp).length} icon={<Star size={16} />} />
        <StatCard label="À venir" value={matches.filter((m: any) => m.status === 'upcoming').length} icon={<Clock size={16} />} />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'all', label: 'Tous' },
          { id: 'completed', label: 'Terminés' },
          { id: 'upcoming', label: 'À venir' },
        ]}
        active={activeTab}
        onChange={setActiveTab}
        className="mb-6"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Match List */}
        <div className="lg:col-span-2 space-y-4">
          {filtered.map((m: any, index: number) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`cursor-pointer ${selectedMatch === m.id ? 'border-neon-blue/50 shadow-neon' : ''}`}
                onClick={() => setSelectedMatch(m.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <Badge variant={m.status === 'completed' ? 'green' : 'neon'} size="sm">
                    {m.status === 'completed' ? '✅ Terminé' : '📅 À venir'}
                  </Badge>
                  <span className="text-xs text-gray-400">{formatDate(m.date)} • {m.tournament}</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 text-center">
                    <p className={`font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{m.team1.name}</p>
                    <p className={`text-3xl font-black ${
                      m.status === 'completed' && m.team1.score > m.team2.score ? 'text-green-400' :
                      m.status === 'completed' && m.team1.score < m.team2.score ? 'text-red-400' :
                      'text-neon-blue'
                    }`}>
                      {m.team1.score}
                    </p>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className={`px-4 py-2 rounded-xl text-xs font-black ${
                      theme === 'dark' ? 'bg-gaming-surface text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                      VS
                    </div>
                    {m.duration && (
                      <span className="text-xs text-gray-400 mt-1">{m.duration}</span>
                    )}
                  </div>

                  <div className="flex-1 text-center">
                    <p className={`font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{m.team2.name}</p>
                    <p className={`text-3xl font-black ${
                      m.status === 'completed' && m.team2.score > m.team1.score ? 'text-green-400' :
                      m.status === 'completed' && m.team2.score < m.team1.score ? 'text-red-400' :
                      'text-neon-purple'
                    }`}>
                      {m.team2.score}
                    </p>
                  </div>
                </div>

                {m.mvp && (
                  <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gaming-border">
                    <Star size={14} className="text-yellow-400" />
                    <span className="text-xs text-gray-400">MVP: <span className="text-yellow-400 font-medium">{m.mvp}</span></span>
                  </div>
                )}

                <div className="text-center mt-2">
                  <Badge variant="purple" size="sm">{m.format}</Badge>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Sidebar */}
        <div>
          {match ? (
            <Card>
              <h3 className={`font-bold text-lg mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Détails du match
              </h3>

              {match.games.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs text-gray-400 mb-3">Games ({match.format})</p>
                  <div className="space-y-2">
                    {match.games.map((game: any) => (
                      <div key={game.number} className="flex items-center justify-between p-2 rounded-lg bg-gaming-surface/50">
                        <span className="text-sm text-gray-300">Game {game.number}</span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={game.winner === match.team1.id ? 'green' : 'red'}
                            size="sm"
                          >
                            {game.winner === match.team1.id ? match.team1.name : match.team2.name}
                          </Badge>
                          <span className="text-xs text-gray-400">{game.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <p className="text-xs text-gray-400 mb-2">MVP</p>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <Star size={20} className="text-yellow-400" />
                  <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{match.mvp}</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-3">Performance</p>
                <div className="h-48">
                  <Line data={performanceChart} options={chartOptions} />
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-8">
                <BarChart3 className="w-10 h-10 mx-auto mb-3 text-gray-500" />
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
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
