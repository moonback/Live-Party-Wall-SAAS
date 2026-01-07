import { useState, useEffect, useRef, RefObject } from 'react';

interface UseAdaptiveCameraResolutionOptions {
  preferredWidth?: number;
  preferredHeight?: number;
  fallbackWidth?: number;
  fallbackHeight?: number;
}

interface CameraResolution {
  width: number;
  height: number;
  actualWidth: number;
  actualHeight: number;
}

/**
 * Hook pour détecter et utiliser la meilleure résolution disponible pour la caméra
 */
export const useAdaptiveCameraResolution = (
  videoRef: RefObject<HTMLVideoElement | null>,
  stream: MediaStream | null,
  options: UseAdaptiveCameraResolutionOptions = {}
): CameraResolution | null => {
  const {
    preferredWidth = 1920,
    preferredHeight = 1080,
    fallbackWidth = 1280,
    fallbackHeight = 720
  } = options;

  const [resolution, setResolution] = useState<CameraResolution | null>(null);
  const capabilitiesChecked = useRef(false);

  useEffect(() => {
    if (!stream || !videoRef.current) return;

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    // Détecter les capacités de la caméra
    const getOptimalConstraints = async () => {
      try {
        // Initialiser avec les valeurs par défaut
        let width = preferredWidth;
        let height = preferredHeight;
        
        // Vérifier les capacités supportées
        const capabilities = videoTrack.getCapabilities?.();
        
        if (capabilities) {
          // Si la caméra supporte des résolutions plus élevées, les utiliser
          if (capabilities.width?.max && capabilities.width.max >= preferredWidth) {
            width = Math.min(capabilities.width.max, preferredWidth);
          } else if (capabilities.width?.max) {
            width = capabilities.width.max;
          }

          if (capabilities.height?.max && capabilities.height.max >= preferredHeight) {
            height = Math.min(capabilities.height.max, preferredHeight);
          } else if (capabilities.height?.max) {
            height = capabilities.height.max;
          }

          // Appliquer les contraintes si possible
          if (!capabilitiesChecked.current) {
            try {
              await videoTrack.applyConstraints({
                width: { ideal: width },
                height: { ideal: height }
              });
              capabilitiesChecked.current = true;
            } catch (e) {
              console.warn('Could not apply optimal constraints:', e);
            }
          }
        }

        // Attendre que la vidéo soit chargée pour obtenir les dimensions réelles
        // Capturer width et height dans la closure pour éviter les erreurs de scope
        const capturedWidth = width;
        const capturedHeight = height;
        
        const updateResolution = () => {
          if (videoRef.current) {
            const actualWidth = videoRef.current.videoWidth || capturedWidth;
            const actualHeight = videoRef.current.videoHeight || capturedHeight;
            
            setResolution({
              width: capturedWidth,
              height: capturedHeight,
              actualWidth,
              actualHeight
            });
          }
        };

        if (videoRef.current.readyState >= 2) {
          updateResolution();
        } else {
          videoRef.current.addEventListener('loadedmetadata', updateResolution, { once: true });
        }
      } catch (error) {
        console.warn('Error getting camera capabilities:', error);
        // Fallback vers résolution par défaut
        setResolution({
          width: fallbackWidth,
          height: fallbackHeight,
          actualWidth: fallbackWidth,
          actualHeight: fallbackHeight
        });
      }
    };

    getOptimalConstraints();

    // Mettre à jour quand le stream change
    return () => {
      capabilitiesChecked.current = false;
    };
  }, [stream, videoRef, preferredWidth, preferredHeight, fallbackWidth, fallbackHeight]);

  return resolution;
};

