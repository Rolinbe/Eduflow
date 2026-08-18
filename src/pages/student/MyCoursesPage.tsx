import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StudentLayout from '../../components/layout/StudentLayout';
import CourseCard from '../../components/ui/CourseCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import type { Enrollment } from '../../types';

export default function MyCoursesPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data: myData, isLoading } = useQuery({
    queryKey: ['my-courses'],
    queryFn: async () => {
      const res = await api.get('/apprenant/my-cours');
      return res.data;
    },
  });

  const enrollments: Enrollment[] = myData?.enrollments || [];

  const filteredCourses = enrollments.filter((item) => {
    const cours = item.cours;
    const matchesSearch = !search || cours?.title?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || cours?.category?.name === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(enrollments.map((item) => item.cours?.category?.name).filter(Boolean))];

  return (
    <StudentLayout title="Mes cours">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-xl">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            placeholder="Rechercher dans mes cours..."
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((cat) => (
            <option key={cat as string} value={cat as string}>{cat as string}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCourses.map((item) => (
            <CourseCard
              key={item.id}
              course={item.cours!}
              progress={item.progress || 0}
              role="APPRENANT"
            />
          ))}
          {filteredCourses.length === 0 && (
            <div className="col-span-full text-center py-12">
              <span className="material-symbols-outlined text-5xl text-gray-300">school</span>
              <p className="text-gray-400 mt-3">
                {search || categoryFilter
                  ? 'Aucun cours ne correspond à votre recherche'
                  : "Vous n'êtes inscrit à aucun cours"}
              </p>
              {!search && !categoryFilter && (
                <Link
                  to="/student/catalog"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">explore</span>
                  Explorer les cours
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </StudentLayout>
  );
}
