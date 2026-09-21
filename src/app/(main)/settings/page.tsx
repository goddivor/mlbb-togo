'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon, User, Bell, Shield, Palette,
  Trash2, Save, Moon, Sun, Sparkles, Zap, Crown,
} from 'lucide-react';
import { Card, Button, Input, Textarea, Tabs, PageHeader, SectionTitle, Avatar } from '@/components/ui';
import { cn } from '@/lib/helpers';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useThemeStore, useAuthStore } from '@/store/useStore';
import { api, setToken, avatarSrc } from '@/lib/api';
import { isPushSupported, isPushEnabled, enablePush, disablePush } from '@/lib/push';
import toast from 'react-hot-toast';
import { useT } from '@/lib/i18n';
import CitySelect from '@/components/geo/CitySelect';

const DEFAULT_NOTIFS = { friends: true, messages: true, teams: true };
const DEFAULT_PRIVACY = { profilePublic: true, showStats: true, showOnline: true, allowInvites: true };

const PALETTES: { id: string; label: string; icon: any; color: string; swatch: string }[] = [
  { id: 'default', label: 'Défaut', icon: Sparkles, color: '#00d4ff', swatch: 'linear-gradient(135deg, #0a0e19 0%, #111726 55%, #00d4ff 140%)' },
  { id: 'neon', label: 'Néon', icon: Zap, color: '#00d4ff', swatch: 'linear-gradient(135deg, #060612 0%, #0f0f2a 55%, #a855f7 140%)' },
  { id: 'gold', label: 'Gold', icon: Crown, color: '#d4a843', swatch: 'linear-gradient(135deg, #0a0a0a 0%, #14120f 55%, #d4a843 140%)' },
  { id: 'night', label: 'Night', icon: Moon, color: '#c4a868', swatch: 'linear-gradient(135deg, #0f0d0a 0%, #1a1814 55%, #c4a868 140%)' },
];

/** Accessible switch shared by every toggle row. */
function Switch({ checked, onChange, disabled, label, size = 'md' }: { checked: boolean; onChange: () => void; disabled?: boolean; label: string; size?: 'md' | 'lg' }) {
  const w = size === 'lg' ? 'h-7 w-14' : 'h-6 w-12';
  const knob = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  const travel = size === 'lg' ? 28 : 24;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className={cn(
        'relative shrink-0 rounded-full transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-60',
        w,
        checked ? 'bg-primary' : 'bg-surface-3 ring-1 ring-inset ring-line-strong',
      )}
    >
      <motion.span
        animate={{ x: checked ? travel : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className={cn('absolute top-1 flex items-center justify-center rounded-full bg-white shadow-elev-1', knob)}
      />
    </button>
  );
}

/** Setting row: label + description on the left, control on the right. */
function SettingRow({ label, desc, control, highlight }: { label: string; desc: string; control: React.ReactNode; highlight?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded border p-4',
        highlight ? 'border-primary/30 bg-primary/5' : 'border-line-subtle bg-surface-2/60',
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink-1">{label}</p>
        <p className="mt-0.5 text-xs text-ink-2">{desc}</p>
      </div>
      {control}
    </div>
  );
}

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

  const TABS = [
    { id: 'profile', label: t('settings.tabProfile'), icon: User },
    { id: 'notifications', label: t('settings.tabNotifications'), icon: Bell },
    { id: 'privacy', label: t('settings.tabPrivacy'), icon: Shield },
    { id: 'appearance', label: t('settings.tabAppearance'), icon: Palette },
  ];

  const saveBar = (key: string, onClick: () => void) => (
    <div className="flex justify-end border-t border-line-subtle pt-4">
      <Button onClick={onClick} loading={saving === key}>
        <Save size={16} />
        {t('settings.save')}
      </Button>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow={t('settings.eyebrow')}
        icon={<SettingsIcon size={22} />}
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
        variant="cyan"
      />

      <div className="overflow-x-auto whitespace-nowrap">
        <Tabs variant="underline" tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'profile' && (
        <Card className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar
              name={userProfile?.displayName || userProfile?.username || '?'}
              src={userProfile?.avatar ? avatarSrc(userProfile.avatar, 160) : undefined}
              size="xl"
              ring
            />
            <SectionTitle
              eyebrow={userProfile?.username ? `@${userProfile.username}` : undefined}
              title={t('settings.profileInfo')}
              description={t('settings.subtitle')}
            />
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <CitySelect
                label={t('settings.city')}
                value={profile.city}
                onChange={(city) => setProfile({ ...profile, city })}
              />
              <Input
                label={t('settings.country')}
                value={profile.country}
                onChange={(e: any) => setProfile({ ...profile, country: e.target.value })}
              />
            </div>
            <p className="-mt-2 text-xs text-ink-3">{t('settings.cityHint')}</p>
            <Textarea
              label={t('settings.bio')}
              value={profile.bio}
              onChange={(e: any) => setProfile({ ...profile, bio: e.target.value })}
              rows={3}
            />
          </div>
          {saveBar('profile', saveProfile)}
        </Card>
      )}

      {activeTab === 'notifications' && (
        <Card className="space-y-6">
          <SectionTitle title={t('settings.notifications.title')} />

          <div className="space-y-3">
            {pushSupported && (
              <SettingRow
                highlight
                label={t('settings.push.title')}
                desc={t('settings.push.desc')}
                control={<Switch checked={pushOn} onChange={togglePush} disabled={pushBusy} label={t('settings.push.title')} />}
              />
            )}
            {[
              { key: 'friends', label: t('settings.notifications.friends'), desc: t('settings.notifications.friendsDesc') },
              { key: 'messages', label: t('settings.notifications.messages'), desc: t('settings.notifications.messagesDesc') },
              { key: 'teams', label: t('settings.notifications.teams'), desc: t('settings.notifications.teamsDesc') },
            ].map((item) => (
              <SettingRow
                key={item.key}
                label={item.label}
                desc={item.desc}
                control={
                  <Switch
                    checked={!!notifications[item.key]}
                    onChange={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                    label={item.label}
                  />
                }
              />
            ))}
          </div>
          {saveBar('notifications', saveNotifications)}
        </Card>
      )}

      {activeTab === 'privacy' && (
        <div className="space-y-6">
          <Card className="space-y-6">
            <SectionTitle title={t('settings.privacy.title')} />
            <div className="space-y-3">
              {[
                { key: 'profilePublic', label: t('settings.privacy.publicProfile'), desc: t('settings.privacy.publicProfileDesc') },
                { key: 'showStats', label: t('settings.privacy.showStats'), desc: t('settings.privacy.showStatsDesc') },
                { key: 'showOnline', label: t('settings.privacy.showOnline'), desc: t('settings.privacy.showOnlineDesc') },
                { key: 'allowInvites', label: t('settings.privacy.allowInvites'), desc: t('settings.privacy.allowInvitesDesc') },
              ].map((item) => (
                <SettingRow
                  key={item.key}
                  label={item.label}
                  desc={item.desc}
                  control={
                    <Switch
                      checked={!!privacy[item.key]}
                      onChange={() => setPrivacy({ ...privacy, [item.key]: !privacy[item.key] })}
                      label={item.label}
                    />
                  }
                />
              ))}
            </div>
            {saveBar('privacy', savePrivacy)}
          </Card>

          <Card accent="red" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow mb-1 !text-accent-red">{t('settings.privacy.dangerZone')}</p>
              <p className="text-sm text-ink-2">{t('settings.deleteConfirm')}</p>
            </div>
            <Button variant="danger" size="sm" onClick={() => setShowDelete(true)} className="shrink-0">
              <Trash2 size={16} />
              {t('settings.privacy.deleteAccount')}
            </Button>
          </Card>
        </div>
      )}

      {activeTab === 'appearance' && (
        <Card className="space-y-6">
          <SectionTitle title={t('settings.appearance.title')} />

          <SettingRow
            label={t('settings.appearance.darkTheme')}
            desc={theme === 'dark' ? t('settings.appearance.darkDesc') : t('settings.appearance.lightDesc')}
            control={
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon size={18} className="text-primary" /> : <Sun size={18} className="text-accent-gold" />}
                <Switch size="lg" checked={theme === 'dark'} onChange={toggleTheme} label={t('settings.appearance.darkTheme')} />
              </div>
            }
          />

          <div>
            <p className="eyebrow mb-3">{t('settings.appearance.colorTheme')}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PALETTES.map((p) => {
                const active = (palette || 'default') === p.id;
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPalette(p.id)}
                    aria-pressed={active}
                    className={cn(
                      'group flex flex-col overflow-hidden rounded border text-left transition-[border-color,box-shadow,transform] duration-base ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                      active ? 'border-primary shadow-glow-cyan' : 'border-line-subtle hover:border-line-strong',
                    )}
                  >
                    <span aria-hidden="true" className="relative block h-16 w-full cut-corners-sm" style={{ background: p.swatch }}>
                      <span className="absolute bottom-2 left-2 h-1.5 w-8 rounded-sm" style={{ background: p.color }} />
                      <span className="absolute bottom-2 left-11 h-1.5 w-4 rounded-sm bg-white/30" />
                    </span>
                    <span className="flex items-center gap-2 px-3 py-2.5">
                      <Icon size={14} style={{ color: p.color }} />
                      <span className={cn('text-sm font-semibold', active ? 'text-ink-1' : 'text-ink-2')}>
                        {p.id === 'default' ? t('settings.appearance.paletteDefault') : p.label}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Account deletion confirmation */}
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
