'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon, User, Bell, Shield, Palette,
  Trash2, Save, Moon, Sun, Eye, EyeOff,
} from 'lucide-react';
import { Card, Button, Input, Badge, Tabs } from '@/components/ui';
import { useThemeStore } from '@/store/useStore';
import { MLBB_RANKS, MLBB_ROLES } from '@/lib/constants';
import toast from 'react-hot-toast';
import { useT } from '@/lib/i18n';

export default function Settings() {
  const { theme, toggleTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const t = useT();

  const [profile, setProfile] = useState({
    username: 'TogoKing',
    email: 'togoking@mlbb.tg',
    bio: 'Meilleur assassin du Togo 🇹🇬 | Mythic 800+',
    rank: 'mythic',
    role: 'assassin',
    country: 'Togo',
    city: 'Lomé',
  });

  const [notifications, setNotifications] = useState<any>({
    matches: true,
    tournaments: true,
    teams: true,
    forum: true,
    email: false,
  });

  const [privacy, setPrivacy] = useState<any>({
    profilePublic: true,
    showStats: true,
    showOnline: true,
    allowInvites: true,
  });

  const handleSave = () => {
    toast.success(t('settings.saved'));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">

      <div className="mb-8">
        <h1 className={`text-2xl md:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          <SettingsIcon className="inline w-8 h-8 mr-2 text-gray-400" />
          {t('settings.title')}
        </h1>
        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          {t('settings.subtitle')}
        </p>
      </div>

      <Tabs
        tabs={[
          { id: 'profile', label: t('settings.tabProfile'), icon: User },
          { id: 'notifications', label: t('settings.tabNotifications'), icon: Bell },
          { id: 'privacy', label: t('settings.tabPrivacy'), icon: Shield },
          { id: 'appearance', label: t('settings.tabAppearance'), icon: Palette },
        ]}
        active={activeTab}
        onChange={setActiveTab}
        className="mb-6"
      />

      {activeTab === 'profile' && (
        <div className="space-y-6">
          <Card>
            <h3 className={`font-bold text-lg mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('settings.profileInfo')}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('settings.username')}
                  value={profile.username}
                  onChange={(e: any) => setProfile({ ...profile, username: e.target.value })}
                />
                <Input
                  label={t('settings.email')}
                  type="email"
                  value={profile.email}
                  onChange={(e: any) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('settings.bio')}</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={3}
                  className={`w-full px-4 py-3 rounded-lg border bg-gaming-card text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue/50 resize-none ${
                    theme === 'dark' ? 'border-gaming-border' : 'border-gray-200'
                  }`}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('settings.mlbbRank')}</label>
                  <select
                    value={profile.rank}
                    onChange={(e) => setProfile({ ...profile, rank: e.target.value })}
                    className={`w-full px-4 py-3 rounded-lg border bg-gaming-card text-white focus:outline-none focus:border-neon-blue/50 ${
                      theme === 'dark' ? 'border-gaming-border' : 'border-gray-200'
                    }`}
                  >
                    {MLBB_RANKS.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('settings.mainRole')}</label>
                  <select
                    value={profile.role}
                    onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                    className={`w-full px-4 py-3 rounded-lg border bg-gaming-card text-white focus:outline-none focus:border-neon-blue/50 ${
                      theme === 'dark' ? 'border-gaming-border' : 'border-gray-200'
                    }`}
                  >
                    {MLBB_ROLES.map((r) => (
                      <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className={`font-bold text-lg mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {t('settings.changePassword')}
            </h3>
            <div className="space-y-4">
              <div className="relative">
                <Input label={t('settings.currentPassword')} type={showPassword ? 'text' : 'password'} placeholder="••••••••" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label={t('settings.newPassword')} type="password" placeholder="••••••••" />
                <Input label={t('settings.confirmPassword')} type="password" placeholder="••••••••" />
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave}>
              <Save size={16} />
              {t('settings.save')}
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <Card>
          <h3 className={`font-bold text-lg mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {t('settings.notifications.title')}
          </h3>
          <div className="space-y-4">
            {[
              { key: 'matches', label: t('settings.notifications.matches'), desc: t('settings.notifications.matchesDesc') },
              { key: 'tournaments', label: t('settings.notifications.tournaments'), desc: t('settings.notifications.tournamentsDesc') },
              { key: 'teams', label: t('settings.notifications.teams'), desc: t('settings.notifications.teamsDesc') },
              { key: 'forum', label: t('settings.notifications.forum'), desc: t('settings.notifications.forumDesc') },
              { key: 'email', label: t('settings.notifications.email'), desc: t('settings.notifications.emailDesc') },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-gaming-surface/30">
                <div>
                  <p className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                <button
                  onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    notifications[item.key] ? 'bg-neon-blue' : 'bg-gaming-border'
                  }`}
                >
                  <motion.div
                    animate={{ x: notifications[item.key] ? 24 : 2 }}
                    className="absolute top-1 w-4 h-4 rounded-full bg-white"
                  />
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={handleSave}>
              <Save size={16} />
              {t('settings.save')}
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'privacy' && (
        <Card>
          <h3 className={`font-bold text-lg mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {t('settings.privacy.title')}
          </h3>
          <div className="space-y-4">
            {[
              { key: 'profilePublic', label: t('settings.privacy.publicProfile'), desc: t('settings.privacy.publicProfileDesc') },
              { key: 'showStats', label: t('settings.privacy.showStats'), desc: t('settings.privacy.showStatsDesc') },
              { key: 'showOnline', label: t('settings.privacy.showOnline'), desc: t('settings.privacy.showOnlineDesc') },
              { key: 'allowInvites', label: t('settings.privacy.allowInvites'), desc: t('settings.privacy.allowInvitesDesc') },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-gaming-surface/30">
                <div>
                  <p className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                <button
                  onClick={() => setPrivacy({ ...privacy, [item.key]: !privacy[item.key] })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    privacy[item.key] ? 'bg-neon-blue' : 'bg-gaming-border'
                  }`}
                >
                  <motion.div
                    animate={{ x: privacy[item.key] ? 24 : 2 }}
                    className="absolute top-1 w-4 h-4 rounded-full bg-white"
                  />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gaming-border">
            <h4 className="text-red-400 font-bold mb-3">{t('settings.privacy.dangerZone')}</h4>
            <Button variant="danger">
              <Trash2 size={16} />
              {t('settings.privacy.deleteAccount')}
            </Button>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={handleSave}>
              <Save size={16} />
              {t('settings.save')}
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'appearance' && (
        <Card>
          <h3 className={`font-bold text-lg mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {t('settings.appearance.title')}
          </h3>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-gaming-surface/30">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon size={20} className="text-neon-blue" /> : <Sun size={20} className="text-yellow-400" />}
                <div>
                  <p className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {t('settings.appearance.darkTheme')}
                  </p>
                  <p className="text-xs text-gray-400">
                    {theme === 'dark' ? t('settings.appearance.darkDesc') : t('settings.appearance.lightDesc')}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  theme === 'dark' ? 'bg-neon-blue' : 'bg-yellow-400'
                }`}
              >
                <motion.div
                  animate={{ x: theme === 'dark' ? 28 : 2 }}
                  className="absolute top-1 w-5 h-5 rounded-full bg-white flex items-center justify-center"
                >
                  {theme === 'dark' ? <Moon size={12} className="text-neon-blue" /> : <Sun size={12} className="text-yellow-500" />}
                </motion.div>
              </button>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-3">{t('settings.appearance.preview')}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border ${
                  theme === 'dark'
                    ? 'bg-gaming-card border-gaming-border'
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple" />
                    <div>
                      <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('settings.appearance.previewCard')}</p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{t('settings.appearance.previewStyle')}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="neon" size="sm">{t('settings.appearance.previewGlow')}</Badge>
                  </div>
                  <p className="text-sm text-white font-bold">{t('settings.appearance.previewEffect')}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
