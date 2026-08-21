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
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Identifiants incorrects');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="group">
        <label className="block text-sm font-semibold text-gray-600 dark:text-dark-300 mb-2 transition-colors duration-200">
          Adresse email
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 dark:text-dark-500 text-xl transition-all duration-200 group-focus-within:text-primary-500 group-focus-within:scale-110">
            mail
          </span>
          <input
            {...register('email')}
            type="email"
            className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-100 dark:border-dark-700 rounded-2xl text-sm bg-white dark:bg-dark-900 dark:text-white focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-dark-500 hover:border-gray-200 dark:hover:border-dark-600 shadow-sm"
            placeholder="vous@exemple.com"
          />
        </div>
        {errors.email && (
          <p className="text-xs text-danger mt-2 font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">error</span>
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="group">
        <label className="block text-sm font-semibold text-gray-600 dark:text-dark-300 mb-2 transition-colors duration-200">
          Mot de passe
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 dark:text-dark-500 text-xl transition-all duration-200 group-focus-within:text-primary-500 group-focus-within:scale-110">
            lock
          </span>
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-100 dark:border-dark-700 rounded-2xl text-sm bg-white dark:bg-dark-900 dark:text-white focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-dark-500 hover:border-gray-200 dark:hover:border-dark-600 shadow-sm"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-500 hover:text-primary-500 dark:hover:text-primary-400 transition-all duration-200 hover:scale-110"
          >
            <span className="material-symbols-outlined text-xl">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-danger mt-2 font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">error</span>
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2.5 cursor-pointer group/check">
          <input type="checkbox" className="w-4 h-4 rounded-lg border-gray-300 dark:border-dark-600 text-primary-500 focus:ring-primary-500 bg-white dark:bg-dark-800 transition-all duration-200" />
          <span className="text-sm text-gray-500 dark:text-dark-400 group-hover/check:text-gray-700 dark:group-hover/check:text-dark-200 transition-colors duration-200">Se souvenir de moi</span>
        </label>
        <a href="/forgot-password" className="text-sm text-primary-500 hover:text-primary-700 font-semibold transition-all duration-200 hover:underline underline-offset-2">
          Mot de passe oublié?
        </a>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="relative w-full py-4 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500 bg-[length:200%_100%] text-white rounded-2xl text-sm font-bold hover:bg-right transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/40 active:scale-[0.98] overflow-hidden group/btn"
      >
        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-700" />
        {isLoading ? (
          <span className="flex items-center justify-center gap-2 relative z-10">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Connexion...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2 relative z-10">
            <span className="material-symbols-outlined text-lg">login</span>
            Se connecter
          </span>
        )}
      </button>
    </form>
  );
}
