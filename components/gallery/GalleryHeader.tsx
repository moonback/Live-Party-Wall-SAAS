import React, { useRef, useEffect } from 'react';
import { ArrowLeft, Camera, Image, Search, X, Filter } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

interface GalleryHeaderProps {
  onBack: () => void;
  onUploadClick: () => void;
  onFiltersClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  isFiltersModalOpen?: boolean;
}

export const GalleryHeader: React.FC<GalleryHeaderProps> = ({
  onBack,
  onUploadClick,
  onFiltersClick,
  searchQuery,
  onSearchChange,
  searchInputRef,
  isFiltersModalOpen = false
}) => {
  const isMobile = useIsMobile();
  const internalSearchRef = useRef<HTMLInputElement>(null);
  const searchRef = searchInputRef || internalSearchRef;
  const [showMobileSearch, setShowMobileSearch] = React.useState(false);

  // Focus sur la recherche avec Ctrl/Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isMobile) {
          setShowMobileSearch(true);
          setTimeout(() => searchRef.current?.focus(), 100);
        } else {
          searchRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchRef, isMobile]);

  // Fermer la recherche mobile quand on efface le texte
  useEffect(() => {
    if (searchQuery === '' && showMobileSearch) {
      // Ne pas fermer automatiquement, laisser l'utilisateur fermer manuellement
    }
  }, [searchQuery, showMobileSearch]);

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-b from-slate-900/98 via-slate-900/95 to-slate-900/98 backdrop-blur-xl border-b border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-3 md:px-6 lg:px-8 py-4 md:py-5">
        {/* Top Row - Logo, Navigation, Actions */}
        <div className="flex items-center justify-between gap-4 mb-4">
          {/* Left: Back + Logo */}
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={onBack} 
              className="relative min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-3 sm:p-2.5 -ml-2 active:scale-95 touch-manipulation hover:bg-white/10 active:bg-white/5 rounded-xl transition-all duration-300 group border border-white/10 hover:border-pink-500/30 flex items-center justify-center"
              aria-label="Retour"
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/0 to-purple-500/0 group-hover:from-pink-500/20 group-hover:to-purple-500/20 transition-all duration-300 blur-sm" />
              <ArrowLeft className="relative w-5 h-5 text-white group-hover:-translate-x-0.5 transition-transform duration-300" />
            </button>
            
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 rounded-xl border border-pink-500/30 shadow-lg">
                <Image className="w-5 h-5 md:w-6 md:h-6 text-pink-400" />
              </div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400">
                Le Mur
              </h1>
            </div>
          </div>

          {/* Right: Search + Filters + Upload (Desktop) */}
          <div className="hidden md:flex items-center gap-3 flex-1 max-w-md ml-auto">
            {/* Barre de recherche - Enhanced */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Rechercher... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-11 pr-11 py-3 bg-slate-900/60 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 active:scale-90 touch-manipulation text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  aria-label="Effacer la recherche"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtres Button - Desktop */}
            <button
              onClick={onFiltersClick}
              className={`relative flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-pink-900/20 hover:scale-105 active:scale-95 ${
                isFiltersModalOpen
                  ? 'bg-gradient-to-r from-pink-500/40 to-purple-500/40 text-pink-300 border-2 border-pink-500/70'
                  : 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 text-pink-400 hover:text-pink-300 border border-pink-500/50'
              }`}
              aria-label={isFiltersModalOpen ? 'Fermer les filtres' : 'Ouvrir les filtres'}
              title="Filtres & Options"
            >
              <Filter className="w-5 h-5" />
              <span className="hidden lg:inline">Filtres</span>
            </button>

            {/* Upload Button - Desktop */}
            <button
              onClick={onUploadClick}
              className="relative flex items-center gap-2.5 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:via-purple-500 hover:to-indigo-500 text-white px-5 py-3 rounded-xl font-semibold transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-pink-900/40 hover:scale-105 active:scale-95 overflow-hidden group"
              aria-label="Envoyer une photo"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <Camera className="relative w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span className="relative">Publier</span>
            </button>
          </div>

          {/* Mobile: Search + Filters + Upload Buttons */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="min-w-[44px] min-h-[44px] p-3 active:scale-95 touch-manipulation hover:bg-white/10 rounded-xl transition-all border border-white/10 flex items-center justify-center"
              aria-label={showMobileSearch ? 'Masquer la recherche' : 'Afficher la recherche'}
            >
              <Search className={`w-5 h-5 ${showMobileSearch ? 'text-pink-400' : 'text-white'}`} />
            </button>
            <button
              onClick={onFiltersClick}
              className={`min-w-[44px] min-h-[44px] p-3 active:scale-95 touch-manipulation hover:bg-white/10 rounded-xl transition-all border flex items-center justify-center ${
                isFiltersModalOpen
                  ? 'border-pink-500/50 bg-pink-500/20'
                  : 'border-white/10'
              }`}
              aria-label={isFiltersModalOpen ? 'Fermer les filtres' : 'Ouvrir les filtres'}
            >
              <Filter className={`w-5 h-5 ${isFiltersModalOpen ? 'text-pink-300' : 'text-pink-400'}`} />
            </button>
            <button
              onClick={onUploadClick}
              className="min-w-[44px] min-h-[44px] p-3 -mr-2 active:scale-95 touch-manipulation hover:bg-white/10 rounded-xl transition-all border border-white/10 flex items-center justify-center"
              aria-label="Envoyer une photo"
            >
              <Camera className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Mobile: Search Bar - Conditionnelle */}
        {isMobile && showMobileSearch && (
          <div className="relative animate-fade-in">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-11 pr-11 py-3 bg-slate-900/60 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all touch-manipulation shadow-inner"
              autoFocus
            />
            <button
              onClick={() => {
                onSearchChange('');
                setShowMobileSearch(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 active:scale-90 touch-manipulation text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              aria-label="Fermer la recherche"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

