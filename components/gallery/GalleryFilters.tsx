import React from 'react';
import { Filter, User, Zap } from 'lucide-react';
import { GalleryFiltersModal } from './GalleryFiltersModal';
import type { SortOption, MediaFilter } from '../../types';

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
  onModalOpenChange
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

  return (
    <>
      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3 -mx-1 px-1 overflow-x-auto scrollbar-hide pb-2 md:pb-0">

        {/* Battles - Reste visible */}
        {battleModeEnabled && (
          <button
            onClick={onToggleBattles}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all touch-manipulation active:scale-95 flex-shrink-0 shadow-lg ${
              showBattles
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-xl shadow-pink-900/30 border border-pink-400/50'
                : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-white/5 border border-white/10'
            }`}
            aria-label={showBattles ? 'Masquer les battles' : 'Afficher les battles'}
            aria-expanded={showBattles}
          >
            <Zap className="w-4 h-4" />
            <span>Battles</span>
            {battlesCount > 0 && (
              <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                {battlesCount}
              </span>
            )}
          </button>
        )}

        {/* Find Me - Reste visible */}
        {onFindMeClick && findMeEnabled && (
          <button
            onClick={onFindMeClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all touch-manipulation active:scale-95 flex-shrink-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 text-pink-400 hover:text-pink-300 border border-pink-500/50 shadow-lg shadow-pink-900/10"
            aria-label="Retrouve-moi sur le mur"
            title="Reconnaissance faciale"
          >
            <User className="w-4 h-4" />
            <span>Retrouve-moi</span>
          </button>
        )}
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
      />
    </>
  );
};

