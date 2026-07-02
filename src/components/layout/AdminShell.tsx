'use client';

import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gaming-dark">
      <AdminSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <AdminHeader />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
