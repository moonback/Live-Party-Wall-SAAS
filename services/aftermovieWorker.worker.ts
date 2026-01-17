/**
 * Web Worker pour le chargement et le traitement des images pour les aftermovies
 * Utilise createImageBitmap() pour réduire l'empreinte mémoire
 * 
 * Communication avec le thread principal :
 * - Le worker reçoit des URLs d'images à charger
 * - Il retourne les ImageBitmap via postMessage (avec Transferable pour performance)
 */

export interface LoadImageMessage {
  type: 'loadImage';
  id: string;
  url: string;
}

export interface LoadImageBatchMessage {
  type: 'loadImageBatch';
  photos: Array<{ id: string; url: string; type: 'photo' | 'video' }>;
}

export interface CancelMessage {
  type: 'cancel';
}

export type WorkerMessage = LoadImageMessage | LoadImageBatchMessage | CancelMessage;

interface ImageLoadedResponse {
  type: 'imageLoaded';
  id: string;
  bitmap: ImageBitmap;
}

interface ImageErrorResponse {
  type: 'imageError';
  id: string;
  error: string;
}

interface BatchProgressResponse {
  type: 'batchProgress';
  loaded: number;
  total: number;
  currentId: string;
}

type WorkerResponse = ImageLoadedResponse | ImageErrorResponse | BatchProgressResponse;

let abortController: AbortController | null = null;

self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  switch (message.type) {
    case 'loadImage': {
      try {
        // Annuler toute opération précédente si nécessaire
        if (abortController) {
          abortController.abort();
        }
        abortController = new AbortController();

        const response = await fetch(message.url, { 
          mode: 'cors', 
          signal: abortController.signal 
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        
        // Utiliser createImageBitmap() pour meilleures performances et moins de mémoire
        const bitmap = await createImageBitmap(blob);

        // Transférer l'ImageBitmap au thread principal (Transferable)
        // Cela évite la copie et améliore les performances
        const responseMessage: ImageLoadedResponse = {
          type: 'imageLoaded',
          id: message.id,
          bitmap
        };

        // @ts-ignore - TypeScript ne reconnaît pas ImageBitmap comme Transferable
        self.postMessage(responseMessage, [bitmap]);
      } catch (error) {
        const errorMessage: ImageErrorResponse = {
          type: 'imageError',
          id: message.id,
          error: error instanceof Error ? error.message : String(error)
        };
        self.postMessage(errorMessage);
      }
      break;
    }

    case 'loadImageBatch': {
      try {
        // Annuler toute opération précédente si nécessaire
        if (abortController) {
          abortController.abort();
        }
        abortController = new AbortController();

        const photos = message.photos;
        const total = photos.length;
        let loaded = 0;

        // Charger les images en parallèle (par lots pour éviter de surcharger)
        const BATCH_SIZE = 5; // Charger 5 images à la fois
        
        for (let i = 0; i < photos.length; i += BATCH_SIZE) {
          const batch = photos.slice(i, i + BATCH_SIZE);
          
          // Envoyer le progrès
          const progressMessage: BatchProgressResponse = {
            type: 'batchProgress',
            loaded,
            total,
            currentId: batch[0]?.id || ''
          };
          self.postMessage(progressMessage);

          // Charger le lot en parallèle
          const batchPromises = batch.map(async (photo) => {
            // Pour les vidéos, on ne les charge pas dans le worker (trop complexe)
            // On les laisse au thread principal
            if (photo.type === 'video') {
              return null;
            }

            try {
              const response = await fetch(photo.url, { 
                mode: 'cors', 
                signal: abortController?.signal 
              });
              
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
              }

              const blob = await response.blob();
              const bitmap = await createImageBitmap(blob);

              loaded++;

              const responseMessage: ImageLoadedResponse = {
                type: 'imageLoaded',
                id: photo.id,
                bitmap
              };

              // @ts-ignore - TypeScript ne reconnaît pas ImageBitmap comme Transferable
              self.postMessage(responseMessage, [bitmap]);
            } catch (error) {
              const errorMessage: ImageErrorResponse = {
                type: 'imageError',
                id: photo.id,
                error: error instanceof Error ? error.message : String(error)
              };
              self.postMessage(errorMessage);
            }
          });

          await Promise.all(batchPromises);
        }

        // Envoyer le progrès final
        const finalProgress: BatchProgressResponse = {
          type: 'batchProgress',
          loaded,
          total,
          currentId: ''
        };
        self.postMessage(finalProgress);
      } catch (error) {
        // Erreur générale
        console.error('Erreur dans loadImageBatch:', error);
      }
      break;
    }

    case 'cancel': {
      if (abortController) {
        abortController.abort();
        abortController = null;
      }
      break;
    }
  }
});

