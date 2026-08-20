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
      <div className="bg-white dark:bg-dark-800 rounded-2xl p-5 shadow-sm dark:shadow-card-dark ring-1 ring-gray-100 dark:ring-dark-700 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 dark:text-dark-400 text-xl">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-dark-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 dark:bg-dark-900 dark:text-white transition-all duration-200"
            placeholder="Rechercher dans mes cours..."
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-3 border border-gray-200 dark:border-dark-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 dark:bg-dark-900 dark:text-white transition-all duration-200"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredCourses.map((item) => (
            <CourseCard
              key={item.id}
              course={item.cours!}
              progress={item.progress || 0}
              role="APPRENANT"
            />
          ))}
          {filteredCourses.length === 0 && (
            <div className="col-span-full text-center py-16 bg-white dark:bg-dark-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-dark-600">
              <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-dark-500">school</span>
              <p className="text-gray-400 dark:text-dark-400 mt-3 font-medium">
                {search || categoryFilter
                  ? 'Aucun cours ne correspond à votre recherche'
                  : "Vous n'êtes inscrit à aucun cours"}
              </p>
              {!search && !categoryFilter && (
                <Link
                  to="/student/catalog"
                  className="inline-flex items-center gap-2 mt-5 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-lg shadow-primary-500/25"
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
