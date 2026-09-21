import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact | MLBB Togo',
  description:
    'Contacter l’équipe MLBB Togo : partenariats, sponsoring, organisation de tournois et questions de la communauté.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
