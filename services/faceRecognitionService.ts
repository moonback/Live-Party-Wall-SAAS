/**
 * Service de reconnaissance faciale utilisant face-api.js
 * Permet de détecter et comparer les visages dans les photos
 */

import * as faceapi from 'face-api.js';
import { logger } from '../utils/logger';
import { getFaceModelsPath } from '../utils/electronPaths';

// État de chargement des modèles
let modelsLoaded = false;
let isLoadingModels = false;

// Seuil de similarité pour considérer deux visages comme identiques (0-1)
// Plus proche de 1 = plus strict
const SIMILARITY_THRESHOLD = 0.6;

/**
 * Charge les modèles face-api.js depuis le dossier public
 * Les modèles doivent être dans public/models/face-api/
 */
export const loadFaceModels = async (): Promise<boolean> => {
  if (modelsLoaded) {
    return true;
  }

  if (isLoadingModels) {
    // Attendre que le chargement en cours se termine
    while (isLoadingModels) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return modelsLoaded;
  }

  isLoadingModels = true;

  try {
    // Utiliser la fonction utilitaire pour obtenir le bon chemin (Electron ou web)
    const MODEL_URL = getFaceModelsPath();

    // Charger les modèles nécessaires
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);

    modelsLoaded = true;
    logger.info('Face recognition models loaded successfully', { component: 'faceRecognitionService' });
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error loading face recognition models', error, { 
      component: 'faceRecognitionService',
      errorMessage 
    });
    
    // Vérifier si c'est une erreur 404 (modèles manquants)
    if (errorMessage.includes('404') || errorMessage.includes('Not Found') || errorMessage.includes('Failed to fetch')) {
      logger.warn('Face recognition models not found. Please download them from GitHub (see public/models/face-api/README.md)', {
        component: 'faceRecognitionService'
      });
    }
    
    // Vérifier si c'est une erreur de tensor corrompu (modèles incomplets)
    if (errorMessage.includes('tensor') || errorMessage.includes('shape') || errorMessage.includes('values')) {
      logger.warn('Face recognition models appear to be corrupted or incomplete. Please re-download them from GitHub (see public/models/face-api/README.md)', {
        component: 'faceRecognitionService'
      });
    }
    
    modelsLoaded = false;
    return false;
  } finally {
    isLoadingModels = false;
  }
};

/**
 * Détecte les visages dans une image
 * @param imageElement - Élément HTMLImageElement, HTMLCanvasElement ou ImageData
 * @returns Promise avec les descripteurs de visages détectés
 */
export const detectFaces = async (
  imageElement: HTMLImageElement | HTMLCanvasElement | ImageData
): Promise<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68>>[]> => {
  if (!modelsLoaded) {
    const loaded = await loadFaceModels();
    if (!loaded) {
      throw new Error('Les modèles de reconnaissance faciale n\'ont pas pu être chargés');
    }
  }

  try {
    // Détecter les visages avec leurs landmarks et descripteurs
    const detections = await faceapi
      .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    return detections;
  } catch (error) {
    logger.error('Error detecting faces', error, { component: 'faceRecognitionService' });
    throw error;
  }
};

/**
 * Calcule la distance euclidienne entre deux descripteurs de visage
 * Plus la distance est faible, plus les visages sont similaires
 * @param descriptor1 - Premier descripteur
 * @param descriptor2 - Deuxième descripteur
 * @returns Distance euclidienne (0 = identique, plus grand = différent)
 */
const euclideanDistance = (
  descriptor1: Float32Array,
  descriptor2: Float32Array
): number => {
  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

/**
 * Compare deux descripteurs de visage et retourne un score de similarité
 * @param descriptor1 - Premier descripteur
 * @param descriptor2 - Deuxième descripteur
 * @returns Score de similarité (0-1, 1 = identique)
 */
export const compareFaces = (
  descriptor1: Float32Array,
  descriptor2: Float32Array
): number => {
  const distance = euclideanDistance(descriptor1, descriptor2);
  // Convertir la distance en score de similarité (0-1)
  // Utilise une fonction sigmoïde pour normaliser
  const similarity = 1 / (1 + distance);
  return similarity;
};

/**
 * Vérifie si deux visages sont similaires selon le seuil défini
 * @param descriptor1 - Premier descripteur
 * @param descriptor2 - Deuxième descripteur
 * @returns true si les visages sont similaires
 */
export const areFacesSimilar = (
  descriptor1: Float32Array,
  descriptor2: Float32Array
): boolean => {
  const similarity = compareFaces(descriptor1, descriptor2);
  return similarity >= SIMILARITY_THRESHOLD;
};

/**
 * Trouve les photos contenant un visage similaire au visage de référence
 * @param referenceDescriptor - Descripteur du visage de référence
 * @param photos - Liste des photos à analyser
 * @returns Promise avec les photos contenant un visage similaire
 */
export const findPhotosWithFace = async (
  referenceDescriptor: Float32Array,
  photos: Array<{ id: string; url: string; type: 'photo' | 'video' }>
): Promise<Array<{ id: string; url: string; similarity: number }>> => {
  if (!modelsLoaded) {
    const loaded = await loadFaceModels();
    if (!loaded) {
      throw new Error('Les modèles de reconnaissance faciale n\'ont pas pu être chargés');
    }
  }

  const matchingPhotos: Array<{ id: string; url: string; similarity: number }> = [];

  // Traiter les photos une par une pour éviter la surcharge
  for (const photo of photos) {
    // Ignorer les vidéos pour l'instant
    if (photo.type !== 'photo') {
      continue;
    }

    try {
      // Charger l'image
      const img = await loadImageFromUrl(photo.url);
      
      // Détecter les visages dans la photo
      const detections = await detectFaces(img);
      
      // Vérifier si un des visages correspond
      for (const detection of detections) {
        const similarity = compareFaces(referenceDescriptor, detection.descriptor);
        if (similarity >= SIMILARITY_THRESHOLD) {
          matchingPhotos.push({
            id: photo.id,
            url: photo.url,
            similarity,
          });
          // Une seule correspondance par photo suffit
          break;
        }
      }
    } catch (error) {
      // Ignorer les erreurs pour cette photo et continuer
      logger.warn('Error processing photo for face recognition', { 
        photoId: photo.id, 
        error,
        component: 'faceRecognitionService' 
      });
    }
  }

  // Trier par similarité décroissante
  matchingPhotos.sort((a, b) => b.similarity - a.similarity);

  return matchingPhotos;
};

/**
 * Charge une image depuis une URL
 * @param url - URL de l'image
 * @returns Promise avec l'élément image chargé
 */
const loadImageFromUrl = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(new Error(`Erreur de chargement de l'image: ${url}`));
    img.src = url;
  });
};

/**
 * Convertit une image base64 en HTMLImageElement
 * @param base64Image - Image en base64
 * @returns Promise avec l'élément image
 */
export const loadImageFromBase64 = (base64Image: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(new Error('Erreur de chargement de l\'image base64'));
    img.src = base64Image;
  });
};

