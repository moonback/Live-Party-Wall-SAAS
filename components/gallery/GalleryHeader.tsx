import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft, Camera, Image, Search, X, Filter, CheckSquare, Square, Trash2, Download } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { motion, AnimatePresence } from 'framer-motion';

interface GalleryHeaderProps {
  onBack: () => void;
  onUploadClick: () => void;
  onFiltersClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  isFiltersModalOpen?: boolean;
  selectionMode?: boolean;
  onToggleSelectionMode?: () => void;
  selectedCount?: number;
  onBatchDownload?: () => void;
}

export const GalleryHeader: React.FC<GalleryHeaderProps> = ({
  onBack,
  onUploadClick,
  onFiltersClick,
  searchQuery,
  onSearchChange,
  searchInputRef,
  isFiltersModalOpen = false,
  selectionMode = false,
  onToggleSelectionMode,
  selectedCount = 0,
  onBatchDownload
}) => {
  const isMobile = useIsMobile();
  const internalSearchRef = useRef<HTMLInputElement>(null);
  const searchRef = searchInputRef || internalSearchRef;
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? `bg-slate-900/90 backdrop-blur-xl border-b border-white/10 shadow-2xl ${isMobile ? 'py-2' : 'py-1.5 sm:py-2'}` 
        : `bg-transparent ${isMobile ? 'py-3' : 'py-2.5 sm:py-4 md:py-6'}`
    }`}>
      <div className={`max-w-7xl mx-auto ${isMobile ? 'px-3' : 'px-2 sm:px-4 md:px-6 lg:px-8'}`}>
        <div className={`flex items-center justify-between ${isMobile ? 'gap-2' : 'gap-2 sm:gap-4'}`}>
          {/* Left: Back + Logo */}
          <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-2 sm:gap-3 md:gap-4'}`}>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack} 
              className={`${isMobile ? 'p-2.5 min-w-[44px] min-h-[44px] rounded-xl' : 'p-2 sm:p-2.5 rounded-xl sm:rounded-2xl'} bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group touch-manipulation flex items-center justify-center`}
              aria-label="Retour"
            >
              <ArrowLeft className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4 sm:w-5 sm:h-5'} text-white group-hover:-translate-x-1 transition-transform`} />
            </motion.button>
            
            <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-2 sm:gap-3'}`}>
              <div className={`${isMobile ? 'hidden' : 'hidden sm:flex'} p-2 sm:p-2.5 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 rounded-xl sm:rounded-2xl border border-pink-500/30 shadow-lg`}>
                <Image className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400" />
              </div>
              <div>
                <h1 className={`${isMobile ? 'text-base' : 'text-lg sm:text-xl md:text-2xl'} font-black tracking-tight text-white`}>
                  Le <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-indigo-400">Mur</span>
                </h1>
                {!isMobile && <p className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.2em]">Live Party Wall</p>}
              </div>
            </div>
          </div>

          {/* Center/Right: Actions */}
          <div className={`flex items-center ${isMobile ? 'gap-1.5' : 'gap-1.5 sm:gap-2 md:gap-3'} flex-1 justify-end`}>
            {/* Search Bar (Desktop) */}
            {!isMobile && (
              <div className="relative max-w-xs w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-pink-400 transition-colors pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Rechercher... (Ctrl+K)"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-11 pr-11 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500/30 transition-all shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 min-w-[32px] min-h-[32px] text-slate-400 hover:text-white transition-colors flex items-center justify-center touch-manipulation"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Mobile Search Toggle */}
            {isMobile && (
              <button
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className={`p-2.5 min-w-[44px] min-h-[44px] rounded-xl border transition-all touch-manipulation flex items-center justify-center ${
                  showMobileSearch ? 'bg-pink-500/20 border-pink-500/50 text-pink-400' : 'bg-white/5 border-white/10 text-white'
                }`}
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* Selection Mode Toggle */}
            {onToggleSelectionMode && (
              <button
                onClick={onToggleSelectionMode}
                className={`flex items-center ${isMobile ? 'gap-1.5 p-2.5 min-w-[44px] min-h-[44px] rounded-xl' : 'gap-1.5 sm:gap-2 p-2 sm:p-2.5 md:px-4 md:py-2.5 rounded-xl sm:rounded-2xl'} border transition-all touch-manipulation ${
                  selectionMode 
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' 
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
                title="Mode sélection"
              >
                {selectionMode ? <CheckSquare className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4 sm:w-5 sm:h-5'}`} /> : <Square className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4 sm:w-5 sm:h-5'}`} />}
                <span className="hidden lg:inline font-semibold text-sm">Sélectionner</span>
              </button>
            )}

            {/* Filters Button */}
            <button
              onClick={onFiltersClick}
              className={`${isMobile ? 'p-2.5 min-w-[44px] min-h-[44px] rounded-xl' : 'p-2 sm:p-2.5 md:px-4 md:py-2.5 rounded-xl sm:rounded-2xl'} border transition-all flex items-center ${isMobile ? 'justify-center' : 'gap-1.5 sm:gap-2'} touch-manipulation ${
                isFiltersModalOpen
                  ? 'bg-pink-500/20 border-pink-500/50 text-pink-400'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Filter className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4 sm:w-5 sm:h-5'}`} />
              <span className="hidden lg:inline font-semibold text-sm">Filtres</span>
            </button>

            {/* Upload Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onUploadClick}
              className={`bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white ${isMobile ? 'p-2.5 min-w-[44px] min-h-[44px] rounded-xl' : 'p-2 sm:p-2.5 md:px-5 md:py-2.5 rounded-xl sm:rounded-2xl'} font-bold transition-all shadow-lg shadow-pink-500/20 flex items-center ${isMobile ? 'justify-center' : 'gap-1.5 sm:gap-2'} touch-manipulation`}
            >
              <Camera className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4 sm:w-5 sm:h-5'}`} />
              <span className="hidden md:inline">Publier</span>
            </motion.button>
          </div>
        </div>

        {/* Mobile Search Bar Expandable */}
        <AnimatePresence>
          {isMobile && showMobileSearch && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-3"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Rechercher une photo..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 bg-white/5 border border-white/10 rounded-xl text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 min-h-[48px]"
                />
                <button
                  onClick={() => setShowMobileSearch(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 min-w-[40px] min-h-[40px] text-slate-400 touch-manipulation flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Batch Actions Bar */}
        <AnimatePresence>
          {selectionMode && selectedCount > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className={`${isMobile ? 'mt-3' : 'mt-2 sm:mt-4'} flex items-center justify-between bg-indigo-500/10 border border-indigo-500/30 ${isMobile ? 'rounded-xl p-3' : 'rounded-xl sm:rounded-2xl p-2.5 sm:p-3 md:px-6'}`}
            >
              <p className={`text-indigo-300 font-bold ${isMobile ? 'text-sm' : 'text-xs sm:text-sm'}`}>
                {selectedCount} élément{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
              </p>
              <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-1.5 sm:gap-2'}`}>
                {onBatchDownload && (
                  <button
                    onClick={onBatchDownload}
                    className={`${isMobile ? 'p-2.5 min-h-[44px] rounded-xl' : 'p-1.5 sm:p-2 rounded-lg sm:rounded-xl'} hover:bg-white/10 text-white transition-colors flex items-center ${isMobile ? 'gap-2' : 'gap-1.5 sm:gap-2'} ${isMobile ? 'text-sm' : 'text-xs sm:text-sm'} font-medium touch-manipulation`}
                  >
                    <Download className={`${isMobile ? 'w-5 h-5' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} text-indigo-400`} />
                    <span className="hidden sm:inline">Télécharger</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

