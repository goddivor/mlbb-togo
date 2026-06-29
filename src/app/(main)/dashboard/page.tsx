'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  TrendingUp, Trophy, Swords, Shield, Star, Target,
  Calendar, MessageSquare, ArrowUpRight, Flame, Crown,
} from 'lucide-react';
import { Card, Badge, StatCard, Button, Tabs, ProgressBar } from '@/components/ui';
import { useThemeStore } from '@/store/useStore';
import { api } from '@/lib/api';
import { calculateWinRate, formatDate } from '@/lib/helpers';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, ArcElement, Title, Tooltip, Filler, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Filler, Legend);

export default function Dashboard() {
  const { theme } = useThemeStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [currentPlayer, setCurrentPlayer] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    api.users.list().then((players: any[]) => setCurrentPlayer(players[0] || null));
    api.matches.list().then(setMatches);
    api.events.list().then(setEvents);
  }, []);

  if (!currentPlayer) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-10 h-10 rounded-full border-2 border-gaming-border border-t-neon-blue animate-spin" />
        </div>
      </div>
    );
  }

  const winRate = calculateWinRate(currentPlayer.wins, currentPlayer.losses);
  const recentMatches = matches.filter((m) => m.status === 'completed').slice(0, 5);

  const performanceData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
    datasets: [
      {
        label: 'Win Rate %',
        data: [65, 70, 68, 75, 72, parseFloat(winRate as string)],
        borderColor: '#00d4ff',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#00d4ff',
        pointBorderColor: '#00d4ff',
        pointRadius: 4,
      },
    ],
  };

  const roleDistribution = {
    labels: ['Assassin', 'Mage', 'Tank', 'Fighter', 'Marksman', 'Support'],
    datasets: [
      {
        data: [35, 25, 15, 12, 8, 5],
        backgroundColor: ['#9b59b6', '#e67e22', '#3498db', '#e74c3c', '#2ecc71', '#1abc9c'],
        borderColor: 'transparent',
        borderWidth: 0,
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#6b7280', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#6b7280', font: { size: 11 } },
        min: 0,
        max: 100,
      },
    },
  };

  const doughnutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#9ca3af', font: { size: 11 }, padding: 12, usePointStyle: true },
      },
    },
    cutout: '65%',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Bonjour, {currentPlayer.username} 👋
          </h1>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Voici votre tableau de bord MLBB Togo
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="neon" size="lg">
            <Crown size={14} className="mr-1" style={{ color: '#00d4ff' }} />
            {currentPlayer.rank.charAt(0).toUpperCase() + currentPlayer.rank.slice(1)}
          </Badge>
          <Badge variant="purple" size="lg">{currentPlayer.role}</Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Victoires"
          value={currentPlayer.wins}
          icon={<TrendingUp size={16} />}
          trend={5}
        />
        <StatCard
          label="Win Rate"
          value={`${winRate}%`}
          icon={<Target size={16} />}
          trend={2.3}
        />
        <StatCard
          label="MVP"
          value={currentPlayer.mvpCount}
          icon={<Star size={16} />}
        />
        <StatCard
          label="Série"
          value={`${currentPlayer.streak}🔥`}
          icon={<Flame size={16} />}
        />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp },
          { id: 'matches', label: 'Matchs', icon: Swords },
          { id: 'events', label: 'Événements', icon: Calendar },
        ]}
        active={activeTab}
        onChange={setActiveTab}
        className="mb-6"
      />

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Chart */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Performance</h3>
              <Badge variant="neon" size="sm">6 derniers mois</Badge>
            </div>
            <div className="h-64">
              <Line data={performanceData} options={chartOptions} />
            </div>
          </Card>

          {/* Role Distribution */}
          <Card>
            <h3 className={`font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Rôles joués</h3>
            <div className="h-56">
              <Doughnut data={roleDistribution} options={doughnutOptions} />
            </div>
          </Card>

          {/* Win/Loss Progress */}
          <Card>
            <h3 className={`font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Statistiques</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Victoires</span>
                  <span className="text-green-400 font-medium">{currentPlayer.wins}</span>
                </div>
                <ProgressBar value={parseFloat(winRate as string)} color="green" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Défaites</span>
                  <span className="text-red-400 font-medium">{currentPlayer.losses}</span>
                </div>
                <ProgressBar value={100 - parseFloat(winRate as string)} color="red" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">MVP Rate</span>
                  <span className="text-neon-blue font-medium">
                    {((currentPlayer.mvpCount / (currentPlayer.wins + currentPlayer.losses)) * 100).toFixed(1)}%
                  </span>
                </div>
                <ProgressBar value={(currentPlayer.mvpCount / (currentPlayer.wins + currentPlayer.losses)) * 100} color="neon-blue" />
              </div>
            </div>
          </Card>

          {/* Recent Matches */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Matchs récents</h3>
              <Link href="/matches">
                <Button variant="ghost" size="sm">Voir tout <ArrowUpRight size={14} /></Button>
              </Link>
            </div>
            <div className="space-y-3">
              {recentMatches.map((match) => (
                <div key={match.id} className={`flex items-center gap-4 p-3 rounded-lg border ${
                  theme === 'dark' ? 'border-gaming-border bg-gaming-surface/30' : 'border-gray-100 bg-gray-50'
                }`}>
                  <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    match.team1.score > match.team2.score
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {match.team1.score > match.team2.score ? 'WIN' : 'LOSS'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{match.team1.name}</span>
                      <span className="text-gray-500">vs</span>
                      <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{match.team2.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span>{match.tournament}</span>
                      <span>⏱️ {match.duration}</span>
                      <span>⭐ MVP: {match.mvp}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(match.date)}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <h3 className={`font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Actions rapides</h3>
            <div className="space-y-2">
              {[
                { label: 'Trouver une équipe', icon: Shield, link: '/teams', color: 'neon-blue' },
                { label: 'Rejoindre un tournoi', icon: Trophy, link: '/tournaments', color: 'neon-purple' },
                { label: 'Voir le forum', icon: MessageSquare, link: '/forum', color: 'neon-pink' },
                { label: 'Prochains événements', icon: Calendar, link: '/events', color: 'neon-green' },
              ].map((action) => (
                <Link key={action.label} href={action.link}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      theme === 'dark' ? 'hover:bg-gaming-surface' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-${action.color}/10 flex items-center justify-center`}>
                      <action.icon size={16} className={`text-${action.color}`} />
                    </div>
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{action.label}</span>
                    <ArrowUpRight size={14} className="ml-auto text-gray-500" />
                  </motion.div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'matches' && (
        <div className="space-y-4">
          {matches.map((match) => (
            <Card key={match.id}>
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 text-center md:text-right">
                  <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{match.team1.name}</p>
                  <p className="text-2xl font-black text-neon-blue">{match.team1.score}</p>
                </div>
                <div className="flex flex-col items-center">
                  <Badge variant={match.status === 'completed' ? 'green' : 'neon'} size="sm">
                    {match.status === 'completed' ? 'Terminé' : 'À venir'}
                  </Badge>
                  <span className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>VS</span>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{match.team2.name}</p>
                  <p className="text-2xl font-black text-neon-purple">{match.team2.score}</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
                <span>{match.tournament}</span>
                <span>⏱️ {match.duration || 'TBD'}</span>
                <span>📅 {formatDate(match.date)}</span>
                {match.mvp && <span>⭐ {match.mvp}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id}>
              <Badge variant={event.type === 'tournament' ? 'gold' : event.type === 'scrim' ? 'neon' : 'purple'} size="sm" className="mb-3">
                {event.type === 'tournament' ? '🏆' : event.type === 'scrim' ? '⚔️' : '📚'} {event.type}
              </Badge>
              <h3 className={`font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{event.title}</h3>
              <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{event.description}</p>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>📅 {event.date}</span>
                <span>🕐 {event.time}</span>
                <span>⏱️ {event.duration}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
