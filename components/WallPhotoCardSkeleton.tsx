import React from 'react';

/**
 * ⚡ Skeleton loader simple pour les cartes photos dans WallView
 * Style cohérent avec le design polaroid
 */
export const WallPhotoCardSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse bg-white/10 backdrop-blur-sm p-3 pb-12 rounded-lg shadow-lg break-inside-avoid">
      <div className="bg-gray-700/50 aspect-square rounded-md mb-4"></div>
      <div className="h-4 bg-gray-700/50 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-700/50 rounded w-1/2"></div>
    </div>
  );
};

