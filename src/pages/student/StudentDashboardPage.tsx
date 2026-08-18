import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StudentLayout from '../../components/layout/StudentLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import type { GlobalProgression, Enrollment } from '../../types';

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
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold">Bienvenue sur EduFlow!</h2>
        <p className="text-white/70 mt-1 text-sm">Continuez votre parcours d'apprentissage</p>
        {summary && (
          <div className="mt-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 max-w-md">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-white/80">Progression globale</span>
                  <span className="font-semibold">{summary.averageProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-white/20 rounded-full">
                  <div className="h-2.5 bg-white rounded-full transition-all" style={{ width: `${summary.averageProgress}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {loadingProgression ? (
        <LoadingSpinner className="py-4" />
      ) : summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Cours en cours</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.inProgressCourses}</p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
              <span className="material-symbols-outlined text-2xl">play_circle</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Cours terminés</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.completedCourses}</p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-50 text-green-600">
              <span className="material-symbols-outlined text-2xl">check_circle</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Progression moyenne</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.averageProgress}%</p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-indigo-50 text-indigo-600">
              <span className="material-symbols-outlined text-2xl">trending_up</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total inscrits</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalEnrolled}</p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-yellow-50 text-yellow-600">
              <span className="material-symbols-outlined text-2xl">workspace_premium</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">Mes cours</h3>
        <Link to="/student/catalog" className="text-sm text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1">
          Explorer les cours
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>

      {loadingCourses ? (
        <LoadingSpinner className="py-8" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {enrolledCourses.map((item: Enrollment) => (
            <Link
              key={item.id}
              to={`/student/course/${item.courseId}`}
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
            >
              <div className="h-32 bg-gradient-to-br from-blue-400 to-blue-700 relative">
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-600">play_arrow</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-gray-900 line-clamp-1">{item.cours?.title || 'Cours'}</h4>
                <p className="text-sm text-gray-500 mt-1 line-clamp-1">{item.cours?.category?.name || ''}</p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progression</span>
                    <span className="font-medium">{item.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full">
                    <div className="h-2 bg-green-500 rounded-full transition-all" style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {enrolledCourses.length === 0 && (
            <div className="col-span-full text-center py-12">
              <span className="material-symbols-outlined text-5xl text-gray-300">school</span>
              <p className="text-gray-400 mt-3">Vous n'êtes inscrit à aucun cours</p>
              <Link
                to="/student/catalog"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
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
