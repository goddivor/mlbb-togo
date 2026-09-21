'use client';

import { useState } from 'react';
import DashboardHeader from './DashboardHeader';
import DashboardSidebar from './DashboardSidebar';
import PageTransition from './PageTransition';

/** Player dashboard shell: fixed sidebar + sticky header + content wrapper. */
export default function DashboardShell({ children }: { children: React.ReactNode }) {
  // Mobile drawer state, shared with the sidebar (drawer) and header (hamburger).
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-surface font-sans text-ink-2">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-999 bg-surface-0/70 backdrop-blur-[2px] lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Content Area */}
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <DashboardHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="flex-1">
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-8">
              <PageTransition>{children}</PageTransition>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
