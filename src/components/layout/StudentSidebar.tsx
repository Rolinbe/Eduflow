import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const menuItems = [
  { path: '/student', label: 'Tableau de bord', icon: 'dashboard' },
  { path: '/student/catalog', label: 'Explorer les cours', icon: 'explore' },
  { path: '/student/courses', label: 'Mes cours', icon: 'school' },
  { path: '/student/chat', label: 'Messages', icon: 'chat' },
  { path: '/student/certificates', label: 'Certificats', icon: 'workspace_premium' },
];

export default function StudentSidebar() {
  const location = useLocation();
  const { handleLogout } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <Link to="/student" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white">school</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">EduFlow</h1>
            <p className="text-xs text-gray-400">Espace apprenant</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = item.path === '/student'
            ? location.pathname === '/student'
            : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-danger transition-colors"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
