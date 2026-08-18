import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import StatCard from '../ui/StatCard';
import LoadingSpinner from '../ui/LoadingSpinner';
import type { Stats } from '../../types';

export default function StatsOverview() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats');
      return res.data.stats;
    },
  });

  if (isLoading) return <LoadingSpinner className="py-8" />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total apprenants"
        value={stats?.totalStudents || 0}
        icon="people"
        color="primary"
      />
      <StatCard
        title="Cours actifs"
        value={stats?.activeCourses || 0}
        icon="school"
        color="success"
      />
      <StatCard
        title="Taux de complétion"
        value={`${stats?.averageCompletion || 0}%`}
        icon="emoji_events"
        color="warning"
      />
      <StatCard
        title="Inscriptions ce mois"
        value={stats?.newEnrollments || 0}
        icon="person_add"
        color="info"
      />
    </div>
  );
}
