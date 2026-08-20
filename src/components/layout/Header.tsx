import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import NotificationBell from '../student/NotificationBell';
import DarkModeToggle from '../ui/DarkModeToggle';

interface HeaderProps {
  onMenuToggle?: () => void;
  title?: string;
}

export default function Header({ onMenuToggle, title }: HeaderProps) {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-white/80 dark:bg-dark-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-dark-700/50 flex items-center justify-between px-6 sticky top-0 z-30 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={() => onMenuToggle?.()}
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-all duration-200 active:scale-95"
        >
          <span className="material-symbols-outlined dark:text-dark-300">menu</span>
        </button>
        {title && (
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
        )}
      </div>
      <div className="flex items-center gap-1">
        <DarkModeToggle />
        <NotificationBell />
        <button
          onClick={() => navigate(user?.role === 'ADMIN' ? '/admin/profile' : '/student/profile')}
          className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-dark-700 rounded-xl p-1.5 transition-all duration-200 active:scale-95"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-indigo-500 rounded-xl flex items-center justify-center overflow-hidden shadow-md shadow-primary-500/20">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-white">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            )}
          </div>
        </button>
      </div>
    </header>
  );
}
