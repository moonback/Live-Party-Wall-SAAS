/**
 * Service pour générer des images de fond avec l'IA (Puter.js) et les uploader automatiquement
 */

import { generateImage, PuterImageOptions } from './puterImageService';
import { uploadBackgroundImage, UploadBackgroundResult } from './backgroundService';
import { updateSettings, EventSettings } from './settingsService';
import { logger } from '../utils/logger';

export interface GenerateAndUploadResult {
  publicUrl: string;
  path: string;
  imageElement: HTMLImageElement;
}

/**
 * Convertit un élément HTMLImageElement en File
 * @param imageElement - Élément image à convertir
 * @param filename - Nom du fichier
 * @param mimeType - Type MIME (par défaut: image/png)
 * @returns Promise résolue avec le File
 */
async function imageElementToFile(
  imageElement: HTMLImageElement,
  filename: string,
  mimeType: string = 'image/png'
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = imageElement.naturalWidth || imageElement.width;
    canvas.height = imageElement.naturalHeight || imageElement.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Impossible de créer le contexte canvas'));
      return;
    }

    // Dessiner l'image sur le canvas
    ctx.drawImage(imageElement, 0, 0);

    // Convertir le canvas en Blob
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Impossible de convertir l\'image en blob'));
          return;
        }

        // Créer un File à partir du Blob
        const file = new File([blob], filename, { type: mimeType });
        resolve(file);
      },
      mimeType,
      0.95 // Qualité (pour JPEG, ignoré pour PNG)
    );
  });
}

/**
 * Génère une image de fond avec l'IA et l'upload automatiquement vers Supabase
 * @param eventId - ID de l'événement
 * @param prompt - Description de l'image à générer
 * @param type - Type d'image ('desktop' ou 'mobile')
 * @param options - Options de génération Puter.js (modèle, qualité)
 * @returns Promise résolue avec l'URL publique et le chemin du fichier
 */
export async function generateAndUploadBackground(
  eventId: string,
  prompt: string,
  type: 'desktop' | 'mobile',
  options: PuterImageOptions = {}
): Promise<GenerateAndUploadResult> {
  try {
    logger.info('Starting AI background generation', {
      component: 'aiBackgroundService',
      action: 'generateAndUploadBackground',
      eventId,
      type,
      prompt: prompt.substring(0, 50) + '...'
    });

    // 1. Générer l'image avec Puter.js
    const imageElement = await generateImage(prompt, options);

    // 2. Convertir l'élément image en File
    const timestamp = Date.now();
    const filename = `ai-background-${type}-${timestamp}.png`;
    const file = await imageElementToFile(imageElement, filename, 'image/png');

    // 3. Upload vers Supabase
    const uploadResult: UploadBackgroundResult = await uploadBackgroundImage(
      eventId,
      file,
      type
    );

    // 4. Mettre à jour les settings avec la nouvelle URL
    const fieldName = type === 'desktop' ? 'background_desktop_url' : 'background_mobile_url';
    await updateSettings(eventId, {
      [fieldName]: uploadResult.publicUrl
    } as Partial<EventSettings>);

    logger.info('AI background generated and uploaded successfully', {
      component: 'aiBackgroundService',
      action: 'generateAndUploadBackground',
      eventId,
      type,
      publicUrl: uploadResult.publicUrl
    });

    return {
      publicUrl: uploadResult.publicUrl,
      path: uploadResult.path,
      imageElement
    };
  } catch (error) {
    logger.error('Error generating and uploading AI background', error, {
      component: 'aiBackgroundService',
      action: 'generateAndUploadBackground',
      eventId,
      type
    });
    throw error;
  }
}

/**
 * Génère une image de fond avec l'IA sans l'uploader (pour aperçu)
 * @param prompt - Description de l'image à générer
 * @param options - Options de génération Puter.js (modèle, qualité)
 * @returns Promise résolue avec l'élément HTMLImageElement
 */
export async function generateBackgroundPreview(
  prompt: string,
  options: PuterImageOptions = {}
): Promise<HTMLImageElement> {
  try {
    logger.info('Generating AI background preview', {
      component: 'aiBackgroundService',
      action: 'generateBackgroundPreview',
      prompt: prompt.substring(0, 50) + '...'
    });

    const imageElement = await generateImage(prompt, options);

    logger.info('AI background preview generated successfully', {
      component: 'aiBackgroundService',
      action: 'generateBackgroundPreview'
    });

    return imageElement;
  } catch (error) {
    logger.error('Error generating AI background preview', error, {
      component: 'aiBackgroundService',
      action: 'generateBackgroundPreview'
    });
    throw error;
  }
}

