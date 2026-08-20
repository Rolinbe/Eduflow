import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StudentLayout from '../../components/layout/StudentLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import type { GlobalProgression, Enrollment } from '../../types';

const gradientColors = [
  'from-blue-400 to-blue-600',
  'from-emerald-400 to-emerald-600',
  'from-violet-400 to-violet-600',
  'from-amber-400 to-amber-600',
  'from-rose-400 to-rose-600',
  'from-cyan-400 to-cyan-600',
];

export default function StudentDashboardPage() {
  const { data: progression, isLoading: loadingProgression } = useQuery<GlobalProgression>({
    queryKey: ['global-progression'],
    queryFn: async () => {
      const res = await api.get('/apprenant/progression');
      return res.data;
    },
  });

  const { data: myCoursesData, isLoading: loadingCourses } = useQuery({
    queryKey: ['my-courses'],
    queryFn: async () => {
      const res = await api.get('/apprenant/my-cours');
      return res.data;
    },
  });

  const enrolledCourses: Enrollment[] = myCoursesData?.enrollments || progression?.enrollments || [];
  const summary = progression?.summary;

  return (
    <StudentLayout title="Tableau de bord">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-indigo-600 p-8 text-white shadow-xl shadow-primary-500/20">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="relative">
          <h2 className="text-2xl font-extrabold">Bonjour !</h2>
          <p className="text-white/80 mt-1">Continuez votre parcours d'apprentissage</p>
          {summary && (
            <div className="mt-5 flex items-center gap-4">
              <div className="flex-1 max-w-sm">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-white/70">Progression globale</span>
                  <span className="font-bold text-white">{summary.averageProgress}%</span>
                </div>
                <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-3 bg-white rounded-full transition-all shadow-sm" style={{ width: `${summary.averageProgress}%` }} />
                </div>
              </div>
              <Link
                to="/student/catalog"
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-all duration-200 backdrop-blur-sm"
              >
                <span className="material-symbols-outlined text-lg">explore</span>
                Explorer
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Stat cards - colorful numbers */}
      {loadingProgression ? (
        <LoadingSpinner className="py-4" />
      ) : summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm dark:shadow-card-dark p-5 flex items-start justify-between ring-1 ring-blue-100 dark:ring-blue-900/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-dark-300">En cours</p>
              <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 tracking-tight">{summary.inProgressCourses}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500 shadow-lg shadow-blue-500/30 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <span className="material-symbols-outlined text-white text-2xl">play_circle</span>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm dark:shadow-card-dark p-5 flex items-start justify-between ring-1 ring-emerald-100 dark:ring-emerald-900/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-dark-300">Terminés</p>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 tracking-tight">{summary.completedCourses}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <span className="material-symbols-outlined text-white text-2xl">check_circle</span>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm dark:shadow-card-dark p-5 flex items-start justify-between ring-1 ring-indigo-100 dark:ring-indigo-900/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-dark-300">Progression</p>
              <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 tracking-tight">{summary.averageProgress}%</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/30 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <span className="material-symbols-outlined text-white text-2xl">trending_up</span>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm dark:shadow-card-dark p-5 flex items-start justify-between ring-1 ring-amber-100 dark:ring-amber-900/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-dark-300">Inscriptions</p>
              <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 tracking-tight">{summary.totalEnrolled}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500 shadow-lg shadow-amber-500/30 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <span className="material-symbols-outlined text-white text-2xl">workspace_premium</span>
            </div>
          </div>
        </div>
      )}

      {/* My courses */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Mes cours</h3>
        <Link to="/student/catalog" className="text-sm text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 font-semibold flex items-center gap-1 transition-all duration-200">
          Explorer les cours
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>

      {loadingCourses ? (
        <LoadingSpinner className="py-8" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {enrolledCourses.map((item: Enrollment, i: number) => (
            <Link
              key={item.id}
              to={`/student/course/${item.courseId}`}
              className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm dark:shadow-card-dark overflow-hidden hover:shadow-xl transition-all duration-300 group hover:-translate-y-1"
            >
              <div className={`h-36 bg-gradient-to-br ${gradientColors[i % gradientColors.length]} relative`}>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
                  <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-primary-600 text-2xl">play_arrow</span>
                  </div>
                </div>
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-white text-xs font-semibold">
                    {item.progress}%
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1">{item.cours?.title || 'Cours'}</h4>
                <p className="text-sm text-gray-500 dark:text-dark-400 mt-1 line-clamp-1">{item.cours?.category?.name || ''}</p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-dark-400 mb-1">
                    <span>Progression</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{item.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all" style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {enrolledCourses.length === 0 && (
            <div className="col-span-full text-center py-16 bg-white dark:bg-dark-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-dark-600">
              <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-dark-500">school</span>
              <p className="text-gray-400 dark:text-dark-400 mt-3 font-medium">Vous n'êtes inscrit à aucun cours</p>
              <Link
                to="/student/catalog"
                className="inline-flex items-center gap-2 mt-5 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-lg shadow-primary-500/25"
              >
                <span className="material-symbols-outlined text-sm">explore</span>
                Explorer les cours
              </Link>
            </div>
          )}
        </div>
      )}
    </StudentLayout>
  );
}
