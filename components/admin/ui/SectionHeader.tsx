import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Badge } from './Badge';

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  badge?: string | number;
  className?: string;
}

/**
 * SectionHeader - En-tête de section standardisé
 * Utilise la hiérarchie typographique du design system (H2: text-2xl font-semibold)
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon: Icon,
  title,
  description,
  badge,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-3 mb-6 ${className}`}>
      <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20 flex-shrink-0">
        <Icon className="w-5 h-5 text-indigo-400" />
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-2xl font-semibold text-slate-100 flex items-center gap-2 flex-wrap">
          {title}
          {badge !== undefined && (
            <Badge variant="primary">{badge}</Badge>
          )}
        </h2>
        {description && (
          <p className="text-sm text-slate-400 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
};

