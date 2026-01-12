import React, { useState, useEffect } from 'react';
import { Download, Frame, Palette, Sparkles, User, MessageSquare, Eye, EyeOff } from 'lucide-react';
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
  showFilters,
  showFrames,
  activeFilter,
  activeFrame,
  onFilterChange,
  onFrameChange,
  onToggleFilters,
  onToggleFrames,
  decorativeFrameUrl,
  decorativeFrameEnabled
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
      <div className="hidden sm:flex absolute top-1/3 right-3 sm:right-6 z-50 flex-col gap-2.5 sm:gap-3 animate-fade-in-down -translate-y-1/2">
        {mediaType === 'photo' && (
          <>
            <button 
              onClick={onDownload}
              className="group relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-black/80 backdrop-blur-xl border-2 border-white/30 flex items-center justify-center hover:bg-black/90 hover:border-white/50 hover:scale-110 active:scale-95 transition-all duration-300 text-white touch-manipulation shadow-2xl hover:shadow-pink-500/50"
              title="Télécharger"
              aria-label="Télécharger la photo"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Download className="w-5 h-5 sm:w-6 sm:h-6 relative z-10 transition-transform duration-300 group-hover:scale-110" strokeWidth={2.5} />
            </button>
            <button 
              onClick={onToggleFilters}
              className={`group relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl backdrop-blur-xl border-2 flex items-center justify-center transition-all duration-300 touch-manipulation shadow-2xl hover:shadow-xl hover:scale-110 active:scale-95 ${
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
              <Palette className="w-5 h-5 sm:w-6 sm:h-6 relative z-10 transition-transform duration-300 group-hover:scale-110" strokeWidth={2.5} />
            </button>
            <button 
              onClick={onToggleFrames}
              className={`group relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl backdrop-blur-xl border-2 flex items-center justify-center transition-all duration-300 touch-manipulation shadow-2xl hover:shadow-xl hover:scale-110 active:scale-95 ${
                showFrames 
                  ? 'bg-gradient-to-br from-pink-500 to-pink-600 border-pink-400/70 text-white shadow-pink-500/50' 
                  : 'bg-black/80 border-white/30 text-white hover:bg-black/90 hover:border-white/50'
              }`}
              title="Cadres"
              aria-label="Ouvrir les cadres"
            >
              <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${
                showFrames 
                  ? 'bg-gradient-to-br from-pink-400/20 to-pink-600/20 opacity-100' 
                  : 'bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100'
              }`} />
              <Frame className="w-5 h-5 sm:w-6 sm:h-6 relative z-10 transition-transform duration-300 group-hover:scale-110" strokeWidth={2.5} />
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
        <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-4 landscape:p-1 landscape:sm:p-2">
          {mediaType === 'video' && preview ? (
            <div className="relative w-full h-full max-h-[85vh] landscape:max-h-[90vh] rounded-2xl sm:rounded-3xl landscape:rounded-xl overflow-hidden shadow-2xl border border-white/10">
              <video
                src={preview}
                controls
                className="w-full h-full object-contain"
                autoPlay
                loop
                playsInline
              />
            </div>
          ) : (
            <div className="relative w-full h-full max-h-[85vh] landscape:max-h-[90vh] flex items-center justify-center">
              <div className="relative w-full h-full flex items-center justify-center rounded-2xl sm:rounded-3xl landscape:rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black/20">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="w-full h-full object-contain animate-fade-in"
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
            </div>
          )}
        </div>
        
        {/* Author Name Input - Compact en bas à gauche */}
        {showInputs && (
          <div className={`absolute bottom-[140px] sm:bottom-[100px] landscape:bottom-[100px] landscape:sm:bottom-[80px] left-3 sm:left-4 landscape:left-2 landscape:sm:left-3 z-40 transition-all duration-500 ${
            mounted ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-4 opacity-0 pointer-events-none'
          }`}>
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
          </div>
        )}

        {/* User Description Input - Centré en haut si nécessaire */}
        {showInputs && (
          <div className={`absolute bottom-[140px] sm:bottom-[100px] landscape:bottom-[100px] landscape:sm:bottom-[80px] left-0 w-full px-3 sm:px-4 landscape:px-2 landscape:sm:px-3 flex justify-center z-40 transition-all duration-500 ${
            mounted ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-4 opacity-0 pointer-events-none'
          }`}>
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
          </div>
        )}
      </div>

      {/* Bottom Controls - Design moderne amélioré avec meilleure visibilité mobile */}
      <div className={`absolute bottom-0 left-0 w-full p-3 sm:p-6 landscape:p-2 landscape:sm:p-3 pb-4 sm:pb-8 landscape:pb-2 landscape:sm:pb-3 bg-gradient-to-t from-black via-black/98 to-black/90 flex flex-nowrap sm:flex-wrap landscape:flex-nowrap gap-2 sm:gap-0 landscape:gap-1.5 landscape:sm:gap-2 sm:space-x-3 sm:space-x-4 z-50 transition-all duration-500 delay-200 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} overflow-x-auto sm:overflow-visible`}>
        {/* Bouton pour cacher/afficher les inputs - Toujours visible */}
        <button 
          onClick={() => setShowInputs(!showInputs)}
          className={`group relative flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 landscape:w-10 landscape:h-10 landscape:sm:w-12 landscape:sm:h-12 rounded-2xl landscape:rounded-xl backdrop-blur-xl border-2 flex items-center justify-center transition-all duration-300 touch-manipulation shadow-2xl hover:shadow-xl hover:scale-110 active:scale-95 ${
            showInputs 
              ? 'bg-black/95 border-white/50 text-white hover:bg-black hover:border-white/70' 
              : 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400/90 text-white shadow-blue-500/60'
          }`}
          title={showInputs ? "Masquer les champs" : "Afficher les champs"}
          aria-label={showInputs ? "Masquer les champs" : "Afficher les champs"}
        >
          <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${
            showInputs 
              ? 'bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100' 
              : 'bg-gradient-to-br from-blue-400/20 to-blue-600/20 opacity-100'
          }`} />
          {showInputs ? (
            <EyeOff className="w-5 h-5 sm:w-7 sm:h-7 relative z-10 transition-transform duration-300 group-hover:scale-110" strokeWidth={2.5} />
          ) : (
            <Eye className="w-5 h-5 sm:w-7 sm:h-7 relative z-10 transition-transform duration-300 group-hover:scale-110" strokeWidth={2.5} />
          )}
        </button>
        
        {/* Bouton Télécharger - Visible en mobile dans la barre du bas */}
        {mediaType === 'photo' && (
          <button 
            onClick={onDownload}
            className="group relative flex-shrink-0 w-12 h-12 sm:hidden rounded-2xl bg-black/95 backdrop-blur-xl border-2 border-white/50 flex items-center justify-center hover:bg-black hover:border-white/70 active:scale-95 transition-all duration-300 text-white touch-manipulation shadow-2xl"
            title="Télécharger"
            aria-label="Télécharger la photo"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Download className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:scale-110" strokeWidth={2.5} />
          </button>
        )}
        
        <button
          onClick={onRetake}
          disabled={loading}
          className="group relative flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 landscape:w-10 landscape:h-10 landscape:sm:w-12 landscape:sm:h-12 flex items-center justify-center bg-white/20 backdrop-blur-xl text-white rounded-2xl landscape:rounded-xl font-bold border-2 border-white/40 active:scale-95 transition-all duration-300 hover:bg-white/30 hover:border-white/60 hover:scale-110 touch-manipulation shadow-2xl hover:shadow-pink-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refaire"
          aria-label="Refaire la photo"
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="text-2xl sm:text-3xl relative z-10 transition-transform duration-300 group-hover:rotate-180">↺</span>
        </button>
        
        <button
          onClick={onSubmit}
          disabled={loading}
          className="group relative flex-1 min-w-[120px] sm:min-w-0 landscape:min-w-[100px] landscape:sm:min-w-0 py-4 sm:py-5 landscape:py-2.5 landscape:sm:py-3 bg-gradient-to-r from-pink-600 via-pink-500 to-pink-600 text-white rounded-2xl sm:rounded-3xl landscape:rounded-xl font-bold shadow-[0_0_30px_rgba(219,39,119,0.6)] hover:shadow-[0_0_50px_rgba(219,39,119,0.8)] hover:from-pink-500 hover:via-pink-400 hover:to-pink-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center border-2 border-pink-400/70 touch-manipulation overflow-hidden"
          aria-label={loading ? loadingStep : "Envoyer au mur"}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-pink-400/0 via-pink-300/30 to-pink-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
          
          {loading ? (
            <div className="relative z-10 flex items-center gap-3">
              <svg className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="animate-pulse text-sm sm:text-base font-semibold">{loadingStep}</span>
            </div>
          ) : (
            <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-2.5 landscape:gap-1.5 landscape:sm:gap-2 font-semibold text-sm sm:text-base landscape:text-xs landscape:sm:text-sm">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 landscape:w-3.5 landscape:h-3.5 landscape:sm:w-4 landscape:sm:h-4 animate-pulse" />
              <span className="hidden sm:inline landscape:hidden">ENVOYER AU MUR</span>
              <span className="sm:hidden landscape:inline">ENVOYER</span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
