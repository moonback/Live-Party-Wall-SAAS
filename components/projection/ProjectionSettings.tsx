import React from 'react';
import { X } from 'lucide-react';

interface ProjectionSettingsProps {
  displayDuration: number;
  transitionType: string;
  speedMultiplier: number;
  isRandom: boolean;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

/**
 * Panneau de paramètres de projection
 */
export const ProjectionSettings: React.FC<ProjectionSettingsProps> = ({
  displayDuration,
  transitionType,
  speedMultiplier,
  isRandom,
  onClose,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <div
      className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-black/80 backdrop-blur-xl border border-white/20 px-6 py-4 rounded-2xl shadow-2xl min-w-[300px] transition-all duration-300"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg">Paramètres</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-white/80 text-sm">Durée d'affichage</span>
          <span className="text-white font-bold">{displayDuration / 1000}s</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/80 text-sm">Transition</span>
          <span className="text-white font-bold capitalize">{transitionType}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/80 text-sm">Vitesse</span>
          <span className="text-white font-bold">{speedMultiplier}x</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/80 text-sm">Mode aléatoire</span>
          <span className={`font-bold ${isRandom ? 'text-pink-400' : 'text-white/60'}`}>
            {isRandom ? 'Activé' : 'Désactivé'}
          </span>
        </div>
      </div>
    </div>
  );
};

