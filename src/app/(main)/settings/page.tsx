'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon, User, Bell, Shield, Palette,
  Trash2, Save, Moon, Sun,
} from 'lucide-react';
import { Card, Button, Input, Textarea, Tabs, PageHeader, SectionCard } from '@/components/ui';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useThemeStore, useAuthStore } from '@/store/useStore';
import { api, setToken } from '@/lib/api';
import { isPushSupported, isPushEnabled, enablePush, disablePush } from '@/lib/push';
import toast from 'react-hot-toast';
import { useT } from '@/lib/i18n';

const DEFAULT_NOTIFS = { friends: true, messages: true, teams: true };
const DEFAULT_PRIVACY = { profilePublic: true, showStats: true, showOnline: true, allowInvites: true };

const PALETTES: { id: string; label: string; swatch: string }[] = [
  { id: 'default', label: 'Défaut', swatch: '#3C50E0' },
  { id: 'neon', label: 'Néon', swatch: '#00d4ff' },
  { id: 'gold', label: 'Gold', swatch: '#d4a843' },
  { id: 'night', label: 'Night', swatch: '#c4a868' },
];

export default function Settings() {
  const { theme, toggleTheme, palette, setPalette } = useThemeStore();
  const userProfile = useAuthStore((s: any) => s.userProfile);
  const setUserProfile = useAuthStore((s: any) => s.setUserProfile);
  const setUser = useAuthStore((s: any) => s.setUser);
  const logout = useAuthStore((s: any) => s.logout);
  const router = useRouter();
  const t = useT();

  const [activeTab, setActiveTab] = useState('profile');
  const [showDelete, setShowDelete] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const [profile, setProfile] = useState({
    username: '', email: '', bio: '', country: '', city: '',
  });
  const [notifications, setNotifications] = useState<any>(DEFAULT_NOTIFS);
  const [privacy, setPrivacy] = useState<any>(DEFAULT_PRIVACY);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    setPushSupported(isPushSupported());
    isPushEnabled().then(setPushOn);
  }, []);

  const togglePush = async () => {
    setPushBusy(true);
    try {
      if (pushOn) {
        await disablePush();
        setPushOn(false);
        toast.success(t('settings.push.disabled'));
      } else {
        await enablePush();
        setPushOn(true);
        toast.success(t('settings.push.enabled'));
      }
    } catch (e: any) {
      const code = e?.message;
      toast.error(
        code === 'push-denied'
          ? t('settings.push.denied')
          : code === 'push-unconfigured'
            ? t('settings.push.unavailable')
            : t('common.error'),
      );
    } finally {
      setPushBusy(false);
    }
  };

  // Hydrate the form from the real profile.
  useEffect(() => {
    if (!userProfile) return;
    setProfile({
      username: userProfile.username || '',
      email: userProfile.email || '',
      bio: userProfile.bio || '',
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
      country: profile.country,
    });
  const saveNotifications = () => persist('notifications', { notifPrefs: notifications });
  const savePrivacy = () => persist('privacy', { privacy });

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
          <h3 className="font-bold text-lg mb-4 text-black dark:text-white">
            {t('settings.notifications.title')}
          </h3>

          {pushSupported && (
            <div className="mb-4 flex items-center justify-between rounded-sm border border-primary/30 bg-primary/5 p-3">
              <div>
                <p className="font-medium text-sm text-black dark:text-white">{t('settings.push.title')}</p>
                <p className="text-xs text-body dark:text-bodydark">{t('settings.push.desc')}</p>
              </div>
              <button
                onClick={togglePush}
                disabled={pushBusy}
                className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-60 ${
                  pushOn ? 'bg-primary' : 'bg-stroke dark:bg-strokedark'
                }`}
              >
                <motion.div animate={{ x: pushOn ? 24 : 2 }} className="absolute top-1 w-4 h-4 rounded-full bg-white" />
              </button>
            </div>
          )}

          <div className="space-y-4">
            {[
              { key: 'friends', label: t('settings.notifications.friends'), desc: t('settings.notifications.friendsDesc') },
              { key: 'messages', label: t('settings.notifications.messages'), desc: t('settings.notifications.messagesDesc') },
              { key: 'teams', label: t('settings.notifications.teams'), desc: t('settings.notifications.teamsDesc') },
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
              <p className="text-sm text-body dark:text-bodydark mb-3">{t('settings.appearance.colorTheme')}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {PALETTES.map((p) => {
                  const active = (palette || 'default') === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPalette(p.id)}
                      className={`flex items-center gap-2.5 rounded-sm border p-3 transition-colors ${
                        active
                          ? 'border-primary bg-primary/10'
                          : 'border-stroke bg-gray-2 hover:border-primary/50 dark:border-strokedark dark:bg-meta-4'
                      }`}
                    >
                      <span className="h-6 w-6 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: p.swatch }} />
                      <span className="text-sm font-medium text-black dark:text-white">
                        {p.id === 'default' ? t('settings.appearance.paletteDefault') : p.label}
                      </span>
                    </button>
                  );
                })}
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
