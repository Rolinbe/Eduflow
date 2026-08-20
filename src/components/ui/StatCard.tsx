interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: { value: number; isPositive: boolean };
  color?: string;
}

const colorConfig: Record<string, { bg: string; icon: string; number: string; ring: string }> = {
  primary: {
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/20',
    icon: 'bg-blue-500 text-white shadow-lg shadow-blue-500/30',
    number: 'text-blue-600 dark:text-blue-400',
    ring: 'ring-blue-100 dark:ring-blue-900/50',
  },
  success: {
    bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/40 dark:to-emerald-800/20',
    icon: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30',
    number: 'text-emerald-600 dark:text-emerald-400',
    ring: 'ring-emerald-100 dark:ring-emerald-900/50',
  },
  warning: {
    bg: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/40 dark:to-amber-800/20',
    icon: 'bg-amber-500 text-white shadow-lg shadow-amber-500/30',
    number: 'text-amber-600 dark:text-amber-400',
    ring: 'ring-amber-100 dark:ring-amber-900/50',
  },
  danger: {
    bg: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/40 dark:to-red-800/20',
    icon: 'bg-red-500 text-white shadow-lg shadow-red-500/30',
    number: 'text-red-600 dark:text-red-400',
    ring: 'ring-red-100 dark:ring-red-900/50',
  },
  info: {
    bg: 'bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/40 dark:to-indigo-800/20',
    icon: 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30',
    number: 'text-indigo-600 dark:text-indigo-400',
    ring: 'ring-indigo-100 dark:ring-indigo-900/50',
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/40 dark:to-purple-800/20',
    icon: 'bg-purple-500 text-white shadow-lg shadow-purple-500/30',
    number: 'text-purple-600 dark:text-purple-400',
    ring: 'ring-purple-100 dark:ring-purple-900/50',
  },
};

export default function StatCard({ title, value, icon, trend, color = 'primary' }: StatCardProps) {
  const c = colorConfig[color] || colorConfig.primary;

  return (
    <div className={`${c.bg} rounded-2xl p-6 flex items-start justify-between ring-1 ${c.ring} transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group cursor-default`}>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-dark-300">{title}</p>
        <p className={`text-3xl font-extrabold mt-2 ${c.number} tracking-tight`}>{value}</p>
        {trend && (
          <div className="flex items-center mt-2">
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
              trend.isPositive
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
            }`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-gray-400 dark:text-dark-400 ml-2">vs mois dernier</span>
          </div>
        )}
      </div>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${c.icon} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
    </div>
  );
}
