'use client';

import { useState } from 'react';
import DashboardHeader from './DashboardHeader';
import DashboardSidebar from './DashboardSidebar';

/** Player dashboard shell: fixed sidebar + sticky header + content wrapper. */
export default function DashboardShell({ children }: { children: React.ReactNode }) {
  // Mobile drawer state, shared with the sidebar (drawer) and header (hamburger).
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="font-satoshi bg-whiten text-body dark:bg-boxdark-2 dark:text-bodydark">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-999 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Content Area */}
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <DashboardHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main>
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
