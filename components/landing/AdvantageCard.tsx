import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AdvantageCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Carte pour afficher un avantage
 */
export const AdvantageCard: React.FC<AdvantageCardProps> = ({
  icon: Icon,
  title,
  description,
}) => {
  return (
    <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-2xl p-8">
      <div className="flex items-start gap-4">
        <Icon className="w-8 h-8 text-pink-400 flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-gray-300 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};

