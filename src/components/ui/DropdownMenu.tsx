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
  const [position, setPosition] = useState<'bottom' | 'top'>('bottom');
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setPosition(spaceBelow < 300 ? 'top' : 'bottom');
    }
  }, [isOpen]);

  const variantClasses: Record<string, string> = {
    default: 'text-gray-700 dark:text-dark-200 hover:bg-gray-50 dark:hover:bg-dark-700',
    danger: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30',
    success: 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30',
    warning: 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30',
  };

  const variantIconBg: Record<string, string> = {
    default: '',
    danger: 'bg-red-100 dark:bg-red-900/40',
    success: 'bg-green-100 dark:bg-green-900/40',
    warning: 'bg-amber-100 dark:bg-amber-900/40',
  };

  const visibleItems = items.filter((item) => !item.disabled);

  const getPositionClass = () =>
    position === 'top' ? 'bottom-full mb-1' : 'top-full mt-1';

  return (
    <div className="relative inline-block" ref={menuRef}>
      <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)}>
        {trigger || (
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-200 transition-all duration-200"
          >
            <span className="material-symbols-outlined text-xl">more_vert</span>
          </button>
        )}
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className={`absolute right-0 z-50 ${getPositionClass()} w-56 bg-white dark:bg-dark-800 rounded-xl shadow-xl border border-gray-100 dark:border-dark-600 py-1.5 overflow-hidden`}
            style={{ animation: 'dropdownIn 0.15s ease-out' }}
          >
            {visibleItems.map((item, index) => {
              const isLastDanger = index > 0 &&
                visibleItems[index - 1].variant !== 'danger' &&
                item.variant === 'danger';
              const isLastItem = index === visibleItems.length - 1;
              const nextIsDanger = !isLastItem && visibleItems[index + 1]?.variant === 'danger';
              const isLastBeforeDanger = item.variant !== 'danger' && nextIsDanger;

              return (
                <div key={index}>
                  {(index === 0 && item.variant === 'danger') || isLastDanger ? (
                    <div className="my-1 border-t border-gray-100 dark:border-dark-700" />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      item.onClick();
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                      variantClasses[item.variant || 'default']
                    }`}
                  >
                    <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-base ${
                      variantIconBg[item.variant || 'default']
                    }`}>
                      <span className="material-symbols-outlined text-lg">{item.icon}</span>
                    </span>
                    {item.label}
                  </button>
                  {isLastBeforeDanger && (
                    <div className="my-1 border-t border-gray-100 dark:border-dark-700" />
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-4px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
