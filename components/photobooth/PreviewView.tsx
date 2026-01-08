import React from 'react';
import { Download, Frame, Palette } from 'lucide-react';
import { FilterSelector } from './FilterSelector';
import { FilterType, FrameType } from '../../utils/imageFilters';
import { MAX_AUTHOR_NAME_LENGTH } from '../../constants';

interface PreviewViewProps {
  preview: string;
  mediaType: 'photo' | 'video';
  authorName: string;
  onAuthorNameChange: (name: string) => void;
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
  return (
    <div className="absolute inset-0 z-10 bg-black animate-fade-in-up flex flex-col">
      {/* Toolbar Top */}
      <div className="absolute top-14 sm:top-20 right-2 sm:right-4 z-30 flex flex-col gap-2 sm:gap-3">
        {mediaType === 'photo' && (
          <>
            <button 
              onClick={onDownload}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/50 backdrop-blur border border-white/20 flex items-center justify-center hover:bg-black/70 transition-all text-white touch-manipulation"
              title="Télécharger"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button 
              onClick={onToggleFilters}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full backdrop-blur border flex items-center justify-center transition-all touch-manipulation ${
                showFilters ? 'bg-pink-500 border-pink-400 text-white' : 'bg-black/50 border-white/20 text-white hover:bg-black/70'
              }`}
              title="Filtres"
            >
              <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button 
              onClick={onToggleFrames}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full backdrop-blur border flex items-center justify-center transition-all touch-manipulation ${
                showFrames ? 'bg-pink-500 border-pink-400 text-white' : 'bg-black/50 border-white/20 text-white hover:bg-black/70'
              }`}
              title="Cadres"
            >
              <Frame className="w-4 h-4 sm:w-5 sm:h-5" />
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

      {/* Media Preview */}
      <div className="relative flex-1 w-full h-full overflow-hidden bg-slate-900">
        <div className="absolute inset-0 flex items-center justify-center">
          {mediaType === 'video' && preview ? (
            <video
              src={preview}
              controls
              className="w-full h-full max-h-[80vh] object-contain"
              autoPlay
              loop
              playsInline
            />
          ) : (
            <>
              <img 
                src={preview} 
                alt="Preview" 
                className="w-full h-full max-h-[80vh] object-contain"
                style={{
                  maxWidth: '100%',
                  height: 'auto'
                }}
              />
              {decorativeFrameEnabled && decorativeFrameUrl && (
                <img
                  src={decorativeFrameUrl}
                  alt="Cadre décoratif"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                />
              )}
            </>
          )}
        </div>
        
        {/* Author Name Input */}
        <div className="absolute bottom-20 sm:bottom-28 left-0 w-full px-4 sm:px-6 flex justify-center z-20">
          <div className="bg-black/40 backdrop-blur-md p-2.5 sm:p-3 rounded-xl sm:rounded-2xl w-full max-w-sm border border-white/10 shadow-lg">
            <input
              type="text"
              value={authorName}
              onChange={(e) => onAuthorNameChange(e.target.value)}
              placeholder="Votre nom..."
              className="w-full text-center font-bold text-lg sm:text-2xl text-white placeholder-white/50 bg-transparent border-none outline-none focus:ring-0"
              maxLength={MAX_AUTHOR_NAME_LENGTH}
              autoFocus
              inputMode="text"
            />
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 w-full p-4 sm:p-6 pb-6 sm:pb-8 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex space-x-3 sm:space-x-4 z-20">
        <button
          onClick={onRetake}
          className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-white/10 backdrop-blur-md text-white rounded-full font-bold border border-white/20 active:scale-95 transition-all hover:bg-white/20 touch-manipulation text-xl sm:text-2xl"
          disabled={loading}
          title="Refaire"
        >
          ↺
        </button>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="relative flex-1 py-3 sm:py-4 bg-gradient-to-r from-pink-600 via-pink-500 to-pink-600 text-white rounded-xl sm:rounded-2xl font-bold shadow-[0_0_20px_rgba(219,39,119,0.4)] hover:shadow-[0_0_30px_rgba(219,39,119,0.6)] hover:from-pink-500 hover:via-pink-400 hover:to-pink-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center border border-pink-400/50 touch-manipulation text-sm sm:text-base overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="animate-pulse text-xs sm:text-sm">{loadingStep}</span>
            </>
          ) : (
            <span className="flex items-center justify-center gap-1.5 sm:gap-2 font-semibold">
              <span role="img" aria-label="Poster" className="text-base sm:text-lg">✨</span>
              <span className="hidden sm:inline">ENVOYER AU MUR</span>
              <span className="sm:hidden">ENVOYER</span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

