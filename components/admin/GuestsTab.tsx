import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Users, Camera, Heart, Trash2, CheckCircle2 } from 'lucide-react';
import { Guest } from '../../types';
import { GuestGridSkeleton, StatsGridSkeleton } from './SkeletonLoaders';

interface GuestStats {
  photosCount: number;
  totalLikes: number;
  totalReactions: number;
}

interface GuestsTabProps {
  guests: Guest[];
  loading: boolean;
  guestStats: Map<string, GuestStats>;
  onRefresh: () => void;
  onDelete: (guest: Guest) => void;
}

export const GuestsTab: React.FC<GuestsTabProps> = ({
  guests,
  loading,
  guestStats,
  onRefresh,
  onDelete
}) => {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  const totalPhotos = Array.from(guestStats.values()).reduce((sum, stats) => sum + stats.photosCount, 0);
  const totalLikes = Array.from(guestStats.values()).reduce((sum, stats) => sum + stats.totalLikes, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5 md:space-y-6">
      {/* Header avec statistiques */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
        className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-slate-800"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-100 mb-1 flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-400 flex-shrink-0" />
              <span className="truncate">Invités connectés</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Gérez tous les invités qui ont créé un profil
            </p>
          </div>
          <motion.button
            whileHover={!prefersReducedMotion ? { scale: 1.02 } : {}}
            whileTap={!prefersReducedMotion ? { scale: 0.98 } : {}}
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-900/50 hover:bg-slate-800/50 rounded-lg transition-colors text-sm text-slate-300 border border-slate-800 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex-shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
            <span className="sm:hidden">Rafraîchir</span>
          </motion.button>
        </div>

        {/* Statistiques globales */}
        <AnimatePresence mode="wait">
          {loading ? (
            <StatsGridSkeleton count={3} />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: prefersReducedMotion ? 0 : 0.3 }}
                className="bg-slate-950/50 rounded-lg p-3 sm:p-4 border border-slate-800"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-teal-500/10 rounded-lg border border-teal-500/20 flex-shrink-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-semibold text-slate-100">{guests.length}</p>
                    <p className="text-xs text-slate-400">Total invités</p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: prefersReducedMotion ? 0 : 0.3 }}
                className="bg-slate-950/50 rounded-lg p-3 sm:p-4 border border-slate-800"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20 flex-shrink-0">
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-semibold text-slate-100">{totalPhotos}</p>
                    <p className="text-xs text-slate-400">Photos totales</p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: prefersReducedMotion ? 0 : 0.3 }}
                className="bg-slate-950/50 rounded-lg p-3 sm:p-4 border border-slate-800"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-pink-500/10 rounded-lg border border-pink-500/20 flex-shrink-0">
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-semibold text-slate-100">{totalLikes}</p>
                    <p className="text-xs text-slate-400">Likes total</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Liste des invités */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          >
            <GuestGridSkeleton count={6} />
          </motion.div>
        ) : guests.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-8 sm:p-12 border border-slate-800 text-center"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            >
              <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-slate-600" />
            </motion.div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-100 mb-2">Aucun invité</h3>
            <p className="text-xs sm:text-sm text-slate-400">Aucun invité n'a encore créé de profil.</p>
          </motion.div>
        ) : (
          <motion.div
            key="guests"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
          >
            {guests.map((guest, index) => {
              const stats = guestStats.get(guest.id) || { photosCount: 0, totalLikes: 0, totalReactions: 0 };
              const joinDate = new Date(guest.createdAt);
              
              return (
                <motion.div
                  key={guest.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.3,
                    delay: index * 0.05,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  whileHover={!prefersReducedMotion ? { y: -2, scale: 1.01 } : {}}
                  className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-slate-800 hover:border-slate-700 transition-all shadow-md hover:shadow-lg"
                >
                  {/* Header avec avatar et nom */}
                  <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src={guest.avatarUrl}
                        alt={guest.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-teal-500/30"
                      />
                      {stats.photosCount > 0 && (
                        <div className="absolute -bottom-1 -right-1 bg-indigo-600 rounded-full p-1 border-2 border-slate-900">
                          <Camera className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-slate-100 truncate mb-1">
                        {guest.name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Inscrit le {joinDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <motion.button
                      whileHover={!prefersReducedMotion ? { scale: 1.1 } : {}}
                      whileTap={!prefersReducedMotion ? { scale: 0.9 } : {}}
                      onClick={() => onDelete(guest)}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-slate-400 hover:text-red-400 flex-shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Supprimer l'invité"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>

                  {/* Statistiques */}
                  <div className="grid grid-cols-3 gap-2 mb-3 sm:mb-4">
                    <div className="bg-slate-950/50 rounded-lg p-2 sm:p-3 text-center border border-slate-800">
                      <p className="text-base sm:text-lg font-semibold text-slate-100">{stats.photosCount}</p>
                      <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Photos</p>
                    </div>
                    <div className="bg-slate-950/50 rounded-lg p-2 sm:p-3 text-center border border-slate-800">
                      <p className="text-base sm:text-lg font-semibold text-pink-400">{stats.totalLikes}</p>
                      <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Likes</p>
                    </div>
                    <div className="bg-slate-950/50 rounded-lg p-2 sm:p-3 text-center border border-slate-800">
                      <p className="text-base sm:text-lg font-semibold text-purple-400">{stats.totalReactions}</p>
                      <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Réactions</p>
                    </div>
                  </div>

                  {/* Badge si actif */}
                  {stats.photosCount > 0 && (
                    <div className="flex items-center gap-2 text-xs text-teal-400 bg-teal-500/10 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 border border-teal-500/20">
                      <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">Actif sur le mur</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

