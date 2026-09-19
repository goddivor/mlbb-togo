import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Devenir sponsor | MLBB Togo',
  description:
    'Offres de sponsoring, activations, chiffres cibles et formulaire de partenariat de la ligue MLBB Togo de Mobile Legends: Bang Bang.',
};

export default function SponsorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
