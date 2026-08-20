import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const { handleLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await handleLogin(data.email, data.password);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Identifiants incorrects');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="block text-sm font-bold text-gray-700 dark:text-dark-200 mb-2 transition-colors duration-200">Email</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 dark:text-dark-400 text-xl transition-colors duration-200">
            mail
          </span>
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
        <label className="block text-sm font-bold text-gray-700 dark:text-dark-200 mb-2 transition-colors duration-200">Mot de passe</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 dark:text-dark-400 text-xl transition-colors duration-200">
            lock
          </span>
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

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 rounded-lg border-gray-300 dark:border-dark-600 text-primary-500 focus:ring-primary-500 bg-white dark:bg-dark-800" />
          <span className="text-sm text-gray-600 dark:text-dark-300 transition-colors duration-200">Se souvenir de moi</span>
        </label>
        <a href="/forgot-password" className="text-sm text-primary-500 hover:text-primary-600 font-semibold transition-colors duration-200">
          Mot de passe oublié?
        </a>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-sm font-bold hover:from-primary-600 hover:to-primary-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 active:scale-[0.98]"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Connexion...
          </span>
        ) : (
          'Se connecter'
        )}
      </button>
    </form>
  );
}
