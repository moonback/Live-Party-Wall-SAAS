import React, { useCallback, useRef } from 'react';
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
  disabled,
}) => {
  const isDisabled =
    disabled || cameraError || (countdown !== null && mediaType === 'photo');
  
  const touchStartTime = useRef<number>(0);
  const hasTriggered = useRef<boolean>(false);

  // Gestion des événements tactiles pour mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isDisabled) return;
    e.preventDefault();
    touchStartTime.current = Date.now();
    hasTriggered.current = false;
  }, [isDisabled]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (isDisabled) return;
    e.preventDefault();
    e.stopPropagation();
    
    const touchDuration = Date.now() - touchStartTime.current;
    
    // Éviter les doubles déclenchements
    if (hasTriggered.current) return;
    
    // Déclencher seulement si le touch est rapide (< 500ms) pour éviter les long press
    if (touchDuration < 500) {
      hasTriggered.current = true;
      onClick();
    }
  }, [isDisabled, onClick]);

  // Gestion du clic pour desktop
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isDisabled) return;
    e.preventDefault();
    e.stopPropagation();
    
    // Éviter les doubles déclenchements si touch a déjà été déclenché
    if (hasTriggered.current) {
      hasTriggered.current = false;
      return;
    }
    
    onClick();
  }, [isDisabled, onClick]);

  // Couleurs dynamiques
  const baseColor =
    mediaType === 'video'
      ? isRecording
        ? 'bg-red-600'
        : 'bg-blue-600'
      : countdown !== null
      ? 'bg-pink-600'
      : 'bg-gradient-to-br from-red-500 via-pink-500 to-red-600';
  const ringColor =
    isDisabled
      ? 'ring-0'
      : mediaType === 'video'
      ? 'focus:ring-blue-300'
      : 'focus:ring-pink-300';

  return (
    <button
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={isDisabled}
      className={`
        relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center
        ${baseColor} transition-all shadow-lg
        border-4 border-white/80
        outline-none focus:ring-4 ${ringColor}
        ${isDisabled ? 'opacity-40 scale-100 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
        touch-manipulation
        z-50
        select-none
        pointer-events-auto
      `}
      style={{ 
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
      aria-label={
        mediaType === 'video'
          ? isRecording
            ? "Arrêter l'enregistrement"
            : "Démarrer l'enregistrement"
          : 'Prendre une photo'
      }
    >
      {/* Style pour le fond simple ou indicateur vidéo */}
      <span
        className={`
          absolute inset-0 rounded-full pointer-events-none
          ${!isDisabled && !isRecording && countdown === null && mediaType === 'photo' ? 'animate-pulse bg-pink-500/10' : ''}
          ${isRecording && mediaType === 'video' ? 'animate-pulse bg-red-600/20' : ''}
        `}
      />
      {/* Icône centrale */}
      <span className="relative z-10 flex items-center justify-center">
        {mediaType === 'video' ? (
          isRecording ? (
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-white" />
          ) : (
            <span
              className="block w-0 h-0 
                border-l-[14px] sm:border-l-[18px]
                border-l-white
                border-t-[9px] sm:border-t-[11px] border-t-transparent
                border-b-[9px] sm:border-b-[11px] border-b-transparent
                ml-1"
              style={{}}
            />
          )
        ) : (
          <CameraIcon
            className="w-7 h-7 sm:w-8 sm:h-8 text-white/90 drop-shadow"
            strokeWidth={2.4}
          />
        )}
      </span>
    </button>
  );
};
