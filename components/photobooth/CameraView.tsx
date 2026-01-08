import React, { useRef } from 'react';
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
  cameraError
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
        <CountdownOverlay countdown={countdown} />
      )}

      {isRecording && mediaType === 'video' && (
        <VideoTimer duration={videoDuration} />
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

