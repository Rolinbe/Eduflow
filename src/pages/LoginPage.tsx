import { useState } from 'react';
import { Link } from 'react-router-dom';
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
            {isLogin ? 'Bienvenue!' : "Créez votre compte"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-dark-400 mt-2 transition-colors duration-200">
            {isLogin
              ? 'Connectez-vous pour accéder à vos cours'
              : 'Rejoignez notre plateforme d\'apprentissage'}
          </p>
        </div>

        {isLogin ? <LoginForm /> : <RegisterForm />}

        <p className="text-center text-sm text-gray-500 dark:text-dark-400 mt-6 transition-colors duration-200">
          {isLogin ? "Vous n'avez pas de compte? " : "Vous avez déjà un compte? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary-500 hover:text-primary-600 font-medium transition-colors duration-200"
          >
            {isLogin ? "S'inscrire" : 'Se connecter'}
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}
