import type { ReactNode } from 'react';
import StudentSidebar from './StudentSidebar';
import Header from './Header';
import ChatWidget from '../student/ChatWidget';

interface StudentLayoutProps {
  title: string;
  children: ReactNode;
}

export default function StudentLayout({ title, children }: StudentLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 transition-colors duration-300">
      <StudentSidebar />
      <div className="lg:ml-64">
        <Header title={title} />
        <main className="p-6 space-y-6">{children}</main>
      </div>
      <ChatWidget />
    </div>
  );
}
