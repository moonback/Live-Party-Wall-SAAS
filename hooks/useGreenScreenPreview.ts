import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '../utils/logger';

interface UseGreenScreenPreviewOptions {
  enabled: boolean;
  backgroundUrl: string | null;
  sensitivity: number;
  smoothness: number;
  videoElement: HTMLVideoElement | null;
}

/**
 * Hook pour la prévisualisation en temps réel du chroma key
 * Traite le flux vidéo avec le fond vert remplacé
 */
export const useGreenScreenPreview = ({
  enabled,
  backgroundUrl,
  sensitivity,
  smoothness,
  videoElement
}: UseGreenScreenPreviewOptions) => {
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastProcessTimeRef = useRef<number>(0);
  const processingRef = useRef<boolean>(false);

  // Créer le canvas si nécessaire
  useEffect(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
  }, []);

  // Créer le worker si nécessaire
  useEffect(() => {
    if (!workerRef.current && typeof Worker !== 'undefined') {
      try {
        workerRef.current = new Worker(
          new URL('../workers/chromaKey.worker.ts', import.meta.url),
          { type: 'module' }
        );
      } catch (error) {
        logger.warn('Failed to create chroma key worker', { component: 'useGreenScreenPreview' }, error);
      }
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Fonction pour traiter une frame
  const processFrame = useCallback(async () => {
    if (!enabled || !backgroundUrl || !videoElement || !canvasRef.current || processingRef.current) {
      return;
    }

    const video = videoElement;
    const canvas = canvasRef.current;

    // Vérifier que la vidéo est prête
    if (video.readyState < 2) {
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (width === 0 || height === 0) {
      return;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Dessiner la frame vidéo sur le canvas
    ctx.drawImage(video, 0, 0, width, height);

    // Obtenir la data URL de la frame
    const frameDataUrl = canvas.toDataURL('image/jpeg', 0.8);

    // Utiliser le worker si disponible, sinon traitement synchrone (moins performant)
    if (workerRef.current) {
      processingRef.current = true;

      const handleMessage = (e: MessageEvent) => {
        if (e.data.type === 'chroma-keyed') {
          setPreviewDataUrl(e.data.imageDataUrl);
          processingRef.current = false;
          workerRef.current?.removeEventListener('message', handleMessage);
          workerRef.current?.removeEventListener('error', handleError);
        } else if (e.data.type === 'error') {
          logger.error('Chroma key worker error', { component: 'useGreenScreenPreview' }, new Error(e.data.error));
          processingRef.current = false;
          workerRef.current?.removeEventListener('message', handleMessage);
          workerRef.current?.removeEventListener('error', handleError);
        }
      };

      const handleError = (error: ErrorEvent) => {
        logger.error('Chroma key worker error', { component: 'useGreenScreenPreview' }, error);
        processingRef.current = false;
        workerRef.current?.removeEventListener('message', handleMessage);
        workerRef.current?.removeEventListener('error', handleError);
      };

      workerRef.current.addEventListener('message', handleMessage);
      workerRef.current.addEventListener('error', handleError);

      workerRef.current.postMessage({
        type: 'apply-chroma-key',
        imageDataUrl: frameDataUrl,
        backgroundUrl,
        options: {
          sensitivity,
          smoothness
        }
      });
    } else {
      // Fallback: traitement synchrone (moins performant, mais fonctionne)
      // Pour l'instant, on retourne juste la frame sans traitement
      // Le traitement complet sera fait lors de la capture
      setPreviewDataUrl(frameDataUrl);
    }
  }, [enabled, backgroundUrl, sensitivity, smoothness, videoElement]);

  // Boucle de traitement avec throttling (30fps max)
  useEffect(() => {
    if (!enabled || !backgroundUrl || !videoElement) {
      setPreviewDataUrl(null);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const targetFPS = 30;
    const frameInterval = 1000 / targetFPS;

    const loop = () => {
      const now = Date.now();
      if (now - lastProcessTimeRef.current >= frameInterval) {
        processFrame();
        lastProcessTimeRef.current = now;
      }
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [enabled, backgroundUrl, videoElement, processFrame]);

  return previewDataUrl;
};

