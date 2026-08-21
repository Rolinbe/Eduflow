import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import MentorLayout from '../../components/layout/MentorLayout';
import MentorContentManager from '../../components/mentor/MentorContentManager';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import type { Cours } from '../../types';

const niveauLabels: Record<string, string> = {
  SIXIEME: '6ème', CINQUIEME: '5ème', QUATRIEME: '4ème', TROISIEME: '3ème',
  SECONDE: 'Seconde', PREMIERE: 'Première', TERMINALE: 'Terminale',
};

const niveauValues = ['SIXIEME', 'CINQUIEME', 'QUATRIEME', 'TROISIEME', 'SECONDE', 'PREMIERE', 'TERMINALE'] as const;
const serieValues = ['S', 'L', 'OSE'] as const;

const inputClass = "w-full px-4 py-3.5 border-2 border-gray-100 dark:border-dark-700 rounded-2xl text-sm bg-white dark:bg-dark-900 dark:text-white focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-dark-500 hover:border-gray-200 dark:hover:border-dark-600 shadow-sm";
const labelClass = "block text-sm font-semibold text-gray-600 dark:text-dark-300 mb-2";

function getLevelBadge(niveau: string, serie?: string | null) {
  const label = niveauLabels[niveau] || niveau;
  return `${label}${serie ? ` · ${serie}` : ''}`;
}

export default function MentorCoursesPage() {
  const { user } = useAuthStore();
  const mentorNiveau = user?.niveauResponsable || null;
  const mentorSerie = user?.serieResponsable || null;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Cours | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Cours | null>(null);
  const [showContentModal, setShowContentModal] = useState<Cours | null>(null);
  const [filter, setFilter] = useState<'all' | 'PUBLIE' | 'BROUILLON'>('all');
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
  const allCourses = [...myCourses, ...adminCourses];

  const filteredMyCourses = filter === 'all' ? myCourses : myCourses.filter(c => c.status === filter);
  const filteredAdminCourses = filter === 'all' ? adminCourses : adminCourses.filter(c => c.status === filter);

  const publishedCount = myCourses.filter(c => c.status === 'PUBLIE').length;
  const draftCount = myCourses.filter(c => c.status === 'BROUILLON').length;
  const totalStudents = allCourses.reduce((sum, c) => sum + (c._count?.enrollments || 0), 0);

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormNiveau(mentorNiveau || '');
    setFormSerie(mentorSerie || '');
    setFormStatus('BROUILLON');
  };

  const openCreate = () => { resetForm(); setShowCreateModal(true); };
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
      setShowCreateModal(false); resetForm();
      toast.success('Cours créé avec succès');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => api.put(`/mentor/cours/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-courses'] });
      setEditingCourse(null); resetForm();
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
      if (formNiveau === 'PREMIERE' || formNiveau === 'TERMINALE') payload.serie = formSerie || undefined;
    }
    if (editingCourse) updateMutation.mutate({ id: editingCourse.id, data: payload });
    else createMutation.mutate(payload);
  };

  const statusLabel = (s: string) => s === 'PUBLIE' ? 'Publié' : s === 'BROUILLON' ? 'Brouillon' : 'Archivé';

  const renderCourseCard = (course: Cours, isMine: boolean) => (
    <div key={course.id} className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm dark:shadow-card-dark ring-1 ring-gray-100 dark:ring-dark-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
      {/* Top stripe */}
      <div className={`h-1.5 ${isMine ? 'bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-500' : 'bg-gradient-to-r from-blue-400 to-cyan-500'}`} />

      <div className="p-5">
        {/* Title + Status */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-bold text-gray-900 dark:text-white text-base line-clamp-1 flex-1">{course.title}</h3>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold flex-shrink-0 ${
            course.status === 'PUBLIE' || isMine === false
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${course.status === 'PUBLIE' || !isMine ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {isMine ? statusLabel(course.status) : 'Publié'}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 dark:text-dark-400 line-clamp-2 mb-3 leading-relaxed">
          {course.description || 'Pas de description'}
        </p>

        {/* Level badge */}
        {course.niveau && (
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 text-xs font-bold rounded-lg">
              <span className="material-symbols-outlined text-sm">school</span>
              {getLevelBadge(course.niveau, course.serie)}
            </span>
          </div>
        )}

        {/* Admin info */}
        {!isMine && course.admin && (
          <p className="text-xs text-gray-400 dark:text-dark-400 mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">person</span>
            Par {course.admin.firstName} {course.admin.lastName}
          </p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <span className="material-symbols-outlined text-sm text-blue-500">videocam</span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{course._count?.videos || 0}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <span className="material-symbols-outlined text-sm text-amber-500">description</span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{course._count?.pdfs || 0}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <span className="material-symbols-outlined text-sm text-emerald-500">people</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{course._count?.enrollments || 0}</span>
          </div>
        </div>

        {/* Actions */}
        <div className={`pt-4 border-t border-gray-100 dark:border-dark-700 ${isMine ? '' : ''}`}>
          {isMine ? (
            <div className="flex gap-2">
              <button
                onClick={() => setShowContentModal(course)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 rounded-xl hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-all duration-200 group/btn"
              >
                <span className="material-symbols-outlined text-sm group-hover/btn:scale-110 transition-transform">upload_file</span>
                Contenu
              </button>
              <button
                onClick={() => openEdit(course)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-gray-600 dark:text-dark-300 bg-gray-50 dark:bg-dark-700 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-600 transition-all duration-200"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Modifier
              </button>
              <button
                onClick={() => statusMutation.mutate({ id: course.id, status: course.status === 'PUBLIE' ? 'BROUILLON' : 'PUBLIE' })}
                className="flex items-center justify-center w-10 h-10 text-gray-400 dark:text-dark-400 bg-gray-50 dark:bg-dark-700 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-600 transition-all duration-200"
                title={course.status === 'PUBLIE' ? 'Masquer' : 'Publier'}
              >
                <span className="material-symbols-outlined text-lg">{course.status === 'PUBLIE' ? 'visibility_off' : 'publish'}</span>
              </button>
              <button
                onClick={() => setDeleteTarget(course)}
                className="flex items-center justify-center w-10 h-10 text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200"
                title="Supprimer"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowContentModal(course)}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 group/btn"
            >
              <span className="material-symbols-outlined text-sm group-hover/btn:scale-110 transition-transform">upload_file</span>
              Accéder au contenu
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <MentorLayout title="Mes cours">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total cours', value: allCourses.length, icon: 'school', color: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/20' },
          { label: 'Publiés', value: publishedCount + adminCourses.length, icon: 'visibility', color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
          { label: 'Brouillons', value: draftCount, icon: 'edit_note', color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
          { label: 'Élèves inscrits', value: totalStudents, icon: 'groups', color: 'from-blue-500 to-cyan-600', shadow: 'shadow-blue-500/20' },
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

      {/* Header + Filter */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl p-5 shadow-sm dark:shadow-card-dark ring-1 ring-gray-100 dark:ring-dark-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-2">
            {[
              { key: 'all' as const, label: 'Tous', count: myCourses.length + adminCourses.length },
              { key: 'PUBLIE' as const, label: 'Publiés', count: publishedCount + adminCourses.length },
              { key: 'BROUILLON' as const, label: 'Brouillons', count: draftCount },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  filter === tab.key
                    ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                    : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-300 hover:bg-gray-200 dark:hover:bg-dark-600'
                }`}
              >
                {tab.label}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  filter === tab.key ? 'bg-white/20' : 'bg-gray-200 dark:bg-dark-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-violet-600 text-white text-sm font-semibold rounded-2xl hover:from-violet-600 hover:to-violet-700 transition-all duration-300 shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/40 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Nouveau cours
          </button>
        </div>
      </div>

      {/* Courses */}
      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : (filteredMyCourses.length === 0 && filteredAdminCourses.length === 0) ? (
        <div className="text-center py-16 bg-white dark:bg-dark-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-dark-600">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-dark-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-gray-300 dark:text-dark-500 text-3xl">school</span>
          </div>
          <p className="text-gray-500 dark:text-dark-400 font-medium">
            {filter !== 'all' ? `Aucun cours ${filter === 'PUBLIE' ? 'publié' : 'en brouillon'}` : 'Aucun cours disponible'}
          </p>
          {filter === 'all' && (
            <button onClick={openCreate} className="mt-5 px-6 py-3 bg-gradient-to-r from-violet-500 to-violet-600 text-white text-sm font-semibold rounded-2xl hover:from-violet-600 hover:to-violet-700 transition-all duration-300 shadow-lg shadow-violet-500/25 active:scale-[0.98]">
              Créer votre premier cours
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {filteredMyCourses.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <span className="material-symbols-outlined text-white text-lg">school</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Mes cours</h3>
                <span className="px-2.5 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs font-bold rounded-full">{filteredMyCourses.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredMyCourses.map((course) => renderCourseCard(course, true))}
              </div>
            </div>
          )}

          {filteredAdminCourses.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <span className="material-symbols-outlined text-white text-lg">admin_panel_settings</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Cours de l'administration</h3>
                <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-full">{filteredAdminCourses.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAdminCourses.map((course) => renderCourseCard(course, false))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal isOpen={showCreateModal || !!editingCourse} onClose={() => { setShowCreateModal(false); setEditingCourse(null); resetForm(); }} title={editingCourse ? 'Modifier le cours' : 'Nouveau cours'}>
        <div className="space-y-5">
          <div className="group">
            <label className={labelClass}>Titre</label>
            <input value={formTitle} onChange={e => setFormTitle(e.target.value)} className={inputClass} placeholder="Ex: Mathématiques - Analyse" />
          </div>
          <div className="group">
            <label className={labelClass}>Description</label>
            <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} className={`${inputClass} resize-none`} rows={3} placeholder="Décrivez le contenu du cours..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {mentorNiveau && !editingCourse ? (
              <div className="group">
                <label className={labelClass}>Niveau</label>
                <div className={`${inputClass} flex items-center gap-2 !bg-gray-50 dark:!bg-dark-900 cursor-default`}>
                  <span className="material-symbols-outlined text-violet-500 text-lg">school</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{niveauLabels[mentorNiveau] || mentorNiveau}</span>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-dark-500 mt-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">info</span>
                  Défini par votre niveau responsable
                </p>
              </div>
            ) : (
              <div className="group">
                <label className={labelClass}>Niveau</label>
                <select value={formNiveau} onChange={e => setFormNiveau(e.target.value)} className={inputClass}>
                  <option value="">Sélectionner</option>
                  {niveauValues.map(n => <option key={n} value={n}>{niveauLabels[n]}</option>)}
                </select>
              </div>
            )}
            {((mentorNiveau && mentorSerie && !editingCourse) || (!editingCourse && (formNiveau === 'PREMIERE' || formNiveau === 'TERMINALE'))) && (
              mentorSerie && !editingCourse ? (
                <div className="group">
                  <label className={labelClass}>Série</label>
                  <div className={`${inputClass} flex items-center gap-2 !bg-gray-50 dark:!bg-dark-900 cursor-default`}>
                    <span className="material-symbols-outlined text-violet-500 text-lg">label</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Série {mentorSerie}</span>
                  </div>
                </div>
              ) : !mentorSerie && !editingCourse ? null : (
                <div className="group">
                  <label className={labelClass}>Série</label>
                  <select value={formSerie} onChange={e => setFormSerie(e.target.value)} className={inputClass}>
                    <option value="">Sélectionner</option>
                    {serieValues.map(s => <option key={s} value={s}>Série {s}</option>)}
                  </select>
                </div>
              )
            )}
          </div>
          <div className="group">
            <label className={labelClass}>Statut</label>
            <select value={formStatus} onChange={e => setFormStatus(e.target.value)} className={inputClass}>
              <option value="BROUILLON">Brouillon</option>
              <option value="PUBLIE">Publié</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-dark-700">
            <button onClick={() => { setShowCreateModal(false); setEditingCourse(null); resetForm(); }} className="px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-dark-300 bg-gray-100 dark:bg-dark-700 rounded-xl hover:bg-gray-200 dark:hover:bg-dark-600 transition-all duration-200">Annuler</button>
            <button onClick={handleSubmit} disabled={!formTitle || createMutation.isPending || updateMutation.isPending} className="relative px-6 py-2.5 bg-gradient-to-r from-violet-500 to-violet-600 text-white text-sm font-semibold rounded-xl hover:from-violet-600 hover:to-violet-700 transition-all duration-200 shadow-lg shadow-violet-500/25 disabled:opacity-50">
              {editingCourse ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirmer la suppression" size="sm">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <span className="material-symbols-outlined text-red-500">warning</span>
            <p className="text-sm text-red-600 dark:text-red-400">
              Cette action est irréversible.
            </p>
          </div>
          <p className="text-sm text-gray-600 dark:text-dark-300">
            Voulez-vous supprimer <strong>{deleteTarget?.title}</strong> ?
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-dark-300 bg-gray-100 dark:bg-dark-700 rounded-xl hover:bg-gray-200 dark:hover:bg-dark-600 transition-all duration-200">Annuler</button>
            <button onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending} className="px-5 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-all duration-200 disabled:opacity-50">
              {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Content Manager Modal */}
      <Modal isOpen={!!showContentModal} onClose={() => setShowContentModal(null)} title={`Contenu : ${showContentModal?.title || ''}`} size="xl">
        {showContentModal && (
          <MentorContentManager coursId={showContentModal.id} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['mentor-courses'] })} />
        )}
      </Modal>
    </MentorLayout>
  );
}
