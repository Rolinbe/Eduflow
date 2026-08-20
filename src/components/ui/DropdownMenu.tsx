import { useState, useRef, useEffect, type ReactNode } from 'react';

interface DropdownItem {
  label: string;
  icon: string;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'success' | 'warning';
  disabled?: boolean;
}

interface DropdownMenuProps {
  trigger?: ReactNode;
  items: DropdownItem[];
}

export default function DropdownMenu({ trigger, items }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const variantClasses: Record<string, string> = {
    default: 'text-gray-700 dark:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-700',
    danger: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30',
    success: 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30',
    warning: 'text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30',
  };

  return (
    <div className="relative" ref={menuRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger || (
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-200 transition-colors duration-200">
            <span className="material-symbols-outlined text-xl">more_vert</span>
          </button>
        )}
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-gray-100 dark:border-dark-600 z-50 py-1.5 overflow-hidden animate-scale-in transition-colors duration-200">
            {items.map((item, index) => (
              item.disabled ? null : (
                <button
                  key={index}
                  onClick={() => {
                    item.onClick();
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors duration-200 ${
                    variantClasses[item.variant || 'default']
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{item.icon}</span>
                  {item.label}
                </button>
              )
            ))}
          </div>
        </>
      )}
    </div>
  );
}
