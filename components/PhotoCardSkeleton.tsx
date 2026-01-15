import React from 'react';
import { motion } from 'framer-motion';

/**
 * Composant Skeleton pour afficher un placeholder pendant le chargement des photos
 * Amélioré avec effet shimmer et animations fluides, responsive design optimisé
 */
export const PhotoCardSkeleton: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-slate-900/70 backdrop-blur-md rounded-xl sm:rounded-2xl overflow-hidden border border-slate-800/50 shadow-xl mb-3 sm:mb-4 md:mb-6 break-inside-avoid relative group"
    >
      {/* Shimmer overlay animé */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none z-10"
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
      
      {/* Header Skeleton */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 bg-slate-900/50 border-b border-slate-800/50 backdrop-blur-sm">
        <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-800/80 overflow-hidden">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
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
        </div>
        <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
          <div className="relative h-3 sm:h-3.5 w-24 sm:w-32 bg-slate-800/80 rounded overflow-hidden">
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          </div>
          <div className="relative h-2 sm:h-2.5 w-16 sm:w-20 bg-slate-800/60 rounded overflow-hidden">
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
                delay: 0.2
              }}
            />
          </div>
        </div>
      </div>

      {/* Media Skeleton - Responsive */}
      <div className="bg-slate-950/50 aspect-[4/5] sm:aspect-[4/5] md:aspect-auto min-h-[250px] sm:min-h-[300px] md:min-h-[400px] flex items-center justify-center relative overflow-hidden">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-slate-800/60"
          animate={{
            opacity: [0.6, 0.8, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
              delay: 0.4
            }}
          />
        </motion.div>
        {/* Placeholder icon avec pulse */}
        <motion.div 
          className="relative z-10 text-slate-700/40 text-3xl sm:text-4xl md:text-5xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.6, 0.4]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          📸
        </motion.div>
      </div>

      {/* Actions & Caption Skeleton */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-2.5">
          <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-800/80 overflow-hidden">
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
                delay: 0.6
              }}
            />
          </div>
          <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-800/80 overflow-hidden">
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
                delay: 0.8
              }}
            />
          </div>
          <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-800/80 overflow-hidden">
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
                delay: 1
              }}
            />
          </div>
        </div>
        <div className="relative h-3 sm:h-4 w-20 sm:w-24 bg-slate-800/80 rounded mb-2 sm:mb-2.5 overflow-hidden">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
              delay: 1.2
            }}
          />
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          <div className="relative h-2.5 sm:h-3 w-full bg-slate-800/60 rounded overflow-hidden">
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
                delay: 1.4
              }}
            />
          </div>
          <div className="relative h-2.5 sm:h-3 w-3/4 bg-slate-800/60 rounded overflow-hidden">
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
                delay: 1.6
              }}
            />
          </div>
        </div>
        <div className="relative h-2 sm:h-2.5 w-28 sm:w-32 bg-slate-800/60 rounded mt-2 sm:mt-2.5 overflow-hidden">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
              delay: 1.8
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Composant pour afficher plusieurs skeletons en colonnes avec animations fluides
 * Responsive design optimisé pour mobile/tablette/desktop
 */
interface PhotoCardSkeletonsProps {
  count?: number;
  columns?: number;
}

export const PhotoCardSkeletons: React.FC<PhotoCardSkeletonsProps> = ({ 
  count = 6, 
  columns = 1 
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={`skeleton-${i}`}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 0.4, 
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

