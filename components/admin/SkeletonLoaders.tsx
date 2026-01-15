import React from 'react';
import { motion } from 'framer-motion';

/**
 * Composants Skeleton réutilisables pour les composants admin
 * Optimisés pour mobile/tablette/desktop avec animations fluides
 */

/**
 * Skeleton pour une carte photo dans la modération
 */
export const PhotoCardSkeleton: React.FC = () => {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
      className="relative group bg-slate-900/50 backdrop-blur-sm rounded-lg overflow-hidden border border-slate-800"
    >
      {/* Shimmer effect */}
      {!prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none z-10"
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
      )}
      
      <div className="aspect-square bg-gradient-to-br from-slate-800/50 via-slate-900/50 to-slate-800/50 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-slate-700/50 border-t-indigo-500/50 rounded-full animate-spin" />
        </div>
      </div>

      <div className="p-3">
        <div className="h-4 bg-slate-800/50 rounded mb-2 w-3/4 animate-pulse" />
        <div className="h-3 bg-slate-800/30 rounded mb-2 w-full animate-pulse" style={{ animationDelay: '0.1s' }} />
        <div className="h-3 bg-slate-800/30 rounded w-1/2 animate-pulse" style={{ animationDelay: '0.2s' }} />
      </div>
    </motion.div>
  );
};

/**
 * Grille de skeletons pour les photos
 */
export const PhotoGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={`photo-skeleton-${i}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.3, 
            delay: i * 0.05,
            ease: [0.16, 1, 0.3, 1]
          }}
        >
          <PhotoCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
};

/**
 * Skeleton pour une carte invité
 */
export const GuestCardSkeleton: React.FC = () => {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
      className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-slate-800"
    >
      {/* Shimmer effect */}
      {!prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none z-10 rounded-xl"
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
      )}

      <div className="flex items-start gap-3 sm:gap-4 mb-4">
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-slate-800/50 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="h-4 bg-slate-800/50 rounded mb-2 w-2/3 animate-pulse" />
          <div className="h-3 bg-slate-800/30 rounded w-1/2 animate-pulse" style={{ animationDelay: '0.1s' }} />
        </div>
        <div className="w-8 h-8 bg-slate-800/30 rounded-lg animate-pulse" />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-950/50 rounded-lg p-3 border border-slate-800">
            <div className="h-5 bg-slate-800/50 rounded mb-1 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
            <div className="h-3 bg-slate-800/30 rounded w-2/3 mx-auto animate-pulse" style={{ animationDelay: `${i * 0.1 + 0.1}s` }} />
          </div>
        ))}
      </div>
    </motion.div>
  );
};

/**
 * Grille de skeletons pour les invités
 */
export const GuestGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={`guest-skeleton-${i}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.3, 
            delay: i * 0.05,
            ease: [0.16, 1, 0.3, 1]
          }}
        >
          <GuestCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
};

/**
 * Skeleton pour une carte battle
 */
export const BattleCardSkeleton: React.FC = () => {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
      className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-slate-800"
    >
      {/* Shimmer effect */}
      {!prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none z-10 rounded-xl"
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
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-slate-800/50 rounded-lg animate-pulse" />
        <div className="flex-1">
          <div className="h-4 bg-slate-800/50 rounded mb-2 w-3/4 animate-pulse" />
          <div className="h-3 bg-slate-800/30 rounded w-1/2 animate-pulse" style={{ animationDelay: '0.1s' }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {[1, 2].map((i) => (
          <div key={i} className="aspect-square bg-slate-800/50 rounded-lg animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-800/30 rounded w-1/3 animate-pulse" />
        <div className="h-8 bg-slate-800/30 rounded w-20 animate-pulse" style={{ animationDelay: '0.2s' }} />
      </div>
    </motion.div>
  );
};

/**
 * Grille de skeletons pour les battles
 */
export const BattleGridSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={`battle-skeleton-${i}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.3, 
            delay: i * 0.05,
            ease: [0.16, 1, 0.3, 1]
          }}
        >
          <BattleCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
};

/**
 * Skeleton pour les statistiques
 */
export const StatsCardSkeleton: React.FC = () => {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
      className="bg-slate-950/50 rounded-lg p-4 border border-slate-800"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-800/30 rounded-lg border border-slate-700/30">
          <div className="w-5 h-5 bg-slate-700/50 rounded animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="h-6 bg-slate-800/50 rounded mb-2 w-16 animate-pulse" />
          <div className="h-3 bg-slate-800/30 rounded w-20 animate-pulse" style={{ animationDelay: '0.1s' }} />
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Grille de skeletons pour les statistiques
 */
export const StatsGridSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={`stats-skeleton-${i}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.3, 
            delay: i * 0.05,
            ease: [0.16, 1, 0.3, 1]
          }}
        >
          <StatsCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
};

/**
 * Skeleton pour une ligne de liste
 */
export const ListItemSkeleton: React.FC = () => {
  return (
    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-900/50 rounded-lg border border-slate-800">
      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-800/50 rounded-full animate-pulse flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="h-4 bg-slate-800/50 rounded mb-2 w-3/4 animate-pulse" />
        <div className="h-3 bg-slate-800/30 rounded w-1/2 animate-pulse" style={{ animationDelay: '0.1s' }} />
      </div>
      <div className="w-8 h-8 bg-slate-800/30 rounded-lg animate-pulse flex-shrink-0" />
    </div>
  );
};

/**
 * Liste de skeletons
 */
export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="space-y-2 sm:space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={`list-item-skeleton-${i}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ 
            duration: 0.3, 
            delay: i * 0.05,
            ease: [0.16, 1, 0.3, 1]
          }}
        >
          <ListItemSkeleton />
        </motion.div>
      ))}
    </div>
  );
};

/**
 * Skeleton pour un champ de formulaire
 */
export const FormFieldSkeleton: React.FC = () => {
  return (
    <div className="space-y-2">
      <div className="h-4 bg-slate-800/50 rounded w-1/4 animate-pulse" />
      <div className="h-10 bg-slate-800/30 rounded animate-pulse" style={{ animationDelay: '0.1s' }} />
    </div>
  );
};

/**
 * Skeleton pour une section de formulaire
 */
export const FormSectionSkeleton: React.FC<{ fields?: number }> = ({ fields = 3 }) => {
  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="h-6 bg-slate-800/50 rounded w-1/3 animate-pulse mb-4" />
      {Array.from({ length: fields }, (_, i) => (
        <FormFieldSkeleton key={`field-${i}`} />
      ))}
    </div>
  );
};

