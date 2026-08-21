import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import MentorLayout from '../../components/layout/MentorLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const niveauLabels: Record<string, string> = {
  SIXIEME: '6ème', CINQUIEME: '5ème', QUATRIEME: '4ème', TROISIEME: '3ème',
  SECONDE: 'Seconde', PREMIERE: 'Première', TERMINALE: 'Terminale',
  LICENCE: 'Licence', MASTER: 'Master', DOCTORAT: 'Doctorat',
};

function getInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
}

function getProgressColor(progress: number) {
  if (progress >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (progress >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-500 dark:text-red-400';
}

function getProgressBg(progress: number) {
  if (progress >= 80) return 'bg-emerald-500';
  if (progress >= 50) return 'bg-amber-500';
  return 'bg-red-400';
}

function getLevelBadge(niveau: string, serie?: string) {
  const label = niveauLabels[niveau] || niveau;
  const showSerie = (niveau === 'PREMIERE' || niveau === 'TERMINALE') && serie;
  return `${label}${showSerie ? ` · ${serie}` : ''}`;
}

export default function MentorStudentsPage() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'progress'>('name');
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['mentor-students'],
    queryFn: async () => {
      const res = await api.get('/mentor/students');
      return res.data;
    },
  });

  const students = (data?.students || [])
    .filter((s: any) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return s.firstName.toLowerCase().includes(q) || s.lastName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    })
    .sort((a: any, b: any) => {
      if (sortBy === 'progress') return (b.avgProgress || 0) - (a.avgProgress || 0);
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    });

  const totalStudents = students.length;
  const avgProgress = totalStudents > 0
    ? Math.round(students.reduce((sum: number, s: any) => sum + (s.avgProgress || 0), 0) / totalStudents)
    : 0;
  const totalEnrollments = students.reduce((sum: number, s: any) => sum + (s.coursesCount || 0), 0);
  const activeStudents = students.filter((s: any) => s.avgProgress > 0).length;

  return (
    <MentorLayout title="Mes élèves">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total élèves', value: totalStudents, icon: 'groups', color: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/20' },
          { label: 'Actifs', value: activeStudents, icon: 'trending_up', color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
          { label: 'Inscriptions', value: totalEnrollments, icon: 'menu_book', color: 'from-blue-500 to-cyan-600', shadow: 'shadow-blue-500/20' },
          { label: 'Moy. progression', value: `${avgProgress}%`, icon: 'equalizer', color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-dark-800 rounded-2xl p-5 shadow-sm dark:shadow-card-dark ring-1 ring-gray-100 dark:ring-dark-700 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg ${stat.shadow}`}>
                <span className="material-symbols-outlined text-white text-xl">{stat.icon}</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-dark-400 font-medium">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl p-5 shadow-sm dark:shadow-card-dark ring-1 ring-gray-100 dark:ring-dark-700">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 dark:text-dark-400 text-xl">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border-2 border-gray-100 dark:border-dark-700 rounded-2xl text-sm bg-gray-50 dark:bg-dark-900 dark:text-white focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-dark-500 hover:border-gray-200 dark:hover:border-dark-600 shadow-sm"
              placeholder="Rechercher par nom ou email..."
            />
          </div>
          <div className="flex gap-2">
            {[
              { key: 'name' as const, label: 'Nom', icon: 'sort_by_alpha' },
              { key: 'progress' as const, label: 'Progression', icon: 'trending_up' },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSortBy(opt.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  sortBy === opt.key
                    ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                    : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-300 hover:bg-gray-200 dark:hover:bg-dark-600'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{opt.icon}</span>
                <span className="hidden sm:inline">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Students Grid */}
      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : students.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {students.map((student: any) => (
            <div key={student.id} className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm dark:shadow-card-dark ring-1 ring-gray-100 dark:ring-dark-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              {/* Header */}
              <div className="bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 p-5 relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-xl" />
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-white/0 via-white/30 to-white/0" />
                <div className="relative flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-white/20 flex-shrink-0">
                    {student.avatar ? (
                      <img src={student.avatar} alt="" className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-white">
                        {getInitials(student.firstName, student.lastName)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-bold text-base truncate">{student.firstName} {student.lastName}</h3>
                    <p className="text-white/60 text-xs truncate">{student.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {student.niveau && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-md text-white text-[10px] font-bold uppercase tracking-wide">
                          <span className="material-symbols-outlined text-[10px]">school</span>
                          {getLevelBadge(student.niveau, student.serie)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-5">
                {/* Main stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-dark-900 rounded-xl">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{student.coursesCount}</p>
                    <p className="text-[10px] text-gray-500 dark:text-dark-400 font-semibold uppercase tracking-wide mt-0.5">Cours suivis</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-dark-900 rounded-xl">
                    <p className={`text-xl font-bold ${getProgressColor(student.avgProgress)}`}>{student.avgProgress}%</p>
                    <p className="text-[10px] text-gray-500 dark:text-dark-400 font-semibold uppercase tracking-wide mt-0.5">Progression</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="h-2 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${getProgressBg(student.avgProgress)}`}
                      style={{ width: `${student.avgProgress}%` }}
                    />
                  </div>
                </div>

                {/* Enrollments list */}
                {student.enrollments?.length > 0 && (
                  <div className="space-y-1.5 mb-4">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-dark-500 uppercase tracking-wider mb-2">Cours en cours</p>
                    {student.enrollments.slice(0, 3).map((e: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-900 transition-colors duration-150">
                        <span className="text-xs text-gray-600 dark:text-dark-300 truncate flex-1 mr-2">{e.coursTitle}</span>
                        <span className={`text-xs font-bold ${getProgressColor(e.progress)}`}>{e.progress}%</span>
                      </div>
                    ))}
                    {student.enrollments.length > 3 && (
                      <p className="text-[10px] text-gray-400 dark:text-dark-500 text-center">
                        +{student.enrollments.length - 3} autre{student.enrollments.length - 3 > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )}

                {student.coursesCount === 0 && (
                  <div className="text-center py-3 mb-4 bg-gray-50 dark:bg-dark-900 rounded-xl">
                    <span className="material-symbols-outlined text-gray-300 dark:text-dark-500 text-2xl">hourglass_empty</span>
                    <p className="text-[10px] text-gray-400 dark:text-dark-500 font-medium mt-1">Pas encore de cours</p>
                  </div>
                )}

                {/* Action */}
                <button
                  onClick={() => navigate(`/mentor/chat?student=${student.id}`)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 rounded-xl hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-all duration-200 group/btn"
                >
                  <span className="material-symbols-outlined text-base group-hover/btn:scale-110 transition-transform duration-200">chat</span>
                  Envoyer un message
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-dark-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-dark-600">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-dark-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-gray-300 dark:text-dark-500 text-3xl">groups</span>
          </div>
          <p className="text-gray-500 dark:text-dark-400 font-medium">
            {search ? 'Aucun élève ne correspond à votre recherche' : 'Aucun élève inscrit à vos cours'}
          </p>
          <p className="text-xs text-gray-400 dark:text-dark-500 mt-1">
            {!search && 'Les apprenants apparaîtront ici une fois inscrits à vos cours'}
          </p>
        </div>
      )}
    </MentorLayout>
  );
}
