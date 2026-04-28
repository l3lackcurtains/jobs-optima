'use client';

import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <aside className="hidden md:flex h-[calc(100vh-3.5rem)] w-64 flex-col border-r bg-background/95">
          <Sidebar />
        </aside>
        <main className="flex-1 overflow-hidden">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}