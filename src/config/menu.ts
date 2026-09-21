import {
  LayoutDashboard,
  Swords,
  Users,
  Shield,
  Megaphone,
  Users2,
  Trophy,
  CalendarDays,
  Inbox,
  MessageSquare,
  Handshake,
  LayoutGrid,
  Radio,
  Gamepad2,
  Medal,
  Sparkles,
  Bell,
  Bot,
  BarChart3,
  ListOrdered,
  Flag,
  Award,
  Crown,
  MapPin,
  KeyRound,
  ScrollText,
  Gem,
} from 'lucide-react';
import type { MenuGroupConfig } from './theme';

/** Player dashboard menu (grouped by section). */
export const playerMenuGroups: MenuGroupConfig[] = [
  {
    id: 'menu',
    titleKey: 'nav.section.menu',
    items: [
      { href: '/dashboard', labelKey: 'header.dashboard', icon: LayoutDashboard },
      { href: '/heroes', labelKey: 'header.heroes', icon: Swords },
      { href: '/players', labelKey: 'header.players', icon: Users },
      { href: '/leaderboard', labelKey: 'header.leaderboard', icon: Trophy },
      { href: '/progress', labelKey: 'header.progress', icon: Sparkles },
      { href: '/ai', labelKey: 'header.ai', icon: Bot },
      { href: '/map', labelKey: 'header.map', icon: MapPin },
    ],
  },
  {
    id: 'esport',
    titleKey: 'nav.section.esport',
    items: [
      { href: '/league', labelKey: 'nav.league', icon: Flag },
      { href: '/teams', labelKey: 'header.teams', icon: Shield },
      { href: '/stats', labelKey: 'header.stats', icon: BarChart3 },
      { href: '/standings', labelKey: 'header.standings', icon: ListOrdered },
      { href: '/matches', labelKey: 'header.matches', icon: CalendarDays },
      { href: '/awards', labelKey: 'header.awards', icon: Award },
      { href: '/hall-of-fame', labelKey: 'header.hallOfFame', icon: Crown },
      { href: '/recruitment', labelKey: 'header.recruitment', icon: Megaphone },
      { href: '/draft', labelKey: 'header.draft', icon: Gamepad2 },
      { href: '/pick-ban', labelKey: 'header.pickban', icon: Swords },
      { href: '/stream', labelKey: 'header.stream', icon: Radio },
    ],
  },
  {
    id: 'social',
    titleKey: 'nav.section.social',
    items: [
      { href: '/friends', labelKey: 'header.friends', icon: Users2 },
      { href: '/forum', labelKey: 'header.communication', icon: MessageSquare },
      { href: '/notifications', labelKey: 'notif.title', icon: Bell },
    ],
  },
];

/** Admin interface menu (grouped by section). */
export const adminMenuGroups: MenuGroupConfig[] = [
  {
    id: 'catalog',
    titleKey: 'nav.section.catalog',
    items: [
      { href: '/admin/catalog', labelKey: 'admin.catalog.title', icon: LayoutGrid, permission: 'admin.catalog' },
    ],
  },
  {
    id: 'esport',
    titleKey: 'nav.section.esport',
    items: [
      { href: '/admin/league', labelKey: 'admin.league.title', icon: Flag, permission: 'admin.league' },
      { href: '/admin/esport', labelKey: 'admin.esport.title', icon: Trophy, permission: 'admin.esport' },
      { href: '/admin/tournaments', labelKey: 'admin.tournaments.title', icon: Medal, permission: 'admin.tournaments' },
      { href: '/admin/seasons', labelKey: 'admin.seasons.title', icon: CalendarDays, permission: 'admin.seasons' },
      { href: '/admin/matches', labelKey: 'admin.matches.title', icon: Swords, permission: 'admin.matches' },
      { href: '/admin/awards', labelKey: 'admin.awards.title', icon: Award, permission: 'admin.awards' },
      { href: '/admin/draft', labelKey: 'admin.draft.title', icon: Gamepad2, permission: 'admin.draft' },
      { href: '/admin/stream', labelKey: 'admin.stream.title', icon: Radio, permission: 'admin.stream' },
    ],
  },
  {
    id: 'community',
    titleKey: 'nav.section.community',
    items: [
      { href: '/admin/users', labelKey: 'admin.users.title', icon: Users, permission: 'admin.users' },
      { href: '/admin/requests', labelKey: 'requests.title', icon: Inbox, permission: 'admin.requests' },
      { href: '/admin/messages', labelKey: 'header.messages', icon: MessageSquare, permission: 'admin.messages' },
      { href: '/admin/rewards', labelKey: 'admin.rewards.title', icon: Gem, permission: 'admin.rewards' },
    ],
  },
  {
    id: 'partners',
    titleKey: 'nav.section.partners',
    items: [{ href: '/admin/sponsors', labelKey: 'admin.sponsors.title', icon: Handshake, permission: 'admin.sponsors' }],
  },
  {
    id: 'system',
    titleKey: 'nav.section.system',
    items: [
      { href: '/admin/roles', labelKey: 'admin.roles.title', icon: KeyRound, permission: 'admin.roles' },
      { href: '/admin/logs', labelKey: 'admin.logs.title', icon: ScrollText, permission: 'admin.logs' },
    ],
  },
];

/** Admin menu restricted to the entries the user's permissions allow. */
export function filterMenuByPermission(
  groups: MenuGroupConfig[],
  permissions: string[],
): MenuGroupConfig[] {
  return groups
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => !i.permission || permissions.includes(i.permission)),
    }))
    .filter((g) => g.items.length > 0);
}
