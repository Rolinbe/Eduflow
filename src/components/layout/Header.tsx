import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import NotificationBell from '../student/NotificationBell';

interface HeaderProps {
  onMenuToggle?: () => void;
  title?: string;
}

export default function Header({ onMenuToggle, title }: HeaderProps) {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={() => onMenuToggle?.()}
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        {title && (
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        )}
      </div>
      <div className="flex items-center gap-4">
        <NotificationBell />
        <button
          onClick={() => navigate(user?.role === 'ADMIN' ? '/admin/profile' : '/student/profile')}
          className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-1.5 transition-colors"
        >
          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-blue-700">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            )}
          </div>
        </button>
      </div>
    </header>
  );
}
