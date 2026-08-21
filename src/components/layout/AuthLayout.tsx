import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

const studyImages = [
  {
    url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80',
    caption: 'Collaboration et apprentissage en groupe',
  },
  {
    url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&q=80',
    caption: 'Concentration et étude approfondie',
  },
  {
    url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1200&q=80',
    caption: 'Découverte et curiosité intellectuelle',
  },
  {
    url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&q=80',
    caption: 'Enseignement et transmission du savoir',
  },
  {
    url: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=1200&q=80',
    caption: 'Écriture et création de connaissances',
  },
  {
    url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&q=80',
    caption: 'Ouverture sur le monde et la culture',
  },
];

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = useCallback((index: number) => {
    if (isTransitioning || index === current) return;
    setIsTransitioning(true);
    setCurrent(index);
    setTimeout(() => setIsTransitioning(false), 1000);
  }, [current, isTransitioning]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setCurrent((prev) => (prev + 1) % studyImages.length);
      setTimeout(() => setIsTransitioning(false), 1000);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex transition-colors duration-200">
      {/* Left panel - animated image carousel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Images */}
        {studyImages.map((img, index) => (
          <div
            key={index}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{ opacity: index === current ? 1 : 0 }}
          >
            <img
              src={img.url}
              alt={img.caption}
              className="w-full h-full object-cover"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-primary-900/30" />

        {/* Logo */}
        <div className="absolute top-0 left-0 right-0 p-8 z-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-3xl">school</span>
            </div>
            <h1 className="text-2xl font-bold text-white">EduFlow</h1>
          </Link>
        </div>

        {/* Caption & dots at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
          <h2 className="text-3xl font-bold text-white leading-tight mb-2">
            Apprenez à votre rythme,<br />partout dans le monde.
          </h2>
          <p className="text-white/80 text-base mb-6 min-h-[1.5rem] transition-all duration-500">
            {studyImages[current].caption}
          </p>

          {/* Dots */}
          <div className="flex items-center gap-3">
            {studyImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={`h-2 rounded-full transition-all duration-500 ${
                  index === current
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Image ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-dark-800 transition-colors duration-200">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
