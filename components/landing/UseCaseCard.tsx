import React from 'react';
import { LucideIcon } from 'lucide-react';

interface UseCaseCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Carte pour afficher un cas d'usage
 */
export const UseCaseCard: React.FC<UseCaseCardProps> = ({
  icon: Icon,
  title,
  description,
}) => {
  return (
    <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
      <Icon className="w-10 h-10 text-pink-400 mb-4" />
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-300 text-sm">{description}</p>
    </div>
  );
};

