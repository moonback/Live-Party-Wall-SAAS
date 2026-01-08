import React from 'react';
import { Filter, User, Zap, Trophy, LayoutGrid, Calendar } from 'lucide-react';
import { GalleryFiltersModal } from './GalleryFiltersModal';
import type { SortOption, MediaFilter, Photo } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

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
  videoEnabled = true
}) => {
  const [internalIsModalOpen, setInternalIsModalOpen] = React.useState(false);
  const isModalOpen = externalIsModalOpen !== undefined ? externalIsModalOpen : internalIsModalOpen;
  const setIsModalOpen = onModalOpenChange || setInternalIsModalOpen;

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
      <div className="flex flex-wrap items-center gap-3 px-1 py-4 overflow-x-auto scrollbar-hide">
        {/* Quick Filter: Media Type */}
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
          {[
            { id: 'all', icon: LayoutGrid, label: 'Tout' },
            { id: 'photo', icon: User, label: 'Photos' },
            ...(videoEnabled ? [{ id: 'video', icon: Zap, label: 'Vidéos' }] : [])
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onMediaFilterChange(item.id as MediaFilter)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                mediaFilter === item.id 
                  ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Battles Toggle */}
        {battleModeEnabled && (
          <button
            onClick={onToggleBattles}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
              showBattles
                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Battles</span>
            {battlesCount > 0 && (
              <span className="bg-indigo-500 text-white px-1.5 py-0.5 rounded-full text-[9px] font-black">
                {battlesCount}
              </span>
            )}
          </button>
        )}

        {/* Leaderboard Toggle */}
        <button
          onClick={onToggleLeaderboard}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
            showLeaderboard
              ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Classement</span>
        </button>

        {/* Find Me */}
        {onFindMeClick && findMeEnabled && (
          <button
            onClick={onFindMeClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all bg-gradient-to-r from-pink-500/10 to-purple-500/10 hover:from-pink-500/20 hover:to-purple-500/20 text-pink-400 border border-pink-500/30"
          >
            <User className="w-4 h-4" />
            <span>Retrouve-moi</span>
          </button>
        )}

        {/* Active Filter Chips */}
        <AnimatePresence>
          {selectedAuthors.map(author => (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              key={author}
              onClick={() => onSelectedAuthorsChange(selectedAuthors.filter(a => a !== author))}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-400 text-[10px] font-bold uppercase tracking-tight"
            >
              {author}
              <X className="w-3 h-3" />
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

