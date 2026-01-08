import React from 'react';
import { Camera as CameraIcon } from 'lucide-react';

interface CaptureButtonProps {
  mediaType: 'photo' | 'video';
  isRecording: boolean;
  cameraError: boolean;
  countdown: number | null;
  onClick: () => void;
  disabled?: boolean;
}

export const CaptureButton: React.FC<CaptureButtonProps> = ({
  mediaType,
  isRecording,
  cameraError,
  countdown,
  onClick,
  disabled
}) => {
  const isDisabled = disabled || cameraError || (countdown !== null && mediaType === 'photo');

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`relative w-20 h-20 sm:w-24 sm:h-24 md:w-20 md:h-20 rounded-full border-4 sm:border-[6px] md:border-2 border-white/90 md:border-white/40 flex items-center justify-center bg-transparent transition-all shadow-lg md:shadow-sm hover:shadow-2xl md:hover:shadow-md focus:outline-none focus:ring-4 focus:ring-pink-400/80 pointer-events-auto group
        ${isDisabled ? 'opacity-40 scale-95 cursor-not-allowed' : 'hover:bg-white/10 hover:border-white md:hover:bg-transparent md:hover:border-white/40 active:scale-90'}
      `}
      aria-label={mediaType === 'video' ? (isRecording ? 'Arrêter l\'enregistrement' : 'Démarrer l\'enregistrement') : 'Prendre une photo'}
    >
      {/* Outer glow effect - pulse animé quand prêt (masqué sur desktop) */}
      {!cameraError && countdown === null && !isRecording && (
        <div className={`absolute inset-0 rounded-full transition-all duration-500 md:hidden ${
          mediaType === 'video'
            ? 'bg-blue-500/25 group-hover:bg-blue-500/40'
            : 'bg-pink-500/25 group-hover:bg-pink-500/40'
        } blur-2xl animate-[pulse_2s_ease-in-out_infinite]`} />
      )}
      
      {/* Glow effect intensifié au hover (masqué sur desktop) */}
      {!cameraError && countdown === null && (
        <div className={`absolute inset-0 rounded-full transition-all duration-300 md:hidden ${
          isRecording && mediaType === 'video'
            ? 'bg-red-500/40 animate-pulse'
            : mediaType === 'video'
            ? 'bg-blue-500/30 group-hover:bg-blue-500/50 group-hover:scale-110'
            : 'bg-pink-500/30 group-hover:bg-pink-500/50 group-hover:scale-110'
        } blur-xl`} />
      )}
      
      {/* Ripple effect au clic (masqué sur desktop) */}
      <div className="absolute inset-0 rounded-full overflow-hidden md:hidden">
        <div className="absolute inset-0 rounded-full bg-white/30 scale-0 group-active:scale-150 opacity-0 group-active:opacity-100 transition-all duration-300 ease-out" />
      </div>
      
      {/* Bouton principal */}
      <div className={`relative w-16 h-16 sm:w-20 sm:h-20 md:w-16 md:h-16 rounded-full border-2 sm:border-4 md:border border-transparent md:border-white/30 transition-all duration-300 shadow-lg md:shadow-none ${
        isRecording && mediaType === 'video'
          ? 'bg-red-600 animate-pulse border-red-400/50 md:bg-red-500/80 md:border-red-400/40'
          : mediaType === 'video'
          ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 group-hover:from-blue-400 group-hover:via-purple-400 group-hover:to-blue-500 group-hover:border-white/60 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-blue-500/50 md:bg-slate-700/90 md:group-hover:bg-slate-600/90 md:group-hover:scale-100 md:group-hover:shadow-none md:group-hover:border-white/50'
          : countdown !== null
          ? 'bg-gradient-to-br from-red-500 via-pink-500 to-red-600 animate-pulse border-red-400/50 md:bg-red-500/80 md:border-red-400/40'
          : 'bg-gradient-to-br from-red-500 via-pink-500 to-red-600 group-hover:from-red-400 group-hover:via-pink-400 group-hover:to-red-500 group-hover:border-white/60 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-pink-500/50 md:bg-slate-800/90 md:group-hover:bg-slate-700/90 md:group-hover:scale-100 md:group-hover:shadow-none md:group-hover:border-white/50'
      }`}>
        {/* Inner shine avec effet de rotation subtil (masqué sur desktop) */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-white/10 to-transparent group-hover:from-white/40 group-hover:via-white/20 md:hidden transition-all duration-300" />
        
        {/* Reflet animé (masqué sur desktop) */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 md:hidden transition-opacity duration-500" 
             style={{ transform: 'rotate(45deg)' }} />
        
        {/* Icône au centre */}
        <div className="absolute inset-0 flex items-center justify-center">
          {mediaType === 'video' ? (
            isRecording ? (
              <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-3 md:h-3 rounded-sm bg-white shadow-lg md:shadow-none" />
            ) : (
              <div className="w-0 h-0 border-l-[6px] sm:border-l-[8px] md:border-l-[6px] border-l-white border-t-[4px] sm:border-t-[6px] md:border-t-[4px] border-t-transparent border-b-[4px] sm:border-b-[6px] md:border-b-[4px] border-b-transparent ml-0.5 sm:ml-1 md:ml-0.5 shadow-lg md:shadow-none" />
            )
          ) : (
            <CameraIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-5 md:h-5 text-white/90 md:text-white/70 drop-shadow-lg md:drop-shadow-none" strokeWidth={2.5} />
          )}
        </div>
        
        {/* Indicateur de pulse subtil quand prêt (masqué sur desktop) */}
        {!cameraError && countdown === null && !isRecording && mediaType === 'photo' && (
          <div className="absolute inset-0 rounded-full border-2 border-white/20 md:hidden animate-[ping_2s_ease-in-out_infinite]" 
               style={{ animationDelay: '0.5s' }} />
        )}
      </div>
      
      {/* Effet de lumière concentré au centre (masqué sur desktop) */}
      {!cameraError && countdown === null && (
        <div className={`absolute inset-0 rounded-full pointer-events-none md:hidden ${
          isRecording && mediaType === 'video'
            ? 'bg-red-400/20'
            : mediaType === 'video'
            ? 'bg-blue-400/20 group-hover:bg-blue-400/30'
            : 'bg-pink-400/20 group-hover:bg-pink-400/30'
        } blur-sm transition-all duration-300`} 
        style={{ 
          clipPath: 'circle(30% at 50% 50%)',
          transform: 'scale(1.2)'
        }} />
      )}
    </button>
  );
};

