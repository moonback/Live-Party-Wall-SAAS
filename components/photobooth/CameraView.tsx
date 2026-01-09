import React, { useRef } from 'react';
import { Timer } from 'lucide-react';
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
  onTimerSettingsClick
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

      {/* Bouton flottant de configuration du timer */}
      {mediaType === 'photo' && onTimerSettingsClick && !cameraError && (
        <button
          onClick={onTimerSettingsClick}
          className="absolute top-20 sm:top-24 right-4 sm:right-6 z-40 bg-gradient-to-br from-pink-500/95 to-purple-600/95 backdrop-blur-md p-3 sm:p-4 rounded-full hover:from-pink-600 hover:to-purple-700 active:scale-95 transition-all duration-200 shadow-2xl border-2 border-white/30 hover:border-white/50 hover:shadow-pink-500/50 group"
          aria-label="Paramètres du timer"
          title="Paramètres du timer"
        >
          <Timer className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-lg group-hover:scale-110 transition-transform" />
          <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse"></div>
        </button>
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
          />
        }
      />
    </div>
  );
};

