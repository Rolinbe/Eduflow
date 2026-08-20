import { useState } from 'react';
import MentorSidebar from './MentorSidebar';
import Header from './Header';

interface MentorLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function MentorLayout({ children, title }: MentorLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 transition-colors duration-300">
      <MentorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} title={title} />
        <main className="p-6 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
