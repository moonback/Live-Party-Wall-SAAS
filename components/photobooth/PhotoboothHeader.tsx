import React from 'react';
import { ArrowLeft, Grid3x3 } from 'lucide-react';

interface PhotoboothHeaderProps {
  onBack: () => void;
  onCollageMode?: () => void;
  collageModeEnabled: boolean;
}

export const PhotoboothHeader: React.FC<PhotoboothHeaderProps> = ({
  onBack,
  onCollageMode,
  collageModeEnabled
}) => {
  return (
    <header className="p-2 sm:p-4 flex items-center justify-between z-20 absolute top-0 w-full bg-gradient-to-b from-black/90 via-black/80 to-transparent backdrop-blur-xl border-b border-white/5">
      <button 
        onClick={onBack} 
        className="relative text-white bg-black/40 backdrop-blur-md px-3 py-2 sm:px-4 sm:py-2.5 rounded-full hover:bg-black/60 active:bg-black/70 active:scale-95 transition-all duration-200 text-sm sm:text-base font-medium border border-white/10 hover:border-white/20 shadow-lg hover:shadow-xl group"
        aria-label="Retour"
      >
        <span className="relative flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden sm:inline">Retour</span>
        </span>
      </button>
      
      <div className="flex items-center gap-1.5 sm:gap-3 flex-1 justify-center">
        <h2 className="font-handwriting text-lg sm:text-2xl text-pink-500 drop-shadow-md">Photobooth</h2>
        
        {onCollageMode && collageModeEnabled && (
          <button
            onClick={onCollageMode}
            className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold bg-purple-500/80 hover:bg-purple-500 text-white transition-all flex items-center gap-0.5 sm:gap-1"
            title="Mode Collage"
          >
            <Grid3x3 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Collage</span>
          </button>
        )}
      </div>
      
      <div className="w-12 sm:w-20"></div>
    </header>
  );
};

