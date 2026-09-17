import type { Metadata } from 'next';
import LegalLayout from '@/components/legal/LegalLayout';

export const metadata: Metadata = { title: 'Sécurité | MLBB Togo' };

export default function SecuritePage() {
  return <LegalLayout slug="securite" />;
}
