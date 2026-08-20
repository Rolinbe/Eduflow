import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import LoadingSpinner from '../ui/LoadingSpinner';

const niveauLabels: Record<string, string> = {
  SIXIEME: '6ème', CINQUIEME: '5ème', QUATRIEME: '4ème', TROISIEME: '3ème',
  SECONDE: 'Seconde', PREMIERE: 'Première', TERMINALE: 'Terminale',
};

const profileSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
});

const passwordSchema = z.object({
  oldPassword: z.string().min(1, 'Mot de passe actuel requis'),
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

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();

  const { data: meData, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data;
    },
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: meData?.user?.firstName || user?.firstName || '',
      lastName: meData?.user?.lastName || user?.lastName || '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const formData = new FormData();
      formData.append('firstName', data.firstName);
      formData.append('lastName', data.lastName);
      if (selectedFile) {
        formData.append('avatar', selectedFile);
      }
      const res = await api.put('/auth/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: (data) => {
      updateUser(data.user);
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Profil mis à jour');
      setSelectedFile(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Erreur lors de la mise à jour');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { oldPassword: string; newPassword: string }) => {
      const res = await api.put('/auth/change-password', {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Mot de passe modifié');
      passwordForm.reset();
      setShowPasswordSection(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Erreur lors du changement');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5 Mo');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Seules les images sont acceptées');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const currentAvatar = avatarPreview || meData?.user?.avatar || user?.avatar;

  if (isLoading) return <LoadingSpinner className="py-12" />;

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1 transition-colors duration-200";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Avatar Section */}
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-card p-6 transition-colors duration-200">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-200">Photo de profil</h2>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center border-4 border-white dark:border-dark-800 shadow-md transition-colors duration-200">
              {currentAvatar ? (
                <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-primary-600">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-600 transition-all duration-200 hover:scale-110 active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">photo_camera</span>
            </button>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">{meData?.user?.firstName} {meData?.user?.lastName}</p>
            <p className="text-xs text-gray-500 dark:text-dark-400 transition-colors duration-200">{meData?.user?.email}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-sm text-primary-500 hover:text-primary-600 font-medium transition-colors duration-200"
            >
              Changer la photo
            </button>
            {selectedFile && (
              <p className="text-xs text-green-600 mt-1">{selectedFile.name} — prêt à sauvegarder</p>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-card p-6 transition-colors duration-200">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-200">Informations personnelles</h2>
        <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Prénom</label>
              <input
                {...profileForm.register('firstName')}
                className={inputClass}
              />
              {profileForm.formState.errors.firstName && (
                <p className="text-xs text-red-500 mt-1">{profileForm.formState.errors.firstName.message}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Nom</label>
              <input
                {...profileForm.register('lastName')}
                className={inputClass}
              />
              {profileForm.formState.errors.lastName && (
                <p className="text-xs text-red-500 mt-1">{profileForm.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              value={meData?.user?.email || ''}
              disabled
              className={`${inputClass} bg-gray-50 dark:bg-dark-900 text-gray-500 dark:text-dark-400 cursor-not-allowed`}
            />
            <p className="text-xs text-gray-400 dark:text-dark-400 mt-1 transition-colors duration-200">L'email ne peut pas être modifié</p>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending || (!profileForm.formState.isDirty && !selectedFile)}
              className="px-6 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-all duration-200 disabled:opacity-50 hover:shadow-lg hover:shadow-primary-500/25 active:scale-[0.98]"
            >
              {updateProfileMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>

      {/* Password Section */}
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-card p-6 transition-colors duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-200">Mot de passe</h2>
          <button
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="text-sm text-primary-500 hover:text-primary-600 font-medium transition-colors duration-200"
          >
            {showPasswordSection ? 'Annuler' : 'Modifier'}
          </button>
        </div>

        {showPasswordSection ? (
          <form onSubmit={passwordForm.handleSubmit((data) => changePasswordMutation.mutate(data))} className="space-y-4">
            <div>
              <label className={labelClass}>Mot de passe actuel</label>
              <input
                type="password"
                {...passwordForm.register('oldPassword')}
                className={inputClass}
              />
              {passwordForm.formState.errors.oldPassword && (
                <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.oldPassword.message}</p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nouveau mot de passe</label>
                <input
                  type="password"
                  {...passwordForm.register('newPassword')}
                  className={inputClass}
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.newPassword.message}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Confirmer</label>
                <input
                  type="password"
                  {...passwordForm.register('confirmPassword')}
                  className={inputClass}
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="px-6 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-all duration-200 disabled:opacity-50 hover:shadow-lg hover:shadow-primary-500/25 active:scale-[0.98]"
              >
                {changePasswordMutation.isPending ? 'Modification...' : 'Modifier le mot de passe'}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-gray-500 dark:text-dark-400 transition-colors duration-200">••••••••••</p>
        )}
      </div>

      {/* Account Info */}
      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-card p-6 transition-colors duration-200">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-200">Informations du compte</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-dark-700 transition-colors duration-200">
            <span className="text-sm text-gray-500 dark:text-dark-400 transition-colors duration-200">Rôle</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">
              {user?.role === 'ADMIN' ? 'Administrateur' : 'Apprenant'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-dark-700 transition-colors duration-200">
            <span className="text-sm text-gray-500 dark:text-dark-400 transition-colors duration-200">Statut</span>
            <span className="text-sm font-medium text-green-600">Actif</span>
          </div>
          {meData?.user?.niveau && (
            <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-dark-700 transition-colors duration-200">
              <span className="text-sm text-gray-500 dark:text-dark-400 transition-colors duration-200">Niveau</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">
                {niveauLabels[meData.user.niveau] || meData.user.niveau}
                {meData.user.niveau === 'TERMINALE' || meData.user.niveau === 'PREMIERE'
                  ? meData.user.serie ? ` — Série ${meData.user.serie}` : ''
                  : ''}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-dark-700 transition-colors duration-200">
            <span className="text-sm text-gray-500 dark:text-dark-400 transition-colors duration-200">Membre depuis</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">
              {new Date(meData?.user?.createdAt || '').toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-500 dark:text-dark-400 transition-colors duration-200">Dernière connexion</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">
              {meData?.user?.lastLogin
                ? new Date(meData.user.lastLogin).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
