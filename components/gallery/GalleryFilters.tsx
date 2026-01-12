import React from 'react';
import { Filter, User, Zap, Trophy, LayoutGrid, Calendar, Video, X } from 'lucide-react';
import { GalleryFiltersModal } from './GalleryFiltersModal';
import type { SortOption, MediaFilter, Photo } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '../../hooks/useIsMobile';

interface GalleryFiltersProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  mediaFilter: MediaFilter;
  onMediaFilterChange: (filter: MediaFilter) => void;
  showLeaderboard: boolean;
  onToggleLeaderboard: () => void;
  showBattles: boolean;
  onToggleBattles: () => void;
  battlesCount: number;
  battleModeEnabled: boolean;
  findMeEnabled?: boolean;
  onFindMeClick?: () => void;
  isModalOpen?: boolean;
  onModalOpenChange?: (open: boolean) => void;
  photos: Photo[];
  selectedAuthors: string[];
  onSelectedAuthorsChange: (authors: string[]) => void;
  videoEnabled?: boolean;
  showAftermovies?: boolean;
  onToggleAftermovies?: () => void;
  aftermoviesCount?: number;
  aftermoviesEnabled?: boolean;
}

export const GalleryFilters: React.FC<GalleryFiltersProps> = ({
  sortBy,
  onSortChange,
  mediaFilter,
  onMediaFilterChange,
  showLeaderboard,
  onToggleLeaderboard,
  showBattles,
  onToggleBattles,
  battlesCount,
  battleModeEnabled,
  findMeEnabled,
  onFindMeClick,
  isModalOpen: externalIsModalOpen,
  onModalOpenChange,
  photos,
  selectedAuthors,
  onSelectedAuthorsChange,
  videoEnabled = true,
  showAftermovies = true,
  onToggleAftermovies,
  aftermoviesCount = 0,
  aftermoviesEnabled = false
}) => {
  const [internalIsModalOpen, setInternalIsModalOpen] = React.useState(false);
  const isModalOpen = externalIsModalOpen !== undefined ? externalIsModalOpen : internalIsModalOpen;
  const setIsModalOpen = onModalOpenChange || setInternalIsModalOpen;
  const isMobile = useIsMobile();

  // Fermer le modal avec Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, setIsModalOpen]);

  const activeFiltersCount = (mediaFilter !== 'all' ? 1 : 0) + (sortBy !== 'recent' ? 1 : 0) + selectedAuthors.length;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 px-3 py-3 sm:gap-3 sm:px-2 md:px-1 sm:py-4 overflow-x-auto scrollbar-hide">
        {/* Battles Toggle */}
        {battleModeEnabled && (
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleBattles}
            className={`flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl sm:gap-2 sm:px-4 sm:py-2 sm:rounded-2xl text-xs sm:text-[10px] md:text-xs font-bold transition-all border touch-manipulation flex-shrink-0 relative overflow-hidden ${
              showBattles
                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400 shadow-lg shadow-indigo-500/20'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {showBattles && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
            )}
            <motion.div
              animate={showBattles ? { rotate: [0, 10, -10, 0] } : {}}
              transition={{ duration: 0.5 }}
              className="relative z-10"
            >
              <Zap className="w-4 h-4 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
            </motion.div>
            <span className="relative z-10">Battles</span>
            {battlesCount > 0 && (
              <motion.span 
                className="bg-indigo-500 text-white px-1.5 py-0.5 rounded-full text-[9px] sm:px-1 md:px-1.5 sm:text-[8px] md:text-[9px] font-black relative z-10"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                {battlesCount}
              </motion.span>
            )}
          </motion.button>
        )}

        {/* Leaderboard Toggle - Optimisé pour tenir sur une ligne */}
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleLeaderboard}
          className={`flex items-center ${isMobile ? 'gap-1 px-2.5 py-2 min-h-[44px] rounded-xl' : 'gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl'} ${isMobile ? 'text-[11px]' : 'text-[10px] sm:text-xs'} font-bold transition-all border touch-manipulation flex-shrink-0 relative overflow-hidden ${
            showLeaderboard
              ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500 shadow-lg shadow-yellow-500/20'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          {showLeaderboard && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          )}
          <motion.div
            animate={showLeaderboard ? { rotate: [0, -15, 15, 0] } : {}}
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </motion.div>
          <span className="whitespace-nowrap relative z-10">Classement</span>
        </motion.button>

        {/* Aftermovies Toggle - Optimisé pour tenir sur une ligne */}
        {aftermoviesEnabled && onToggleAftermovies && (
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleAftermovies}
            className={`flex items-center gap-1 px-2.5 py-2 min-h-[44px] rounded-xl sm:gap-1.5 sm:px-3 sm:py-2.5 sm:rounded-2xl text-[11px] sm:text-[10px] md:text-xs font-bold transition-all border touch-manipulation flex-shrink-0 relative overflow-hidden ${
              showAftermovies
                ? 'bg-purple-500/20 border-purple-500/50 text-purple-400 shadow-lg shadow-purple-500/20'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {showAftermovies && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
            )}
            <motion.div
              animate={showAftermovies ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.5 }}
              className="relative z-10"
            >
              <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </motion.div>
            <span className="whitespace-nowrap relative z-10">Aftermovies</span>
            {aftermoviesCount > 0 && (
              <motion.span 
                className="bg-purple-500 text-white px-1 py-0.5 rounded-full text-[8px] sm:px-1.5 sm:text-[9px] font-black ml-0.5 relative z-10"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                {aftermoviesCount}
              </motion.span>
            )}
          </motion.button>
        )}

        {/* Find Me */}
        {onFindMeClick && findMeEnabled && (
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onFindMeClick}
            className="flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl sm:gap-2 sm:px-4 sm:py-2 sm:rounded-2xl text-xs sm:text-[10px] md:text-xs font-bold transition-all bg-gradient-to-r from-pink-500/10 to-purple-500/10 hover:from-pink-500/20 hover:to-purple-500/20 text-pink-400 border border-pink-500/30 touch-manipulation flex-shrink-0 relative overflow-hidden group"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-pink-500/30 group-hover:via-purple-500/30 group-hover:to-pink-500/30"
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
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="relative z-10"
            >
              <User className="w-4 h-4 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
            </motion.div>
            <span className="relative z-10">Retrouve-moi</span>
          </motion.button>
        )}

        {/* Active Filter Chips */}
        <AnimatePresence>
          {selectedAuthors.map(author => (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.9 }}
            key={author}
            onClick={() => onSelectedAuthorsChange(selectedAuthors.filter(a => a !== author))}
            className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl sm:gap-2 sm:px-2.5 md:px-3 sm:py-1.5 md:py-2 sm:rounded-lg md:rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs sm:text-[9px] md:text-[10px] font-bold uppercase tracking-tight touch-manipulation flex-shrink-0 relative overflow-hidden group shadow-lg shadow-pink-500/10"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-pink-500/20"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
            <span className="relative z-10">{author}</span>
            <motion.div
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.2 }}
              className="relative z-10"
            >
              <X className="w-3.5 h-3.5 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3" />
            </motion.div>
          </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal de filtres */}
      <GalleryFiltersModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sortBy={sortBy}
        onSortChange={onSortChange}
        mediaFilter={mediaFilter}
        onMediaFilterChange={onMediaFilterChange}
        showLeaderboard={showLeaderboard}
        onToggleLeaderboard={onToggleLeaderboard}
        photos={photos}
        selectedAuthors={selectedAuthors}
        onSelectedAuthorsChange={onSelectedAuthorsChange}
        videoEnabled={videoEnabled}
      />
    </>
  );
};

