import React from 'react';
import { motion } from 'framer-motion';

/**
 * Skeleton loader pour les états de chargement du photobooth
 * Optimisé pour mobile/tablette/desktop avec animations fluides
 */
export const PhotoboothSkeleton: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full bg-black z-10 flex flex-col">
      {/* Skeleton pour la caméra/vidéo */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-gradient-to-br from-slate-900 via-black to-slate-900">
        {/* Shimmer effect animé */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none z-20"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
            repeatDelay: 0.5
          }}
        />
        
        {/* Zone principale de preview */}
        <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-4 md:p-6 landscape:p-1 landscape:sm:p-2">
          <div className="relative w-full h-full max-h-[85vh] md:max-h-[90vh] landscape:max-h-[90vh] flex items-center justify-center rounded-2xl sm:rounded-3xl landscape:rounded-xl overflow-hidden border border-white/10 bg-black/20">
            {/* Skeleton pour l'image/vidéo */}
            <div className="w-full h-full bg-gradient-to-br from-slate-800/50 via-slate-900/50 to-slate-800/50 animate-pulse">
              {/* Pattern de chargement */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 sm:gap-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="relative"
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 border-4 border-pink-500/30 border-t-pink-500 border-r-purple-500 rounded-full" />
                  </motion.div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-4 w-32 sm:w-40 bg-slate-700/50 rounded-full animate-pulse" />
                    <div className="h-3 w-24 sm:w-32 bg-slate-700/30 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skeleton pour les contrôles du bas */}
      <div className="absolute bottom-0 left-0 w-full px-2 py-2 sm:px-4 sm:py-4 md:px-6 md:py-4 landscape:px-1.5 landscape:py-1.5 bg-gradient-to-t from-black via-black/95 to-black/90 flex items-end gap-1 sm:gap-2 md:gap-3 landscape:gap-1 z-50">
        {/* Bouton galerie skeleton */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 landscape:w-8 landscape:h-8 rounded-full bg-slate-800/60 animate-pulse" />
          <div className="h-2 w-12 sm:w-16 bg-slate-700/50 rounded-full animate-pulse" />
        </div>

        {/* Bouton capture skeleton */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-slate-700/60 to-slate-800/60 border-4 border-white/20 animate-pulse" />
        </div>

        {/* Bouton caméra skeleton */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 landscape:w-8 landscape:h-8 rounded-full bg-slate-800/60 animate-pulse" />
          <div className="h-2 w-12 sm:w-16 bg-slate-700/50 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Skeleton pour le header */}
      <div className="absolute top-0 left-0 w-full p-2 sm:p-4 md:p-6 landscape:p-1.5 landscape:sm:p-2 flex items-center justify-between z-20 bg-gradient-to-b from-black/90 via-black/80 to-transparent backdrop-blur-xl border-b border-white/5">
        <div className="h-8 w-20 sm:w-24 md:w-28 bg-slate-800/60 rounded-full animate-pulse" />
        <div className="h-6 w-32 sm:w-40 md:w-48 bg-slate-800/60 rounded-full animate-pulse" />
        <div className="h-8 w-20 sm:w-24 md:w-28 bg-slate-800/60 rounded-full animate-pulse" />
      </div>
    </div>
  );
};

/**
 * Skeleton loader compact pour les miniatures de photos
 */
export const PhotoThumbnailSkeleton: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden bg-slate-800/60 border border-slate-700/50"
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none z-10"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
          repeatDelay: 0.3
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-700/50 to-slate-900/50 animate-pulse" />
    </motion.div>
  );
};

/**
 * Skeleton loader pour la grille de photos (mode rafale)
 */
export const BurstPhotosSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 landscape:grid-cols-3 landscape:sm:grid-cols-4 gap-3 sm:gap-4 md:gap-5 landscape:gap-2 landscape:sm:gap-2.5">
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={`skeleton-${i}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.3, 
            delay: i * 0.1 
          }}
        >
          <PhotoThumbnailSkeleton />
        </motion.div>
      ))}
    </div>
  );
};

