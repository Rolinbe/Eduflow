interface ProgressBarProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  color?: string;
}

export default function ProgressBar({ value, size = 'md', showLabel = true, color }: ProgressBarProps) {
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const getColor = (val: number) => {
    if (color) return color;
    if (val >= 75) return 'bg-success';
    if (val >= 40) return 'bg-primary-500';
    return 'bg-warning';
  };

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-200 dark:bg-dark-600 rounded-full ${sizeClasses[size]} transition-colors duration-200`}>
        <div
          className={`${getColor(value)} ${sizeClasses[size]} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-gray-500 dark:text-dark-400 mt-1 inline-block transition-colors duration-200">{Math.round(value)}%</span>
      )}
    </div>
  );
}
