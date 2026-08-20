import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex transition-colors duration-200">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 to-primary-900 p-12 flex-col justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-3xl">school</span>
          </div>
          <h1 className="text-2xl font-bold text-white">EduFlow</h1>
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-white leading-tight">
            Apprenez à votre rythme,<br />partout dans le monde.
          </h2>
          <p className="text-white/70 mt-4 text-lg">
            Plateforme d'apprentage en ligne moderne et intuitive.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-white/80 text-sm">person</span>
              </div>
            ))}
          </div>
          <p className="text-white/60 text-sm">+1000 apprenants actifs</p>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-dark-800 transition-colors duration-200">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
