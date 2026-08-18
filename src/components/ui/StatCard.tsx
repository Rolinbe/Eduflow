import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: { value: number; isPositive: boolean };
  color?: string;
}

export default function StatCard({ title, value, icon, trend, color = 'primary' }: StatCardProps) {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-green-50 text-success',
    warning: 'bg-yellow-50 text-warning',
    danger: 'bg-red-50 text-danger',
    info: 'bg-blue-50 text-info',
  };

  return (
    <div className="bg-white rounded-lg shadow-card p-6 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {trend && (
          <div className="flex items-center mt-2">
            <span className={`text-sm font-medium ${trend.isPositive ? 'text-success' : 'text-danger'}`}>
              <span className="material-symbols-outlined text-base align-middle">
                {trend.isPositive ? 'trending_up' : 'trending_down'}
              </span>
              {' '}{Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-gray-400 ml-2">vs mois dernier</span>
          </div>
        )}
      </div>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorMap[color] || colorMap.primary}`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
    </div>
  );
}
