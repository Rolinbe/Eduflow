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
  LICENCE: 'Licence', MASTER: 'Master', DOCTORAT: 'Doctorat',
};

const editProfileSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  role: z.enum(['ADMIN', 'APPRENANT', 'MENTOR']),
  niveau: z.enum(['SIXIEME', 'CINQUIEME', 'QUATRIEME', 'TROISIEME', 'SECONDE', 'PREMIERE', 'TERMINALE', 'LICENCE', 'MASTER', 'DOCTORAT']).nullable().optional(),
  serie: z.enum(['S', 'L', 'OSE']).nullable().optional(),
  niveauResponsable: z.enum(['SIXIEME', 'CINQUIEME', 'QUATRIEME', 'TROISIEME', 'SECONDE', 'PREMIERE', 'TERMINALE']).nullable().optional(),
  serieResponsable: z.enum(['S', 'L', 'OSE']).nullable().optional(),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

export default function UserManagementPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showProgressModal, setShowProgressModal] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<User | null>(null);
  const [editTarget, setEditTarget] = useState<User | null>(null);
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

  const editProfileMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: EditProfileFormData }) =>
      api.put(`/admin/users/${id}/profile`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Profil mis à jour avec succès');
      setEditTarget(null);
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Badge variant="primary">Admin</Badge>;
      case 'MENTOR': return <Badge variant="warning">Mentor</Badge>;
      case 'APPRENANT': return <Badge variant="info">Apprenant</Badge>;
      default: return <Badge variant="gray">{role}</Badge>;
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Utilisateur',
      render: (item: User) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center transition-all duration-200">
            <span className="text-sm font-semibold text-primary-700 dark:text-primary-400">
              {item.firstName?.[0]}{item.lastName?.[0]}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{item.firstName} {item.lastName}</p>
            <p className="text-xs text-gray-400 dark:text-dark-400">{item.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Rôle',
      render: (item: User) => getRoleBadge(item.role),
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
        if (!item.niveau) return <span className="text-xs text-gray-400 dark:text-dark-400">-</span>;
        const label = niveauLabels[item.niveau] || item.niveau;
        const serie = (item.niveau === 'PREMIERE' || item.niveau === 'TERMINALE') && item.serie ? ` ${item.serie}` : '';
        return <Badge variant="info">{label}{serie}</Badge>;
      },
    },
    {
      key: 'createdAt',
      header: 'Inscrit le',
      render: (item: User) => (
        <span className="text-sm text-gray-500 dark:text-dark-400">
          {new Date(item.createdAt).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item: User) => (
        <DropdownMenu
          items={[
            { label: 'Modifier le profil', icon: 'edit', onClick: () => setEditTarget(item) },
            { label: 'Voir la progression', icon: 'bar_chart', onClick: () => setShowProgressModal(item) },
            { label: 'Réinitialiser le mot de passe', icon: 'lock_reset', onClick: () => setResetPasswordTarget(item), variant: 'warning' },
            { label: item.status === 'ACTIF' ? 'Désactiver' : 'Activer', icon: item.status === 'ACTIF' ? 'person_off' : 'person', onClick: () => {
              const newStatus = item.status === 'ACTIF' ? 'INACTIF' : 'ACTIF';
              statusMutation.mutate({ id: item.id, status: newStatus });
            }},
            ...(item.status === 'BLOQUE' ? [{ label: 'Débloquer', icon: 'lock_open', onClick: () => statusMutation.mutate({ id: item.id, status: 'ACTIF' }), variant: 'success' as const }] : []),
            ...(item.status !== 'BLOQUE' ? [{ label: 'Bloquer', icon: 'block', onClick: () => statusMutation.mutate({ id: item.id, status: 'BLOQUE' }), variant: 'danger' as const }] : []),
            ...(item.role !== 'ADMIN' ? [{ label: 'Supprimer', icon: 'delete', onClick: () => setDeleteTarget(item), variant: 'danger' as const }] : []),
          ]}
        />
      ),
    },
  ];

  return (
    <AdminLayout title="Gestion des utilisateurs">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 dark:text-dark-400 text-xl">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-dark-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 dark:text-white transition-all duration-200"
              placeholder="Rechercher un utilisateur..."
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-gray-200 dark:border-dark-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 dark:text-white transition-all duration-200"
          >
            <option value="">Tous les rôles</option>
            <option value="ADMIN">Admin</option>
            <option value="MENTOR">Mentor</option>
            <option value="APPRENANT">Apprenant</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-gray-200 dark:border-dark-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 dark:text-white transition-all duration-200"
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

      {/* Edit Profile Modal */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Modifier le profil — ${editTarget?.firstName} ${editTarget?.lastName}`}
        size="lg"
      >
        {editTarget && (
          <EditProfileForm
            user={editTarget}
            isPending={editProfileMutation.isPending}
            onSubmit={(formData) => editProfileMutation.mutate({ id: editTarget.id, data: formData })}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Modal>

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
          <p className="text-sm text-gray-600 dark:text-dark-300">
            Voulez-vous vraiment supprimer l'utilisateur <strong>{deleteTarget?.firstName} {deleteTarget?.lastName}</strong> ?
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

function EditProfileForm({ user, isPending, onSubmit, onCancel }: { user: User; isPending: boolean; onSubmit: (data: EditProfileFormData) => void; onCancel: () => void }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      niveau: user.niveau || null,
      serie: user.serie || null,
      niveauResponsable: user.niveauResponsable || null,
      serieResponsable: user.serieResponsable || null,
    },
  });

  const watchRole = watch('role');
  const watchNiveau = watch('niveau');
  const showSerie = watchNiveau === 'PREMIERE' || watchNiveau === 'TERMINALE';
  const showNiveauFields = watchRole === 'APPRENANT' || watchRole === 'MENTOR';
  const showMentorFields = watchRole === 'MENTOR';

  const cleanData = (data: EditProfileFormData): EditProfileFormData => ({
    ...data,
    niveau: data.niveau || null,
    serie: data.serie || null,
    niveauResponsable: data.niveauResponsable || null,
    serieResponsable: data.serieResponsable || null,
  });

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(cleanData(data)))} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1">Prénom</label>
          <input
            type="text"
            {...register('firstName')}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-800 dark:text-white transition-all"
          />
          {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1">Nom</label>
          <input
            type="text"
            {...register('lastName')}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-800 dark:text-white transition-all"
          />
          {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1">Email</label>
        <input
          type="email"
          {...register('email')}
          className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-800 dark:text-white transition-all"
        />
        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1">Rôle</label>
        <select
          {...register('role')}
          className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-800 dark:text-white transition-all"
        >
          <option value="APPRENANT">Apprenant</option>
          <option value="MENTOR">Mentor</option>
          <option value="ADMIN">Admin</option>
        </select>
        {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role.message}</p>}
      </div>

      {showNiveauFields && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1">
              {showMentorFields ? 'Niveau responsable' : 'Niveau'}
            </label>
            <select
              {...register(showMentorFields ? 'niveauResponsable' : 'niveau')}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-800 dark:text-white transition-all"
            >
              <option value="">Aucun</option>
              <option value="SIXIEME">6ème</option>
              <option value="CINQUIEME">5ème</option>
              <option value="QUATRIEME">4ème</option>
              <option value="TROISIEME">3ème</option>
              <option value="SECONDE">Seconde</option>
              <option value="PREMIERE">Première</option>
              <option value="TERMINALE">Terminale</option>
            </select>
          </div>
          {showMentorFields && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1">Série responsable</label>
              <select
                {...register('serieResponsable')}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-800 dark:text-white transition-all"
              >
                <option value="">Aucune</option>
                <option value="S">Série S</option>
                <option value="L">Série L</option>
                <option value="OSE">Série OSE</option>
              </select>
            </div>
          )}
          {!showMentorFields && showSerie && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1">Série</label>
              <select
                {...register('serie')}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-800 dark:text-white transition-all"
              >
                <option value="">Aucune</option>
                <option value="S">Série S</option>
                <option value="L">Série L</option>
                <option value="OSE">Série OSE</option>
              </select>
            </div>
          )}
        </div>
      )}

      {showMentorFields && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1">Niveau (personnel)</label>
            <select
              {...register('niveau')}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-800 dark:text-white transition-all"
            >
              <option value="">Aucun</option>
              <option value="SIXIEME">6ème</option>
              <option value="CINQUIEME">5ème</option>
              <option value="QUATRIEME">4ème</option>
              <option value="TROISIEME">3ème</option>
              <option value="SECONDE">Seconde</option>
              <option value="PREMIERE">Première</option>
              <option value="TERMINALE">Terminale</option>
              <option value="LICENCE">Licence</option>
              <option value="MASTER">Master</option>
              <option value="DOCTORAT">Doctorat</option>
            </select>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-dark-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-dark-300 bg-gray-100 dark:bg-dark-700 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-all"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-all disabled:opacity-50"
        >
          {isPending ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
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
    return <p className="text-sm text-gray-400 dark:text-dark-400 text-center py-4">Aucune donnée de progression</p>;
  }

  return (
    <div className="space-y-4">
      {result.enrollments.map((enrollment: any) => (
        <div key={enrollment.id} className="border border-gray-100 dark:border-dark-700 rounded-lg p-4 transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {enrollment.cours?.title || 'Cours'}
            </p>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${enrollment.progress >= 100 ? 'text-success' : 'text-primary-500'}`}>
                {enrollment.progress >= 100 ? 'Terminé' : 'En cours'}
              </span>
              <span className="text-xs text-gray-400 dark:text-dark-400">
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
      <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg transition-all duration-200">
        <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400">warning</span>
        <p className="text-xs text-yellow-700 dark:text-yellow-300">
          Un notification sera envoyée à <strong>{user?.firstName}</strong> l'informant du changement.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1">Nouveau mot de passe</label>
        <input
          type="password"
          {...register('newPassword')}
          className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 dark:text-white transition-all duration-200"
          placeholder="Minimum 8 caractères"
        />
        {errors.newPassword && (
          <p className="text-xs text-red-500 mt-1">{errors.newPassword.message}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1">Confirmer le mot de passe</label>
        <input
          type="password"
          {...register('confirmPassword')}
          className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-800 dark:text-white transition-all duration-200"
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
          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-dark-300 bg-gray-100 dark:bg-dark-700 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-all duration-200"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 transition-all duration-200 disabled:opacity-50"
        >
          {isPending ? 'Réinitialisation...' : 'Réinitialiser'}
        </button>
      </div>
    </form>
  );
}
