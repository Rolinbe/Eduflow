import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import AdminLayout from '../../components/layout/AdminLayout';
import StatsOverview from '../../components/admin/StatsOverview';
import EnrollmentChart from '../../components/admin/EnrollmentChart';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import type { Stats } from '../../types';

const activityIcons: Record<string, { icon: string; bg: string }> = {
  enrollment: { icon: 'person_add', bg: 'bg-blue-500 shadow-blue-500/30' },
  course: { icon: 'school', bg: 'bg-emerald-500 shadow-emerald-500/30' },
  user: { icon: 'person', bg: 'bg-violet-500 shadow-violet-500/30' },
  announcement: { icon: 'campaign', bg: 'bg-amber-500 shadow-amber-500/30' },
  default: { icon: 'info', bg: 'bg-gray-400 shadow-gray-400/30' },
};

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats');
      return res.data.stats;
    },
  });

  return (
    <AdminLayout title="Tableau de bord">
      <StatsOverview />
      <EnrollmentChart />

      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-card dark:shadow-card-dark p-6 transition-all duration-200 ring-1 ring-gray-100 dark:ring-dark-700">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <span className="material-symbols-outlined text-white text-xl">history</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Activités récentes</h3>
        </div>
        {isLoading ? (
          <LoadingSpinner className="py-4" />
        ) : (
          <div className="space-y-3">
            {stats?.recentActivities?.slice(0, 6).map((activite: any, i: number) => {
              const actStyle = activityIcons[activite.type] || activityIcons.default;
              return (
                <div
                  key={i}
                  className="flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-all duration-200 group"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${actStyle.bg} transition-transform duration-200 group-hover:scale-110`}>
                    <span className="material-symbols-outlined text-white text-xl">{actStyle.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-dark-200 truncate">{activite.message}</p>
                    <p className="text-xs text-gray-400 dark:text-dark-400 mt-0.5">
                      {new Date(activite.date).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            {(!stats?.recentActivities || stats.recentActivities.length === 0) && (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-dark-500">history</span>
                <p className="text-gray-400 dark:text-dark-400 mt-3">Aucune activité récente</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
