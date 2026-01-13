import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  iconColor?: 'indigo' | 'teal' | 'pink' | 'purple' | 'yellow' | 'red';
  className?: string;
}

/**
 * StatCard - Card pour afficher des statistiques
 * Utilise les couleurs standardisées du design system
 */
export const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  value,
  label,
  iconColor = 'indigo',
  className = ''
}) => {
  const iconColors: Record<string, string> = {
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    teal: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
    pink: 'bg-pink-500/10 border-pink-500/20 text-pink-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-400'
  };

  return (
    <div className={`bg-slate-950/50 rounded-lg p-4 border border-slate-800 ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg border ${iconColors[iconColor]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-semibold text-slate-100">{value}</p>
          <p className="text-xs text-slate-400 mt-1">{label}</p>
        </div>
      </div>
    </div>
  );
};

