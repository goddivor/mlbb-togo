'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon, User, Bell, Shield, Palette,
  Trash2, Save, Moon, Sun, Eye, EyeOff,
} from 'lucide-react';
import { Card, Button, Input, Textarea, Select, Badge, Tabs, PageHeader, SectionCard } from '@/components/ui';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useThemeStore, useAuthStore } from '@/store/useStore';
import { api, setToken } from '@/lib/api';
import { MLBB_RANKS, MLBB_ROLES } from '@/lib/constants';
import toast from 'react-hot-toast';
import { useT } from '@/lib/i18n';

const DEFAULT_NOTIFS = { matches: true, tournaments: true, teams: true, forum: true, email: false };
const DEFAULT_PRIVACY = { profilePublic: true, showStats: true, showOnline: true, allowInvites: true };

export default function Settings() {
  const { theme, toggleTheme } = useThemeStore();
  const userProfile = useAuthStore((s: any) => s.userProfile);
  const setUserProfile = useAuthStore((s: any) => s.setUserProfile);
  const setUser = useAuthStore((s: any) => s.setUser);
  const logout = useAuthStore((s: any) => s.logout);
  const router = useRouter();
  const t = useT();

  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const [profile, setProfile] = useState({
    username: '', email: '', bio: '', rank: 'warrior', role: 'fighter', country: '', city: '',
  });
  const [notifications, setNotifications] = useState<any>(DEFAULT_NOTIFS);
  const [privacy, setPrivacy] = useState<any>(DEFAULT_PRIVACY);
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });

  // Hydrate the form from the real profile.
  useEffect(() => {
    if (!userProfile) return;
    setProfile({
      username: userProfile.username || '',
      email: userProfile.email || '',
      bio: userProfile.bio || '',
      rank: userProfile.rank || 'warrior',
      role: userProfile.role || 'fighter',
      country: userProfile.country || '',
      city: userProfile.city || '',
    });
    setNotifications({ ...DEFAULT_NOTIFS, ...(userProfile.notifPrefs || {}) });
    setPrivacy({ ...DEFAULT_PRIVACY, ...(userProfile.privacy || {}) });
  }, [userProfile?.id]);

  const myId = userProfile?.id;

  const persist = async (key: string, patch: any) => {
    if (!myId) return;
    setSaving(key);
    try {
      const updated: any = await api.users.update(myId, patch);
      setUser(updated);
      setUserProfile(updated);
      toast.success(t('settings.saved'));
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setSaving(null);
    }
  };

  const saveProfile = () =>
    persist('profile', {
      username: profile.username,
      bio: profile.bio,
      city: profile.city,
      rank: profile.rank,
      role: profile.role,
      country: profile.country,
    });
  const saveNotifications = () => persist('notifications', { notifPrefs: notifications });
  const savePrivacy = () => persist('privacy', { privacy });

  const changePassword = async () => {
    if (!pwd.current || !pwd.next) return toast.error(t('settings.pwdRequired'));
    if (pwd.next !== pwd.confirm) return toast.error(t('settings.pwdMismatch'));
    setSaving('password');
    try {
      await api.auth.changePassword({
        email: profile.email,
        currentPassword: pwd.current,
        newPassword: pwd.next,
      });
      setPwd({ current: '', next: '', confirm: '' });
      toast.success(t('settings.pwdChanged'));
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
    } finally {
      setSaving(null);
    }
  };

  const deleteAccount = async () => {
    setSaving('delete');
    try {
      await api.users.deleteSelf();
      setShowDelete(false);
      logout();
      setToken(null);
      toast.success(t('settings.accountDeleted'));
      router.push('/');
    } catch (e: any) {
      toast.error(e?.message || t('common.error'));
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">

      <PageHeader
        icon={<SettingsIcon size={28} />}
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
        variant="cyan"
      />

      <SectionCard className="!p-4">
        <Tabs
          tabs={[
            { id: 'profile', label: t('settings.tabProfile'), icon: User },
            { id: 'notifications', label: t('settings.tabNotifications'), icon: Bell },
            { id: 'privacy', label: t('settings.tabPrivacy'), icon: Shield },
            { id: 'appearance', label: t('settings.tabAppearance'), icon: Palette },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
      </SectionCard>

      {activeTab === 'profile' && (
        <div className="space-y-6">
          <Card>
            <h3 className="font-bold text-lg mb-4 text-black dark:text-white">
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
                  disabled
                  readOnly
                />
              </div>
              <Textarea
                label={t('settings.bio')}
                value={profile.bio}
                onChange={(e: any) => setProfile({ ...profile, bio: e.target.value })}
                rows={3}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label={t('settings.mlbbRank')}
                  value={profile.rank}
                  onChange={(e: any) => setProfile({ ...profile, rank: e.target.value })}
                >
                  {MLBB_RANKS.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </Select>
                <Select
                  label={t('settings.mainRole')}
                  value={profile.role}
                  onChange={(e: any) => setProfile({ ...profile, role: e.target.value })}
                >
                  {MLBB_ROLES.map((r) => (
                    <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
                  ))}
                </Select>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-bold text-lg mb-4 text-black dark:text-white">
              {t('settings.changePassword')}
            </h3>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  label={t('settings.currentPassword')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={pwd.current}
                  onChange={(e: any) => setPwd({ ...pwd, current: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-bodydark2 hover:text-body dark:hover:text-bodydark"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('settings.newPassword')}
                  type="password"
                  placeholder="••••••••"
                  value={pwd.next}
                  onChange={(e: any) => setPwd({ ...pwd, next: e.target.value })}
                />
                <Input
                  label={t('settings.confirmPassword')}
                  type="password"
                  placeholder="••••••••"
                  value={pwd.confirm}
                  onChange={(e: any) => setPwd({ ...pwd, confirm: e.target.value })}
                />
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={changePassword} loading={saving === 'password'}>
                  {t('settings.changePassword')}
                </Button>
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveProfile} loading={saving === 'profile'}>
              <Save size={16} />
              {t('settings.save')}
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <Card>
          <h3 className="font-bold text-lg mb-4 text-white">
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
              <div key={item.key} className="flex items-center justify-between p-3 rounded-sm bg-gray-2 dark:bg-meta-4">
                <div>
                  <p className="font-medium text-sm text-black dark:text-white">{item.label}</p>
                  <p className="text-xs text-body dark:text-bodydark">{item.desc}</p>
                </div>
                <button
                  onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    notifications[item.key] ? 'bg-primary' : 'bg-stroke dark:bg-strokedark'
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
            <Button onClick={saveNotifications} loading={saving === 'notifications'}>
              <Save size={16} />
              {t('settings.save')}
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'privacy' && (
        <Card>
          <h3 className="font-bold text-lg mb-4 text-white">
            {t('settings.privacy.title')}
          </h3>
          <div className="space-y-4">
            {[
              { key: 'profilePublic', label: t('settings.privacy.publicProfile'), desc: t('settings.privacy.publicProfileDesc') },
              { key: 'showStats', label: t('settings.privacy.showStats'), desc: t('settings.privacy.showStatsDesc') },
              { key: 'showOnline', label: t('settings.privacy.showOnline'), desc: t('settings.privacy.showOnlineDesc') },
              { key: 'allowInvites', label: t('settings.privacy.allowInvites'), desc: t('settings.privacy.allowInvitesDesc') },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-3 rounded-sm bg-gray-2 dark:bg-meta-4">
                <div>
                  <p className="font-medium text-sm text-black dark:text-white">{item.label}</p>
                  <p className="text-xs text-body dark:text-bodydark">{item.desc}</p>
                </div>
                <button
                  onClick={() => setPrivacy({ ...privacy, [item.key]: !privacy[item.key] })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    privacy[item.key] ? 'bg-primary' : 'bg-stroke dark:bg-strokedark'
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

          <div className="mt-8 pt-6 border-t border-stroke dark:border-strokedark">
            <h4 className="text-danger font-bold mb-3">{t('settings.privacy.dangerZone')}</h4>
            <Button variant="danger" onClick={() => setShowDelete(true)}>
              <Trash2 size={16} />
              {t('settings.privacy.deleteAccount')}
            </Button>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={savePrivacy} loading={saving === 'privacy'}>
              <Save size={16} />
              {t('settings.save')}
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'appearance' && (
        <Card>
          <h3 className="font-bold text-lg mb-4 text-white">
            {t('settings.appearance.title')}
          </h3>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-sm bg-gray-2 dark:bg-meta-4">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon size={20} className="text-primary" /> : <Sun size={20} className="text-warning" />}
                <div>
                  <p className="font-medium text-sm text-black dark:text-white">
                    {t('settings.appearance.darkTheme')}
                  </p>
                  <p className="text-xs text-body dark:text-bodydark">
                    {theme === 'dark' ? t('settings.appearance.darkDesc') : t('settings.appearance.lightDesc')}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  theme === 'dark' ? 'bg-primary' : 'bg-warning'
                }`}
              >
                <motion.div
                  animate={{ x: theme === 'dark' ? 28 : 2 }}
                  className="absolute top-1 w-5 h-5 rounded-full bg-white flex items-center justify-center"
                >
                  {theme === 'dark' ? <Moon size={12} className="text-primary" /> : <Sun size={12} className="text-warning" />}
                </motion.div>
              </button>
            </div>

            <div>
              <p className="text-sm text-body dark:text-bodydark mb-3">{t('settings.appearance.preview')}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-sm border bg-white border-stroke shadow-default dark:bg-boxdark dark:border-strokedark">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-sm bg-primary" />
                    <div>
                      <p className="text-sm font-bold text-black dark:text-white">{t('settings.appearance.previewCard')}</p>
                      <p className="text-xs text-body dark:text-bodydark">{t('settings.appearance.previewStyle')}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-sm bg-primary/10 border border-primary/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="neon" size="sm">{t('settings.appearance.previewGlow')}</Badge>
                  </div>
                  <p className="text-sm text-black dark:text-white font-bold">{t('settings.appearance.previewEffect')}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Confirmation de suppression du compte */}
      <ConfirmModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={deleteAccount}
        loading={saving === 'delete'}
        variant="danger"
        title={t('settings.privacy.deleteAccount')}
        message={t('settings.deleteConfirm')}
        confirmLabel={t('settings.privacy.deleteAccount')}
      />
    </div>
  );
}
