'use client';

import DashboardHeader from './DashboardHeader';

/**
 * Coquille du tableau de bord : header épuré (sans sidebar), contenu centré.
 */
export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gaming-dark">
      <DashboardHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
