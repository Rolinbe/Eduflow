import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAuth } from '../../hooks/useAuth';

const menuItems = [
  { path: '/admin', label: 'Tableau de bord', icon: 'dashboard', color: 'text-blue-500' },
  { path: '/admin/courses', label: 'Gestion des cours', icon: 'school', color: 'text-emerald-500' },
  { path: '/admin/users', label: 'Utilisateurs', icon: 'people', color: 'text-violet-500' },
  { path: '/admin/announcements', label: 'Annonces', icon: 'campaign', color: 'text-amber-500' },
  { path: '/admin/chat', label: 'Messagerie', icon: 'chat', color: 'text-cyan-500' },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
  const location = useLocation();
  const { user } = useAuthStore();
  const { handleLogout } = useAuth();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}
      <aside className={`w-64 bg-white dark:bg-dark-900 border-r border-gray-100 dark:border-dark-700 h-screen fixed left-0 top-0 flex flex-col z-50 transition-all duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo */}
        <div className="p-5 border-b border-gray-100 dark:border-dark-700">
          <Link to="/admin" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="w-11 h-11 bg-gradient-to-br from-primary-500 via-primary-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-all duration-300 group-hover:scale-105">
              <span className="material-symbols-outlined text-white text-2xl">school</span>
            </div>
            <div>
              <h1 className="text-lg font-extrabold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
                EdukaFlow
              </h1>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-dark-400">Administration</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 mt-2">
          <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-dark-500">Menu principal</p>
          {menuItems.map((item) => {
            const isActive = item.path === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-primary-900/30 dark:to-indigo-900/20 text-primary-700 dark:text-primary-300 shadow-sm ring-1 ring-primary-100 dark:ring-primary-800/30'
                    : 'text-gray-600 dark:text-dark-300 hover:bg-gray-50 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span className={`material-symbols-outlined text-xl transition-all duration-200 ${isActive ? item.color : 'text-gray-400 dark:text-dark-500 group-hover:' + item.color}`}>
                  {item.icon}
                </span>
                {item.label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User profile + Logout */}
        <div className="p-3 border-t border-gray-100 dark:border-dark-700 space-y-1">
          <Link
            to="/admin/profile"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-800 transition-all duration-200"
            onClick={onClose}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-indigo-500 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-white">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-400 dark:text-dark-400 truncate">{user?.email}</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 dark:text-dark-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}
