import { MLBB_RANKS } from './constants';

export const getRankColor = (rankId: string): string => {
  const rank = MLBB_RANKS.find((r) => r.id === rankId);
  return rank ? rank.color : '#8b8b8b';
};

export const getRankName = (rankId: string): string => {
  const rank = MLBB_RANKS.find((r) => r.id === rankId);
  return rank ? rank.name : 'Inconnu';
};

export const calculateWinRate = (wins: number, losses: number): number | string => {
  const total = wins + losses;
  if (total === 0) return 0;
  return ((wins / total) * 100).toFixed(1);
};

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  return new Date(date).toLocaleString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const timeAgo = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `${minutes}min`;
  if (hours < 24) return `${hours}h`;
  if (days < 30) return `${days}j`;
  return formatDate(date);
};

export const truncateText = (text: string, maxLength = 100): string => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const generateId = (): string => Math.random().toString(36).substr(2, 9);

export const getInitials = (name: string): string => {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
};

export const getPerformanceColor = (value: number): string => {
  if (value >= 70) return 'text-green-400';
  if (value >= 50) return 'text-yellow-400';
  return 'text-red-400';
};

export const cn = (...classes: (string | false | null | undefined)[]): string =>
  classes.filter(Boolean).join(' ');
