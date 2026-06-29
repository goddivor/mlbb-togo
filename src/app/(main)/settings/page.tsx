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

export default function Settings() {
  const { theme, toggleTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);

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
    toast.success('Paramètres sauvegardés!');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-2xl md:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          <SettingsIcon className="inline w-8 h-8 mr-2 text-gray-400" />
          Paramètres
        </h1>
        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          Gérez votre compte et vos préférences
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'profile', label: 'Profil', icon: User },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'privacy', label: 'Confidentialité', icon: Shield },
          { id: 'appearance', label: 'Apparence', icon: Palette },
        ]}
        active={activeTab}
        onChange={setActiveTab}
        className="mb-6"
      />

      {activeTab === 'profile' && (
        <div className="space-y-6">
          <Card>
            <h3 className={`font-bold text-lg mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Informations du profil
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Pseudo"
                  value={profile.username}
                  onChange={(e: any) => setProfile({ ...profile, username: e.target.value })}
                />
                <Input
                  label="Email"
                  type="email"
                  value={profile.email}
                  onChange={(e: any) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Bio</label>
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
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Rang MLBB</label>
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
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Rôle principal</label>
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
              Changer le mot de passe
            </h3>
            <div className="space-y-4">
              <div className="relative">
                <Input label="Mot de passe actuel" type={showPassword ? 'text' : 'password'} placeholder="••••••••" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Nouveau mot de passe" type="password" placeholder="••••••••" />
                <Input label="Confirmer" type="password" placeholder="••••••••" />
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave}>
              <Save size={16} />
              Sauvegarder
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <Card>
          <h3 className={`font-bold text-lg mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Préférences de notification
          </h3>
          <div className="space-y-4">
            {[
              { key: 'matches', label: 'Matchs', desc: 'Notifications pour les matchs à venir' },
              { key: 'tournaments', label: 'Tournois', desc: 'Inscriptions et résultats de tournois' },
              { key: 'teams', label: 'Équipes', desc: "Invitations et activités d'équipe" },
              { key: 'forum', label: 'Forum', desc: 'Réponses à vos posts et commentaires' },
              { key: 'email', label: 'Email', desc: 'Recevoir les notifications par email' },
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
              Sauvegarder
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'privacy' && (
        <Card>
          <h3 className={`font-bold text-lg mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Confidentialité
          </h3>
          <div className="space-y-4">
            {[
              { key: 'profilePublic', label: 'Profil public', desc: 'Les autres joueurs peuvent voir votre profil' },
              { key: 'showStats', label: 'Afficher les stats', desc: 'Vos statistiques sont visibles sur votre profil' },
              { key: 'showOnline', label: 'Statut en ligne', desc: 'Afficher quand vous êtes connecté' },
              { key: 'allowInvites', label: 'Autoriser les invitations', desc: 'Les autres peuvent vous inviter dans des équipes' },
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
            <h4 className="text-red-400 font-bold mb-3">Zone de danger</h4>
            <Button variant="danger">
              <Trash2 size={16} />
              Supprimer mon compte
            </Button>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={handleSave}>
              <Save size={16} />
              Sauvegarder
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'appearance' && (
        <Card>
          <h3 className={`font-bold text-lg mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Apparence
          </h3>

          <div className="space-y-6">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-gaming-surface/30">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon size={20} className="text-neon-blue" /> : <Sun size={20} className="text-yellow-400" />}
                <div>
                  <p className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Thème {theme === 'dark' ? 'sombre' : 'clair'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {theme === 'dark' ? 'Idéal pour les sessions de jeu nocturnes' : 'Plus lumineux pour la journée'}
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

            {/* Preview */}
            <div>
              <p className="text-sm text-gray-400 mb-3">Aperçu</p>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border ${
                  theme === 'dark'
                    ? 'bg-gaming-card border-gaming-border'
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple" />
                    <div>
                      <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Carte exemple</p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Style gaming</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="neon" size="sm">Nouveau</Badge>
                  </div>
                  <p className="text-sm text-white font-bold">Avec glow</p>
                  <p className="text-xs text-gray-400">Effet néon</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
