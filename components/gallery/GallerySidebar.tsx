import React, { useState, useMemo } from 'react';
import { 
  Filter, 
  User, 
  Zap, 
  Trophy, 
  Video, 
  Grid3x3, 
  List, 
  LayoutGrid as MasonryIcon, 
  Film,
  X,
  Search,
  Clock,
  Sparkles,
  Image as ImageIcon,
  XCircle,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import type { SortOption, MediaFilter, Photo, GalleryViewMode } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '../../hooks/useIsMobile';

interface GallerySidebarProps {
  // Tri et filtres
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  mediaFilter: MediaFilter;
  onMediaFilterChange: (filter: MediaFilter) => void;
  photos: Photo[];
  selectedAuthors: string[];
  onSelectedAuthorsChange: (authors: string[]) => void;
  videoEnabled?: boolean;
  
  // Battles
  showBattles: boolean;
  onToggleBattles: () => void;
  battlesCount: number;
  battleModeEnabled: boolean;
  
  // Aftermovies
  showAftermovies?: boolean;
  onToggleAftermovies?: () => void;
  aftermoviesCount?: number;
  aftermoviesEnabled?: boolean;
  
  // Leaderboard
  onOpenLeaderboard: () => void;
  
  // Find Me
  findMeEnabled?: boolean;
  onFindMeClick?: () => void;
  
  // View Mode
  viewMode?: GalleryViewMode;
  onViewModeChange?: (mode: GalleryViewMode) => void;
  
  // Recherche (optionnel)
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  
  // État de la sidebar
  isOpen?: boolean;
  onToggle?: () => void;
}

export const GallerySidebar: React.FC<GallerySidebarProps> = ({
  sortBy,
  onSortChange,
  mediaFilter,
  onMediaFilterChange,
  photos,
  selectedAuthors,
  onSelectedAuthorsChange,
  videoEnabled = true,
  showBattles,
  onToggleBattles,
  battlesCount,
  battleModeEnabled,
  showAftermovies = true,
  onToggleAftermovies,
  aftermoviesCount = 0,
  aftermoviesEnabled = false,
  onOpenLeaderboard,
  findMeEnabled,
  onFindMeClick,
  viewMode = 'grid',
  onViewModeChange,
  searchQuery = '',
  onSearchChange,
  isOpen: externalIsOpen,
  onToggle
}) => {
  const isMobile = useIsMobile();
  const [internalIsOpen, setInternalIsOpen] = useState(!isMobile);
  const [authorSearch, setAuthorSearch] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['view', 'filters']));
  
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onToggle ? () => onToggle() : setInternalIsOpen;

  // Fermer avec Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && isMobile) {
        setIsOpen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isMobile, setIsOpen]);

  // Empêcher le scroll du body quand la sidebar est ouverte sur mobile
  React.useEffect(() => {
    if (isOpen && isMobile) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
    return undefined;
  }, [isOpen, isMobile]);

  const uniqueAuthors = useMemo(() => {
    const authorsSet = new Set(photos.map(p => p.author).filter(Boolean));
    const authors = Array.from(authorsSet).sort();
    if (!authorSearch) return authors;
    return authors.filter(a => a.toLowerCase().includes(authorSearch.toLowerCase()));
  }, [photos, authorSearch]);

  const toggleAuthor = (author: string) => {
    if (selectedAuthors.includes(author)) {
      onSelectedAuthorsChange(selectedAuthors.filter(a => a !== author));
    } else {
      onSelectedAuthorsChange([...selectedAuthors, author]);
    }
  };

  const clearAllFilters = () => {
    onSelectedAuthorsChange([]);
    onMediaFilterChange('all');
    onSortChange('recent');
  };

  const hasActiveFilters = selectedAuthors.length > 0 || mediaFilter !== 'all' || sortBy !== 'recent';
  const activeFiltersCount = (mediaFilter !== 'all' ? 1 : 0) + (sortBy !== 'recent' ? 1 : 0) + selectedAuthors.length;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const sidebarContent = (
    <div className="h-full flex flex-col bg-slate-900/95 backdrop-blur-xl border-r border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between p-2.5 sm:p-3 md:p-4 border-b border-white/10 bg-gradient-to-r from-pink-500/5 to-purple-500/5 flex-shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="p-1.5 sm:p-2 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 rounded-lg sm:rounded-xl border border-pink-500/30">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base md:text-lg font-black text-white">Filtres</h2>
            {activeFiltersCount > 0 && (
              <p className="text-[10px] sm:text-xs text-slate-400">{activeFiltersCount} actif{activeFiltersCount > 1 ? 's' : ''}</p>
            )}
          </div>
        </div>
        {isMobile && (
          <button
            onClick={() => setIsOpen()}
            className="p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 md:p-4 space-y-2 sm:space-y-3 scrollbar-hide">
        {/* Recherche (optionnel) */}
        {onSearchChange && (
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-pink-500/30"
            />
          </div>
        )}

        {/* Mode de Vue */}
        {onViewModeChange && (
          <section>
            <button
              onClick={() => toggleSection('view')}
              className="w-full flex items-center justify-between p-1.5 text-left"
            >
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Vue</h3>
              {expandedSections.has('view') ? (
                <ChevronDown className="w-3 h-3 text-slate-400" />
              ) : (
                <ChevronRight className="w-3 h-3 text-slate-400" />
              )}
            </button>
            <AnimatePresence>
              {expandedSections.has('view') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                    {([
                      { mode: 'grid' as GalleryViewMode, icon: Grid3x3, label: 'Grille' },
                      { mode: 'list' as GalleryViewMode, icon: List, label: 'Liste' },
                      ...(isMobile ? [] : [{ mode: 'masonry' as GalleryViewMode, icon: MasonryIcon, label: 'Masonry' }]),
                      { mode: 'carousel' as GalleryViewMode, icon: Film, label: 'Carrousel' }
                    ]).map(({ mode, icon: Icon, label }) => (
                      <motion.button
                        key={mode}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onViewModeChange(mode)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                          viewMode === mode
                            ? 'bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-indigo-500/20 border-pink-500/30 text-pink-400'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[10px] font-bold">{label}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {/* Filtres Rapides */}
        <section>
          <button
            onClick={() => toggleSection('quick')}
            className="w-full flex items-center justify-between p-1.5 text-left"
          >
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Rapides</h3>
            {expandedSections.has('quick') ? (
              <ChevronDown className="w-3 h-3 text-slate-400" />
            ) : (
              <ChevronRight className="w-3 h-3 text-slate-400" />
            )}
          </button>
          <AnimatePresence>
            {expandedSections.has('quick') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-1.5 mt-1.5"
              >
                {/* Battles */}
                {battleModeEnabled && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onToggleBattles}
                    className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all ${
                      showBattles
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">Battles</span>
                    </div>
                    {battlesCount > 0 && (
                      <span className="bg-indigo-500 text-white px-1.5 py-0.5 rounded-full text-[10px] font-black">
                        {battlesCount}
                      </span>
                    )}
                  </motion.button>
                )}

                {/* Aftermovies */}
                {aftermoviesEnabled && onToggleAftermovies && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onToggleAftermovies}
                    className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all ${
                      showAftermovies
                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">Aftermovies</span>
                    </div>
                    {aftermoviesCount > 0 && (
                      <span className="bg-purple-500 text-white px-1.5 py-0.5 rounded-full text-[10px] font-black">
                        {aftermoviesCount}
                      </span>
                    )}
                  </motion.button>
                )}

                {/* Leaderboard */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onOpenLeaderboard}
                  className="w-full flex items-center justify-between p-2 rounded-lg border bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-yellow-400 hover:border-yellow-500/30 transition-all"
                >
                  <div className="flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">Classement</span>
                  </div>
                </motion.button>

                {/* Find Me */}
                {onFindMeClick && findMeEnabled && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onFindMeClick}
                    className="w-full flex items-center gap-1.5 p-2 rounded-lg border bg-gradient-to-r from-pink-500/10 to-purple-500/10 hover:from-pink-500/20 hover:to-purple-500/20 text-pink-400 border-pink-500/30 transition-all"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">Retrouve-moi</span>
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Filtres Avancés */}
        <section>
          <button
            onClick={() => toggleSection('filters')}
            className="w-full flex items-center justify-between p-1.5 text-left"
          >
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Avancés</h3>
            {expandedSections.has('filters') ? (
              <ChevronDown className="w-3 h-3 text-slate-400" />
            ) : (
              <ChevronRight className="w-3 h-3 text-slate-400" />
            )}
          </button>
          <AnimatePresence>
            {expandedSections.has('filters') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-2.5 mt-1.5"
              >
                {/* Tri */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 mb-1.5">Tri</h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'recent' as SortOption, icon: Clock, label: 'Récent' },
                      { id: 'popular' as SortOption, icon: Sparkles, label: 'Populaire' }
                    ].map(({ id, icon: Icon, label }) => (
                      <motion.button
                        key={id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSortChange(id)}
                        className={`flex items-center gap-1.5 p-2 rounded-lg border transition-all ${
                          sortBy === id
                            ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold">{label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Type de Média */}
                {videoEnabled && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 mb-1.5">Type</h4>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'all' as MediaFilter, icon: Grid3x3, label: 'Tous' },
                        { id: 'photo' as MediaFilter, icon: ImageIcon, label: 'Photos' },
                        { id: 'video' as MediaFilter, icon: Video, label: 'Vidéos' }
                      ].map(({ id, icon: Icon, label }) => (
                        <motion.button
                          key={id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onMediaFilterChange(id)}
                          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg border transition-all ${
                            mediaFilter === id
                              ? 'bg-pink-500/10 border-pink-500/50 text-pink-400'
                              : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-bold">{label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Auteurs */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-[10px] font-bold text-slate-400">Auteurs</h4>
                    <div className="relative">
                      <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="..."
                        value={authorSearch}
                        onChange={(e) => setAuthorSearch(e.target.value)}
                        className="w-20 pl-6 pr-1.5 py-0.5 bg-white/5 border border-white/5 rounded-full text-[9px] text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-pink-500/50"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-0.5 scrollbar-hide">
                    {uniqueAuthors.map((author) => (
                      <motion.button
                        key={author}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleAuthor(author)}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all ${
                          selectedAuthors.includes(author)
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white border-none'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {author}
                      </motion.button>
                    ))}
                    {uniqueAuthors.length === 0 && (
                      <p className="text-slate-600 text-[10px] italic py-1 w-full text-center">Aucun auteur</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Filtres Actifs */}
        {activeFiltersCount > 0 && (
          <section>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Actifs</h3>
              <button
                onClick={clearAllFilters}
                className="text-[10px] text-slate-500 hover:text-pink-400 transition-colors flex items-center gap-0.5"
              >
                <XCircle className="w-2.5 h-2.5" />
                Reset
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedAuthors.map(author => (
                <motion.button
                  key={author}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelectedAuthorsChange(selectedAuthors.filter(a => a !== author))}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-pink-500/10 border border-pink-500/30 text-pink-400 text-[10px] font-bold"
                >
                  <span>{author}</span>
                  <X className="w-2.5 h-2.5" />
                </motion.button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );

  // Desktop : Sidebar fixe avec responsive
  if (!isMobile) {
    return (
      <aside className="w-56 md:w-64 lg:w-72 xl:w-80 flex-shrink-0 h-full border-r border-white/10">
        {sidebarContent}
      </aside>
    );
  }

  // Mobile : Drawer
  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen()}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100]"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-72 sm:w-80 z-[101]"
          >
            {sidebarContent}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

