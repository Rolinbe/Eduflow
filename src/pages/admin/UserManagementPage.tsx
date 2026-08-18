import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import AdminLayout from '../../components/layout/AdminLayout';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import DropdownMenu from '../../components/ui/DropdownMenu';
import ProgressBar from '../../components/ui/ProgressBar';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import type { User, PaginatedResponse } from '../../types';

const niveauLabels: Record<string, string> = {
  SIXIEME: '6ème', CINQUIEME: '5ème', QUATRIEME: '4ème', TROISIEME: '3ème',
  SECONDE: 'Seconde', PREMIERE: 'Première', TERMINALE: 'Terminale',
};

export default function UserManagementPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showProgressModal, setShowProgressModal] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, statusFilter, roleFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (roleFilter) params.set('role', roleFilter);
      const res = await api.get(`/admin/users?${params.toString()}`);
      const { users, pagination } = res.data;
      return { data: users, page: pagination.page, totalPages: pagination.totalPages, total: pagination.total } as PaginatedResponse<User>;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) =>
      api.patch(`/admin/users/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Statut mis à jour');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Utilisateur supprimé');
      setDeleteTarget(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: number; newPassword: string }) =>
      api.put(`/admin/users/${id}/reset-password`, { newPassword }),
    onSuccess: () => {
      toast.success('Mot de passe réinitialisé avec succès');
      setResetPasswordTarget(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIF': return <Badge variant="success">Actif</Badge>;
      case 'INACTIF': return <Badge variant="gray">Inactif</Badge>;
      case 'BLOQUE': return <Badge variant="danger">Bloqué</Badge>;
      default: return <Badge variant="gray">{status}</Badge>;
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Utilisateur',
      render: (item: User) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-primary-700">
              {item.firstName?.[0]}{item.lastName?.[0]}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{item.firstName} {item.lastName}</p>
            <p className="text-xs text-gray-400">{item.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Rôle',
      render: (item: User) => (
        <Badge variant={item.role === 'ADMIN' ? 'primary' : 'info'}>
          {item.role === 'ADMIN' ? 'Admin' : 'Apprenant'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (item: User) => getStatusBadge(item.status),
    },
    {
      key: 'niveau',
      header: 'Niveau',
      render: (item: User) => {
        if (!item.niveau) return <span className="text-xs text-gray-400">-</span>;
        const label = niveauLabels[item.niveau] || item.niveau;
        const serie = item.niveau === 'TERMINALE' && item.serie ? ` ${item.serie}` : '';
        return <Badge variant="info">{label}{serie}</Badge>;
      },
    },
    {
      key: 'createdAt',
      header: 'Inscrit le',
      render: (item: User) => (
        <span className="text-sm text-gray-500">
          {new Date(item.createdAt).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item: User) => (
        item.role === 'ADMIN' ? (
          <div className="flex items-center gap-3">
            <Badge variant="primary">Admin</Badge>
          </div>
        ) : (
          <DropdownMenu
            items={[
              { label: 'Voir la progression', icon: 'bar_chart', onClick: () => setShowProgressModal(item) },
              { label: 'Réinitialiser le mot de passe', icon: 'lock_reset', onClick: () => setResetPasswordTarget(item), variant: 'warning' },
              { label: item.status === 'ACTIF' ? 'Désactiver' : 'Activer', icon: item.status === 'ACTIF' ? 'person_off' : 'person', onClick: () => {
                const newStatus = item.status === 'ACTIF' ? 'INACTIF' : 'ACTIF';
                statusMutation.mutate({ id: item.id, status: newStatus });
              }},
              ...(item.status === 'BLOQUE' ? [{ label: 'Débloquer', icon: 'lock_open', onClick: () => statusMutation.mutate({ id: item.id, status: 'ACTIF' }), variant: 'success' as const }] : []),
              ...(item.status !== 'BLOQUE' ? [{ label: 'Bloquer', icon: 'block', onClick: () => statusMutation.mutate({ id: item.id, status: 'BLOQUE' }), variant: 'danger' as const }] : []),
              { label: 'Supprimer', icon: 'delete', onClick: () => setDeleteTarget(item), variant: 'danger' },
            ]}
          />
        )
      ),
    },
  ];

  return (
    <AdminLayout title="Gestion des utilisateurs">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-xl">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              placeholder="Rechercher un utilisateur..."
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          >
            <option value="">Tous les rôles</option>
            <option value="ADMIN">Admin</option>
            <option value="APPRENANT">Apprenant</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          >
            <option value="">Tous les statuts</option>
            <option value="ACTIF">Actif</option>
            <option value="INACTIF">Inactif</option>
            <option value="BLOQUE">Bloqué</option>
          </select>
        </div>
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
          emptyMessage="Aucun utilisateur trouvé"
        />
      )}

      <Modal
        isOpen={!!showProgressModal}
        onClose={() => setShowProgressModal(null)}
        title={`Progression de ${showProgressModal?.firstName} ${showProgressModal?.lastName}`}
        size="lg"
      >
        {showProgressModal && <UserProgressDetail userId={showProgressModal.id} />}
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirmer la suppression"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Voulez-vous vraiment supprimer l'utilisateur <strong>{deleteTarget?.firstName} {deleteTarget?.lastName}</strong> ?
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

      <Modal
        isOpen={!!resetPasswordTarget}
        onClose={() => setResetPasswordTarget(null)}
        title={`Réinitialiser le mot de passe — ${resetPasswordTarget?.firstName} ${resetPasswordTarget?.lastName}`}
        size="sm"
      >
        <ResetPasswordForm
          user={resetPasswordTarget}
          isPending={resetPasswordMutation.isPending}
          onSubmit={(newPassword) => {
            if (resetPasswordTarget) {
              resetPasswordMutation.mutate({ id: resetPasswordTarget.id, newPassword });
            }
          }}
        />
      </Modal>
    </AdminLayout>
  );
}

function UserProgressDetail({ userId }: { userId: number }) {
  const { data: result, isLoading } = useQuery({
    queryKey: ['user-progression', userId],
    queryFn: async () => {
      const res = await api.get(`/admin/users/${userId}/progression`);
      return res.data;
    },
  });

  if (isLoading) return <LoadingSpinner className="py-8" />;

  if (!result || !result.enrollments || result.enrollments.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4">Aucune donnée de progression</p>;
  }

  return (
    <div className="space-y-4">
      {result.enrollments.map((enrollment: any) => (
        <div key={enrollment.id} className="border border-gray-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-900">
              {enrollment.cours?.title || 'Cours'}
            </p>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${enrollment.progress >= 100 ? 'text-success' : 'text-primary-500'}`}>
                {enrollment.progress >= 100 ? 'Terminé' : 'En cours'}
              </span>
              <span className="text-xs text-gray-400">
                {enrollment.progress}%
              </span>
            </div>
          </div>
          <ProgressBar value={enrollment.progress || 0} size="sm" />
        </div>
      ))}
    </div>
  );
}

const resetPasswordFormSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Une majuscule requise')
    .regex(/[a-z]/, 'Une minuscule requise')
    .regex(/[0-9]/, 'Un chiffre requis'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;

function ResetPasswordForm({ user, isPending, onSubmit }: { user: User | null; isPending: boolean; onSubmit: (password: string) => void }) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const handleFormSubmit = (data: ResetPasswordFormData) => {
    onSubmit(data.newPassword);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
        <span className="material-symbols-outlined text-yellow-600">warning</span>
        <p className="text-xs text-yellow-700">
          Un notification sera envoyée à <strong>{user?.firstName}</strong> l'informant du changement.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
        <input
          type="password"
          {...register('newPassword')}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Minimum 8 caractères"
        />
        {errors.newPassword && (
          <p className="text-xs text-red-500 mt-1">{errors.newPassword.message}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
        <input
          type="password"
          {...register('confirmPassword')}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Retapez le mot de passe"
        />
        {errors.confirmPassword && (
          <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
        )}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => { reset(); }}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Réinitialisation...' : 'Réinitialiser'}
        </button>
      </div>
    </form>
  );
}
