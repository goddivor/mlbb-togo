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
  Play,
  BarChart3,
  Award,
  Flame,
  Newspaper,
} from 'lucide-react';
import type { MenuGroupConfig } from './theme';

/** Player dashboard menu (grouped by section). */
export const playerMenuGroups: MenuGroupConfig[] = [
  {
    id: 'menu',
    titleKey: 'nav.section.menu',
    items: [
      { href: '/dashboard', labelKey: 'header.dashboard', icon: LayoutDashboard },
      { href: '/feed', labelKey: 'header.feed', icon: Newspaper },
      { href: '/calendar', labelKey: 'header.calendar', icon: CalendarDays },
    ],
  },
  {
    id: 'rankings',
    titleKey: 'nav.section.rankings',
    items: [
      { href: '/rankings', labelKey: 'header.rankings', icon: BarChart3 },
      { href: '/awards', labelKey: 'header.awards', icon: Award },
      { href: '/hall-of-fame', labelKey: 'header.hallOfFame', icon: Flame },
    ],
  },
  {
    id: 'media',
    titleKey: 'nav.section.media',
    items: [
      { href: '/streams', labelKey: 'header.streams', icon: Play },
      { href: '/statistics', labelKey: 'header.statistics', icon: BarChart3 },
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
    items: [
      { href: '/friends', labelKey: 'header.friends', icon: Users2 },
      { href: '/messages', labelKey: 'header.messages', icon: MessageSquare },
    ],
  },
];

/** Admin interface menu (grouped by section). */
export const adminMenuGroups: MenuGroupConfig[] = [
  {
    id: 'catalog',
    titleKey: 'nav.section.catalog',
    items: [
      { href: '/admin/catalog', labelKey: 'admin.catalog.title', icon: LayoutGrid },
    ],
  },
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
      { href: '/admin/users', labelKey: 'admin.users.title', icon: Users },
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
