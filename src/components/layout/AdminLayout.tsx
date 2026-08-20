import { useState } from 'react';
import type { ReactNode } from 'react';
import AdminSidebar from './AdminSidebar';
import Header from './Header';

interface AdminLayoutProps {
  title: string;
  children: ReactNode;
}

export default function AdminLayout({ title, children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 transition-colors duration-300">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} title={title} />
        <main className="p-6 space-y-6">{children}</main>
      </div>
    </div>
  );
}
