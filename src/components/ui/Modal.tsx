import { useEffect } from 'react';
import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEscape);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200" onClick={onClose} />
      <div className={`relative bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full mx-4 ${sizeClasses[size]} max-h-[90vh] flex flex-col animate-scale-in transition-all duration-200 ring-1 ring-gray-100 dark:ring-dark-700`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-dark-700 transition-colors duration-200">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-all duration-200 active:scale-95"
          >
            <span className="material-symbols-outlined text-gray-400 dark:text-dark-400">close</span>
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
