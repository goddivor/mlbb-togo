'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, Sun, Moon, Bell, Search, User, LogOut, Settings,
  ChevronDown, Swords, BarChart3,
} from 'lucide-react';
import { useAppStore, useThemeStore, useAuthStore } from '@/store/useStore';
import { setToken } from '@/lib/api';
import { timeAgo } from '@/lib/helpers';

export default function Navbar() {
  const router = useRouter();
  const { sidebarOpen, toggleSidebar, notifications } = useAppStore();
  const { theme, toggleTheme } = useThemeStore();
  const { userProfile, logout } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = userProfile?.roleUser === 'admin' || userProfile?.roleUser === 'moderator';
  const notifs = notifications;
  const unreadCount = notifs.filter((n: any) => !n.read).length;

  const handleLogout = () => {
    setShowProfile(false);
    setToken(null);
    logout();
    router.push('/');
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-16 border-b transition-colors duration-300 ${
        theme === 'dark'
          ? 'bg-gaming-dark/90 border-gaming-border backdrop-gaming'
          : 'bg-white/90 border-gray-200 backdrop-blur-lg'
      }`}
    >
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark' ? 'hover:bg-gaming-surface text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="relative">
              <Swords className="w-8 h-8 text-neon-blue" />
              <div className="absolute inset-0 blur-md opacity-50">
                <Swords className="w-8 h-8 text-neon-blue" />
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-gradient">MLBB</span>
              <span className={`text-lg font-bold ml-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Togo</span>
            </div>
          </Link>
        </div>

        {/* Center - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Rechercher joueurs, équipes, posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg text-sm transition-all duration-300 focus:outline-none ${
                theme === 'dark'
                  ? 'bg-gaming-card border border-gaming-border text-white placeholder-gray-500 focus:border-neon-blue/50'
                  : 'bg-gray-100 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary-500'
              }`}
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark' ? 'hover:bg-gaming-surface text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </motion.button>

          {/* Notifications */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-lg transition-colors relative ${
                theme === 'dark' ? 'hover:bg-gaming-surface text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full">
                  {unreadCount}
                </span>
              )}
            </motion.button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className={`absolute right-0 top-12 w-80 rounded-xl border shadow-gaming overflow-hidden ${
                    theme === 'dark' ? 'bg-gaming-card border-gaming-border' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className={`p-3 border-b ${theme === 'dark' ? 'border-gaming-border' : 'border-gray-100'}`}>
                    <h3 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifs.slice(0, 5).map((notif: any) => (
                      <div
                        key={notif.id}
                        className={`p-3 border-b cursor-pointer transition-colors ${
                          theme === 'dark'
                            ? `border-gaming-border hover:bg-gaming-surface ${!notif.read ? 'bg-neon-blue/5' : ''}`
                            : `border-gray-50 hover:bg-gray-50 ${!notif.read ? 'bg-primary-50' : ''}`
                        }`}
                      >
                        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{notif.title}</p>
                        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{notif.message}</p>
                        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{timeAgo(notif.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/settings"
                    className={`block p-3 text-center text-sm font-medium ${
                      theme === 'dark' ? 'text-neon-blue hover:bg-gaming-surface' : 'text-primary-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setShowNotifications(false)}
                  >
                    Voir tout
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowProfile(!showProfile)}
              className={`flex items-center gap-2 p-1.5 rounded-lg transition-colors ${
                theme === 'dark' ? 'hover:bg-gaming-surface' : 'hover:bg-gray-100'
              }`}
            >
              {userProfile?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userProfile.avatar}
                  alt={userProfile.username || 'Profil'}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-lg object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-sm font-bold text-white">
                  {userProfile?.username?.[0]?.toUpperCase() || 'G'}
                </div>
              )}
              <ChevronDown size={14} className={`hidden sm:block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            </motion.button>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className={`absolute right-0 top-12 w-56 rounded-xl border shadow-gaming overflow-hidden ${
                    theme === 'dark' ? 'bg-gaming-card border-gaming-border' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className={`p-3 border-b ${theme === 'dark' ? 'border-gaming-border' : 'border-gray-100'}`}>
                    <p className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {userProfile?.username || 'Guest'}
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {userProfile?.email || 'Connectez-vous'}
                    </p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setShowProfile(false)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                        theme === 'dark' ? 'text-gray-300 hover:bg-gaming-surface' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <User size={16} />
                      Mon Profil
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setShowProfile(false)}
                        className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                          theme === 'dark' ? 'text-yellow-400 hover:bg-yellow-500/10' : 'text-yellow-600 hover:bg-yellow-50'
                        }`}
                      >
                        <BarChart3 size={16} />
                        Administration
                      </Link>
                    )}
                    <Link
                      href="/settings"
                      onClick={() => setShowProfile(false)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                        theme === 'dark' ? 'text-gray-300 hover:bg-gaming-surface' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Settings size={16} />
                      Paramètres
                    </Link>
                    <hr className={theme === 'dark' ? 'border-gaming-border' : 'border-gray-100'} />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <LogOut size={16} />
                      Déconnexion
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
}
