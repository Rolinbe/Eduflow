import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StudentLayout from '../../components/layout/StudentLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import type { Cours } from '../../types';

const niveauLabels: Record<string, string> = {
  SIXIEME: '6ème', CINQUIEME: '5ème', QUATRIEME: '4ème', TROISIEME: '3ème',
  SECONDE: 'Seconde', PREMIERE: 'Première', TERMINALE: 'Terminale',
};

const gradientColors = [
  'from-blue-400 to-indigo-500',
  'from-emerald-400 to-teal-500',
  'from-violet-400 to-purple-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-cyan-400 to-sky-500',
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function CourseCatalogPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ['student-categories'],
    queryFn: async () => {
      const res = await api.get('/apprenant/categories');
      return res.data.categories || res.data;
    },
  });

  const { data: myCoursesData } = useQuery({
    queryKey: ['my-courses'],
    queryFn: async () => {
      const res = await api.get('/apprenant/my-cours');
      return res.data;
    },
  });

  const enrolledCourseIds = new Set(
    (myCoursesData?.enrollments || []).map((e: any) => e.courseId)
  );

  const { data: courses, isLoading } = useQuery({
    queryKey: ['student-catalog', search, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      const res = await api.get(`/apprenant/cours?${params.toString()}`);
      return res.data.courses || res.data;
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async (courseId: number) => api.post(`/apprenant/cours/${courseId}/enroll`),
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      queryClient.invalidateQueries({ queryKey: ['global-progression'] });
      toast.success('Inscription réussie !');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Erreur lors de l'inscription"),
  });

  return (
    <StudentLayout title="Explorer les cours">
      {/* Search & Filter bar */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl p-5 shadow-sm dark:shadow-card-dark ring-1 ring-gray-100 dark:ring-dark-700 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 dark:text-dark-400 text-xl">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-dark-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 dark:bg-dark-900 dark:text-white transition-all duration-200"
            placeholder="Rechercher un cours..."
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-3 border border-gray-200 dark:border-dark-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 dark:bg-dark-900 dark:text-white transition-all duration-200"
        >
          <option value="">Toutes les catégories</option>
          {categories?.map((cat: any) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {courses?.map((course: Cours) => {
            const gradient = gradientColors[hashStr(course.title || '') % gradientColors.length];
            return (
              <div key={course.id} className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm dark:shadow-card-dark overflow-hidden hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 ring-1 ring-gray-100 dark:ring-dark-700">
                <div className={`h-40 bg-gradient-to-br ${gradient} relative`}>
                  {course.coverImage && (
                    <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {course.niveau && (
                      <Badge variant="primary">
                        {niveauLabels[course.niveau] || course.niveau}{course.serie ? ` ${course.serie}` : ''}
                      </Badge>
                    )}
                    <Badge variant={course.status === 'PUBLIE' ? 'success' : 'gray'}>
                      {course.category?.name || ''}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
                    <div className="w-14 h-14 bg-white/90 dark:bg-dark-800/90 rounded-full flex items-center justify-center shadow-lg">
                      <span className="material-symbols-outlined text-primary-600 text-2xl">play_arrow</span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{course.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-dark-400 mt-1 line-clamp-2">{course.description || 'Pas de description'}</p>
                  <div className="flex items-center gap-2 mt-3 text-xs text-gray-400 dark:text-dark-400">
                    <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <span className="material-symbols-outlined text-sm text-blue-500">videocam</span>
                      <span className="font-medium">{course._count?.videos || 0}</span>
                    </span>
                    <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <span className="material-symbols-outlined text-sm text-amber-500">description</span>
                      <span className="font-medium">{course._count?.pdfs || 0}</span>
                    </span>
                    <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                      <span className="material-symbols-outlined text-sm text-emerald-500">people</span>
                      <span className="font-medium">{course._count?.enrollments || 0}</span>
                    </span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-700">
                    {enrolledCourseIds.has(course.id) ? (
                      <Link
                        to={`/student/course/${course.id}`}
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 text-emerald-700 dark:text-emerald-400 text-sm font-semibold rounded-xl hover:from-emerald-100 hover:to-emerald-200 dark:hover:from-emerald-900/40 dark:hover:to-emerald-800/30 transition-all duration-200"
                      >
                        <span className="material-symbols-outlined text-sm">play_circle</span>
                        Continuer
                      </Link>
                    ) : (
                      <button
                        onClick={() => enrollMutation.mutate(course.id)}
                        disabled={enrollMutation.isPending}
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-primary-500/25"
                      >
                        <span className="material-symbols-outlined text-sm">add_circle</span>
                        {enrollMutation.isPending ? 'Inscription...' : "S'inscrire"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {(!courses || courses.length === 0) && (
            <div className="col-span-full text-center py-16 bg-white dark:bg-dark-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-dark-600">
              <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-dark-500">explore</span>
              <p className="text-gray-400 dark:text-dark-400 mt-3 font-medium">Aucun cours disponible</p>
            </div>
          )}
        </div>
      )}
    </StudentLayout>
  );
}
