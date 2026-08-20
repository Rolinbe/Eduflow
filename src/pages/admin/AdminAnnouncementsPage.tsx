import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import AdminLayout from '../../components/layout/AdminLayout';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import type { Announcement } from '../../types';

const announcementSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  content: z.string().min(10, 'Le contenu doit contenir au moins 10 caractères'),
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

export default function AdminAnnouncementsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const queryClient = useQueryClient();

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: async () => {
      const res = await api.get('/admin/announcements');
      return res.data.announcements as Announcement[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AnnouncementFormData) => api.post('/admin/announcements', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      setShowCreateModal(false);
      toast.success('Annonce publiée avec succès');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/admin/announcements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      toast.success('Annonce supprimée');
      setDeleteTarget(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  return (
    <AdminLayout title="Annonces">
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-all duration-200"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Nouvelle annonce
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : !announcements || announcements.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 transition-all duration-200">
          <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-dark-500">campaign</span>
          <p className="text-gray-400 dark:text-dark-400 mt-3">Aucune annonce pour le moment</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-all duration-200"
          >
            Publier la première annonce
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div key={a.id} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 shadow-card dark:shadow-card-dark p-6 transition-all duration-200 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{a.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-dark-400 mt-2 whitespace-pre-wrap">{a.content}</p>
                  <div className="flex items-center gap-3 mt-4 text-xs text-gray-400 dark:text-dark-400">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">person</span>
                      {a.admin?.firstName} {a.admin?.lastName}
                    </span>
                    <span>•</span>
                    <span>{new Date(a.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteTarget(a)}
                  className="ml-4 flex items-center justify-center w-9 h-9 text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 flex-shrink-0"
                  title="Supprimer"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nouvelle annonce">
        <AnnouncementForm
          isPending={createMutation.isPending}
          onSubmit={(data) => createMutation.mutate(data)}
          onClose={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Supprimer l'annonce" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-dark-300">
            Voulez-vous vraiment supprimer l'annonce <strong>{deleteTarget?.title}</strong> ?
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

function AnnouncementForm({ isPending, onSubmit, onClose }: { isPending: boolean; onSubmit: (data: AnnouncementFormData) => void; onClose: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1">Titre</label>
        <input
          {...register('title')}
          className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 dark:text-white transition-all duration-200"
          placeholder="Titre de l'annonce"
        />
        {errors.title && <p className="text-xs text-danger mt-1">{errors.title.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1">Contenu</label>
        <textarea
          {...register('content')}
          rows={5}
          className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 dark:text-white resize-none transition-all duration-200"
          placeholder="Contenu de l'annonce..."
        />
        {errors.content && <p className="text-xs text-danger mt-1">{errors.content.message}</p>}
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-dark-700">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-dark-300 bg-gray-100 dark:bg-dark-700 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-all duration-200"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-all duration-200 disabled:opacity-50"
        >
          {isPending ? 'Publication...' : 'Publier'}
        </button>
      </div>
    </form>
  );
}
