import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Trash2, Image as ImageIcon, Video } from 'lucide-react';
import { Photo } from '../../types';
import { PhotoGridSkeleton } from './SkeletonLoaders';

interface ModerationTabProps {
  photos: Photo[];
  loading: boolean;
  onRefresh: () => void;
  onDelete: (photo: Photo) => void;
}

export const ModerationTab: React.FC<ModerationTabProps> = ({
  photos,
  loading,
  onRefresh,
  onDelete
}) => {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header avec bouton refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-100 mb-1">
            Modération des photos
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Gérez et supprimez les photos partagées
          </p>
        </div>
        <motion.button 
          whileHover={!prefersReducedMotion ? { scale: 1.02 } : {}}
          whileTap={!prefersReducedMotion ? { scale: 0.98 } : {}}
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-900/50 hover:bg-slate-800/50 rounded-lg transition-colors text-sm text-slate-300 border border-slate-800 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          title="Rafraîchir la liste"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Actualiser</span>
          <span className="sm:hidden">Rafraîchir</span>
        </motion.button>
      </div>

      {/* Contenu avec skeleton ou photos */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          >
            <PhotoGridSkeleton count={10} />
          </motion.div>
        ) : photos.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            className="col-span-full flex flex-col items-center justify-center py-12 sm:py-16 text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800/50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            >
              <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-30" />
            </motion.div>
            <p className="text-base sm:text-lg font-medium mb-2">Aucune photo à modérer</p>
            <p className="text-xs sm:text-sm text-slate-600 text-center px-4">
              Les nouvelles photos apparaîtront ici
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="photos"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4"
          >
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.3,
                  delay: index * 0.03,
                  ease: [0.16, 1, 0.3, 1]
                }}
                whileHover={!prefersReducedMotion ? { y: -2, scale: 1.02 } : {}}
                className="relative group bg-slate-900/50 backdrop-blur-sm rounded-lg overflow-hidden border border-slate-800 hover:border-slate-700 transition-all shadow-md hover:shadow-lg"
              >
                <div className="aspect-square bg-slate-950 relative overflow-hidden">
                  {photo.type === 'video' ? (
                    <video
                      src={photo.url}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      controls
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img 
                      src={photo.url} 
                      alt={photo.caption} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                  {photo.type === 'video' && (
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                      <Video className="w-3 h-3 text-white" />
                      {photo.duration && (
                        <span className="text-white text-[10px] font-medium">
                          {Math.floor(photo.duration)}s
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                    <motion.button
                      whileHover={!prefersReducedMotion ? { scale: 1.1 } : {}}
                      whileTap={!prefersReducedMotion ? { scale: 0.9 } : {}}
                      onClick={() => onDelete(photo)}
                      className="p-3 bg-red-600 hover:bg-red-700 rounded-full text-white transition-all shadow-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Supprimer la photo"
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>

                <div className="p-2 sm:p-3">
                  <p className="font-medium text-xs sm:text-sm truncate text-slate-100 mb-1">
                    {photo.author || 'Anonyme'}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-400 truncate mb-1 sm:mb-2 line-clamp-2">
                    {photo.caption || 'Sans description'}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-500">
                    {new Date(photo.timestamp).toLocaleString('fr-FR', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

