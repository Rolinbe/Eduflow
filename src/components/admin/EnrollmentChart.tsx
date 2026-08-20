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
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm p-6 ring-1 ring-gray-100 dark:ring-dark-700 transition-colors duration-200">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <span className="material-symbols-outlined text-white text-xl">trending_up</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Inscriptions mensuelles</h3>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={enrollmentData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} />
            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                backgroundColor: 'white',
                color: '#1e293b',
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2 }}
              name="Inscriptions"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm p-6 ring-1 ring-gray-100 dark:ring-dark-700 transition-colors duration-200">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <span className="material-symbols-outlined text-white text-xl">school</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Cours populaires</h3>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={stats?.popularCourses || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="title" tick={{ fontSize: 12, fill: '#9ca3af' }} width={100} />
            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                backgroundColor: 'white',
                color: '#1e293b',
              }}
            />
            <Bar dataKey="enrollments" fill="url(#emeraldGradient)" radius={[6, 6, 0, 0]} name="Inscriptions" />
            <defs>
              <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
