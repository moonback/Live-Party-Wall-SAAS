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
  const [flashEnabled, setFlashEnabled] = useState<boolean>(false);
  const [flashSupported, setFlashSupported] = useState<boolean>(false);
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
      if (!videoTrack) {
        setCameraError(true);
        addToast("Impossible d'accéder à la caméra", 'error');
        return;
      }

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

      // Vérifier si le flash est supporté et réinitialiser si nécessaire
      const capabilities = videoTrack.getCapabilities();
      const supported = 'torch' in capabilities || 'fillLightMode' in capabilities;
      setFlashSupported(supported);
      // Réinitialiser le flash si la caméra change et que le flash était activé
      if (flashEnabled && supported) {
        try {
          if ('torch' in capabilities) {
            await videoTrack.applyConstraints({
              advanced: [{ torch: true } as MediaTrackConstraints]
            });
          } else if ('fillLightMode' in capabilities) {
            await videoTrack.applyConstraints({
              advanced: [{ fillLightMode: 'flash' } as MediaTrackConstraints]
            });
          }
        } catch (e) {
          // Ignorer les erreurs silencieusement si le flash ne peut pas être activé
          logger.warn("Flash activation failed", e, { component: 'useCamera', action: 'startCamera' });
          setFlashEnabled(false);
        }
      } else if (!supported) {
        // Désactiver l'état si le flash n'est pas supporté
        setFlashEnabled(false);
      }
    } catch (err) {
      logger.error("Camera access error", err, { component: 'useCamera', action: 'startCamera' });
      setCameraError(true);
      addToast("Impossible d'accéder à la caméra", 'error');
    }
  }, [stream, facingMode, videoDevices.length, preferredWidth, preferredHeight, flashEnabled, addToast]);

  const stopCamera = useCallback(async () => {
    if (stream) {
      // Désactiver le flash avant d'arrêter la caméra
      if (flashEnabled) {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          try {
            const capabilities = videoTrack.getCapabilities();
            if ('torch' in capabilities) {
              await videoTrack.applyConstraints({
                advanced: [{ torch: false } as MediaTrackConstraints]
              });
            } else if ('fillLightMode' in capabilities) {
              await videoTrack.applyConstraints({
                advanced: [{ fillLightMode: 'off' } as MediaTrackConstraints]
              });
            }
          } catch (e) {
            // Ignorer les erreurs silencieusement
            logger.warn("Flash deactivation failed", e, { component: 'useCamera', action: 'stopCamera' });
          }
        }
        setFlashEnabled(false);
      }
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream, flashEnabled]);

  const switchCamera = useCallback(async () => {
    // Désactiver le flash avant de changer de caméra
    if (stream && flashEnabled) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        try {
          const capabilities = videoTrack.getCapabilities();
          if ('torch' in capabilities) {
            await videoTrack.applyConstraints({
              advanced: [{ torch: false } as MediaTrackConstraints]
            });
          } else if ('fillLightMode' in capabilities) {
            await videoTrack.applyConstraints({
              advanced: [{ fillLightMode: 'off' } as MediaTrackConstraints]
            });
          }
        } catch (e) {
          // Ignorer les erreurs silencieusement
          logger.warn("Flash deactivation failed", e, { component: 'useCamera', action: 'switchCamera' });
        }
      }
      setFlashEnabled(false);
    }

    if (videoDevices.length >= 2) {
      const currentIndex = videoDevices.findIndex(d => d.deviceId === currentDeviceId);
      const nextIndex = (currentIndex + 1) % videoDevices.length;
      const nextDevice = videoDevices[nextIndex];
      startCamera(nextDevice.deviceId);
      return;
    }
    
    const nextFacingMode = facingMode === 'user' ? 'environment' : 'user';
    startCamera(undefined, nextFacingMode);
  }, [videoDevices, currentDeviceId, facingMode, startCamera, stream, flashEnabled]);

  const toggleFlash = useCallback(async () => {
    if (!stream || !flashSupported) return;

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    const newFlashState = !flashEnabled;
    
    try {
      const capabilities = videoTrack.getCapabilities();
      // Essayer d'utiliser torch (Android/Chrome)
      if ('torch' in capabilities) {
        await videoTrack.applyConstraints({
          advanced: [{ torch: newFlashState } as MediaTrackConstraints]
        });
        setFlashEnabled(newFlashState);
      } else if ('fillLightMode' in capabilities) {
        // iOS Safari utilise fillLightMode
        await videoTrack.applyConstraints({
          advanced: [{ fillLightMode: newFlashState ? 'flash' : 'off' } as MediaTrackConstraints]
        });
        setFlashEnabled(newFlashState);
      }
    } catch (error) {
      logger.error("Error toggling flash", error, { component: 'useCamera', action: 'toggleFlash' });
      addToast("Impossible d'activer le flash", 'error');
      setFlashEnabled(false);
    }
  }, [stream, flashEnabled, flashSupported, addToast]);

  // Désactiver le flash quand la caméra s'arrête
  useEffect(() => {
    if (!stream && flashEnabled) {
      setFlashEnabled(false);
    }
  }, [stream, flashEnabled]);

  return {
    stream,
    cameraError,
    videoDevices,
    currentDeviceId,
    facingMode,
    videoRef,
    flashEnabled,
    flashSupported,
    startCamera,
    stopCamera,
    switchCamera,
    toggleFlash
  };
};

