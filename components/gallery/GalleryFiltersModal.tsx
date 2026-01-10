import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { SortOption, MediaFilter, Photo } from '../../types';
import { Clock, Sparkles, X, XCircle, Search } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { motion, AnimatePresence } from 'framer-motion';

interface GalleryFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  mediaFilter: MediaFilter;
  onMediaFilterChange: (filter: MediaFilter) => void;
  showLeaderboard: boolean;
  onToggleLeaderboard: () => void;
  photos: Photo[];
  selectedAuthors: string[];
  onSelectedAuthorsChange: (authors: string[]) => void;
  videoEnabled?: boolean;
}

export const GalleryFiltersModal: React.FC<GalleryFiltersModalProps> = ({
  isOpen,
  onClose,
  sortBy,
  onSortChange,
  mediaFilter,
  onMediaFilterChange,
  showLeaderboard,
  onToggleLeaderboard,
  photos,
  selectedAuthors,
  onSelectedAuthorsChange,
  videoEnabled = true
}) => {
  const isMobile = useIsMobile();
  const [authorSearch, setAuthorSearch] = React.useState('');

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

  // Empêcher le scroll du body quand le modal est ouvert
  React.useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (typeof window === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100]"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div 
            className={`fixed inset-0 z-[101] pointer-events-none ${
              isMobile 
                ? 'flex items-end justify-center' 
                : 'flex items-center justify-center p-4 md:p-6'
            }`}
          >
            <motion.div
              initial={isMobile ? { y: '100%' } : { scale: 0.9, opacity: 0, y: 0 }}
              animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1, y: 0 }}
              exit={isMobile ? { y: '100%' } : { scale: 0.9, opacity: 0, y: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`w-full bg-slate-900 border border-white/10 shadow-2xl pointer-events-auto overflow-hidden flex flex-col ${
                isMobile 
                  ? 'max-w-full rounded-t-3xl sm:rounded-t-[2.5rem] max-h-[90vh]' 
                  : 'max-w-2xl rounded-[2.5rem] max-h-[80vh] my-auto'
              }`}
            >
              {/* Header */}
              <div className={`flex items-center justify-between ${isMobile ? 'p-4' : 'p-3 sm:p-4 md:p-8'} border-b border-white/5 bg-gradient-to-r from-pink-500/5 to-purple-500/5 flex-shrink-0`}>
                <div>
                  <h2 className={`${isMobile ? 'text-xl' : 'text-lg sm:text-xl md:text-3xl'} font-black text-white`}>Filtres</h2>
                  <p className={`text-slate-400 ${isMobile ? 'text-xs' : 'text-[10px] md:text-xs'} font-bold uppercase tracking-widest ${isMobile ? 'mt-1' : 'mt-0.5 md:mt-1'} ${isMobile ? 'block' : 'hidden md:block'}`}>Personnalisez votre vue</p>
                </div>
                <button
                  onClick={onClose}
                  className={`${isMobile ? 'p-3 min-w-[44px] min-h-[44px] rounded-xl' : 'p-2 sm:p-3 rounded-xl sm:rounded-2xl'} bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-95 touch-manipulation flex items-center justify-center`}
                >
                  <X className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5 sm:w-6 sm:h-6'}`} />
                </button>
              </div>

              {/* Body */}
              <div className={`flex-1 overflow-y-auto ${isMobile ? 'p-4 space-y-6' : 'p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8'}`}>
                {/* Sort Order */}
                <section>
                  <h3 className={`${isMobile ? 'text-sm' : 'text-xs sm:text-sm'} font-black text-slate-500 uppercase tracking-widest ${isMobile ? 'mb-3' : 'mb-3 sm:mb-4'}`}>Tri</h3>
                  <div className={`grid grid-cols-2 ${isMobile ? 'gap-2' : 'gap-2 sm:gap-3'}`}>
                    {[
                      { id: 'recent', icon: Clock, label: 'Plus récents', desc: 'Dernières photos partagées' },
                      { id: 'popular', icon: Sparkles, label: 'Plus populaires', desc: 'Photos les plus likées' }
                    ].map(item => (
                      <button
                        key={item.id}
                        onClick={() => onSortChange(item.id as SortOption)}
                        className={`flex items-start ${isMobile ? 'gap-3 p-3 min-h-[80px] rounded-2xl' : 'gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl sm:rounded-3xl'} border text-left transition-all touch-manipulation ${
                          sortBy === item.id 
                            ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400 shadow-lg shadow-indigo-500/10' 
                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10'
                        }`}
                      >
                        <div className={`${isMobile ? 'p-2 rounded-xl' : 'p-2 sm:p-2.5 rounded-xl sm:rounded-2xl'} ${sortBy === item.id ? 'bg-indigo-500/20' : 'bg-white/5'}`}>
                          <item.icon className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4 sm:w-5 sm:h-5'}`} />
                        </div>
                        <div>
                          <p className={`${isMobile ? 'text-xs' : 'text-[10px] sm:text-xs'} font-black uppercase tracking-tight`}>{item.label}</p>
                          <p className={`${isMobile ? 'text-[10px]' : 'text-[9px] sm:text-[10px]'} opacity-60 mt-0.5`}>{item.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Authors */}
                <section>
                  <div className={`flex items-center justify-between ${isMobile ? 'mb-3' : 'mb-3 sm:mb-4'}`}>
                    <h3 className={`${isMobile ? 'text-sm' : 'text-xs sm:text-sm'} font-black text-slate-500 uppercase tracking-widest`}>Auteurs</h3>
                    <div className="relative">
                      <Search className={`absolute ${isMobile ? 'left-3 w-4 h-4' : 'left-2.5 sm:left-3 w-3 h-3 sm:w-3.5 sm:h-3.5'} top-1/2 -translate-y-1/2 text-slate-500`} />
                      <input 
                        type="text"
                        placeholder="Rechercher..."
                        value={authorSearch}
                        onChange={(e) => setAuthorSearch(e.target.value)}
                        className={`bg-white/5 border border-white/5 rounded-full ${isMobile ? 'pl-10 pr-3 py-2.5 min-h-[44px] text-sm' : 'pl-8 sm:pl-9 pr-3 sm:pr-4 py-1 sm:py-1.5 text-[10px] sm:text-xs'} text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-pink-500/50`}
                      />
                    </div>
                  </div>
                  <div className={`flex flex-wrap ${isMobile ? 'gap-2 max-h-48' : 'gap-1.5 sm:gap-2 max-h-40 sm:max-h-48'} overflow-y-auto p-1 scrollbar-hide`}>
                    {uniqueAuthors.map(author => (
                      <button
                        key={author}
                        onClick={() => toggleAuthor(author)}
                        className={`${isMobile ? 'px-4 py-2.5 min-h-[44px] rounded-xl text-xs' : 'px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs'} font-bold border transition-all touch-manipulation ${
                          selectedAuthors.includes(author)
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white border-none shadow-lg shadow-pink-500/20'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {author}
                      </button>
                    ))}
                    {uniqueAuthors.length === 0 && (
                      <p className={`text-slate-600 ${isMobile ? 'text-sm' : 'text-xs'} italic py-4 w-full text-center`}>Aucun auteur trouvé</p>
                    )}
                  </div>
                </section>
              </div>

              {/* Footer */}
              <div className={`${isMobile ? 'p-4' : 'p-4 sm:p-6 md:p-8'} bg-slate-950/50 border-t border-white/5 flex items-center justify-between ${isMobile ? 'gap-3' : 'gap-3 sm:gap-4'}`}>
                <button
                  onClick={clearAllFilters}
                  disabled={!hasActiveFilters}
                  className={`flex items-center ${isMobile ? 'gap-2 px-3 py-2.5 min-h-[44px] text-xs' : 'gap-1.5 sm:gap-2 text-[10px] sm:text-xs'} font-black text-slate-500 hover:text-pink-400 uppercase tracking-widest disabled:opacity-30 transition-colors touch-manipulation`}
                >
                  <XCircle className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4 sm:w-5 sm:h-5'}`} />
                  <span className="hidden sm:inline">Réinitialiser</span>
                  <span className="sm:hidden">Reset</span>
                </button>
                <button
                  onClick={onClose}
                  className={`${isMobile ? 'px-6 py-3.5 min-h-[48px] rounded-2xl text-sm' : 'px-6 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-3xl text-xs sm:text-sm'} bg-white text-slate-900 font-black uppercase tracking-widest hover:bg-pink-500 hover:text-white transition-all shadow-xl active:scale-95 touch-manipulation`}
                >
                  Appliquer
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

