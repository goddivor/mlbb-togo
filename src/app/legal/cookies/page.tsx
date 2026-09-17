import type { Metadata } from 'next';
import LegalLayout from '@/components/legal/LegalLayout';

export const metadata: Metadata = { title: 'Charte cookies | MLBB Togo' };

export default function CookiesPage() {
  return <LegalLayout slug="cookies" />;
}
