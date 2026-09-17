'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Award,
  Crown,
  Flame,
  Footprints,
  Medal,
  MessageSquare,
  Shield,
  Star,
  Sun,
  Swords,
  Target,
  Trophy,
  Users2,
  Zap,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  footprints: Footprints,
  swords: Swords,
  shield: Shield,
  trophy: Trophy,
  star: Star,
  medal: Medal,
  message: MessageSquare,
  users: Users2,
  sun: Sun,
  zap: Zap,
  crown: Crown,
  target: Target,
  flame: Flame,
};

/** Maps the icon key sent by the backend to a lucide icon. */
export function GamificationIcon({ name, size = 18, className }: { name?: string; size?: number; className?: string }) {
  const Icon = (name && ICONS[name]) || Award;
  return <Icon size={size} className={className} />;
}
