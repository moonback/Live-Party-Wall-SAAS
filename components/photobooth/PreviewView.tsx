import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Palette, Sparkles, User, MessageSquare, Eye, EyeOff } from 'lucide-react';
import { FilterSelector } from './FilterSelector';
import { FilterType, FrameType } from '../../utils/imageFilters';
import { MAX_AUTHOR_NAME_LENGTH, MAX_USER_DESCRIPTION_LENGTH } from '../../constants';

interface PreviewViewProps {
  preview: string;
  mediaType: 'photo' | 'video';
  authorName: string;
  onAuthorNameChange: (name: string) => void;
  userDescription: string;
  onUserDescriptionChange: (description: string) => void;
  onDownload: () => void;
  onRetake: () => void;
  onSubmit: () => void;
  loading: boolean;
  loadingStep: string;
  uploadProgress?: number;
  showFilters: boolean;
  showFrames: boolean;
  activeFilter: FilterType;
  activeFrame: FrameType;
  onFilterChange: (filter: FilterType) => void;
  onFrameChange: (frame: FrameType) => void;
  onToggleFilters: () => void;
  onToggleFrames: () => void;
  decorativeFrameUrl?: string | null;
  decorativeFrameEnabled?: boolean;
  isLimitReached?: boolean;
}

export const PreviewView: React.FC<PreviewViewProps> = ({
  preview,
  mediaType,
  authorName,
  onAuthorNameChange,
  userDescription,
  onUserDescriptionChange,
  onDownload,
  onRetake,
  onSubmit,
  loading,
  loadingStep,
  uploadProgress = 0,
  showFilters,
  showFrames,
  activeFilter,
  activeFrame,
  onFilterChange,
  onFrameChange,
  onToggleFilters,
  onToggleFrames,
  decorativeFrameUrl,
  decorativeFrameEnabled,
  isLimitReached = false
}) => {
  const [isAuthorNameFocused, setIsAuthorNameFocused] = useState(false);
  const [isDescriptionFocused, setIsDescriptionFocused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showInputs, setShowInputs] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`absolute inset-0 z-10 bg-gradient-to-br from-black via-slate-900 to-black flex flex-col transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {/* Toolbar Top - Visible uniquement en desktop, positionnée plus bas et centrée verticalement */}
      <div className="hidden md:flex absolute top-1/3 right-4 md:right-6 lg:right-8 z-50 flex-col gap-3 md:gap-3.5 lg:gap-4 animate-fade-in-down -translate-y-1/2">
        {mediaType === 'photo' && (
          <>
            <button 
              onClick={onDownload}
              className="group relative w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-2xl bg-black/80 backdrop-blur-xl border-2 border-white/30 flex items-center justify-center hover:bg-black/90 hover:border-white/50 hover:scale-110 active:scale-95 transition-all duration-300 text-white touch-manipulation shadow-2xl hover:shadow-pink-500/50"
              title="Télécharger"
              aria-label="Télécharger la photo"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Download className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 relative z-10 transition-transform duration-300 group-hover:scale-110" strokeWidth={2.5} />
            </button>
            <button 
              onClick={onToggleFilters}
              className={`group relative w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-2xl backdrop-blur-xl border-2 flex items-center justify-center transition-all duration-300 touch-manipulation shadow-2xl hover:shadow-xl hover:scale-110 active:scale-95 ${
                showFilters 
                  ? 'bg-gradient-to-br from-pink-500 to-pink-600 border-pink-400/70 text-white shadow-pink-500/50' 
                  : 'bg-black/80 border-white/30 text-white hover:bg-black/90 hover:border-white/50'
              }`}
              title="Filtres"
              aria-label="Ouvrir les filtres"
            >
              <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${
                showFilters 
                  ? 'bg-gradient-to-br from-pink-400/20 to-pink-600/20 opacity-100' 
                  : 'bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100'
              }`} />
              <Palette className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 relative z-10 transition-transform duration-300 group-hover:scale-110" strokeWidth={2.5} />
            </button>
            
          </>
        )}
      </div>

      <FilterSelector
        showFilters={showFilters}
        showFrames={showFrames}
        activeFilter={activeFilter}
        activeFrame={activeFrame}
        onFilterChange={onFilterChange}
        onFrameChange={onFrameChange}
        onToggleFilters={onToggleFilters}
        onToggleFrames={onToggleFrames}
      />

      {/* Media Preview - Amélioré avec animations */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-gradient-to-br from-slate-900 via-black to-slate-900">
        {/* Progress Bar Overlay */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 md:gap-6"
          >
            <div className="w-full max-w-[280px] xs:max-w-[320px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px] px-4">
              <div className="w-full bg-white/10 rounded-full h-2.5 xs:h-3 sm:h-4 md:h-5 overflow-hidden backdrop-blur-sm border-2 border-white/20 shadow-2xl">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-pink-500 via-pink-400 to-pink-500 rounded-full relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12 animate-shimmer-enhanced" />
                </motion.div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 md:gap-3">
              <div className="flex items-center gap-2 md:gap-3">
                <motion.svg
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="h-5 w-5 xs:h-6 xs:w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </motion.svg>
                <span className="text-xs xs:text-sm sm:text-base md:text-lg font-bold text-white drop-shadow-lg">{loadingStep}</span>
              </div>
              <span className="text-[10px] xs:text-xs sm:text-sm md:text-base text-white/70 font-medium">{uploadProgress}%</span>
            </div>
          </motion.div>
        )}
        <div className="absolute inset-0 flex items-center justify-center p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8 landscape:p-1 landscape:xs:p-1.5 landscape:sm:p-2 landscape:md:p-3">
          {mediaType === 'video' && preview ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full h-full max-h-[85vh] md:max-h-[90vh] landscape:max-h-[90vh] rounded-2xl sm:rounded-3xl md:rounded-[2rem] landscape:rounded-xl overflow-hidden shadow-2xl border border-white/10"
            >
              <video
                src={preview}
                controls
                className="w-full h-full object-contain"
                autoPlay
                loop
                playsInline
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full h-full max-h-[85vh] md:max-h-[90vh] landscape:max-h-[90vh] flex items-center justify-center"
            >
              <div className="relative w-full h-full flex items-center justify-center rounded-2xl sm:rounded-3xl md:rounded-[2rem] landscape:rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black/20">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="w-full h-full object-contain"
                  style={{
                    maxWidth: '100%',
                    height: 'auto'
                  }}
                />
                {decorativeFrameEnabled && decorativeFrameUrl && (
                  <img
                    src={decorativeFrameUrl}
                    alt="Cadre décoratif"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none z-10"
                  />
                )}
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Author Name Input - Compact en bas à gauche */}
        {showInputs && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: -20 }}
            animate={mounted ? { opacity: 1, y: 0, x: 0 } : { opacity: 0, y: 20, x: -20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-[140px] xs:bottom-[130px] sm:bottom-[110px] md:bottom-[100px] landscape:bottom-[100px] landscape:xs:bottom-[90px] landscape:sm:bottom-[80px] landscape:md:bottom-[75px] left-3 xs:left-4 sm:left-5 md:left-6 landscape:left-2 landscape:xs:left-2.5 landscape:sm:left-3 landscape:md:left-4 z-40 pointer-events-auto"
          >
            <div className={`relative transition-all duration-300 ${
              isAuthorNameFocused ? 'scale-105' : 'scale-100'
            }`}>
              <div className={`absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-br from-pink-500/30 via-purple-500/30 to-pink-500/30 blur-xl transition-opacity duration-300 ${
                isAuthorNameFocused ? 'opacity-100' : 'opacity-0'
              }`} />
              <div className="relative bg-black/85 backdrop-blur-xl p-1.5 sm:p-2 landscape:p-1 landscape:sm:p-1.5 rounded-lg sm:rounded-xl landscape:rounded-md border border-white/30 shadow-xl min-w-[140px] sm:min-w-[180px] landscape:min-w-[120px] landscape:sm:min-w-[150px] max-w-[200px] sm:max-w-[250px]">
                <div className="flex items-center gap-1 mb-0.5 landscape:mb-0">
                  <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 landscape:w-2.5 landscape:h-2.5 text-pink-400 flex-shrink-0" />
                  <span className="text-[9px] sm:text-[10px] landscape:text-[8px] landscape:sm:text-[9px] text-white/80 font-semibold truncate">Votre nom</span>
                </div>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => onAuthorNameChange(e.target.value)}
                  onFocus={() => setIsAuthorNameFocused(true)}
                  onBlur={() => setIsAuthorNameFocused(false)}
                  placeholder="Votre nom..."
                  className="w-full text-left font-semibold text-sm sm:text-base landscape:text-xs landscape:sm:text-sm text-white placeholder-white/40 bg-transparent border-none outline-none focus:ring-0 transition-all duration-300 py-0.5 landscape:py-0"
                  maxLength={MAX_AUTHOR_NAME_LENGTH}
                  inputMode="text"
                  aria-label="Nom de l'auteur"
                />
                {authorName.length > 0 && (
                  <div className="text-[8px] sm:text-[9px] landscape:text-[7px] text-white/50 text-left mt-0.5 animate-fade-in font-medium">
                    {authorName.length}/{MAX_AUTHOR_NAME_LENGTH}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* User Description Input - Centré en haut si nécessaire */}
        {showInputs && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-[140px] xs:bottom-[130px] sm:bottom-[110px] md:bottom-[100px] landscape:bottom-[100px] landscape:xs:bottom-[90px] landscape:sm:bottom-[80px] landscape:md:bottom-[75px] left-0 w-full px-3 xs:px-4 sm:px-5 md:px-6 landscape:px-2 landscape:xs:px-2.5 landscape:sm:px-3 landscape:md:px-4 flex justify-center z-40 pointer-events-auto"
          >
            <div className={`relative w-full sm:max-w-md transition-all duration-300 delay-100 ${
              isDescriptionFocused ? 'scale-105' : 'scale-100'
            }`}>
              <div className={`absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500/30 via-purple-500/30 to-blue-500/30 blur-xl transition-opacity duration-300 ${
                isDescriptionFocused ? 'opacity-100' : 'opacity-0'
              }`} />
              <div className="relative bg-black/80 backdrop-blur-2xl p-2 sm:p-2.5 landscape:p-1.5 landscape:sm:p-2 rounded-xl sm:rounded-2xl landscape:rounded-lg w-full border-2 border-white/30 shadow-2xl">
                <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1 landscape:mb-0.5 landscape:gap-1">
                  <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 landscape:w-3 landscape:h-3 text-blue-400" />
                  <span className="text-[10px] sm:text-xs landscape:text-[9px] landscape:sm:text-[10px] text-white/80 font-semibold">Description (optionnel)</span>
                </div>
                <textarea
                  value={userDescription}
                  onChange={(e) => onUserDescriptionChange(e.target.value)}
                  onFocus={() => setIsDescriptionFocused(true)}
                  onBlur={() => setIsDescriptionFocused(false)}
                  placeholder="Ajoutez une description..."
                  className="w-full text-center text-xs sm:text-sm landscape:text-[10px] landscape:sm:text-xs text-white placeholder-white/50 bg-transparent border-none outline-none focus:ring-0 resize-none transition-all duration-300 py-0.5 landscape:py-0"
                  maxLength={MAX_USER_DESCRIPTION_LENGTH}
                  rows={1}
                  style={{ minHeight: '1.5rem', maxHeight: '4rem' }}
                  aria-label="Description de la photo"
                />
                {userDescription.length > 0 && (
                  <div className="text-[10px] sm:text-xs text-white/50 text-center mt-0.5 sm:mt-1 animate-fade-in font-medium">
                    {userDescription.length}/{MAX_USER_DESCRIPTION_LENGTH}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom Controls - Design moderne amélioré avec meilleure visibilité mobile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-0 left-0 w-full px-2 xs:px-3 sm:px-4 md:px-6 py-2 xs:py-2.5 sm:py-4 md:py-5 landscape:px-1.5 landscape:xs:px-2 landscape:sm:px-2.5 landscape:md:px-3 landscape:py-1.5 landscape:xs:py-2 landscape:sm:py-2.5 landscape:md:py-3 bg-gradient-to-t from-black via-black/95 to-black/90 flex items-end gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3 landscape:gap-1 landscape:xs:gap-1.5 landscape:sm:gap-2 landscape:md:gap-2.5 z-50 overflow-x-auto sm:overflow-visible"
      >
        {/* Toggle Inputs */}
        <button
          onClick={() => setShowInputs(!showInputs)}
          className={`group relative flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 landscape:w-8 landscape:h-8 rounded-lg backdrop-blur-xl border flex items-center justify-center transition-all duration-300 shadow-xl hover:shadow-lg hover:scale-105 active:scale-95 ${
            showInputs
              ? 'bg-black/90 border-white/40 text-white hover:bg-black hover:border-white/60'
              : 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400/80 text-white shadow-blue-500/30'
          }`}
          title={showInputs ? "Masquer les champs" : "Afficher les champs"}
          aria-label={showInputs ? "Masquer les champs" : "Afficher les champs"}
        >
          {showInputs ? (
            <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" strokeWidth={2.2} />
          ) : (
            <Eye className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" strokeWidth={2.2} />
          )}
        </button>

        {/* Download button - Mobile only */}
        {mediaType === 'photo' && (
          <button
            onClick={onDownload}
            className="group relative flex-shrink-0 w-10 h-10 sm:hidden rounded-lg bg-black/90 backdrop-blur-xl border border-white/40 flex items-center justify-center hover:bg-black hover:border-white/60 active:scale-95 transition-all duration-300 text-white shadow-xl"
            title="Télécharger"
            aria-label="Télécharger la photo"
          >
            <Download className="w-4 h-4 relative z-10" strokeWidth={2.2} />
          </button>
        )}

        {/* Retake */}
        <button
          onClick={onRetake}
          disabled={loading}
          className="group relative flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 landscape:w-8 landscape:h-8 flex items-center justify-center bg-white/15 text-white rounded-lg font-bold border border-white/30 active:scale-95 transition-all duration-300 hover:bg-white/25 hover:border-white/50 hover:scale-105 shadow-xl hover:shadow-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refaire"
          aria-label="Refaire la photo"
        >
          <span className="text-xl sm:text-2xl relative z-10 group-hover:rotate-180 transition-transform duration-300">↺</span>
        </button>

        {/* Submit */}
        <button
          onClick={onSubmit}
          disabled={loading || isLimitReached}
          className="group relative flex-1 min-w-[70px] sm:min-w-0 py-1.5 sm:py-2 landscape:py-1 landscape:sm:py-1.5 px-2 sm:px-3 landscape:px-1.5 bg-gradient-to-r from-pink-600 via-pink-500 to-pink-600 text-white rounded-lg font-bold shadow-[0_0_10px_rgba(219,39,119,0.4)] hover:shadow-[0_0_12px_rgba(219,39,119,0.6)] hover:from-pink-500 hover:via-pink-400 hover:to-pink-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center border border-pink-400/50 overflow-hidden"
          aria-label={loading ? loadingStep : isLimitReached ? "Limite atteinte" : "Envoyer au mur"}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink-400/0 via-pink-200/20 to-pink-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm pointer-events-none" />
          {loading ? (
            <div className="relative z-10 flex flex-col items-center gap-2 w-full">
              <div className="w-full max-w-[200px] sm:max-w-[250px] bg-white/10 rounded-full h-2 sm:h-2.5 overflow-hidden backdrop-blur-sm border border-white/20">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 via-pink-400 to-pink-500 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                  style={{ width: `${uploadProgress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-shimmer-enhanced" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4 landscape:h-3 landscape:w-3 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="animate-pulse text-[10px] sm:text-xs landscape:text-[9px] font-semibold">{loadingStep}</span>
              </div>
            </div>
          ) : (
            <span className="relative z-10 flex items-center justify-center gap-1 sm:gap-1.5 landscape:gap-1 font-semibold text-[10px] sm:text-xs landscape:text-[9px] landscape:sm:text-[10px]">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 landscape:w-2.5 landscape:h-2.5 animate-pulse" />
              <span className="hidden sm:inline landscape:hidden">ENVOYER AU MUR</span>
              <span className="inline sm:hidden landscape:inline">ENVOYER</span>
            </span>
          )}
        </button>
      </motion.div>
    </div>
  );
};
