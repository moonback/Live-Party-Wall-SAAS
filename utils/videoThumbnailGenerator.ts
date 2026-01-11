/**
 * Utilitaires pour générer des miniatures vidéo
 */

import { logger } from './logger';

/**
 * Génère une miniature à partir d'une vidéo
 * @param videoUrl - URL de la vidéo
 * @param timeSeconds - Temps en secondes pour extraire la frame (défaut: 1)
 * @param quality - Qualité JPEG 0-1 (défaut: 0.8)
 * @returns Promise avec data URL de l'image
 */
export async function generateVideoThumbnail(
  videoUrl: string,
  timeSeconds: number = 1,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;
    video.currentTime = timeSeconds;
    video.muted = true;
    video.playsInline = true;

    const handleLoadedData = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Impossible de créer le contexte canvas'));
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnail = canvas.toDataURL('image/jpeg', quality);
      resolve(thumbnail);

      // Nettoyage
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.src = '';
    };

    const handleError = (error: Event) => {
      reject(new Error('Erreur lors du chargement de la vidéo'));
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
    };

    video.addEventListener('loadeddata', handleLoadedData, { once: true });
    video.addEventListener('error', handleError, { once: true });

    video.load();
  });
}

/**
 * Génère plusieurs miniatures à partir d'une vidéo (pour carrousel)
 * @param videoUrl - URL de la vidéo
 * @param count - Nombre de miniatures à générer
 * @param duration - Durée totale de la vidéo en secondes
 * @returns Promise avec tableau de data URLs
 */
export async function generateMultipleThumbnails(
  videoUrl: string,
  count: number = 4,
  duration: number
): Promise<string[]> {
  const thumbnails: string[] = [];
  const interval = duration / (count + 1);

  for (let i = 1; i <= count; i++) {
    const time = interval * i;
    try {
      const thumbnail = await generateVideoThumbnail(videoUrl, time);
      thumbnails.push(thumbnail);
    } catch (error) {
      logger.error(`Erreur génération thumbnail à ${time}s`, error, { component: 'videoThumbnailGenerator', action: 'generateThumbnails', time });
    }
  }

  return thumbnails;
}

/**
 * Génère une miniature animée (GIF) à partir d'une vidéo
 * Note: Cette fonction nécessite une bibliothèque externe comme gif.js
 * @param videoUrl - URL de la vidéo
 * @param startTime - Temps de début en secondes
 * @param duration - Durée en secondes (max 3s recommandé)
 * @returns Promise avec blob du GIF
 */
export async function generateAnimatedThumbnail(
  videoUrl: string,
  startTime: number = 0,
  duration: number = 2
): Promise<Blob> {
  // Cette implémentation nécessite gif.js ou une alternative
  // Exemple conceptuel:
  return new Promise((resolve, reject) => {
    // TODO: Implémenter avec gif.js
    reject(new Error('Non implémenté - nécessite gif.js'));
  });
}


