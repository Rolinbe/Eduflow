import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import MentorLayout from '../../components/layout/MentorLayout';
import MentorContentManager from '../../components/mentor/MentorContentManager';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import type { Cours } from '../../types';

const niveauLabels: Record<string, string> = {
  SIXIEME: '6ème', CINQUIEME: '5ème', QUATRIEME: '4ème', TROISIEME: '3ème',
  SECONDE: 'Seconde', PREMIERE: 'Première', TERMINALE: 'Terminale',
};

const niveauValues = ['SIXIEME', 'CINQUIEME', 'QUATRIEME', 'TROISIEME', 'SECONDE', 'PREMIERE', 'TERMINALE'] as const;
const serieValues = ['S', 'L', 'OSE'] as const;

export default function MentorCoursesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Cours | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Cours | null>(null);
  const [showContentModal, setShowContentModal] = useState<Cours | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formNiveau, setFormNiveau] = useState('');
  const [formSerie, setFormSerie] = useState('');
  const [formStatus, setFormStatus] = useState('BROUILLON');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['mentor-courses'],
    queryFn: async () => {
      const res = await api.get('/mentor/cours');
      return res.data;
    },
  });

  const myCourses: Cours[] = data?.myCourses || [];
  const adminCourses: Cours[] = data?.adminCourses || [];

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormNiveau('');
    setFormSerie('');
    setFormStatus('BROUILLON');
  };

  const openCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEdit = (c: Cours) => {
    setFormTitle(c.title);
    setFormDescription(c.description || '');
    setFormNiveau(c.niveau || '');
    setFormSerie(c.serie || '');
    setFormStatus(c.status);
    setEditingCourse(c);
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => api.post('/mentor/cours', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-courses'] });
      queryClient.invalidateQueries({ queryKey: ['mentor-dashboard'] });
      setShowCreateModal(false);
      resetForm();
      toast.success('Cours créé avec succès');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => api.put(`/mentor/cours/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-cours'] });
      setEditingCourse(null);
      resetForm();
      toast.success('Cours modifié');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/mentor/cours/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-courses'] });
      queryClient.invalidateQueries({ queryKey: ['mentor-dashboard'] });
      setDeleteTarget(null);
      toast.success('Cours supprimé');
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => api.patch(`/mentor/cours/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mentor-courses'] }),
  });

  const handleSubmit = () => {
    const payload: any = { title: formTitle, description: formDescription || undefined, status: formStatus };
    if (formNiveau) {
      payload.niveau = formNiveau;
      if (formNiveau === 'PREMIERE' || formNiveau === 'TERMINALE') {
        payload.serie = formSerie || undefined;
      }
    }
    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <MentorLayout title="Mes cours">
      <div className="flex justify-end">
        <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-violet-600 text-white text-sm font-semibold rounded-xl hover:from-violet-600 hover:to-violet-700 transition-all duration-200 shadow-lg shadow-violet-500/25">
          <span className="material-symbols-outlined text-lg">add</span>
          Nouveau cours
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : myCourses.length === 0 && adminCourses.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-dark-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-dark-600">
          <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-dark-500">school</span>
          <p className="text-gray-400 dark:text-dark-400 mt-3 font-medium">Aucun cours disponible</p>
          <button onClick={openCreate} className="mt-5 px-6 py-3 bg-gradient-to-r from-violet-500 to-violet-600 text-white text-sm font-semibold rounded-xl hover:from-violet-600 hover:to-violet-700 transition-all duration-200 shadow-lg shadow-violet-500/25">
            Créer votre premier cours
          </button>
        </div>
      ) : (
        <>
          {/* Mes cours (créés par moi) */}
          {myCourses.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-white text-lg">school</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Mes cours</h3>
                <span className="px-2.5 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs font-bold rounded-full">{myCourses.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {myCourses.map((course) => (
                  <div key={course.id} className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm dark:shadow-card-dark ring-1 ring-gray-100 dark:ring-dark-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="h-3 bg-gradient-to-r from-violet-400 to-purple-500" />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1 flex-1">{course.title}</h3>
                        <Badge variant={course.status === 'PUBLIE' ? 'success' : course.status === 'BROUILLON' ? 'warning' : 'gray'}>
                          {course.status === 'PUBLIE' ? 'Publié' : course.status === 'BROUILLON' ? 'Brouillon' : 'Archivé'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-dark-400 line-clamp-2 mb-3">{course.description || 'Pas de description'}</p>
                      {course.niveau && (
                        <Badge variant="primary">{niveauLabels[course.niveau] || course.niveau}{course.serie ? ` ${course.serie}` : ''}</Badge>
                      )}
                      <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 dark:text-dark-400">
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
                      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-dark-700">
                        <button onClick={() => setShowContentModal(course)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 rounded-xl hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-all duration-200">
                          <span className="material-symbols-outlined text-sm">upload_file</span>
                          Gérer
                        </button>
                        <button onClick={() => openEdit(course)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-gray-600 dark:text-dark-300 bg-gray-50 dark:bg-dark-700 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-600 transition-all duration-200">
                          <span className="material-symbols-outlined text-sm">edit</span>
                          Modifier
                        </button>
                        <button onClick={() => statusMutation.mutate({ id: course.id, status: course.status === 'PUBLIE' ? 'BROUILLON' : 'PUBLIE' })} className="flex items-center justify-center w-9 h-9 text-gray-400 dark:text-dark-400 bg-gray-50 dark:bg-dark-700 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-600 transition-all duration-200">
                          <span className="material-symbols-outlined text-sm">{course.status === 'PUBLIE' ? 'visibility_off' : 'publish'}</span>
                        </button>
                        <button onClick={() => setDeleteTarget(course)} className="flex items-center justify-center w-9 h-9 text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cours de l'admin (correspondant à mon niveau) */}
          {adminCourses.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-white text-lg">admin_panel_settings</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Cours de l'administration</h3>
                <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-full">{adminCourses.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {adminCourses.map((course) => (
                  <div key={course.id} className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm dark:shadow-card-dark ring-1 ring-gray-100 dark:ring-dark-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="h-3 bg-gradient-to-r from-blue-400 to-indigo-500" />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1 flex-1">{course.title}</h3>
                        <Badge variant="success">Publié</Badge>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-dark-400 line-clamp-2 mb-3">{course.description || 'Pas de description'}</p>
                      {course.niveau && (
                        <Badge variant="primary">{niveauLabels[course.niveau] || course.niveau}{course.serie ? ` ${course.serie}` : ''}</Badge>
                      )}
                      {course.admin && (
                        <p className="text-xs text-gray-400 dark:text-dark-400 mt-2">
                          Par {course.admin.firstName} {course.admin.lastName}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 dark:text-dark-400">
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
                        <button onClick={() => setShowContentModal(course)} className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200">
                          <span className="material-symbols-outlined text-sm">upload_file</span>
                          Accéder et gérer le contenu
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create / Edit Modal */}
      <Modal isOpen={showCreateModal || !!editingCourse} onClose={() => { setShowCreateModal(false); setEditingCourse(null); resetForm(); }} title={editingCourse ? 'Modifier le cours' : 'Nouveau cours'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-dark-200 mb-2">Titre</label>
            <input value={formTitle} onChange={e => setFormTitle(e.target.value)} className="w-full px-4 py-3 border border-gray-200 dark:border-dark-600 rounded-xl text-sm bg-gray-50 dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500" placeholder="Titre du cours" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-dark-200 mb-2">Description</label>
            <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} className="w-full px-4 py-3 border border-gray-200 dark:border-dark-600 rounded-xl text-sm bg-gray-50 dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500" rows={3} placeholder="Description du cours" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-dark-200 mb-2">Niveau</label>
              <select value={formNiveau} onChange={e => setFormNiveau(e.target.value)} className="w-full px-4 py-3 border border-gray-200 dark:border-dark-600 rounded-xl text-sm bg-gray-50 dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                <option value="">Sélectionner</option>
                {niveauValues.map(n => <option key={n} value={n}>{niveauLabels[n]}</option>)}
              </select>
            </div>
            {(formNiveau === 'PREMIERE' || formNiveau === 'TERMINALE') && (
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-dark-200 mb-2">Série</label>
                <select value={formSerie} onChange={e => setFormSerie(e.target.value)} className="w-full px-4 py-3 border border-gray-200 dark:border-dark-600 rounded-xl text-sm bg-gray-50 dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                  <option value="">Sélectionner</option>
                  {serieValues.map(s => <option key={s} value={s}>Série {s}</option>)}
                </select>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-dark-200 mb-2">Statut</label>
            <select value={formStatus} onChange={e => setFormStatus(e.target.value)} className="w-full px-4 py-3 border border-gray-200 dark:border-dark-600 rounded-xl text-sm bg-gray-50 dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500">
              <option value="BROUILLON">Brouillon</option>
              <option value="PUBLIE">Publié</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowCreateModal(false); setEditingCourse(null); resetForm(); }} className="px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-dark-300 bg-gray-100 dark:bg-dark-700 rounded-xl hover:bg-gray-200 dark:hover:bg-dark-600 transition-all duration-200">Annuler</button>
            <button onClick={handleSubmit} disabled={!formTitle || createMutation.isPending || updateMutation.isPending} className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-violet-600 text-white text-sm font-semibold rounded-xl hover:from-violet-600 hover:to-violet-700 transition-all duration-200 shadow-lg shadow-violet-500/25 disabled:opacity-50">
              {editingCourse ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirmer la suppression" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-dark-300">Voulez-vous supprimer <strong>{deleteTarget?.title}</strong> ? Cette action est irréversible.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-dark-300 bg-gray-100 dark:bg-dark-700 rounded-xl hover:bg-gray-200 dark:hover:bg-dark-600 transition-all duration-200">Annuler</button>
            <button onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending} className="px-5 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-all duration-200 disabled:opacity-50">
              {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Content Manager Modal */}
      <Modal isOpen={!!showContentModal} onClose={() => setShowContentModal(null)} title={`Gérer le contenu : ${showContentModal?.title || ''}`} size="xl">
        {showContentModal && (
          <MentorContentManager coursId={showContentModal.id} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['mentor-courses'] })} />
        )}
      </Modal>
    </MentorLayout>
  );
}
