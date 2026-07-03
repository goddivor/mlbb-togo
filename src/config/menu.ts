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
} from 'lucide-react';
import type { MenuGroupConfig } from './theme';

/** Menu du dashboard joueur (groupé par section). */
export const playerMenuGroups: MenuGroupConfig[] = [
  {
    id: 'menu',
    titleKey: 'nav.section.menu',
    items: [
      { href: '/dashboard', labelKey: 'header.dashboard', icon: LayoutDashboard },
      { href: '/heroes', labelKey: 'header.heroes', icon: Swords },
      { href: '/players', labelKey: 'header.players', icon: Users },
    ],
  },
  {
    id: 'esport',
    titleKey: 'nav.section.esport',
    items: [
      { href: '/teams', labelKey: 'header.teams', icon: Shield },
      { href: '/recruitment', labelKey: 'header.recruitment', icon: Megaphone },
    ],
  },
  {
    id: 'social',
    titleKey: 'nav.section.social',
    items: [{ href: '/friends', labelKey: 'header.friends', icon: Users2 }],
  },
];

/** Menu de l'interface admin (groupé par section). */
export const adminMenuGroups: MenuGroupConfig[] = [
  {
    id: 'esport',
    titleKey: 'nav.section.esport',
    items: [
      { href: '/admin/esport', labelKey: 'admin.esport.title', icon: Trophy },
      { href: '/admin/seasons', labelKey: 'admin.seasons.title', icon: CalendarDays },
      { href: '/admin/matches', labelKey: 'admin.matches.title', icon: Swords },
    ],
  },
  {
    id: 'community',
    titleKey: 'nav.section.community',
    items: [
      { href: '/admin/requests', labelKey: 'requests.title', icon: Inbox },
      { href: '/admin/messages', labelKey: 'header.messages', icon: MessageSquare },
    ],
  },
  {
    id: 'partners',
    titleKey: 'nav.section.partners',
    items: [{ href: '/admin/sponsors', labelKey: 'admin.sponsors.title', icon: Handshake }],
  },
];
