import React from 'react';
import { ArrowLeft, Camera as CameraIcon, Video, Grid3x3 } from 'lucide-react';

interface PhotoboothHeaderProps {
  onBack: () => void;
  onCollageMode?: () => void;
  mediaType: 'photo' | 'video';
  onMediaTypeChange: (type: 'photo' | 'video') => void;
  isRecording: boolean;
  videoCaptureEnabled: boolean;
  collageModeEnabled: boolean;
  onStopRecording?: () => void;
}

export const PhotoboothHeader: React.FC<PhotoboothHeaderProps> = ({
  onBack,
  onCollageMode,
  mediaType,
  onMediaTypeChange,
  isRecording,
  videoCaptureEnabled,
  collageModeEnabled,
  onStopRecording
}) => {
  return (
    <header className="p-2 sm:p-4 landscape:p-1.5 landscape:sm:p-2 flex items-center justify-between z-20 absolute top-0 w-full bg-gradient-to-b from-black/90 via-black/80 to-transparent backdrop-blur-xl border-b border-white/5">
      <button 
        onClick={onBack} 
        className="relative text-white bg-black/40 backdrop-blur-md px-3 py-2 sm:px-4 sm:py-2.5 landscape:px-2 landscape:py-1.5 landscape:sm:px-3 landscape:sm:py-2 rounded-full landscape:rounded-lg hover:bg-black/60 active:bg-black/70 active:scale-95 transition-all duration-200 text-sm sm:text-base landscape:text-xs landscape:sm:text-sm font-medium border border-white/10 hover:border-white/20 shadow-lg hover:shadow-xl group"
        aria-label="Retour"
      >
        <span className="relative flex items-center gap-1.5 landscape:gap-1">
          <ArrowLeft className="w-4 h-4 landscape:w-3.5 landscape:h-3.5 landscape:sm:w-4 landscape:sm:h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden sm:inline landscape:hidden">Retour</span>
        </span>
      </button>
      
      <div className="flex items-center gap-1.5 sm:gap-3 landscape:gap-1 landscape:sm:gap-1.5 flex-1 justify-center">
        <h2 className="font-handwriting text-lg sm:text-2xl landscape:text-base landscape:sm:text-xl text-pink-500 drop-shadow-md">Photobooth</h2>
        
        {onCollageMode && collageModeEnabled && (
          <button
            onClick={onCollageMode}
            className="px-2 py-1 sm:px-3 sm:py-1.5 landscape:px-1.5 landscape:py-0.5 landscape:sm:px-2 landscape:sm:py-1 rounded-full landscape:rounded-lg text-[10px] sm:text-xs landscape:text-[9px] landscape:sm:text-[10px] font-bold bg-purple-500/80 hover:bg-purple-500 text-white transition-all flex items-center gap-0.5 sm:gap-1 landscape:gap-0.5"
            title="Mode Collage"
          >
            <Grid3x3 className="w-3 h-3 sm:w-4 sm:h-4 landscape:w-2.5 landscape:h-2.5 landscape:sm:w-3 landscape:sm:h-3" />
            <span className="hidden sm:inline landscape:hidden">Collage</span>
          </button>
        )}
        
        {videoCaptureEnabled && (
          <div className="flex items-center gap-1 sm:gap-2 landscape:gap-0.5 landscape:sm:gap-1 bg-black/30 backdrop-blur-md rounded-full p-0.5 sm:p-1 landscape:p-0.5 border border-white/20">
            <button
              onClick={() => {
                if (isRecording && onStopRecording) onStopRecording();
                onMediaTypeChange('photo');
              }}
              className={`px-2 py-1 sm:px-3 sm:py-1.5 landscape:px-1.5 landscape:py-0.5 landscape:sm:px-2 landscape:sm:py-1 rounded-full landscape:rounded-lg text-[10px] sm:text-xs landscape:text-[9px] landscape:sm:text-[10px] font-bold transition-all ${
                mediaType === 'photo' 
                  ? 'bg-pink-500 text-white' 
                  : 'text-white/70 hover:text-white'
              }`}
              disabled={isRecording}
            >
              <CameraIcon className="w-3 h-3 sm:w-4 sm:h-4 landscape:w-2.5 landscape:h-2.5 landscape:sm:w-3 landscape:sm:h-3 inline sm:mr-1 landscape:mr-0.5" />
              <span className="hidden sm:inline landscape:hidden">Photo</span>
            </button>
            <button
              onClick={() => {
                if (isRecording && onStopRecording) onStopRecording();
                onMediaTypeChange('video');
              }}
              className={`px-2 py-1 sm:px-3 sm:py-1.5 landscape:px-1.5 landscape:py-0.5 landscape:sm:px-2 landscape:sm:py-1 rounded-full landscape:rounded-lg text-[10px] sm:text-xs landscape:text-[9px] landscape:sm:text-[10px] font-bold transition-all ${
                mediaType === 'video' 
                  ? 'bg-pink-500 text-white' 
                  : 'text-white/70 hover:text-white'
              }`}
              disabled={isRecording}
            >
              <Video className="w-3 h-3 sm:w-4 sm:h-4 landscape:w-2.5 landscape:h-2.5 landscape:sm:w-3 landscape:sm:h-3 inline sm:mr-1 landscape:mr-0.5" />
              <span className="hidden sm:inline landscape:hidden">Vidéo</span>
            </button>
          </div>
        )}
      </div>
      
      <div className="w-12 sm:w-20 landscape:w-10 landscape:sm:w-12"></div>
    </header>
  );
};

