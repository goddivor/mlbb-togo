'use client';

import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAppStore, useThemeStore } from '@/store/useStore';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const { theme } = useThemeStore();

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-gaming-dark' : 'bg-gray-50'}`}>
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main
          className={`flex-1 pt-16 transition-all duration-300 ${
            sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
          }`}
          onClick={() => {
            if (window.innerWidth < 1024 && sidebarOpen) {
              setSidebarOpen(false);
            }
          }}
        >
          <div className="relative z-10 min-h-[calc(100vh-4rem)]">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
