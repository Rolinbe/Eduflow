import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const menuItems = [
  { path: '/student', label: 'Tableau de bord', icon: 'dashboard', color: 'text-blue-500' },
  { path: '/student/catalog', label: 'Explorer les cours', icon: 'explore', color: 'text-emerald-500' },
  { path: '/student/courses', label: 'Mes cours', icon: 'school', color: 'text-violet-500' },
  { path: '/student/chat', label: 'Messages', icon: 'chat', color: 'text-cyan-500' },
  { path: '/student/certificates', label: 'Certificats', icon: 'workspace_premium', color: 'text-amber-500' },
];

export default function StudentSidebar() {
  const location = useLocation();
  const { handleLogout } = useAuth();

  return (
    <aside className="w-64 bg-white dark:bg-dark-900 border-r border-gray-100 dark:border-dark-700 h-screen fixed left-0 top-0 flex flex-col transition-colors duration-300">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100 dark:border-dark-700">
        <Link to="/student" className="flex items-center gap-3 group">
          <div className="w-11 h-11 bg-gradient-to-br from-primary-500 via-primary-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-all duration-300 group-hover:scale-105">
            <span className="material-symbols-outlined text-white text-2xl">school</span>
          </div>
          <div>
            <h1 className="text-lg font-extrabold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
              EduFlow
            </h1>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-dark-400">Espace apprenant</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 mt-2">
        <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-dark-500">Navigation</p>
        {menuItems.map((item) => {
          const isActive = item.path === '/student'
            ? location.pathname === '/student'
            : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-primary-900/30 dark:to-indigo-900/20 text-primary-700 dark:text-primary-300 shadow-sm ring-1 ring-primary-100 dark:ring-primary-800/30'
                  : 'text-gray-600 dark:text-dark-300 hover:bg-gray-50 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span className={`material-symbols-outlined text-xl transition-all duration-200 ${isActive ? item.color : 'text-gray-400 dark:text-dark-500'}`}>
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

      {/* Logout */}
      <div className="p-3 border-t border-gray-100 dark:border-dark-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 dark:text-dark-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
