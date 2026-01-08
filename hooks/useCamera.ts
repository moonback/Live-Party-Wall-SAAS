import { useState, useRef, useEffect, useCallback } from 'react';
import { logger } from '../utils/logger';
import { useToast } from '../context/ToastContext';

interface UseCameraOptions {
  preferredWidth?: number;
  preferredHeight?: number;
  fallbackWidth?: number;
  fallbackHeight?: number;
}

export const useCamera = (options: UseCameraOptions = {}) => {
  const { addToast } = useToast();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<boolean>(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    preferredWidth = 1920,
    preferredHeight = 1080,
    fallbackWidth = 1280,
    fallbackHeight = 720
  } = options;

  const startCamera = useCallback(async (
    deviceId?: string,
    preferredFacingMode?: 'user' | 'environment'
  ) => {
    try {
      // Ne pas redémarrer si déjà en cours et pas de changement demandé
      if (stream && !deviceId && !preferredFacingMode && !cameraError) return;
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const constraints: MediaTrackConstraints = {
        width: { ideal: preferredWidth, min: 640 },
        height: { ideal: preferredHeight, min: 480 },
        aspectRatio: { ideal: 16 / 9 }
      };

      if (deviceId) {
        constraints.deviceId = { exact: deviceId };
      } else {
        const facing = preferredFacingMode || facingMode;
        constraints.facingMode = facing;
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: constraints, 
        audio: false 
      });
      
      setStream(mediaStream);
      setCameraError(false);
      
      const videoTrack = mediaStream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      
      if (settings.deviceId) {
        setCurrentDeviceId(settings.deviceId);
      }
      
      if (settings.facingMode && (settings.facingMode === 'user' || settings.facingMode === 'environment')) {
        setFacingMode(settings.facingMode);
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      if (videoDevices.length === 0) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const inputs = devices.filter(d => d.kind === 'videoinput');
          setVideoDevices(inputs);
        } catch (e) {
          logger.error("Error enumerating devices", e, { component: 'useCamera', action: 'startCamera' });
        }
      }
    } catch (err) {
      logger.error("Camera access error", err, { component: 'useCamera', action: 'startCamera' });
      setCameraError(true);
      addToast("Impossible d'accéder à la caméra", 'error');
    }
  }, [stream, facingMode, videoDevices.length, preferredWidth, preferredHeight, addToast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const switchCamera = useCallback(() => {
    if (videoDevices.length >= 2) {
      const currentIndex = videoDevices.findIndex(d => d.deviceId === currentDeviceId);
      const nextIndex = (currentIndex + 1) % videoDevices.length;
      const nextDevice = videoDevices[nextIndex];
      startCamera(nextDevice.deviceId);
      return;
    }
    
    const nextFacingMode = facingMode === 'user' ? 'environment' : 'user';
    startCamera(undefined, nextFacingMode);
  }, [videoDevices, currentDeviceId, facingMode, startCamera]);

  return {
    stream,
    cameraError,
    videoDevices,
    currentDeviceId,
    facingMode,
    videoRef,
    startCamera,
    stopCamera,
    switchCamera
  };
};

