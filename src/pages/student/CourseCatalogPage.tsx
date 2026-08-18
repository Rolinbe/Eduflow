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

const niveauValues = ['SIXIEME', 'CINQUIEME', 'QUATRIEME', 'TROISIEME', 'SECONDE', 'PREMIERE', 'TERMINALE'] as const;

export default function CourseCatalogPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [niveauFilter, setNiveauFilter] = useState('');
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
    queryKey: ['student-catalog', search, categoryFilter, niveauFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      if (niveauFilter) params.set('niveau', niveauFilter);
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
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-xl">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            placeholder="Rechercher un cours..."
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
        >
          <option value="">Toutes les catégories</option>
          {categories?.map((cat: any) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <select
          value={niveauFilter}
          onChange={(e) => setNiveauFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
        >
          <option value="">Tous les niveaux</option>
          {niveauValues.map((n) => (
            <option key={n} value={n}>{niveauLabels[n]}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses?.map((course: Cours) => (
            <div key={course.id} className="bg-white rounded-lg shadow-card overflow-hidden hover:shadow-md transition-shadow duration-200 group">
              <div className="h-40 bg-gradient-to-br from-primary-400 to-primary-700 relative">
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
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 line-clamp-1">{course.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{course.description || 'Pas de description'}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">videocam</span>
                    {course._count?.videos || 0} vidéos
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">description</span>
                    {course._count?.pdfs || 0} PDFs
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">people</span>
                    {course._count?.enrollments || 0}
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {enrolledCourseIds.has(course.id) ? (
                    <Link
                      to={`/student/course/${course.id}`}
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-50 text-green-700 text-sm font-medium rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">play_circle</span>
                      Continuer
                    </Link>
                  ) : (
                    <button
                      onClick={() => enrollMutation.mutate(course.id)}
                      disabled={enrollMutation.isPending}
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">add_circle</span>
                      {enrollMutation.isPending ? 'Inscription...' : "S'inscrire"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {(!courses || courses.length === 0) && (
            <div className="col-span-full text-center py-12">
              <span className="material-symbols-outlined text-5xl text-gray-300">school</span>
              <p className="text-gray-400 mt-3">Aucun cours disponible</p>
            </div>
          )}
        </div>
      )}
    </StudentLayout>
  );
}
