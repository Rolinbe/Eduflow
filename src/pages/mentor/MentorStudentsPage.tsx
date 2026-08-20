import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import MentorLayout from '../../components/layout/MentorLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ProgressBar from '../../components/ui/ProgressBar';

const niveauLabels: Record<string, string> = {
  SIXIEME: '6ème', CINQUIEME: '5ème', QUATRIEME: '4ème', TROISIEME: '3ème',
  SECONDE: 'Seconde', PREMIERE: 'Première', TERMINALE: 'Terminale',
};

export default function MentorStudentsPage() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['mentor-students'],
    queryFn: async () => {
      const res = await api.get('/mentor/students');
      return res.data;
    },
  });

  const students = (data?.students || []).filter((s: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.firstName.toLowerCase().includes(q) || s.lastName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  return (
    <MentorLayout title="Mes élèves">
      <div className="bg-white dark:bg-dark-800 rounded-2xl p-5 shadow-sm dark:shadow-card-dark ring-1 ring-gray-100 dark:ring-dark-700">
        <div className="relative max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 dark:text-dark-400 text-xl">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-dark-600 rounded-xl text-sm bg-gray-50 dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
            placeholder="Rechercher un élève..."
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : students.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {students.map((student: any) => (
            <div key={student.id} className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm dark:shadow-card-dark ring-1 ring-gray-100 dark:ring-dark-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="bg-gradient-to-br from-violet-400 to-purple-500 p-6 text-center relative overflow-hidden">
                <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                <div className="relative">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                    {student.avatar ? (
                      <img src={student.avatar} alt="" className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-white">
                        {student.firstName?.[0]}{student.lastName?.[0]}
                      </span>
                    )}
                  </div>
                  <h3 className="text-white font-bold text-lg mt-3">{student.firstName} {student.lastName}</h3>
                  <p className="text-white/70 text-sm">{student.email}</p>
                  {student.niveau && (
                    <span className="inline-block mt-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-white text-xs font-semibold">
                      {niveauLabels[student.niveau] || student.niveau}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500 dark:text-dark-400">Cours suivis</span>
                  <span className="text-sm font-bold text-violet-600 dark:text-violet-400">{student.coursesCount}</span>
                </div>
                {student.coursesCount > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-dark-400 mb-1">
                      <span>Progression moyenne</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{student.avgProgress}%</span>
                    </div>
                    <ProgressBar value={student.avgProgress} size="sm" />
                  </div>
                )}
                {student.enrollments?.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {student.enrollments.slice(0, 3).map((e: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-dark-400 truncate flex-1">{e.coursTitle}</span>
                        <span className="font-bold text-gray-700 dark:text-dark-200 ml-2">{e.progress}%</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-dark-700">
                  <button
                    onClick={() => navigate(`/mentor/chat?student=${student.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 rounded-xl hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-all duration-200"
                  >
                    <span className="material-symbols-outlined text-sm">chat</span>
                    Message
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-dark-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-dark-600">
          <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-dark-500">groups</span>
          <p className="text-gray-400 dark:text-dark-400 mt-3 font-medium">
            {search ? 'Aucun élève ne correspond à votre recherche' : 'Aucun élève inscrit à vos cours'}
          </p>
        </div>
      )}
    </MentorLayout>
  );
}
