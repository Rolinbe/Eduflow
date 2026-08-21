import { useState } from 'react';
import AuthLayout from '../components/layout/AuthLayout';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <AuthLayout>
      <div>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-200">
            {isLogin ? 'Bienvenue !' : 'Créez votre compte'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-dark-400 mt-2 transition-colors duration-200">
            {isLogin
              ? 'Connectez-vous pour accéder à vos cours'
              : 'Rejoignez la plateforme EdukaFlow'}
          </p>
        </div>

        {isLogin ? <LoginForm /> : <RegisterForm />}

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100 dark:border-dark-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-4 text-gray-400 dark:text-dark-500 bg-white dark:bg-dark-800">
              {isLogin ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className={`w-full py-3 rounded-2xl text-sm font-bold border-2 transition-all duration-300 ${
            isLogin
              ? 'border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md'
              : 'border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-300 hover:bg-gray-50 dark:hover:bg-dark-700 hover:border-gray-300 dark:hover:border-dark-500 hover:shadow-md'
          }`}
        >
          {isLogin ? "Créer un compte" : 'Se connecter'}
        </button>
      </div>
    </AuthLayout>
  );
}
