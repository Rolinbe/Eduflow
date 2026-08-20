interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray';
  size?: 'sm' | 'md';
}

export default function Badge({ children, variant = 'primary', size = 'sm' }: BadgeProps) {
  const variantClasses: Record<string, string> = {
    primary: 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400',
    success: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    warning: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    danger: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    info: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    gray: 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-300',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full transition-colors duration-200 ${variantClasses[variant]} ${sizeClasses[size]}`}>
      {children}
    </span>
  );
}
