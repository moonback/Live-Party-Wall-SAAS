/**
 * Hook pour compresser des images avec un Web Worker
 * Évite de bloquer le thread principal
 */

import { useState, useCallback, useRef } from 'react';

interface CompressionOptions {
  maxWidth: number;
  quality: number;
}

interface CompressionResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
}

export function useImageCompression() {
  const [isCompressing, setIsCompressing] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  // Initialiser le worker une seule fois
  const getWorker = useCallback(() => {
    if (!workerRef.current) {
      // Créer le worker depuis le fichier
      // Vite gère automatiquement les workers avec ?worker
      workerRef.current = new Worker(
        new URL('../workers/imageCompression.worker.ts', import.meta.url),
        { type: 'module' }
      );
    }
    return workerRef.current;
  }, []);

  const compressImage = useCallback(
    async (file: File, options: CompressionOptions): Promise<CompressionResult> => {
      setIsCompressing(true);

      return new Promise((resolve, reject) => {
        const worker = getWorker();

        const handleMessage = (e: MessageEvent) => {
          if (e.data.type === 'compressed') {
            // Convertir le blob en data URL
            const reader = new FileReader();
            reader.onload = () => {
              setIsCompressing(false);
              worker.removeEventListener('message', handleMessage);
              worker.removeEventListener('error', handleError);
              
              resolve({
                dataUrl: reader.result as string,
                originalSize: e.data.originalSize,
                compressedSize: e.data.compressedSize,
              });
            };
            reader.onerror = () => {
              setIsCompressing(false);
              worker.removeEventListener('message', handleMessage);
              worker.removeEventListener('error', handleError);
              reject(new Error('Failed to read compressed image'));
            };
            reader.readAsDataURL(e.data.blob);
          } else if (e.data.type === 'error') {
            setIsCompressing(false);
            worker.removeEventListener('message', handleMessage);
            worker.removeEventListener('error', handleError);
            reject(new Error(e.data.error));
          }
        };

        const handleError = (error: ErrorEvent) => {
          setIsCompressing(false);
          worker.removeEventListener('message', handleMessage);
          worker.removeEventListener('error', handleError);
          reject(new Error(`Worker error: ${error.message}`));
        };

        worker.addEventListener('message', handleMessage);
        worker.addEventListener('error', handleError);

        // Envoyer la tâche de compression
        worker.postMessage({
          type: 'compress',
          file,
          maxWidth: options.maxWidth,
          quality: options.quality,
        });
      });
    },
    [getWorker]
  );

  // Nettoyer le worker lors du démontage
  const cleanup = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  return {
    compressImage,
    isCompressing,
    cleanup,
  };
}

