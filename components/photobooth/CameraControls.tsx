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
    <div className="absolute bottom-0 left-0 w-full p-4 sm:p-8 landscape:p-2 landscape:sm:p-3 pb-4 sm:pb-6 landscape:pb-2 landscape:sm:pb-3 flex items-center justify-center space-x-6 sm:space-x-12 landscape:space-x-3 landscape:sm:space-x-4 pointer-events-none sm:pointer-events-auto">
      <button 
        onClick={onGalleryClick}
        className="flex flex-col items-center text-slate-300 hover:text-white active:scale-95 transition-all duration-200 group pointer-events-auto"
        aria-label="Choisir un fichier depuis la galerie"
      >
        <div className="relative w-10 h-10 sm:w-12 sm:h-12 landscape:w-8 landscape:h-8 landscape:sm:w-10 landscape:sm:h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-1 landscape:mb-0.5 border border-slate-400/20 group-hover:border-pink-400 group-hover:bg-white/15 group-hover:shadow-lg group-hover:shadow-pink-500/20 transition-all duration-300">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500/0 to-purple-500/0 group-hover:from-pink-500/20 group-hover:to-purple-500/20 transition-all duration-300 blur-sm" />
          <span role="img" aria-hidden="true" className="text-xl sm:text-2xl landscape:text-base landscape:sm:text-lg relative z-10 group-hover:scale-110 transition-transform duration-300">📂</span>
        </div>
        <span className="text-[10px] sm:text-xs landscape:text-[9px] landscape:sm:text-[10px] uppercase tracking-wider font-bold group-hover:text-pink-300 transition-colors duration-300">Galerie</span>
      </button>

      {captureButton}

      {showSwitchCamera && (
        <button 
          onClick={onSwitchCamera}
          className="flex flex-col items-center text-slate-300 hover:text-white active:scale-95 transition-all duration-200 group pointer-events-auto"
          title="Changer de caméra"
          aria-label="Changer de caméra"
        >
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 landscape:w-8 landscape:h-8 landscape:sm:w-10 landscape:sm:h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-1 landscape:mb-0.5 border border-slate-400/20 group-hover:border-pink-400 group-hover:bg-white/15 group-hover:shadow-lg group-hover:shadow-pink-500/20 transition-all duration-300">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500/0 to-purple-500/0 group-hover:from-pink-500/20 group-hover:to-purple-500/20 transition-all duration-300 blur-sm" />
            <SwitchCamera className="w-5 h-5 sm:w-6 sm:h-6 landscape:w-4 landscape:h-4 landscape:sm:w-5 landscape:sm:h-5 relative z-10 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <span className="text-[10px] sm:text-xs landscape:text-[9px] landscape:sm:text-[10px] uppercase tracking-wider font-bold group-hover:text-pink-300 transition-colors duration-300">Caméra</span>
        </button>
      )}
    </div>
  );
};

