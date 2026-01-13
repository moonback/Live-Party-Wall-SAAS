/**
 * Service de génération d'images avec Puter.js
 * Permet de générer des images à partir de prompts texte en utilisant l'API Puter.js
 */

import { logger } from '../utils/logger';

/**
 * Génère une image à partir d'un prompt en utilisant Puter.js
 * @param prompt - Description de l'image à générer
 * @param model - Modèle à utiliser (défaut: gemini-2.5-flash-image-preview)
 * @returns Promise résolue avec l'image en base64 (format data:image/jpeg;base64,...)
 */
export const generateImageFromPrompt = async (
  prompt: string,
  model: string = 'gemini-2.5-flash-image-preview'
): Promise<string> => {
  // Vérifier que Puter.js est chargé
  if (typeof window === 'undefined' || !(window as any).puter) {
    throw new Error('Puter.js n\'est pas chargé. Veuillez rafraîchir la page.');
  }

  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Le prompt ne peut pas être vide');
  }

  try {
    logger.info('Génération d\'image en cours', { 
      component: 'imageGenerationService', 
      action: 'generateImageFromPrompt',
      model,
      promptLength: prompt.length
    });

    // Générer l'image avec Puter.js
    const imageElement = await (window as any).puter.ai.txt2img(prompt, { model });
    
    if (!imageElement || !(imageElement instanceof HTMLImageElement)) {
      throw new Error('L\'API Puter.js n\'a pas retourné une image valide');
    }

    // Attendre que l'image soit complètement chargée
    if (!imageElement.complete) {
      await new Promise((resolve, reject) => {
        imageElement.onload = resolve;
        imageElement.onerror = () => reject(new Error('Erreur lors du chargement de l\'image générée'));
        // Timeout de 30 secondes
        setTimeout(() => reject(new Error('Timeout lors du chargement de l\'image')), 30000);
      });
    }

    // Convertir en base64
    const base64 = await imageElementToBase64(imageElement);
    
    logger.info('Image générée avec succès', { 
      component: 'imageGenerationService', 
      action: 'generateImageFromPrompt',
      imageSize: base64.length
    });

    return base64;
  } catch (error) {
    logger.error('Erreur lors de la génération d\'image', error, { 
      component: 'imageGenerationService', 
      action: 'generateImageFromPrompt',
      model,
      prompt: prompt.substring(0, 50) + '...'
    });
    
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erreur inconnue lors de la génération d\'image');
  }
};

/**
 * Convertit un HTMLImageElement en base64
 * @param img - Élément image HTML à convertir
 * @returns Promise résolue avec l'image en base64 (format data:image/jpeg;base64,...)
 */
const imageElementToBase64 = (img: HTMLImageElement): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Impossible de créer le contexte canvas'));
        return;
      }

      // Dessiner l'image sur le canvas
      ctx.drawImage(img, 0, 0);

      // Convertir en blob puis en base64
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Impossible de convertir l\'image en blob'));
            return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            if (!result) {
              reject(new Error('Impossible de lire le résultat du FileReader'));
              return;
            }
            resolve(result);
          };
          reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        0.9 // Qualité JPEG (90%)
      );
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Erreur lors de la conversion de l\'image'));
    }
  });
};

/**
 * Vérifie si Puter.js est disponible
 * @returns true si Puter.js est chargé, false sinon
 */
export const isPuterAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).puter;
};

