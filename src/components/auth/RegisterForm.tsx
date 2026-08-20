import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const niveauValues = ['SIXIEME', 'CINQUIEME', 'QUATRIEME', 'TROISIEME', 'SECONDE', 'PREMIERE', 'TERMINALE'] as const;
const serieValues = ['S', 'L', 'OSE'] as const;

const niveauLabels: Record<string, string> = {
  SIXIEME: '6ème', CINQUIEME: '5ème', QUATRIEME: '4ème', TROISIEME: '3ème',
  SECONDE: 'Seconde', PREMIERE: 'Première', TERMINALE: 'Terminale',
};

const registerSchema = z.object({
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  confirmPassword: z.string(),
  niveau: z.string().optional(),
  serie: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
}).refine((data) => {
  if ((data.niveau === 'TERMINALE' || data.niveau === 'PREMIERE') && !data.serie) return false;
  return true;
}, { message: 'Une série est requise pour la Terminale et la Première', path: ['serie'] });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const { handleRegister } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const selectedNiveau = watch('niveau');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await handleRegister({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        niveau: data.niveau || undefined,
        serie: data.niveau === 'TERMINALE' ? data.serie : undefined,
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1.5 transition-colors duration-200">Nom</label>
          <input
            {...register('lastName')}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            placeholder="Dupont"
          />
          {errors.lastName && <p className="text-xs text-danger mt-1">{errors.lastName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1.5 transition-colors duration-200">Prénom</label>
          <input
            {...register('firstName')}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            placeholder="Jean"
          />
          {errors.firstName && <p className="text-xs text-danger mt-1">{errors.firstName.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1.5 transition-colors duration-200">Niveau</label>
          <select
            {...register('niveau')}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">Sélectionner</option>
            {niveauValues.map((n) => (
              <option key={n} value={n}>{niveauLabels[n]}</option>
            ))}
          </select>
        </div>
        {(selectedNiveau === 'TERMINALE' || selectedNiveau === 'PREMIERE') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1.5 transition-colors duration-200">Série</label>
            <select
              {...register('serie')}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Sélectionner</option>
              {serieValues.map((s) => (
                <option key={s} value={s}>Série {s}</option>
              ))}
            </select>
            {errors.serie && <p className="text-xs text-danger mt-1">{errors.serie.message}</p>}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1.5 transition-colors duration-200">Email</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 dark:text-dark-400 text-xl transition-colors duration-200">mail</span>
          <input
            {...register('email')}
            type="email"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            placeholder="vous@exemple.com"
          />
        </div>
        {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1.5 transition-colors duration-200">Mot de passe</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 dark:text-dark-400 text-xl transition-colors duration-200">lock</span>
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            className="w-full pl-10 pr-10 py-2.5 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-200 transition-colors duration-200"
          >
            <span className="material-symbols-outlined text-xl">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </div>
        {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1.5 transition-colors duration-200">Confirmer le mot de passe</label>
        <input
          {...register('confirmPassword')}
          type="password"
          className="w-full px-4 py-2.5 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
          placeholder="••••••••"
        />
        {errors.confirmPassword && <p className="text-xs text-danger mt-1">{errors.confirmPassword.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 bg-primary-500 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary-500/25 active:scale-[0.98]"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Inscription...
          </span>
        ) : (
          "Créer un compte"
        )}
      </button>
    </form>
  );
}
