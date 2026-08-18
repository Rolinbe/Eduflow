import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import type { Stats } from '../../types';

const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export default function EnrollmentChart() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats');
      return res.data.stats;
    },
  });

  if (isLoading) return <LoadingSpinner className="py-8" />;

  const enrollmentData = (stats?.monthlyEnrollments || []).map((e) => ({
    month: MONTH_NAMES[e.month - 1] || e.month,
    count: e.count,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow-card p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Évolution des inscriptions</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={enrollmentData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} />
            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
              name="Inscriptions"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow-card p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Cours les plus populaires</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats?.popularCourses || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="title" tick={{ fontSize: 12, fill: '#9ca3af' }} width={100} />
            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Bar dataKey="enrollments" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Inscriptions" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
