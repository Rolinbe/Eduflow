import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import AdminLayout from '../../components/layout/AdminLayout';
import StatsOverview from '../../components/admin/StatsOverview';
import EnrollmentChart from '../../components/admin/EnrollmentChart';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import type { Stats } from '../../types';

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

      <div className="bg-white rounded-lg shadow-card p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Activités récentes</h3>
        {isLoading ? (
          <LoadingSpinner className="py-4" />
        ) : (
          <div className="space-y-3">
            {stats?.recentActivities?.slice(0, 5).map((activite: any, i: number) => (
              <div key={i} className="flex items-center gap-4 py-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activite.type === 'enrollment' ? 'bg-blue-50 text-primary-500' :
                  'bg-gray-50 text-gray-500'
                }`}>
                  <span className="material-symbols-outlined text-lg">
                    {activite.type === 'enrollment' ? 'person_add' : 'info'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{activite.message}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(activite.date).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            {(!stats?.recentActivities || stats.recentActivities.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-4">Aucune activité récente</p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
