'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, Shield, Trophy, MessageSquare, TrendingUp, Activity, Eye, UserPlus, Zap } from 'lucide-react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { useAdminStore, useThemeStore } from '@/store/useStore';
import { api } from '@/lib/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const StatCard = ({ icon: Icon, label, value, trend, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay * 0.1 }}
    className="bg-gaming-card border border-gaming-border rounded-xl p-5 hover:border-neon-blue/30 transition-all group"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-400 text-sm mb-1">{label}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
        {trend && (
          <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
            <TrendingUp size={12} /> {trend}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color} group-hover:scale-110 transition-transform`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
  </motion.div>
);

const QuickAction = ({ icon: Icon, label, color, onClick }: any) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`flex items-center gap-3 p-3 rounded-lg border border-gaming-border hover:border-${color}/50 transition-all w-full text-left`}
  >
    <div className={`p-2 rounded-lg bg-${color}/20`}>
      <Icon size={16} className={`text-${color}`} />
    </div>
    <span className="text-sm text-gray-300">{label}</span>
  </motion.button>
);

export default function AdminDashboard() {
  const { stats, setStats } = useAdminStore();
  const { theme } = useThemeStore();
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const textColor = theme === 'dark' ? '#94a3b8' : '#64748b';

  useEffect(() => {
    api.admin.stats().then(setStats);
  }, [setStats]);

  const activityData = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    datasets: [
      { label: 'Connexions', data: [45, 52, 38, 67, 82, 95, 73], borderColor: '#00d4ff', backgroundColor: 'rgba(0,212,255,0.1)', fill: true, tension: 0.4 },
      { label: 'Inscriptions', data: [5, 8, 3, 12, 15, 22, 10], borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.1)', fill: true, tension: 0.4 },
    ],
  };

  const roleData = {
    labels: ['Tank', 'Fighter', 'Assassin', 'Mage', 'Marksman', 'Support'],
    datasets: [{ data: [15, 22, 14, 17, 18, 8], backgroundColor: ['#3498db', '#e74c3c', '#9b59b6', '#e67e22', '#2ecc71', '#1abc9c'], borderWidth: 0 }],
  };

  const tournamentData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
    datasets: [{ label: 'Tournois', data: [2, 3, 4, 5, 3, 6], backgroundColor: 'rgba(0,212,255,0.6)', borderRadius: 6 }],
  };

  const recentActivity = [
    { icon: UserPlus, text: 'Nouveau joueur: GoldLane_King', time: '5min', color: 'text-green-400' },
    { icon: Trophy, text: 'Tournoi Weekly Scrim Cup terminé', time: '2h', color: 'text-yellow-400' },
    { icon: MessageSquare, text: 'Nouveau post dans le forum', time: '3h', color: 'text-blue-400' },
    { icon: Shield, text: 'Phoenix Rising a gagné un match', time: '5h', color: 'text-purple-400' },
    { icon: Zap, text: 'Record de connexions atteint', time: '1j', color: 'text-pink-400' },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="text-neon-blue" size={32} /> Admin Dashboard
          </h1>
          <p className="text-gray-400 mt-1">Vue d&apos;ensemble de la plateforme MLBB Togo</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Activity size={16} className="text-green-400 animate-pulse" />
          <span>{stats.onlineNow} en ligne</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Utilisateurs" value={stats.totalUsers} trend="+12% ce mois" color="bg-blue-500" delay={0} />
        <StatCard icon={Shield} label="Équipes" value={stats.totalTeams} trend="+3 cette semaine" color="bg-purple-500" delay={1} />
        <StatCard icon={Trophy} label="Tournois" value={stats.totalTournaments} trend="2 en cours" color="bg-yellow-500" delay={2} />
        <StatCard icon={MessageSquare} label="Posts Forum" value={stats.totalPosts} trend="+8% ce mois" color="bg-green-500" delay={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="lg:col-span-2 bg-gaming-card border border-gaming-border rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Activité de la semaine</h3>
          <Line data={activityData} options={{ responsive: true, plugins: { legend: { labels: { color: textColor } } }, scales: { x: { grid: { color: gridColor }, ticks: { color: textColor } }, y: { grid: { color: gridColor }, ticks: { color: textColor } } } }} />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="bg-gaming-card border border-gaming-border rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Distribution des rôles</h3>
          <Doughnut data={roleData} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { color: textColor, padding: 12 } } } }} />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="bg-gaming-card border border-gaming-border rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Tournois par mois</h3>
          <Bar data={tournamentData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { x: { grid: { color: gridColor }, ticks: { color: textColor } }, y: { grid: { color: gridColor }, ticks: { color: textColor } } } }} />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="lg:col-span-2 bg-gaming-card border border-gaming-border rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Activité récente</h3>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.1 }} className="flex items-center gap-3 p-3 rounded-lg bg-gaming-darker/50 hover:bg-gaming-darker transition-colors">
                <item.icon size={16} className={item.color} />
                <span className="text-sm text-gray-300 flex-1">{item.text}</span>
                <span className="text-xs text-gray-500">{item.time}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="bg-gaming-card border border-gaming-border rounded-xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Actions rapides</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction icon={Users} label="Gérer utilisateurs" color="blue-400" onClick={() => {}} />
          <QuickAction icon={Trophy} label="Créer tournoi" color="yellow-400" onClick={() => {}} />
          <QuickAction icon={Shield} label="Gérer équipes" color="purple-400" onClick={() => {}} />
          <QuickAction icon={Eye} label="Voir les logs" color="green-400" onClick={() => {}} />
        </div>
      </motion.div>
    </div>
  );
}
