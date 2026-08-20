import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import MentorLayout from '../../components/layout/MentorLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function MentorDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['mentor-dashboard'],
    queryFn: async () => {
      const res = await api.get('/mentor/dashboard');
      return res.data;
    },
  });

  const stats = data?.stats;
  const recentStudents = data?.recentStudents || [];

  return (
    <MentorLayout title="Tableau de bord">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-violet-600 to-purple-600 p-8 text-white shadow-xl shadow-violet-500/20">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="relative">
          <h2 className="text-2xl font-extrabold">Bonjour Mentor !</h2>
          <p className="text-white/80 mt-1">Gérez vos cours et suivez vos élèves</p>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-4" />
      ) : stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-5 flex items-start justify-between ring-1 ring-violet-100 dark:ring-violet-900/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-dark-300">Mes cours</p>
              <p className="text-3xl font-extrabold text-violet-600 dark:text-violet-400 mt-1 tracking-tight">{stats.totalCourses}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-violet-500 shadow-lg shadow-violet-500/30 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <span className="material-symbols-outlined text-white text-2xl">school</span>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-5 flex items-start justify-between ring-1 ring-blue-100 dark:ring-blue-900/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-dark-300">Élèves suivis</p>
              <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 tracking-tight">{stats.totalStudents}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500 shadow-lg shadow-blue-500/30 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <span className="material-symbols-outlined text-white text-2xl">groups</span>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-5 flex items-start justify-between ring-1 ring-emerald-100 dark:ring-emerald-900/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-dark-300">Inscriptions</p>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 tracking-tight">{stats.totalEnrollments}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <span className="material-symbols-outlined text-white text-2xl">person_add</span>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-5 flex items-start justify-between ring-1 ring-amber-100 dark:ring-amber-900/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-dark-300">Progression moy.</p>
              <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 tracking-tight">{stats.avgProgress}%</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500 shadow-lg shadow-amber-500/30 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <span className="material-symbols-outlined text-white text-2xl">trending_up</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent students */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Élèves récents</h3>
        <Link to="/mentor/students" className="text-sm text-violet-500 hover:text-violet-600 dark:text-violet-400 font-semibold flex items-center gap-1 transition-all duration-200">
          Voir tout
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-8" />
      ) : (
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm dark:shadow-card-dark ring-1 ring-gray-100 dark:ring-dark-700 overflow-hidden">
          {recentStudents.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-dark-700">
              {recentStudents.map((student: any) => (
                <div key={student.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all duration-200">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-sm font-bold text-white">
                      {student.firstName?.[0]}{student.lastName?.[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{student.firstName} {student.lastName}</p>
                    <p className="text-xs text-gray-400 dark:text-dark-400">{student.email}</p>
                  </div>
                  {student.enrollments?.length > 0 && (
                    <div className="text-right">
                      <p className="text-sm font-bold text-violet-600 dark:text-violet-400">
                        {Math.round(student.enrollments.reduce((sum: number, e: any) => sum + e.progress, 0) / student.enrollments.length)}%
                      </p>
                      <p className="text-xs text-gray-400 dark:text-dark-400">progression</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-dark-500">groups</span>
              <p className="text-gray-400 dark:text-dark-400 mt-3">Aucun élève inscrit à vos cours</p>
            </div>
          )}
        </div>
      )}
    </MentorLayout>
  );
}
