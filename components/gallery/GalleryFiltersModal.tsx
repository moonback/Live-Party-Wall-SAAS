import React from 'react';
import { SortOption, MediaFilter } from '../../types';
import { Clock, Sparkles, Trophy, Image, Video, Filter, X } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

interface GalleryFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  mediaFilter: MediaFilter;
  onMediaFilterChange: (filter: MediaFilter) => void;
  showLeaderboard: boolean;
  onToggleLeaderboard: () => void;
}

export const GalleryFiltersModal: React.FC<GalleryFiltersModalProps> = ({
  isOpen,
  onClose,
  sortBy,
  onSortChange,
  mediaFilter,
  onMediaFilterChange,
  showLeaderboard,
  onToggleLeaderboard
}) => {
  const isMobile = useIsMobile();

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={`fixed inset-0 z-[100] flex justify-center p-4 pointer-events-none ${
          isMobile ? 'items-start pt-[100px]' : 'items-center'
        }`}
      >
        <div
          className={`bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-white/10 shadow-2xl w-full max-w-7xl pointer-events-auto animate-scale-in overflow-hidden`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400">
              Filtres & Options
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-all active:scale-95 text-slate-400 hover:text-white"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content - Plus compact sur desktop */}
          <div className={`p-5`}>
            <div
              className={`flex flex-wrap items-center justify-center gap-3 ${
                isMobile
                  ? ''
                  : 'gap-1 [&>button]:px-2 [&>button]:py-2 [&>button>span]:hidden'
              }`}
            >
              {/* Filtre par type */}
              <button
                onClick={() => {
                  onMediaFilterChange('all');
                  onClose();
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all touch-manipulation active:scale-95 relative group ${
                  mediaFilter === 'all'
                    ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white shadow-lg shadow-pink-900/20 border-2 border-pink-500/30'
                    : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 border border-white/10'
                }`}
                aria-label="Tous les médias"
                aria-pressed={mediaFilter === 'all'}
                title="Afficher tous les médias (photos et vidéos)"
              >
                <Filter
                  className={`w-5 h-5 ${mediaFilter === 'all' ? 'text-pink-400' : ''}`}
                />
                <span>Tous</span>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900/95 backdrop-blur-sm text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 border border-white/20 shadow-xl">
                  Afficher tous les médias
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900/95"></div>
                </div>
              </button>
              <button
                onClick={() => {
                  onMediaFilterChange('photo');
                  onClose();
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all touch-manipulation active:scale-95 relative group ${
                  mediaFilter === 'photo'
                    ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white shadow-lg shadow-pink-900/20 border-2 border-pink-500/30'
                    : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 border border-white/10'
                }`}
                aria-label="Photos uniquement"
                aria-pressed={mediaFilter === 'photo'}
                title="Afficher uniquement les photos"
              >
                <Image
                  className={`w-5 h-5 ${mediaFilter === 'photo' ? 'text-pink-400' : ''}`}
                />
                <span>Photos</span>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900/95 backdrop-blur-sm text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 border border-white/20 shadow-xl">
                  Afficher uniquement les photos
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900/95"></div>
                </div>
              </button>
              <button
                onClick={() => {
                  onMediaFilterChange('video');
                  onClose();
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all touch-manipulation active:scale-95 relative group ${
                  mediaFilter === 'video'
                    ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white shadow-lg shadow-pink-900/20 border-2 border-pink-500/30'
                    : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 border border-white/10'
                }`}
                aria-label="Vidéos uniquement"
                aria-pressed={mediaFilter === 'video'}
                title="Afficher uniquement les vidéos"
              >
                <Video
                  className={`w-5 h-5 ${mediaFilter === 'video' ? 'text-pink-400' : ''}`}
                />
                <span>Vidéos</span>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900/95 backdrop-blur-sm text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 border border-white/20 shadow-xl">
                  Afficher uniquement les vidéos
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900/95"></div>
                </div>
              </button>

              {/* Séparateur */}
              <div className="w-px h-8 bg-white/10"></div>

              {/* Tri */}
              <button
                onClick={() => {
                  onSortChange('recent');
                  onClose();
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all touch-manipulation active:scale-95 relative group ${
                  sortBy === 'recent'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white shadow-lg shadow-cyan-900/20 border-2 border-cyan-500/30'
                    : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 border border-white/10'
                }`}
                aria-label="Trier par date récente"
                aria-pressed={sortBy === 'recent'}
                title="Trier par date (plus récentes en premier)"
              >
                <Clock
                  className={`w-5 h-5 ${sortBy === 'recent' ? 'text-cyan-400' : ''}`}
                />
                <span>Récents</span>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900/95 backdrop-blur-sm text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 border border-white/20 shadow-xl">
                  Trier par date (plus récentes en premier)
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900/95"></div>
                </div>
              </button>
              <button
                onClick={() => {
                  onSortChange('popular');
                  onClose();
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all touch-manipulation active:scale-95 relative group ${
                  sortBy === 'popular'
                    ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-white shadow-lg shadow-yellow-900/20 border-2 border-yellow-500/30'
                    : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 border border-white/10'
                }`}
                aria-label="Trier par popularité"
                aria-pressed={sortBy === 'popular'}
                title="Trier par popularité (plus de likes en premier)"
              >
                <Sparkles
                  className={`w-5 h-5 ${sortBy === 'popular' ? 'text-yellow-400' : ''}`}
                />
                <span>Populaires</span>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900/95 backdrop-blur-sm text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 border border-white/20 shadow-xl">
                  Trier par popularité (plus de likes en premier)
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900/95"></div>
                </div>
              </button>

              {/* Séparateur */}
              <div className="w-px h-8 bg-white/10"></div>

              {/* Classement */}
              <button
                onClick={() => {
                  onToggleLeaderboard();
                  onClose();
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all touch-manipulation active:scale-95 relative group ${
                  showLeaderboard
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-xl shadow-yellow-900/30 border-2 border-yellow-400/50'
                    : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 border border-white/10'
                }`}
                aria-label={showLeaderboard ? 'Masquer le classement' : 'Afficher le classement'}
                aria-pressed={showLeaderboard}
                title={showLeaderboard ? 'Masquer le classement des photographes' : 'Afficher le classement des photographes'}
              >
                <Trophy className="w-5 h-5" />
                <span>Classement</span>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900/95 backdrop-blur-sm text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 border border-white/20 shadow-xl">
                  {showLeaderboard ? 'Masquer le classement' : 'Afficher le classement des photographes'}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900/95"></div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

