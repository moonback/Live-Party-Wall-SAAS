import React from 'react';
import { Camera, Users, Heart } from 'lucide-react';

interface ProjectionStatsProps {
  totalPhotos: number;
  uniqueAuthors: number;
  totalLikes: number;
  show: boolean;
}

/**
 * Composant pour afficher les statistiques en temps réel
 */
export const ProjectionStats: React.FC<ProjectionStatsProps> = ({
  totalPhotos,
  uniqueAuthors,
  totalLikes,
  show,
}) => {
  if (!show) return null;

  return (
    <div
      className={`absolute top-4 right-4 z-10 flex items-center gap-3 transition-all duration-300 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
      }`}
    >
      <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-xl shadow-lg">
        <div className="flex items-center gap-4 text-white text-sm">
          <div className="flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-pink-400" />
            <span className="font-bold">{totalPhotos}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="font-bold">{uniqueAuthors}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
            <span className="font-bold">{totalLikes}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

