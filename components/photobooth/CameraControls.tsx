import React from 'react';
import { SwitchCamera } from 'lucide-react';

interface CameraControlsProps {
  onGalleryClick: () => void;
  onSwitchCamera: () => void;
  showSwitchCamera: boolean;
  captureButton: React.ReactNode;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  onGalleryClick,
  onSwitchCamera,
  showSwitchCamera,
  captureButton
}) => {
  return (
    <div className="absolute bottom-0 left-0 w-full p-3 xs:p-4 sm:p-6 md:p-8 lg:p-10 landscape:p-2 landscape:xs:p-2.5 landscape:sm:p-3 landscape:md:p-4 pb-3 xs:pb-4 sm:pb-6 md:pb-8 landscape:pb-2 landscape:xs:pb-2.5 landscape:sm:pb-3 landscape:md:pb-4 flex items-center justify-center space-x-4 xs:space-x-6 sm:space-x-8 md:space-x-12 lg:space-x-16 landscape:space-x-2.5 landscape:xs:space-x-3 landscape:sm:space-x-4 landscape:md:space-x-6 pointer-events-none sm:pointer-events-auto">
      <button 
        onClick={onGalleryClick}
        className="flex flex-col items-center text-slate-300 hover:text-white active:scale-95 transition-all duration-200 group pointer-events-auto"
        aria-label="Choisir un fichier depuis la galerie"
      >
        <div className="relative w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 landscape:w-8 landscape:h-8 landscape:xs:w-9 landscape:xs:h-9 landscape:sm:w-10 landscape:sm:h-10 landscape:md:w-12 landscape:md:h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-0.5 xs:mb-1 sm:mb-1.5 landscape:mb-0.5 landscape:xs:mb-0.5 landscape:sm:mb-1 border border-slate-400/20 group-hover:border-pink-400 group-hover:bg-white/15 group-hover:shadow-lg group-hover:shadow-pink-500/20 transition-all duration-300">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500/0 to-purple-500/0 group-hover:from-pink-500/20 group-hover:to-purple-500/20 transition-all duration-300 blur-sm" />
          <span role="img" aria-hidden="true" className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl landscape:text-base landscape:xs:text-lg landscape:sm:text-xl landscape:md:text-2xl relative z-10 group-hover:scale-110 transition-transform duration-300">📂</span>
        </div>
        <span className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm landscape:text-[8px] landscape:xs:text-[9px] landscape:sm:text-[10px] landscape:md:text-xs uppercase tracking-wider font-bold group-hover:text-pink-300 transition-colors duration-300">Galerie</span>
      </button>

      {captureButton}

      {showSwitchCamera && (
        <button 
          onClick={onSwitchCamera}
          className="flex flex-col items-center text-slate-300 hover:text-white active:scale-95 transition-all duration-200 group pointer-events-auto"
          title="Changer de caméra"
          aria-label="Changer de caméra"
        >
          <div className="relative w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 landscape:w-8 landscape:h-8 landscape:xs:w-9 landscape:xs:h-9 landscape:sm:w-10 landscape:sm:h-10 landscape:md:w-12 landscape:md:h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-0.5 xs:mb-1 sm:mb-1.5 landscape:mb-0.5 landscape:xs:mb-0.5 landscape:sm:mb-1 border border-slate-400/20 group-hover:border-pink-400 group-hover:bg-white/15 group-hover:shadow-lg group-hover:shadow-pink-500/20 transition-all duration-300">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500/0 to-purple-500/0 group-hover:from-pink-500/20 group-hover:to-purple-500/20 transition-all duration-300 blur-sm" />
            <SwitchCamera className="w-4.5 h-4.5 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 landscape:w-4 landscape:h-4 landscape:xs:w-4.5 landscape:xs:h-4.5 landscape:sm:w-5 landscape:sm:h-5 landscape:md:w-6 landscape:md:h-6 relative z-10 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <span className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm landscape:text-[8px] landscape:xs:text-[9px] landscape:sm:text-[10px] landscape:md:text-xs uppercase tracking-wider font-bold group-hover:text-pink-300 transition-colors duration-300">Caméra</span>
        </button>
      )}
    </div>
  );
};

