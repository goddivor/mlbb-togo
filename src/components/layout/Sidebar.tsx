'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Shield, MessageSquare,
  Trophy, Calendar, Swords, User, Settings, Sparkles,
  BarChart3, FileText, FileInput, ScrollText,
} from 'lucide-react';
import { useAppStore, useThemeStore, useAuthStore } from '@/store/useStore';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/players', label: 'Joueurs', icon: Users },
  { path: '/teams', label: 'Équipes', icon: Shield },
  { path: '/forum', label: 'Forum', icon: MessageSquare },
  { path: '/tournaments', label: 'Tournois', icon: Trophy },
  { path: '/events', label: 'Événements', icon: Calendar },
  { path: '/matches', label: 'Matchs', icon: Swords },
  { path: '/heroes', label: 'Héros', icon: Sparkles },
];

const adminItems = [
  { path: '/admin', label: 'Admin Dashboard', icon: BarChart3 },
  { path: '/admin/users', label: 'Utilisateurs', icon: Users },
  { path: '/admin/teams', label: 'Équipes', icon: Shield },
  { path: '/admin/tournaments', label: 'Tournois', icon: Trophy },
  { path: '/admin/posts', label: 'Posts', icon: FileText },
  { path: '/admin/forms', label: 'Formulaires', icon: FileInput },
  { path: '/admin/logs', label: 'Logs', icon: ScrollText },
];

const bottomItems = [
  { path: '/profile', label: 'Profil', icon: User },
  { path: '/settings', label: 'Paramètres', icon: Settings },
];

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const { theme } = useThemeStore();
  const { userProfile } = useAuthStore();
  const pathname = usePathname();
  const isAdmin = userProfile?.roleUser === 'admin' || userProfile?.roleUser === 'moderator';

  const renderNavItem = (item: any) => {
    const Icon = item.icon;
    const isActive = pathname === item.path ||
      (item.path !== '/' && item.path !== '/admin' && pathname.startsWith(item.path)) ||
      (item.path === '/admin' && pathname === '/admin');

    return (
      <Link
        key={item.path}
        href={item.path}
        onClick={() => {
          if (window.innerWidth < 1024) setSidebarOpen(false);
        }}
        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
          isActive
            ? theme === 'dark'
              ? 'bg-neon-blue/10 text-neon-blue'
              : 'bg-primary-50 text-primary-600'
            : theme === 'dark'
              ? 'text-gray-400 hover:text-white hover:bg-gaming-surface'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        {isActive && (
          <motion.div
            layoutId="sidebar-active"
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full ${
              theme === 'dark' ? 'bg-neon-blue' : 'bg-primary-600'
            }`}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        <Icon size={20} className="flex-shrink-0" />
        <AnimatePresence>
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="text-sm font-medium whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    );
  };

  return (
    <>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          width: sidebarOpen ? 256 : 80,
          x: typeof window !== 'undefined' && window.innerWidth < 1024 && !sidebarOpen ? -256 : 0,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`fixed top-16 left-0 bottom-0 z-40 border-r overflow-hidden ${
          theme === 'dark'
            ? 'bg-gaming-dark/95 border-gaming-border backdrop-gaming'
            : 'bg-white/95 border-gray-200 backdrop-blur-lg'
        }`}
      >
        <div className="h-full py-4 flex flex-col">
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            {navItems.map(renderNavItem)}

            {isAdmin && (
              <>
                <div className="pt-4 pb-2">
                  {sidebarOpen && (
                    <p className={`px-3 text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>
                      Administration
                    </p>
                  )}
                  {!sidebarOpen && <hr className={theme === 'dark' ? 'border-gaming-border' : 'border-gray-200'} />}
                </div>
                {adminItems.map(renderNavItem)}
              </>
            )}
          </nav>

          <div className={`px-3 pt-4 border-t space-y-1 ${theme === 'dark' ? 'border-gaming-border' : 'border-gray-100'}`}>
            {bottomItems.map(renderNavItem)}
            <div className={`flex items-center gap-3 px-3 py-2 mt-2 rounded-lg ${
              theme === 'dark' ? 'bg-gaming-surface/50' : 'bg-gray-50'
            }`}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                TG
              </div>
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className={`text-xs font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>MLBB Togo</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>v2.0.0</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
