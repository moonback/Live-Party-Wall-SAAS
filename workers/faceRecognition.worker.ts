/**
 * Web Worker pour la reconnaissance faciale
 * Évite de bloquer le thread principal pendant la détection et comparaison de visages
 * Utilise face-api.js pour la détection
 */

// Type pour face-api.js (chargé dynamiquement)
type FaceApi = typeof import('face-api.js');

interface FaceDetectionWithDescriptor {
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

interface DetectFacesMessage {
  type: 'detect-faces';
  imageDataUrl: string;
}

interface DetectFacesResponse {
  type: 'faces-detected';
  detections: Array<{
    detection: {
      box: { x: number; y: number; width: number; height: number };
      score: number;
    };
    landmarks: {
      positions: Array<{ x: number; y: number }>;
    };
    descriptor: number[]; // Float32Array sérialisé
  }>;
}

interface CompareFacesMessage {
  type: 'compare-faces';
  descriptor1: number[];
  descriptor2: number[];
}

interface CompareFacesResponse {
  type: 'faces-compared';
  similarity: number;
}

interface FindMatchingPhotosMessage {
  type: 'find-matching-photos';
  referenceDescriptor: number[];
  photos: Array<{ id: string; url: string; type: 'photo' | 'video' }>;
  modelUrl: string;
}

interface FindMatchingPhotosProgress {
  type: 'progress';
  current: number;
  total: number;
  photoId: string;
}

interface FindMatchingPhotosResponse {
  type: 'matching-photos-found';
  matches: Array<{ id: string; url: string; similarity: number }>;
}

interface ErrorResponse {
  type: 'error';
  error: string;
}

// Variable pour stocker la bibliothèque chargée dynamiquement
let faceapi: FaceApi | null = null;
let isLoadingFaceApi = false;
let modelsLoaded = false;
let isLoadingModels = false;

// Seuil de similarité
const SIMILARITY_THRESHOLD = 0.6;

/**
 * Charge la bibliothèque face-api.js de manière dynamique
 */
const loadFaceApi = async (): Promise<FaceApi> => {
  if (faceapi) {
    return faceapi;
  }

  if (isLoadingFaceApi) {
    while (isLoadingFaceApi) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (faceapi) {
      return faceapi;
    }
    throw new Error('Erreur lors du chargement de face-api.js');
  }

  isLoadingFaceApi = true;

  try {
    const faceApiModule = await import('face-api.js');
    faceapi = faceApiModule as FaceApi;
    return faceapi;
  } catch (error) {
    isLoadingFaceApi = false;
    throw new Error('Impossible de charger la bibliothèque face-api.js');
  } finally {
    isLoadingFaceApi = false;
  }
};

/**
 * Charge les modèles face-api.js
 */
const loadFaceModels = async (modelUrl: string): Promise<boolean> => {
  if (modelsLoaded) {
    return true;
  }

  if (isLoadingModels) {
    while (isLoadingModels) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return modelsLoaded;
  }

  isLoadingModels = true;

  try {
    const faceApiLib = await loadFaceApi();

    await Promise.all([
      faceApiLib.nets.tinyFaceDetector.loadFromUri(modelUrl),
      faceApiLib.nets.faceLandmark68Net.loadFromUri(modelUrl),
      faceApiLib.nets.faceRecognitionNet.loadFromUri(modelUrl),
    ]);

    modelsLoaded = true;
    return true;
  } catch (error) {
    modelsLoaded = false;
    return false;
  } finally {
    isLoadingModels = false;
  }
};

/**
 * Calcule la distance euclidienne entre deux descripteurs
 */
const euclideanDistance = (descriptor1: number[], descriptor2: number[]): number => {
  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

/**
 * Compare deux descripteurs et retourne un score de similarité
 */
const compareFaces = (descriptor1: number[], descriptor2: number[]): number => {
  const distance = euclideanDistance(descriptor1, descriptor2);
  return 1 / (1 + distance);
};

/**
 * Charge une image depuis une data URL
 */
const loadImageFromDataUrl = async (imageDataUrl: string): Promise<ImageBitmap> => {
  const response = await fetch(imageDataUrl);
  const blob = await response.blob();
  return await createImageBitmap(blob);
};

/**
 * Charge une image depuis une URL
 */
const loadImageFromUrl = async (url: string): Promise<ImageBitmap> => {
  const response = await fetch(url, { mode: 'cors' });
  if (!response.ok) {
    throw new Error(`Erreur de chargement de l'image: ${url}`);
  }
  const blob = await response.blob();
  return await createImageBitmap(blob);
};

self.onmessage = async (e: MessageEvent) => {
  try {
    if (e.data.type === 'detect-faces') {
      const { imageDataUrl, modelUrl } = e.data as DetectFacesMessage & { modelUrl: string };
      
      // Charger les modèles si nécessaire
      if (!modelsLoaded) {
        const loaded = await loadFaceModels(modelUrl);
        if (!loaded) {
          throw new Error('Les modèles de reconnaissance faciale n\'ont pas pu être chargés');
        }
      }

      if (!faceapi) {
        await loadFaceApi();
      }

      if (!faceapi) {
        throw new Error('La bibliothèque face-api.js n\'a pas pu être chargée');
      }

      // Charger l'image
      const imageBitmap = await loadImageFromDataUrl(imageDataUrl);
      
      // Créer un canvas temporaire pour face-api.js
      const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }
      ctx.drawImage(imageBitmap, 0, 0);
      
      // Détecter les visages
      const detections = await faceapi
        .detectAllFaces(canvas as any, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      // Sérialiser les descripteurs (Float32Array -> number[])
      const serializedDetections = detections.map(det => ({
        detection: {
          box: {
            x: det.detection.box.x,
            y: det.detection.box.y,
            width: det.detection.box.width,
            height: det.detection.box.height
          },
          score: det.detection.score
        },
        landmarks: {
          positions: det.landmarks.positions.map((pos: any) => ({ x: pos.x, y: pos.y }))
        },
        descriptor: Array.from(det.descriptor)
      }));

      imageBitmap.close();

      const response: DetectFacesResponse = {
        type: 'faces-detected',
        detections: serializedDetections
      };
      
      self.postMessage(response);

    } else if (e.data.type === 'compare-faces') {
      const { descriptor1, descriptor2 } = e.data as CompareFacesMessage;
      
      const similarity = compareFaces(descriptor1, descriptor2);
      
      const response: CompareFacesResponse = {
        type: 'faces-compared',
        similarity
      };
      
      self.postMessage(response);

    } else if (e.data.type === 'find-matching-photos') {
      const { referenceDescriptor, photos, modelUrl } = e.data as FindMatchingPhotosMessage;
      
      // Charger les modèles si nécessaire
      if (!modelsLoaded) {
        const loaded = await loadFaceModels(modelUrl);
        if (!loaded) {
          throw new Error('Les modèles de reconnaissance faciale n\'ont pas pu être chargés');
        }
      }

      if (!faceapi) {
        await loadFaceApi();
      }

      if (!faceapi) {
        throw new Error('La bibliothèque face-api.js n\'a pas pu être chargée');
      }

      const matchingPhotos: Array<{ id: string; url: string; similarity: number }> = [];
      const total = photos.length;

      // Traiter les photos une par une
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        
        // Ignorer les vidéos
        if (photo.type !== 'photo') {
          continue;
        }

        try {
          // Envoyer un message de progression
          const progress: FindMatchingPhotosProgress = {
            type: 'progress',
            current: i + 1,
            total,
            photoId: photo.id
          };
          self.postMessage(progress);

          // Charger l'image
          const imageBitmap = await loadImageFromUrl(photo.url);
          
          // Créer un canvas temporaire
          const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            imageBitmap.close();
            continue;
          }
          ctx.drawImage(imageBitmap, 0, 0);
          
          // Détecter les visages
          const detections = await faceapi
            .detectAllFaces(canvas as any, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();
          
          imageBitmap.close();

          // Vérifier si un des visages correspond
          for (const detection of detections) {
            const descriptor = Array.from(detection.descriptor);
            const similarity = compareFaces(referenceDescriptor, descriptor);
            if (similarity >= SIMILARITY_THRESHOLD) {
              matchingPhotos.push({
                id: photo.id,
                url: photo.url,
                similarity,
              });
              break; // Une seule correspondance par photo suffit
            }
          }
        } catch (error) {
          // Ignorer les erreurs pour cette photo et continuer
          console.warn('Error processing photo for face recognition', photo.id, error);
        }
      }

      // Trier par similarité décroissante
      matchingPhotos.sort((a, b) => b.similarity - a.similarity);

      const response: FindMatchingPhotosResponse = {
        type: 'matching-photos-found',
        matches: matchingPhotos
      };
      
      self.postMessage(response);
    }
  } catch (error) {
    const errorResponse: ErrorResponse = {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    self.postMessage(errorResponse);
  }
};

