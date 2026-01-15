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
    <header className="p-2 xs:p-3 sm:p-4 md:p-5 lg:p-6 landscape:p-1.5 landscape:xs:p-2 landscape:sm:p-2.5 landscape:md:p-3 flex items-center justify-between z-20 absolute top-0 w-full bg-gradient-to-b from-black/90 via-black/80 to-transparent backdrop-blur-xl border-b border-white/5">
      <button 
        onClick={onBack} 
        className="relative text-white bg-black/40 backdrop-blur-md px-2.5 xs:px-3 sm:px-4 md:px-5 py-1.5 xs:py-2 sm:py-2.5 md:py-3 landscape:px-2 landscape:xs:px-2.5 landscape:sm:px-3 landscape:md:px-3.5 landscape:py-1 landscape:xs:py-1.5 landscape:sm:py-2 landscape:md:py-2.5 rounded-full landscape:rounded-lg hover:bg-black/60 active:bg-black/70 active:scale-95 transition-all duration-200 text-xs xs:text-sm sm:text-base md:text-lg landscape:text-[10px] landscape:xs:text-xs landscape:sm:text-sm landscape:md:text-base font-medium border border-white/10 hover:border-white/20 shadow-lg hover:shadow-xl group"
        aria-label="Retour"
      >
        <span className="relative flex items-center gap-1 xs:gap-1.5 sm:gap-2 landscape:gap-0.5 landscape:xs:gap-1 landscape:sm:gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 landscape:w-3 landscape:h-3 landscape:xs:w-3.5 landscape:xs:h-3.5 landscape:sm:w-4 landscape:sm:h-4 landscape:md:w-5 landscape:md:h-5 group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden md:inline landscape:hidden">Retour</span>
        </span>
      </button>
      
      <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 landscape:gap-0.5 landscape:xs:gap-1 landscape:sm:gap-1.5 landscape:md:gap-2 flex-1 justify-center">
        <h2 className="font-handwriting text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl landscape:text-sm landscape:xs:text-base landscape:sm:text-lg landscape:md:text-xl text-pink-500 drop-shadow-md">Photobooth</h2>
        
        {onCollageMode && collageModeEnabled && (
          <button
            onClick={onCollageMode}
            className="px-2 xs:px-2.5 sm:px-3 md:px-4 py-1 xs:py-1.5 sm:py-1.5 md:py-2 landscape:px-1.5 landscape:xs:px-2 landscape:sm:px-2.5 landscape:md:px-3 landscape:py-0.5 landscape:xs:py-1 landscape:sm:py-1 landscape:md:py-1.5 rounded-full landscape:rounded-lg text-[9px] xs:text-[10px] sm:text-xs md:text-sm landscape:text-[8px] landscape:xs:text-[9px] landscape:sm:text-[10px] landscape:md:text-xs font-bold bg-purple-500/80 hover:bg-purple-500 text-white transition-all flex items-center gap-0.5 xs:gap-1 sm:gap-1.5 md:gap-2 landscape:gap-0.5 landscape:xs:gap-0.5 landscape:sm:gap-1 landscape:md:gap-1.5"
            title="Mode Collage"
          >
            <Grid3x3 className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 landscape:w-2.5 landscape:h-2.5 landscape:xs:w-3 landscape:xs:h-3 landscape:sm:w-3.5 landscape:sm:h-3.5 landscape:md:w-4 landscape:md:h-4" />
            <span className="hidden md:inline landscape:hidden">Collage</span>
          </button>
        )}
        
        {videoCaptureEnabled && (
          <div className="flex items-center gap-0.5 xs:gap-1 sm:gap-1.5 md:gap-2 landscape:gap-0.5 landscape:xs:gap-0.5 landscape:sm:gap-1 landscape:md:gap-1.5 bg-black/30 backdrop-blur-md rounded-full p-0.5 xs:p-1 sm:p-1.5 md:p-2 landscape:p-0.5 landscape:xs:p-0.5 landscape:sm:p-1 landscape:md:p-1.5 border border-white/20">
            <button
              onClick={() => {
                if (isRecording && onStopRecording) onStopRecording();
                onMediaTypeChange('photo');
              }}
              className={`px-2 xs:px-2.5 sm:px-3 md:px-4 py-1 xs:py-1.5 sm:py-1.5 md:py-2 landscape:px-1.5 landscape:xs:px-2 landscape:sm:px-2.5 landscape:md:px-3 landscape:py-0.5 landscape:xs:py-1 landscape:sm:py-1 landscape:md:py-1.5 rounded-full landscape:rounded-lg text-[9px] xs:text-[10px] sm:text-xs md:text-sm landscape:text-[8px] landscape:xs:text-[9px] landscape:sm:text-[10px] landscape:md:text-xs font-bold transition-all ${
                mediaType === 'photo' 
                  ? 'bg-pink-500 text-white' 
                  : 'text-white/70 hover:text-white'
              }`}
              disabled={isRecording}
            >
              <CameraIcon className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 landscape:w-2.5 landscape:h-2.5 landscape:xs:w-3 landscape:xs:h-3 landscape:sm:w-3.5 landscape:sm:h-3.5 landscape:md:w-4 landscape:md:h-4 inline sm:mr-1 md:mr-1.5 landscape:mr-0.5 landscape:xs:mr-0.5 landscape:sm:mr-1 landscape:md:mr-1" />
              <span className="hidden md:inline landscape:hidden">Photo</span>
            </button>
            <button
              onClick={() => {
                if (isRecording && onStopRecording) onStopRecording();
                onMediaTypeChange('video');
              }}
              className={`px-2 xs:px-2.5 sm:px-3 md:px-4 py-1 xs:py-1.5 sm:py-1.5 md:py-2 landscape:px-1.5 landscape:xs:px-2 landscape:sm:px-2.5 landscape:md:px-3 landscape:py-0.5 landscape:xs:py-1 landscape:sm:py-1 landscape:md:py-1.5 rounded-full landscape:rounded-lg text-[9px] xs:text-[10px] sm:text-xs md:text-sm landscape:text-[8px] landscape:xs:text-[9px] landscape:sm:text-[10px] landscape:md:text-xs font-bold transition-all ${
                mediaType === 'video' 
                  ? 'bg-pink-500 text-white' 
                  : 'text-white/70 hover:text-white'
              }`}
              disabled={isRecording}
            >
              <Video className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 landscape:w-2.5 landscape:h-2.5 landscape:xs:w-3 landscape:xs:h-3 landscape:sm:w-3.5 landscape:sm:h-3.5 landscape:md:w-4 landscape:md:h-4 inline sm:mr-1 md:mr-1.5 landscape:mr-0.5 landscape:xs:mr-0.5 landscape:sm:mr-1 landscape:md:mr-1" />
              <span className="hidden md:inline landscape:hidden">Vidéo</span>
            </button>
          </div>
        )}
      </div>
      
      <div className="w-10 xs:w-12 sm:w-16 md:w-20 lg:w-24 landscape:w-8 landscape:xs:w-10 landscape:sm:w-12 landscape:md:w-16"></div>
    </header>
  );
};

