/**
 * Hook pour gérer la reconnaissance faciale avec Web Worker
 * Évite de bloquer le thread principal pendant la détection et comparaison
 */

import { useCallback, useRef, useEffect } from 'react';
import { getFaceModelsPath } from '../utils/electronPaths';
import { logger } from '../utils/logger';

export interface FaceDetectionWithDescriptor {
  detection: {
    box: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    score: number;
  };
  landmarks: {
    positions: Array<{ x: number; y: number }>;
  };
  descriptor: Float32Array;
}

interface FindPhotosProgress {
  current: number;
  total: number;
  photoId: string;
}

export function useFaceRecognition() {
  const workerRef = useRef<Worker | null>(null);

  // Initialiser le worker une seule fois
  const getWorker = useCallback(() => {
    if (!workerRef.current) {
      try {
        workerRef.current = new Worker(
          new URL('../workers/faceRecognition.worker.ts', import.meta.url),
          { type: 'module' }
        );
      } catch (error) {
        logger.error('Failed to create face recognition worker', error, { component: 'useFaceRecognition' });
        return null;
      }
    }
    return workerRef.current;
  }, []);

  /**
   * Détecte les visages dans une image
   */
  const detectFaces = useCallback(
    async (imageDataUrl: string): Promise<FaceDetectionWithDescriptor[]> => {
      const worker = getWorker();
      if (!worker) {
        throw new Error('Web Worker not available');
      }

      const modelUrl = getFaceModelsPath();

      return new Promise((resolve, reject) => {
        const handleMessage = (e: MessageEvent) => {
          if (e.data.type === 'faces-detected') {
            worker.removeEventListener('message', handleMessage);
            worker.removeEventListener('error', handleError);
            
            // Convertir les descripteurs sérialisés en Float32Array
            const detections: FaceDetectionWithDescriptor[] = e.data.detections.map((det: any) => ({
              detection: det.detection,
              landmarks: det.landmarks,
              descriptor: new Float32Array(det.descriptor)
            }));
            
            resolve(detections);
          } else if (e.data.type === 'error') {
            worker.removeEventListener('message', handleMessage);
            worker.removeEventListener('error', handleError);
            reject(new Error(e.data.error));
          }
        };

        const handleError = (error: ErrorEvent) => {
          worker.removeEventListener('message', handleMessage);
          worker.removeEventListener('error', handleError);
          reject(new Error(`Worker error: ${error.message}`));
        };

        worker.addEventListener('message', handleMessage);
        worker.addEventListener('error', handleError);

        worker.postMessage({
          type: 'detect-faces',
          imageDataUrl,
          modelUrl
        });
      });
    },
    [getWorker]
  );

  /**
   * Compare deux descripteurs de visage
   */
  const compareFaces = useCallback(
    async (descriptor1: Float32Array, descriptor2: Float32Array): Promise<number> => {
      const worker = getWorker();
      if (!worker) {
        throw new Error('Web Worker not available');
      }

      return new Promise((resolve, reject) => {
        const handleMessage = (e: MessageEvent) => {
          if (e.data.type === 'faces-compared') {
            worker.removeEventListener('message', handleMessage);
            worker.removeEventListener('error', handleError);
            resolve(e.data.similarity);
          } else if (e.data.type === 'error') {
            worker.removeEventListener('message', handleMessage);
            worker.removeEventListener('error', handleError);
            reject(new Error(e.data.error));
          }
        };

        const handleError = (error: ErrorEvent) => {
          worker.removeEventListener('message', handleMessage);
          worker.removeEventListener('error', handleError);
          reject(new Error(`Worker error: ${error.message}`));
        };

        worker.addEventListener('message', handleMessage);
        worker.addEventListener('error', handleError);

        worker.postMessage({
          type: 'compare-faces',
          descriptor1: Array.from(descriptor1),
          descriptor2: Array.from(descriptor2)
        });
      });
    },
    [getWorker]
  );

  /**
   * Trouve les photos contenant un visage similaire
   * @param onProgress - Callback appelé à chaque progression (optionnel)
   */
  const findPhotosWithFace = useCallback(
    async (
      referenceDescriptor: Float32Array,
      photos: Array<{ id: string; url: string; type: 'photo' | 'video' }>,
      onProgress?: (progress: FindPhotosProgress) => void
    ): Promise<Array<{ id: string; url: string; similarity: number }>> => {
      const worker = getWorker();
      if (!worker) {
        throw new Error('Web Worker not available');
      }

      const modelUrl = getFaceModelsPath();

      return new Promise((resolve, reject) => {
        const handleMessage = (e: MessageEvent) => {
          if (e.data.type === 'progress' && onProgress) {
            onProgress({
              current: e.data.current,
              total: e.data.total,
              photoId: e.data.photoId
            });
          } else if (e.data.type === 'matching-photos-found') {
            worker.removeEventListener('message', handleMessage);
            worker.removeEventListener('error', handleError);
            resolve(e.data.matches);
          } else if (e.data.type === 'error') {
            worker.removeEventListener('message', handleMessage);
            worker.removeEventListener('error', handleError);
            reject(new Error(e.data.error));
          }
        };

        const handleError = (error: ErrorEvent) => {
          worker.removeEventListener('message', handleMessage);
          worker.removeEventListener('error', handleError);
          reject(new Error(`Worker error: ${error.message}`));
        };

        worker.addEventListener('message', handleMessage);
        worker.addEventListener('error', handleError);

        worker.postMessage({
          type: 'find-matching-photos',
          referenceDescriptor: Array.from(referenceDescriptor),
          photos,
          modelUrl
        });
      });
    },
    [getWorker]
  );

  // Nettoyer le worker lors du démontage
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  return {
    detectFaces,
    compareFaces,
    findPhotosWithFace
  };
}

