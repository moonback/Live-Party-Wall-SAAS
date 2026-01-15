import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft, Camera, Search, X, Filter, CheckSquare, Square, Download, Users } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';
import { getStaticAssetPath } from '../../utils/electronPaths';

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
  onParticipantsClick?: () => void;
  onSidebarToggle?: () => void;
  isSidebarOpen?: boolean;
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
  onBatchDownload,
  onParticipantsClick,
  onSidebarToggle,
  isSidebarOpen = false
}) => {
  const isMobile = useIsMobile();
  const internalSearchRef = useRef<HTMLInputElement>(null);
  const searchRef = searchInputRef || internalSearchRef;
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { settings } = useSettings();
  const logoUrl = settings.logo_url || getStaticAssetPath('logo-accueil.png');

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
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`sticky top-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? `bg-slate-900/95 backdrop-blur-2xl border-b border-white/10 shadow-2xl py-2 md:py-1.5` 
          : `bg-transparent py-3 md:py-4 lg:py-6`
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
          {/* Left: Back + Sidebar Toggle + Logo */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <motion.button 
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack} 
              className="p-2.5 min-w-[44px] min-h-[44px] rounded-xl md:p-2 md:rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 group touch-manipulation flex items-center justify-center relative overflow-hidden"
              aria-label="Retour"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 to-purple-500/0 group-hover:from-pink-500/20 group-hover:to-purple-500/20 transition-all duration-300" />
              <ArrowLeft className="w-5 h-5 md:w-4 md:h-4 lg:w-5 lg:h-5 text-white group-hover:text-pink-400 relative z-10 transition-all duration-300" />
            </motion.button>
            
            {/* Sidebar Toggle (Mobile only) */}
            {isMobile && onSidebarToggle && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onSidebarToggle}
                className={`p-2.5 min-w-[44px] min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 border transition-all touch-manipulation flex items-center justify-center ${
                  isSidebarOpen
                    ? 'border-pink-500/50 text-pink-400'
                    : 'border-white/10 text-white'
                }`}
                aria-label="Ouvrir les filtres"
              >
                <Filter className="w-5 h-5" />
              </motion.button>
            )}
            
            <motion.div 
              className="flex items-center gap-2 sm:gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <motion.div 
                className="hidden sm:flex p-1.5 sm:p-2 bg-white/10 rounded-xl sm:rounded-2xl border border-white/20 shadow-lg relative overflow-hidden"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-6 w-auto sm:h-7 sm:w-auto max-w-[60px] sm:max-w-[80px] object-contain relative z-10"
                  loading="lazy"
                />
              </motion.div>
              <div>
                <motion.h1 
                  className="text-base sm:text-lg md:text-xl lg:text-2xl font-black tracking-tight text-white"
                  animate={{ 
                    backgroundPosition: ['0%', '100%', '0%'],
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                  style={{
                    backgroundImage: 'linear-gradient(90deg, #fff, #ec4899, #a855f7, #6366f1, #fff)',
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Mur <motion.span 
                    className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-indigo-400"
                    animate={{ 
                      backgroundPosition: ['0%', '100%', '0%'],
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear'
                    }}
                    style={{
                      backgroundImage: 'linear-gradient(90deg, #ec4899, #a855f7, #6366f1, #ec4899)',
                      backgroundSize: '200% auto',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    Social
                  </motion.span>
                </motion.h1>
                {!isMobile && (
                  <motion.p 
                    className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.2em]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
Votre mur social interactif
                  </motion.p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Center/Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-1 justify-end">
            {/* Participants Button (Desktop) - À gauche de la recherche */}
            {!isMobile && onParticipantsClick && (
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onParticipantsClick}
                className="p-2.5 min-w-[44px] min-h-[44px] rounded-xl md:px-4 md:py-2.5 md:rounded-2xl bg-white/5 hover:bg-indigo-500/10 border border-white/10 hover:border-indigo-500/30 text-slate-400 hover:text-indigo-400 transition-all touch-manipulation flex items-center justify-center gap-2 relative overflow-hidden group"
                title="Voir les participants"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-indigo-500/20 group-hover:via-purple-500/20 group-hover:to-pink-500/20 transition-all duration-300"
                />
                <Users className="w-5 h-5 md:w-4 md:h-4 lg:w-5 lg:h-5 relative z-10" />
                <span className="hidden lg:inline font-semibold text-sm relative z-10">Participants</span>
              </motion.button>
            )}

            {/* Search Bar (Desktop) */}
            {!isMobile && (
              <motion.div 
                className="relative max-w-xs lg:max-w-sm xl:max-w-md w-full group"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                >
                  <Search className="w-4 h-4 sm:w-4 sm:h-4 text-slate-400 group-focus-within:text-pink-400 transition-colors duration-300" />
                </motion.div>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Rechercher... (Ctrl+K)"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-10 sm:pl-11 pr-10 sm:pr-11 py-2 sm:py-2.5 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500/30 transition-all shadow-inner hover:bg-white/10 hover:border-white/20"
                />
                <AnimatePresence>
                  {searchQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      onClick={() => onSearchChange('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 min-w-[32px] min-h-[32px] text-slate-400 hover:text-white transition-colors flex items-center justify-center touch-manipulation rounded-full hover:bg-white/10"
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Participants Button (Mobile) */}
            {isMobile && onParticipantsClick && (
              <button
                onClick={onParticipantsClick}
                className="p-2.5 min-w-[44px] min-h-[44px] rounded-xl border bg-white/5 border-white/10 text-white hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all touch-manipulation flex items-center justify-center"
                title="Voir les participants"
              >
                <Users className="w-5 h-5" />
              </button>
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
                className={`flex items-center gap-1.5 p-2.5 min-w-[44px] min-h-[44px] rounded-xl sm:gap-2 sm:p-2 md:px-4 md:py-2.5 md:rounded-2xl border transition-all touch-manipulation justify-center md:justify-start ${
                  selectionMode 
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' 
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
                title="Mode sélection"
              >
                {selectionMode ? <CheckSquare className="w-5 h-5 md:w-4 md:h-4 lg:w-5 lg:h-5" /> : <Square className="w-5 h-5 md:w-4 md:h-4 lg:w-5 lg:h-5" />}
                <span className="hidden lg:inline font-semibold text-sm">Sélectionner</span>
              </button>
            )}

            {/* Filters Button (Desktop only - Mobile uses Sidebar Toggle) */}
            {!isMobile && (
              <button
                onClick={onFiltersClick}
                className={`p-2.5 min-w-[44px] min-h-[44px] rounded-xl sm:p-2 md:px-4 md:py-2.5 md:rounded-2xl border transition-all flex items-center justify-center sm:gap-1.5 md:gap-2 touch-manipulation ${
                  isFiltersModalOpen
                    ? 'bg-pink-500/20 border-pink-500/50 text-pink-400'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Filter className="w-5 h-5 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                <span className="hidden lg:inline font-semibold text-sm">Filtres</span>
              </button>
            )}

            {/* Upload Button */}
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={onUploadClick}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white p-2.5 min-w-[44px] min-h-[44px] rounded-xl sm:p-2 md:px-5 md:py-2.5 md:rounded-2xl font-bold transition-all shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 flex items-center justify-center sm:gap-1.5 md:gap-2 touch-manipulation relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: 'linear'
                }}
              />
              <Camera className="w-5 h-5 md:w-4 md:h-4 lg:w-5 lg:h-5 relative z-10" />
              <span className="hidden md:inline relative z-10">Publier</span>
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
              className="mt-3 sm:mt-2 md:mt-4 flex items-center justify-between bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-3 sm:rounded-2xl sm:p-2.5 md:p-3 md:px-6"
            >
              <p className="text-indigo-300 font-bold text-sm sm:text-xs md:text-sm">
                {selectedCount} élément{selectedCount > 1 ? 's' : ''} sélectionné à télécharger{selectedCount > 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2 sm:gap-1.5 md:gap-2">
                {onBatchDownload && (
                  <button
                    onClick={onBatchDownload}
                    className="p-2.5 min-h-[44px] rounded-xl sm:p-1.5 sm:rounded-lg md:p-2 md:rounded-xl hover:bg-white/10 text-white transition-colors flex items-center gap-2 sm:gap-1.5 md:gap-2 text-sm sm:text-xs md:text-sm font-medium touch-manipulation"
                  >
                    <Download className="w-5 h-5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-indigo-400" />
                    <span className="hidden sm:inline">Télécharger</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

