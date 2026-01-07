import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Carte pour afficher une fonctionnalité
 */
export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
}) => {
  return (
    <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-lg p-4 sm:p-5 hover:bg-white/10 transition-all duration-300 hover:scale-105 group">
      <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 mb-3 sm:mb-4 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-lg group-hover:from-pink-500/30 group-hover:to-purple-500/30 transition-all">
        <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-pink-400" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2">{title}</h3>
      <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{description}</p>
    </div>
  );
};

