import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ligue | MLBB Togo',
  description:
    'Portail de la ligue MLBB Togo : saison en cours, podium, derniers résultats, prochains matchs, annonces, stream et sponsors.',
};

export default function LeagueLayout({ children }: { children: React.ReactNode }) {
  return children;
}
