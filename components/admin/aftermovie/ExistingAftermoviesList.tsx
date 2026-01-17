import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, RefreshCw, Trash2 } from 'lucide-react';
import { PhotoGridSkeleton } from '../SkeletonLoaders';
import { Aftermovie } from '../../../types';

interface ExistingAftermoviesListProps {
  aftermovies: Aftermovie[];
  loading: boolean;
  deletingIds: Set<string>;
  onRefresh: () => void;
  onDelete: (aftermovie: Aftermovie) => void;
}

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const formatDuration = (seconds?: number): string => {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
};

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const ExistingAftermoviesList: React.FC<ExistingAftermoviesListProps> = ({
  aftermovies,
  loading,
  deletingIds,
  onRefresh,
  onDelete
}) => {
  if (aftermovies.length === 0 && !loading) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="mb-4 sm:mb-6 bg-slate-950/50 border border-slate-800 rounded-lg p-3 sm:p-4"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20 flex-shrink-0">
              <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-semibold text-slate-100 truncate">Aftermovies existants</h3>
              <p className="text-[10px] sm:text-xs text-slate-400">
                {loading ? 'Chargement...' : `${aftermovies.length} aftermovie${aftermovies.length > 1 ? 's' : ''} disponible${aftermovies.length > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px] flex-shrink-0"
            title="Actualiser la liste"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
            <span className="sm:hidden">Rafraîchir</span>
          </motion.button>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <PhotoGridSkeleton count={3} />
            </motion.div>
          ) : (
            <motion.div
              key="aftermovies"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3"
            >
              {aftermovies.map((aftermovie, index) => {
                const isDeleting = deletingIds.has(aftermovie.id);
                return (
                  <motion.div
                    key={aftermovie.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    whileHover={{ y: -2, scale: 1.01 }}
                    className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 sm:p-4 hover:border-slate-700 transition-all shadow-md hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-100 truncate mb-1">
                          {aftermovie.title || aftermovie.filename}
                        </h4>
                        <div className="space-y-1 text-xs text-slate-400">
                          {aftermovie.duration_seconds && (
                            <div className="flex items-center gap-1.5">
                              <Video className="w-3 h-3" />
                              <span>{formatDuration(aftermovie.duration_seconds)}</span>
                            </div>
                          )}
                          {aftermovie.file_size && (
                            <div className="flex items-center gap-1.5">
                              <span>{formatFileSize(aftermovie.file_size)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <span>{formatDate(aftermovie.created_at)}</span>
                          </div>
                          {aftermovie.created_by && (
                            <div className="flex items-center gap-1.5">
                              <span>Par {aftermovie.created_by}</span>
                            </div>
                          )}
                          {aftermovie.download_count !== undefined && aftermovie.download_count > 0 && (
                            <div className="flex items-center gap-1.5 text-indigo-400">
                              <span>{aftermovie.download_count} téléchargement{aftermovie.download_count > 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDelete(aftermovie)}
                        disabled={isDeleting}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        title="Supprimer l'aftermovie"
                      >
                        {isDeleting ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <a
                      href={aftermovie.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full px-3 py-2 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-xs font-medium transition-colors text-center"
                    >
                      Voir / Télécharger
                    </a>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

