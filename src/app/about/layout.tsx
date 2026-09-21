import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'À propos | MLBB Togo',
  description:
    'Présentation de MLBB Togo : mission, valeurs, objectifs, offre de sponsoring et questions fréquentes de la communauté togolaise de Mobile Legends: Bang Bang.',
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
