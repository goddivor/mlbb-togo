import type { Metadata } from 'next';
import LegalLayout from '@/components/legal/LegalLayout';

export const metadata: Metadata = { title: 'Données personnelles | MLBB Togo' };

export default function DonneesPersonnellesPage() {
  return <LegalLayout slug="donnees-personnelles" />;
}
