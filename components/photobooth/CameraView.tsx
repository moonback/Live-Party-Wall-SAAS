import React, { useRef } from 'react';
import { motion } from 'framer-motion';
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
        <div className="absolute top-16 xs:top-20 sm:top-24 md:top-28 landscape:top-10 landscape:xs:top-12 landscape:sm:top-14 landscape:md:top-16 right-3 xs:right-4 sm:right-6 md:right-8 landscape:right-2 landscape:xs:right-2.5 landscape:sm:right-3 landscape:md:right-4 z-40 flex flex-col gap-2 xs:gap-2.5 sm:gap-3 md:gap-4 landscape:gap-1.5 landscape:xs:gap-1.5 landscape:sm:gap-2 landscape:md:gap-2.5">
          {/* Bouton mode rafale */}
          {onBurstModeToggle && (
            <button
              onClick={onBurstModeToggle}
              className={`backdrop-blur-md p-2.5 xs:p-3 sm:p-4 md:p-4.5 landscape:p-1.5 landscape:xs:p-2 landscape:sm:p-2.5 landscape:md:p-3 rounded-full landscape:rounded-lg active:scale-95 transition-all duration-200 shadow-2xl border-2 group ${
                burstMode
                  ? 'bg-gradient-to-br from-yellow-500/95 to-orange-600/95 hover:from-yellow-600 hover:to-orange-700 border-yellow-400/50 hover:border-yellow-300/70 hover:shadow-yellow-500/50'
                  : 'bg-gradient-to-br from-slate-500/95 to-slate-600/95 hover:from-slate-600 hover:to-slate-700 border-white/30 hover:border-white/50'
              }`}
              aria-label={burstMode ? 'Désactiver le mode rafale' : 'Activer le mode rafale'}
              title={burstMode ? 'Mode rafale activé (3-5 photos)' : 'Mode rafale désactivé'}
              disabled={isCapturingBurst}
            >
              <Zap className={`w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 landscape:w-3.5 landscape:h-3.5 landscape:xs:w-4 landscape:xs:h-4 landscape:sm:w-5 landscape:sm:h-5 landscape:md:w-6 landscape:md:h-6 drop-shadow-lg group-hover:scale-110 transition-transform ${
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
              className="bg-gradient-to-br from-pink-500/95 to-purple-600/95 backdrop-blur-md p-2.5 xs:p-3 sm:p-4 md:p-4.5 landscape:p-1.5 landscape:xs:p-2 landscape:sm:p-2.5 landscape:md:p-3 rounded-full landscape:rounded-lg hover:from-pink-600 hover:to-purple-700 active:scale-95 transition-all duration-200 shadow-2xl border-2 border-white/30 hover:border-white/50 hover:shadow-pink-500/50 group"
              aria-label="Paramètres du timer"
              title="Paramètres du timer"
            >
              <Timer className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 landscape:w-3.5 landscape:h-3.5 landscape:xs:w-4 landscape:xs:h-4 landscape:sm:w-5 landscape:sm:h-5 landscape:md:w-6 landscape:md:h-6 text-white drop-shadow-lg group-hover:scale-110 transition-transform" />
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
        <div className="absolute bottom-20 xs:bottom-24 sm:bottom-28 md:bottom-32 landscape:bottom-14 landscape:xs:bottom-16 landscape:sm:bottom-18 landscape:md:bottom-20 left-0 right-0 flex justify-center z-30 px-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-yellow-500/90 backdrop-blur-md px-3 xs:px-4 sm:px-5 md:px-6 py-1.5 xs:py-2 sm:py-2.5 md:py-3 landscape:px-2.5 landscape:xs:px-3 landscape:sm:px-3.5 landscape:md:px-4 landscape:py-1 landscape:xs:py-1.5 landscape:sm:py-1.5 landscape:md:py-2 rounded-full landscape:rounded-lg border-2 border-yellow-400/50 shadow-lg"
          >
            <p className="text-white text-[10px] xs:text-xs sm:text-sm md:text-base landscape:text-[9px] landscape:xs:text-[10px] landscape:sm:text-xs landscape:md:text-sm font-bold flex items-center gap-1.5 xs:gap-2 sm:gap-2.5 landscape:gap-1 landscape:xs:gap-1.5 landscape:sm:gap-1.5">
              <Zap className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 landscape:w-3 landscape:h-3 landscape:xs:w-3.5 landscape:xs:h-3.5 landscape:sm:w-4 landscape:sm:h-4 landscape:md:w-4.5 landscape:md:h-4.5" />
              <span className="whitespace-nowrap">Mode rafale activé</span>
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
};

