import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import AdminLayout from '../../components/layout/AdminLayout';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import CourseForm from '../../components/admin/CourseForm';
import ContentManager from '../../components/admin/ContentManager';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import type { Cours } from '../../types';

const niveaux = [
  { key: 'SIXIEME', label: '6ème', icon: 'looks_one', color: 'from-blue-500 to-blue-600' },
  { key: 'CINQUIEME', label: '5ème', icon: 'looks_two', color: 'from-indigo-500 to-indigo-600' },
  { key: 'QUATRIEME', label: '4ème', icon: 'looks_3', color: 'from-violet-500 to-violet-600' },
  { key: 'TROISIEME', label: '3ème', icon: 'looks_4', color: 'from-purple-500 to-purple-600' },
  { key: 'SECONDE', label: 'Seconde', icon: 'school', color: 'from-teal-500 to-teal-600' },
  { key: 'PREMIERE', label: 'Première', icon: 'school', color: 'from-amber-500 to-amber-600', hasSerie: true },
  { key: 'TERMINALE', label: 'Terminale', icon: 'emoji_events', color: 'from-rose-500 to-rose-600', hasSerie: true },
];

const series = [
  { key: 'S', label: 'Série S', icon: 'science', color: 'from-emerald-500 to-emerald-600' },
  { key: 'L', label: 'Série L', icon: 'menu_book', color: 'from-cyan-500 to-cyan-600' },
  { key: 'OSE', label: 'Série OSE', icon: 'settings', color: 'from-orange-500 to-orange-600' },
];

export default function CourseManagementPage() {
  const [selectedNiveau, setSelectedNiveau] = useState<string | null>(null);
  const [selectedSerie, setSelectedSerie] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Cours | null>(null);
  const [showContentModal, setShowContentModal] = useState<Cours | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Cours | null>(null);
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await api.get('/admin/categories');
      return res.data.categories;
    },
  });

  const { data: allCourses, isLoading: loadingAll } = useQuery({
    queryKey: ['admin-cours'],
    queryFn: async () => {
      const res = await api.get('/admin/cours?limit=500');
      return res.data.courses as Cours[];
    },
  });

  const coursesByNiveau: Record<string, Cours[]> = {};
  allCourses?.forEach((c) => {
    const key = c.niveau || '__none__';
    if (!coursesByNiveau[key]) coursesByNiveau[key] = [];
    coursesByNiveau[key].push(c);
  });

  const filteredCourses = allCourses?.filter((c) => {
    if (c.niveau !== selectedNiveau) return false;
    if ((selectedNiveau === 'PREMIERE' || selectedNiveau === 'TERMINALE') && selectedSerie) {
      return c.serie === selectedSerie;
    }
    return true;
  });

  const createMutation = useMutation({
    mutationFn: async (formData: any) => api.post('/admin/cours', formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cours'] });
      setShowCreateModal(false);
      toast.success('Cours créé avec succès');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || err.response?.data?.details?.[0]?.message || 'Erreur'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => api.put(`/admin/cours/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cours'] });
      setEditingCourse(null);
      toast.success('Cours modifié avec succès');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || err.response?.data?.details?.[0]?.message || 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/admin/cours/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cours'] });
      toast.success('Cours supprimé');
      setDeleteTarget(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) =>
      api.patch(`/admin/cours/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cours'] });
      toast.success('Statut mis à jour');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const handleCreateClick = () => {
    setShowCreateModal(true);
  };

  const getCreateDefaults = () => {
    const defaults: any = {};
    if (selectedNiveau) defaults.niveau = selectedNiveau;
    if (selectedSerie) defaults.serie = selectedSerie;
    return defaults;
  };

  const niveauLabel = niveaux.find((n) => n.key === selectedNiveau)?.label || '';
  const serieLabel = series.find((s) => s.key === selectedSerie)?.label || '';

  if (loadingAll) {
    return (
      <AdminLayout title="Gestion des cours">
        <LoadingSpinner className="py-12" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gestion des cours">
      {/* Level 1: Niveau cards */}
      {!selectedNiveau && (
        <>
          <p className="text-sm text-gray-500 dark:text-dark-400 mb-4">Sélectionnez un niveau pour gérer ses cours</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {niveaux.map((n) => {
              const count = coursesByNiveau[n.key]?.length || 0;
              return (
                <button
                  key={n.key}
                  onClick={() => setSelectedNiveau(n.key)}
                  className={`bg-gradient-to-br ${n.color} rounded-xl p-6 text-left text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 group`}
                >
                  <span className="material-symbols-outlined text-4xl opacity-80 group-hover:opacity-100 transition-opacity">
                    {n.icon}
                  </span>
                  <h3 className="text-xl font-bold mt-3">{n.label}</h3>
                  <p className="text-sm opacity-80 mt-1">
                    {count} cours
                  </p>
                  {n.hasSerie && (
                    <div className="flex gap-2 mt-3">
                      {series.map((s) => {
                        const sCount = coursesByNiveau[n.key]?.filter((c) => c.serie === s.key).length || 0;
                        return (
                          <span key={s.key} className="text-xs bg-white/20 rounded-full px-2.5 py-1">
                            {s.key} ({sCount})
                          </span>
                        );
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Level 2: Serie sub-cards (Première / Terminale) */}
      {selectedNiveau && (selectedNiveau === 'PREMIERE' || selectedNiveau === 'TERMINALE') && !selectedSerie && (
        <>
          <button
            onClick={() => setSelectedNiveau(null)}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200 mb-4 transition-colors duration-200"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Retour aux niveaux
          </button>
          <p className="text-sm text-gray-500 dark:text-dark-400 mb-4">Sélectionnez une série pour <strong>{niveauLabel}</strong></p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {series.map((s) => {
              const count = coursesByNiveau[selectedNiveau]?.filter((c) => c.serie === s.key).length || 0;
              return (
                <button
                  key={s.key}
                  onClick={() => setSelectedSerie(s.key)}
                  className={`bg-gradient-to-br ${s.color} rounded-xl p-6 text-left text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 group`}
                >
                  <span className="material-symbols-outlined text-4xl opacity-80 group-hover:opacity-100 transition-opacity">
                    {s.icon}
                  </span>
                  <h3 className="text-xl font-bold mt-3">{s.label}</h3>
                  <p className="text-sm opacity-80 mt-1">{count} cours</p>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Level 3: Course list for selected niveau/serie */}
      {selectedNiveau && (selectedNiveau !== 'PREMIERE' && selectedNiveau !== 'TERMINALE' || selectedSerie) && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => { setSelectedSerie(null); if (selectedNiveau === 'PREMIERE' || selectedNiveau === 'TERMINALE') setSelectedNiveau(null); else setSelectedNiveau(null); }}
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200 transition-colors duration-200"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Retour
            </button>
            <div className="h-5 w-px bg-gray-200 dark:bg-dark-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {niveauLabel}
              {serieLabel && <> — {serieLabel}</>}
            </h2>
            <Badge variant="gray">{filteredCourses?.length || 0} cours</Badge>
          </div>

          <div className="flex justify-end mb-4">
            <button
              onClick={handleCreateClick}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-all duration-200"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Nouveau cours
            </button>
          </div>

          {!filteredCourses || filteredCourses.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 transition-all duration-200">
              <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-dark-500">school</span>
              <p className="text-gray-400 dark:text-dark-400 mt-3">Aucun cours pour ce niveau{serieLabel ? ` — ${serieLabel}` : ''}</p>
              <button
                onClick={handleCreateClick}
                className="mt-4 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-all duration-200"
              >
                Créer le premier cours
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((course) => (
                <div key={course.id} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 shadow-card dark:shadow-card-dark overflow-hidden hover:shadow-md transition-all duration-200">
                  <div className="h-3 bg-gradient-to-r from-primary-400 to-primary-600" />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 flex-1">{course.title}</h3>
                      <Badge variant={course.status === 'PUBLIE' ? 'success' : course.status === 'BROUILLON' ? 'warning' : 'gray'}>
                        {course.status === 'PUBLIE' ? 'Publié' : course.status === 'BROUILLON' ? 'Brouillon' : 'Archivé'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-dark-400 line-clamp-2 mb-3">{course.description || 'Pas de description'}</p>
                    {course.category && (
                      <Badge variant="gray">{course.category.name}</Badge>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 dark:text-dark-400">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">videocam</span>
                        {course._count?.videos || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">description</span>
                        {course._count?.pdfs || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">people</span>
                        {course._count?.enrollments || 0}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-dark-700">
                      <button
                        onClick={() => setShowContentModal(course)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-all duration-200"
                      >
                        <span className="material-symbols-outlined text-sm">upload_file</span>
                        Contenu
                      </button>
                      <button
                        onClick={() => setEditingCourse(course)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-600 dark:text-dark-300 bg-gray-50 dark:bg-dark-700 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-all duration-200"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        Modifier
                      </button>
                      <button
                        onClick={() => {
                          const newStatus = course.status === 'PUBLIE' ? 'BROUILLON' : 'PUBLIE';
                          statusMutation.mutate({ id: course.id, status: newStatus });
                        }}
                        className="flex items-center justify-center w-9 h-9 text-gray-400 dark:text-dark-400 bg-gray-50 dark:bg-dark-700 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-600 transition-all duration-200"
                        title={course.status === 'PUBLIE' ? 'Dépublier' : 'Publier'}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {course.status === 'PUBLIE' ? 'visibility_off' : 'publish'}
                        </span>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(course)}
                        className="flex items-center justify-center w-9 h-9 text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200"
                        title="Supprimer"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Créer un cours">
        <CourseForm
          categories={categories || []}
          initialData={getCreateDefaults()}
          onSubmit={(formData) => createMutation.mutate(formData)}
          onClose={() => setShowCreateModal(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editingCourse} onClose={() => setEditingCourse(null)} title="Modifier le cours">
        {editingCourse && (
          <CourseForm
            categories={categories || []}
            initialData={editingCourse}
            onSubmit={(formData) => updateMutation.mutate({ id: editingCourse.id, data: formData })}
            onClose={() => setEditingCourse(null)}
            isLoading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Content Modal */}
      <Modal isOpen={!!showContentModal} onClose={() => setShowContentModal(null)} title={`Contenu: ${showContentModal?.title || ''}`} size="xl">
        {showContentModal && (
          <ContentManager coursId={showContentModal.id} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['admin-cours'] })} />
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirmer la suppression" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-dark-300">
            Voulez-vous vraiment supprimer le cours <strong>{deleteTarget?.title}</strong> et tout son contenu ?
            Cette action est irréversible.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-dark-300 bg-gray-100 dark:bg-dark-700 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-all duration-200"
            >
              Annuler
            </button>
            <button
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-danger rounded-lg hover:bg-red-600 transition-all duration-200 disabled:opacity-50"
            >
              {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
