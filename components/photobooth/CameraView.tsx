import React, { useRef } from 'react';
import { Timer, Zap } from 'lucide-react';
import { CaptureButton } from './CaptureButton';
import { CountdownOverlay } from './CountdownOverlay';
import { VideoTimer } from './VideoTimer';
import { CameraControls } from './CameraControls';

interface CameraViewProps {
  mediaType: 'photo' | 'video';
  countdown: number | null;
  isRecording: boolean;
  videoDuration: number;
  onCapture: () => void;
  onGalleryClick: () => void;
  onSwitchCamera: () => void;
  videoDevices: MediaDeviceInfo[];
  decorativeFrameUrl?: string | null;
  decorativeFrameEnabled?: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraError: boolean;
  timerMaxDuration?: number;
  onTimerSettingsClick?: () => void;
  burstMode?: boolean;
  onBurstModeToggle?: () => void;
  isCapturingBurst?: boolean;
}

export const CameraView: React.FC<CameraViewProps> = ({
  mediaType,
  countdown,
  isRecording,
  videoDuration,
  onCapture,
  onGalleryClick,
  onSwitchCamera,
  videoDevices,
  decorativeFrameUrl,
  decorativeFrameEnabled,
  videoRef,
  cameraError,
  timerMaxDuration = 3,
  onTimerSettingsClick,
  burstMode = false,
  onBurstModeToggle,
  isCapturingBurst = false
}) => {
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const showSwitchCamera = videoDevices.length > 1 || videoDevices.length === 0;

  return (
    <div className="absolute inset-0 w-full h-full bg-black z-10">
      {!cameraError ? (
        <div 
          ref={videoContainerRef}
          className="absolute inset-0 overflow-hidden"
        >
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover transition-all duration-300"
          />
          {decorativeFrameEnabled && decorativeFrameUrl && (
            <img
              src={decorativeFrameUrl}
              alt="Cadre décoratif"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-10"
            />
          )}
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-800">
          <p className="text-4xl mb-4">📷</p>
          <p className="animate-pulse">Caméra non détectée</p>
          <button onClick={onGalleryClick} className="mt-6 text-pink-400 underline font-bold focus:outline-none focus:ring-2 focus:ring-pink-400 rounded">
            Choisir un fichier
          </button>
        </div>
      )}

      {countdown !== null && mediaType === 'photo' && (
        <CountdownOverlay countdown={countdown} maxDuration={timerMaxDuration} />
      )}

      {isRecording && mediaType === 'video' && (
        <VideoTimer duration={videoDuration} />
      )}

      {/* Boutons flottants de configuration */}
      {mediaType === 'photo' && !cameraError && (
        <div className="absolute top-20 sm:top-24 landscape:top-12 landscape:sm:top-16 right-4 sm:right-6 landscape:right-2 landscape:sm:right-3 z-40 flex flex-col gap-2 sm:gap-3 landscape:gap-1.5 landscape:sm:gap-2">
          {/* Bouton mode rafale */}
          {onBurstModeToggle && (
            <button
              onClick={onBurstModeToggle}
              className={`backdrop-blur-md p-3 sm:p-4 landscape:p-2 landscape:sm:p-2.5 rounded-full landscape:rounded-lg active:scale-95 transition-all duration-200 shadow-2xl border-2 group ${
                burstMode
                  ? 'bg-gradient-to-br from-yellow-500/95 to-orange-600/95 hover:from-yellow-600 hover:to-orange-700 border-yellow-400/50 hover:border-yellow-300/70 hover:shadow-yellow-500/50'
                  : 'bg-gradient-to-br from-slate-500/95 to-slate-600/95 hover:from-slate-600 hover:to-slate-700 border-white/30 hover:border-white/50'
              }`}
              aria-label={burstMode ? 'Désactiver le mode rafale' : 'Activer le mode rafale'}
              title={burstMode ? 'Mode rafale activé (3-5 photos)' : 'Mode rafale désactivé'}
              disabled={isCapturingBurst}
            >
              <Zap className={`w-5 h-5 sm:w-6 sm:h-6 landscape:w-4 landscape:h-4 landscape:sm:w-5 landscape:sm:h-5 drop-shadow-lg group-hover:scale-110 transition-transform ${
                burstMode ? 'text-white' : 'text-white/70'
              }`} strokeWidth={burstMode ? 3 : 2} />
              <div className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity animate-pulse ${
                burstMode ? 'bg-yellow-400/20' : 'bg-white/20'
              }`}></div>
            </button>
          )}
          
          {/* Bouton configuration du timer */}
          {onTimerSettingsClick && (
            <button
              onClick={onTimerSettingsClick}
              className="bg-gradient-to-br from-pink-500/95 to-purple-600/95 backdrop-blur-md p-3 sm:p-4 landscape:p-2 landscape:sm:p-2.5 rounded-full landscape:rounded-lg hover:from-pink-600 hover:to-purple-700 active:scale-95 transition-all duration-200 shadow-2xl border-2 border-white/30 hover:border-white/50 hover:shadow-pink-500/50 group"
              aria-label="Paramètres du timer"
              title="Paramètres du timer"
            >
              <Timer className="w-5 h-5 sm:w-6 sm:h-6 landscape:w-4 landscape:h-4 landscape:sm:w-5 landscape:sm:h-5 text-white drop-shadow-lg group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse"></div>
            </button>
          )}
        </div>
      )}

      <CameraControls
        onGalleryClick={onGalleryClick}
        onSwitchCamera={onSwitchCamera}
        showSwitchCamera={showSwitchCamera}
        captureButton={
          <CaptureButton
            mediaType={mediaType}
            isRecording={isRecording}
            cameraError={cameraError}
            countdown={countdown}
            onClick={onCapture}
            disabled={isCapturingBurst}
          />
        }
      />
      
      {/* Indicateur mode rafale */}
      {burstMode && mediaType === 'photo' && !cameraError && (
        <div className="absolute bottom-24 sm:bottom-28 landscape:bottom-16 landscape:sm:bottom-20 left-0 right-0 flex justify-center z-30">
          <div className="bg-yellow-500/90 backdrop-blur-md px-4 py-2 landscape:px-3 landscape:py-1.5 rounded-full landscape:rounded-lg border-2 border-yellow-400/50 shadow-lg">
            <p className="text-white text-xs sm:text-sm landscape:text-[10px] landscape:sm:text-xs font-bold flex items-center gap-2 landscape:gap-1.5">
              <Zap className="w-4 h-4 landscape:w-3 landscape:h-3 landscape:sm:w-3.5 landscape:sm:h-3.5" />
              Mode rafale activé
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

