import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Informations légales | MLBB Togo',
  description:
    'Mentions légales, sécurité, charte cookies et politique de données personnelles du site MLBB Togo.',
};

export default function LegalRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
