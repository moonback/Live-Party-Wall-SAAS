import React, { useMemo } from 'react';
import { SortOption, MediaFilter, Photo } from '../../types';
import { Clock, Sparkles, Trophy, Image, Video, Filter, X, User, XCircle, Search, LayoutGrid } from 'lucide-react';
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

  return (
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
          <div className={`fixed inset-0 z-[101] pointer-events-none ${
            isMobile 
              ? 'flex items-end justify-center p-0' 
              : 'flex items-center justify-center p-4 md:p-6'
          }`}>
            <motion.div
              initial={isMobile ? { y: '100%' } : { scale: 0.9, opacity: 0, y: 0 }}
              animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1, y: 0 }}
              exit={isMobile ? { y: '100%' } : { scale: 0.9, opacity: 0, y: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`w-full bg-slate-900 border border-white/10 shadow-2xl pointer-events-auto overflow-hidden flex flex-col ${
                isMobile 
                  ? 'max-w-full rounded-t-[2.5rem] max-h-[80vh]' 
                  : 'max-w-2xl rounded-[2.5rem] max-h-[80vh] my-auto'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 md:p-8 border-b border-white/5 bg-gradient-to-r from-pink-500/5 to-purple-500/5 flex-shrink-0">
                <div>
                  <h2 className="text-xl md:text-3xl font-black text-white">Filtres</h2>
                  <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-0.5 md:mt-1 hidden md:block">Personnalisez votre vue</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl transition-all active:scale-95"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                {/* Media Type */}
                <section>
                  <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Contenu</h3>
                  <div className={`grid ${videoEnabled ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
                    {[
                      { id: 'all', icon: LayoutGrid, label: 'Tout' },
                      { id: 'photo', icon: Image, label: 'Photos' },
                      ...(videoEnabled ? [{ id: 'video', icon: Video, label: 'Vidéos' }] : [])
                    ].map(item => (
                      <button
                        key={item.id}
                        onClick={() => onMediaFilterChange(item.id as MediaFilter)}
                        className={`flex flex-col items-center gap-3 p-4 rounded-3xl border transition-all ${
                          mediaFilter === item.id 
                            ? 'bg-pink-500/10 border-pink-500/50 text-pink-400 shadow-lg shadow-pink-500/10' 
                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10'
                        }`}
                      >
                        <item.icon className="w-6 h-6" />
                        <span className="text-xs font-bold">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Sort Order */}
                <section>
                  <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Tri</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'recent', icon: Clock, label: 'Plus récents', desc: 'Dernières photos partagées' },
                      { id: 'popular', icon: Sparkles, label: 'Plus populaires', desc: 'Photos les plus likées' }
                    ].map(item => (
                      <button
                        key={item.id}
                        onClick={() => onSortChange(item.id as SortOption)}
                        className={`flex items-start gap-4 p-4 rounded-3xl border text-left transition-all ${
                          sortBy === item.id 
                            ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400 shadow-lg shadow-indigo-500/10' 
                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10'
                        }`}
                      >
                        <div className={`p-2.5 rounded-2xl ${sortBy === item.id ? 'bg-indigo-500/20' : 'bg-white/5'}`}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-tight">{item.label}</p>
                          <p className="text-[10px] opacity-60 mt-0.5">{item.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Authors */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Auteurs</h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input 
                        type="text"
                        placeholder="Rechercher..."
                        value={authorSearch}
                        onChange={(e) => setAuthorSearch(e.target.value)}
                        className="bg-white/5 border border-white/5 rounded-full pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-pink-500/50"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1 scrollbar-hide">
                    {uniqueAuthors.map(author => (
                      <button
                        key={author}
                        onClick={() => toggleAuthor(author)}
                        className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all ${
                          selectedAuthors.includes(author)
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white border-none shadow-lg shadow-pink-500/20'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {author}
                      </button>
                    ))}
                    {uniqueAuthors.length === 0 && (
                      <p className="text-slate-600 text-xs italic py-4 w-full text-center">Aucun auteur trouvé</p>
                    )}
                  </div>
                </section>
              </div>

              {/* Footer */}
              <div className="p-6 md:p-8 bg-slate-950/50 border-t border-white/5 flex items-center justify-between gap-4">
                <button
                  onClick={clearAllFilters}
                  disabled={!hasActiveFilters}
                  className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-pink-400 uppercase tracking-widest disabled:opacity-30 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                  Réinitialiser
                </button>
                <button
                  onClick={onClose}
                  className="px-8 py-4 bg-white text-slate-900 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-pink-500 hover:text-white transition-all shadow-xl active:scale-95"
                >
                  Appliquer
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

