import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import AdminLayout from '../../components/layout/AdminLayout';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import DropdownMenu from '../../components/ui/DropdownMenu';
import CourseForm from '../../components/admin/CourseForm';
import ContentManager from '../../components/admin/ContentManager';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import type { Cours, PaginatedResponse } from '../../types';

export default function CourseManagementPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
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

  const { data, isLoading } = useQuery({
    queryKey: ['admin-cours', search, categoryFilter, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/admin/cours?${params.toString()}`);
      const { courses, pagination } = res.data;
      return { data: courses, page: pagination.page, totalPages: pagination.totalPages, total: pagination.total } as PaginatedResponse<Cours>;
    },
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

  const columns = [
    {
      key: 'title',
      header: 'Titre',
      render: (item: Cours) => (
        <div>
          <p className="font-medium text-gray-900">{item.title}</p>
          <p className="text-xs text-gray-400 line-clamp-1">{item.description}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Catégorie',
      render: (item: Cours) => <Badge variant="gray">{item.category?.name || '—'}</Badge>,
    },
    {
      key: 'status',
      header: 'Statut',
      render: (item: Cours) => (
        <Badge variant={item.status === 'PUBLIE' ? 'success' : item.status === 'BROUILLON' ? 'warning' : 'gray'}>
          {item.status === 'PUBLIE' ? 'Publié' : item.status === 'BROUILLON' ? 'Brouillon' : 'Archivé'}
        </Badge>
      ),
    },
    {
      key: 'content',
      header: 'Contenu',
      render: (item: Cours) => (
        <div className="flex gap-3 text-xs text-gray-500">
          <span>{item._count?.videos || 0} vidéos</span>
          <span>{item._count?.pdfs || 0} PDFs</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item: Cours) => (
        <DropdownMenu
          items={[
            { label: 'Gérer le contenu', icon: 'upload_file', onClick: () => setShowContentModal(item) },
            { label: 'Modifier', icon: 'edit', onClick: () => setEditingCourse(item) },
            { label: 'Publier', icon: 'publish', onClick: () => statusMutation.mutate({ id: item.id, status: 'PUBLIE' }), variant: 'success', disabled: item.status === 'PUBLIE' },
            { label: 'Mettre en brouillon', icon: 'draft', onClick: () => statusMutation.mutate({ id: item.id, status: 'BROUILLON' }), variant: 'warning', disabled: item.status === 'BROUILLON' },
            { label: 'Archiver', icon: 'archive', onClick: () => statusMutation.mutate({ id: item.id, status: 'ARCHIVE' }), disabled: item.status === 'ARCHIVE' },
            { label: 'Supprimer', icon: 'delete', onClick: () => setDeleteTarget(item), variant: 'danger' },
          ]}
        />
      ),
    },
  ];

  return (
    <AdminLayout title="Gestion des cours">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-xl">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              placeholder="Rechercher un cours..."
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          >
            <option value="">Toutes les catégories</option>
            {categories?.map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          >
            <option value="">Tous les statuts</option>
            <option value="PUBLIE">Publié</option>
            <option value="BROUILLON">Brouillon</option>
            <option value="ARCHIVE">Archivé</option>
          </select>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Nouveau cours
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : (
        <DataTable
          columns={columns}
          data={data?.data || []}
          page={data?.page || 1}
          totalPages={data?.totalPages || 1}
          onPageChange={setPage}
          keyExtractor={(item) => String(item.id)}
          emptyMessage="Aucun cours trouvé"
        />
      )}

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Créer un cours">
        <CourseForm
          categories={categories || []}
          onSubmit={(formData) => createMutation.mutate(formData)}
          onClose={() => setShowCreateModal(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>

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

      <Modal isOpen={!!showContentModal} onClose={() => setShowContentModal(null)} title={`Contenu: ${showContentModal?.title || ''}`} size="xl">
        {showContentModal && (
          <ContentManager coursId={showContentModal.id} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['admin-cours'] })} />
        )}
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirmer la suppression" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Voulez-vous vraiment supprimer le cours <strong>{deleteTarget?.title}</strong> et tout son contenu ?
            Cette action est irréversible.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-danger rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
