import type { Metadata } from 'next';
import LegalLayout from '@/components/legal/LegalLayout';

export const metadata: Metadata = { title: 'Mentions légales | MLBB Togo' };

export default function MentionsLegalesPage() {
  return <LegalLayout slug="mentions-legales" />;
}
