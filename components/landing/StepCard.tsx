import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StepCardProps {
  number: number;
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Carte pour afficher une étape du processus
 */
export const StepCard: React.FC<StepCardProps> = ({
  number,
  icon: Icon,
  title,
  description,
}) => {
  return (
    <div className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-2xl p-6 sm:p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105 group text-center">
      <div className="flex items-center justify-center w-16 h-16 mb-6 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl group-hover:from-pink-500/30 group-hover:to-purple-500/30 transition-all mx-auto">
        <Icon className="w-8 h-8 text-pink-400" />
      </div>
      <div className="inline-flex items-center justify-center w-10 h-10 bg-pink-500/20 rounded-full mb-4 text-pink-400 font-bold text-lg">
        {number}
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-300 leading-relaxed">{description}</p>
    </div>
  );
};

