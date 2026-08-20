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
  accountType: z.enum(['APPRENANT', 'MENTOR']),
  niveau: z.string().optional(),
  serie: z.string().optional(),
  niveauResponsable: z.string().optional(),
  serieResponsable: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
}).refine((data) => {
  if (data.accountType === 'APPRENANT' && (data.niveau === 'TERMINALE' || data.niveau === 'PREMIERE') && !data.serie) return false;
  return true;
}, { message: 'Une série est requise pour la Terminale et la Première', path: ['serie'] })
.refine((data) => {
  if (data.accountType === 'MENTOR' && !data.niveauResponsable) return false;
  return true;
}, { message: 'Le niveau responsable est requis pour les mentors', path: ['niveauResponsable'] })
.refine((data) => {
  if (data.accountType === 'MENTOR' && (data.niveauResponsable === 'PREMIERE' || data.niveauResponsable === 'TERMINALE') && !data.serieResponsable) return false;
  return true;
}, { message: 'La série est requise pour les mentors de Première ou Terminale', path: ['serieResponsable'] });

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
    defaultValues: { accountType: 'APPRENANT' },
  });

  const accountType = watch('accountType');
  const selectedNiveau = watch('niveau');
  const selectedNiveauResponsable = watch('niveauResponsable');
  const isMentor = accountType === 'MENTOR';

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await handleRegister({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: data.accountType,
        niveau: isMentor ? undefined : data.niveau || undefined,
        serie: !isMentor && data.niveau === 'PREMIERE' ? data.serie : undefined,
        niveauResponsable: isMentor ? data.niveauResponsable : undefined,
        serieResponsable: isMentor && (data.niveauResponsable === 'PREMIERE' || data.niveauResponsable === 'TERMINALE') ? data.serieResponsable : undefined,
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Account Type Selection */}
      <div>
        <label className="block text-sm font-bold text-gray-700 dark:text-dark-200 mb-3">Je suis</label>
        <div className="grid grid-cols-2 gap-3">
          <label className={`relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
            !isMentor
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-200 dark:ring-primary-800/30'
              : 'border-gray-200 dark:border-dark-600 hover:border-gray-300 dark:hover:border-dark-500'
          }`}>
            <input type="radio" value="APPRENANT" {...register('accountType')} className="sr-only" />
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              !isMentor ? 'bg-primary-500 shadow-lg shadow-primary-500/30' : 'bg-gray-200 dark:bg-dark-600'
            }`}>
              <span className={`material-symbols-outlined text-xl ${!isMentor ? 'text-white' : 'text-gray-500 dark:text-dark-400'}`}>school</span>
            </div>
            <div>
              <p className={`text-sm font-bold ${!isMentor ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-dark-200'}`}>Apprenant</p>
              <p className="text-xs text-gray-400 dark:text-dark-400">Je veux apprendre</p>
            </div>
          </label>
          <label className={`relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
            isMentor
              ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 ring-1 ring-violet-200 dark:ring-violet-800/30'
              : 'border-gray-200 dark:border-dark-600 hover:border-gray-300 dark:hover:border-dark-500'
          }`}>
            <input type="radio" value="MENTOR" {...register('accountType')} className="sr-only" />
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isMentor ? 'bg-violet-500 shadow-lg shadow-violet-500/30' : 'bg-gray-200 dark:bg-dark-600'
            }`}>
              <span className={`material-symbols-outlined text-xl ${isMentor ? 'text-white' : 'text-gray-500 dark:text-dark-400'}`}>psychology</span>
            </div>
            <div>
              <p className={`text-sm font-bold ${isMentor ? 'text-violet-700 dark:text-violet-300' : 'text-gray-700 dark:text-dark-200'}`}>Mentor</p>
              <p className="text-xs text-gray-400 dark:text-dark-400">Je veux enseigner</p>
            </div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-dark-200 mb-2">Nom</label>
          <input
            {...register('lastName')}
            className="w-full px-4 py-3 border border-gray-200 dark:border-dark-600 rounded-xl text-sm bg-gray-50 dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            placeholder="Dupont"
          />
          {errors.lastName && <p className="text-xs text-danger mt-1.5 font-medium">{errors.lastName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-dark-200 mb-2">Prénom</label>
          <input
            {...register('firstName')}
            className="w-full px-4 py-3 border border-gray-200 dark:border-dark-600 rounded-xl text-sm bg-gray-50 dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            placeholder="Jean"
          />
          {errors.firstName && <p className="text-xs text-danger mt-1.5 font-medium">{errors.firstName.message}</p>}
        </div>
      </div>

      {/* Mentor: niveau responsable */}
      {isMentor && (
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-dark-200 mb-2">Niveau responsable</label>
          <select
            {...register('niveauResponsable')}
            className="w-full px-4 py-3 border border-gray-200 dark:border-dark-600 rounded-xl text-sm bg-gray-50 dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">Sélectionner le niveau</option>
            {niveauValues.map((n) => (
              <option key={n} value={n}>{niveauLabels[n]}</option>
            ))}
          </select>
          {errors.niveauResponsable && <p className="text-xs text-danger mt-1.5 font-medium">{errors.niveauResponsable.message}</p>}
        </div>
      )}

      {/* Mentor: série responsable (only for Première / Terminale) */}
      {isMentor && (selectedNiveauResponsable === 'PREMIERE' || selectedNiveauResponsable === 'TERMINALE') && (
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-dark-200 mb-2">Série du niveau</label>
          <select
            {...register('serieResponsable')}
            className="w-full px-4 py-3 border border-gray-200 dark:border-dark-600 rounded-xl text-sm bg-gray-50 dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">Sélectionner la série</option>
            {serieValues.map((s) => (
              <option key={s} value={s}>Série {s}</option>
            ))}
          </select>
          {errors.serieResponsable && <p className="text-xs text-danger mt-1.5 font-medium">{errors.serieResponsable.message}</p>}
        </div>
      )}

      {/* Apprenant: niveau + série */}
      {!isMentor && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-dark-200 mb-2">Niveau</label>
            <select
              {...register('niveau')}
              className="w-full px-4 py-3 border border-gray-200 dark:border-dark-600 rounded-xl text-sm bg-gray-50 dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Sélectionner</option>
              {niveauValues.map((n) => (
                <option key={n} value={n}>{niveauLabels[n]}</option>
              ))}
            </select>
          </div>
          {selectedNiveau === 'PREMIERE' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-dark-200 mb-2">Série</label>
              <select
                {...register('serie')}
                className="w-full px-4 py-3 border border-gray-200 dark:border-dark-600 rounded-xl text-sm bg-gray-50 dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Sélectionner</option>
                {serieValues.map((s) => (
                  <option key={s} value={s}>Série {s}</option>
                ))}
              </select>
              {errors.serie && <p className="text-xs text-danger mt-1.5 font-medium">{errors.serie.message}</p>}
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-bold text-gray-700 dark:text-dark-200 mb-2">Email</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 dark:text-dark-400 text-xl">mail</span>
          <input
            {...register('email')}
            type="email"
            className="w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-dark-600 rounded-xl text-sm bg-gray-50 dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-dark-500"
            placeholder="vous@exemple.com"
          />
        </div>
        {errors.email && <p className="text-xs text-danger mt-1.5 font-medium">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 dark:text-dark-200 mb-2">Mot de passe</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 dark:text-dark-400 text-xl">lock</span>
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            className="w-full pl-12 pr-12 py-3.5 border border-gray-200 dark:border-dark-600 rounded-xl text-sm bg-gray-50 dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-dark-500"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-200 transition-colors duration-200"
          >
            <span className="material-symbols-outlined text-xl">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </div>
        {errors.password && <p className="text-xs text-danger mt-1.5 font-medium">{errors.password.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 dark:text-dark-200 mb-2">Confirmer le mot de passe</label>
        <input
          {...register('confirmPassword')}
          type="password"
          className="w-full px-4 py-3.5 border border-gray-200 dark:border-dark-600 rounded-xl text-sm bg-gray-50 dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
          placeholder="••••••••"
        />
        {errors.confirmPassword && <p className="text-xs text-danger mt-1.5 font-medium">{errors.confirmPassword.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-[0.98] ${
          isMentor
            ? 'bg-gradient-to-r from-violet-500 to-violet-600 text-white hover:from-violet-600 hover:to-violet-700 shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30'
            : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30'
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Inscription...
          </span>
        ) : (
          isMentor ? "Créer un compte Mentor" : "Créer un compte"
        )}
      </button>
    </form>
  );
}
