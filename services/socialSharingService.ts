import { Photo } from '../types';
import { logger } from '../utils/logger';

/**
 * Génère une image Instagram Story (1080x1920) avec watermark
 * @param photo - Photo à transformer
 * @param restaurantName - Nom du restaurant
 * @param caption - Légende à afficher (optionnel)
 * @returns Promise résolue avec le Blob de l'image Story
 */
export const generateInstagramStory = async (
  photo: Photo,
  restaurantName: string,
  caption?: string
): Promise<Blob> => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Impossible de créer le contexte canvas');
    }

    // Charger l'image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = photo.url;
    });

    // Calculer les dimensions pour remplir le canvas (maintenir le ratio)
    const imgRatio = img.width / img.height;
    const canvasRatio = canvas.width / canvas.height;
    
    let drawWidth = canvas.width;
    let drawHeight = canvas.height;
    let drawX = 0;
    let drawY = 0;

    if (imgRatio > canvasRatio) {
      // Image plus large : ajuster la hauteur
      drawHeight = canvas.width / imgRatio;
      drawY = (canvas.height - drawHeight) / 2;
    } else {
      // Image plus haute : ajuster la largeur
      drawWidth = canvas.height * imgRatio;
      drawX = (canvas.width - drawWidth) / 2;
    }

    // Fond noir
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dessiner l'image centrée
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    // Ajouter un overlay sombre en bas pour la légende
    const gradient = ctx.createLinearGradient(0, canvas.height - 400, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, canvas.height - 400, canvas.width, 400);

    // Ajouter la légende si fournie
    if (caption) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      
      // Découper la légende en plusieurs lignes si nécessaire
      const words = caption.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      
      words.forEach((word) => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > canvas.width - 200 && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      if (currentLine) {
        lines.push(currentLine);
      }

      // Dessiner les lignes
      lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, canvas.height - 100 - (lines.length - 1 - index) * 60);
      });
    }

    // Ajouter le watermark discret en bas à droite
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '32px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(restaurantName, canvas.width - 40, canvas.height - 40);

    // Convertir en Blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Erreur lors de la conversion en Blob'));
          }
        },
        'image/jpeg',
        0.9
      );
    });
  } catch (error) {
    logger.error('Error generating Instagram Story', error, {
      component: 'socialSharingService',
      action: 'generateInstagramStory'
    });
    throw error;
  }
};

/**
 * Génère une image Instagram Reel (1080x1920) avec watermark
 * Identique à Story pour l'instant (format vertical)
 */
export const generateInstagramReel = async (
  photo: Photo,
  restaurantName: string,
  caption?: string
): Promise<Blob> => {
  // Pour l'instant, Reel = Story (même format)
  return generateInstagramStory(photo, restaurantName, caption);
};

/**
 * Ajoute un watermark discret à une image
 * @param imageBlob - Blob de l'image
 * @param restaurantName - Nom du restaurant
 * @returns Promise résolue avec le Blob de l'image avec watermark
 */
export const addWatermark = async (
  imageBlob: Blob,
  restaurantName: string
): Promise<Blob> => {
  try {
    const img = new Image();
    const imgUrl = URL.createObjectURL(imageBlob);
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imgUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Impossible de créer le contexte canvas');
    }

    // Dessiner l'image originale
    ctx.drawImage(img, 0, 0);

    // Ajouter le watermark en bas à droite
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    const fontSize = Math.max(16, img.width / 40); // Taille adaptative
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(restaurantName, img.width - 20, img.height - 20);

    // Nettoyer l'URL
    URL.revokeObjectURL(imgUrl);

    // Convertir en Blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Erreur lors de la conversion en Blob'));
          }
        },
        'image/jpeg',
        0.9
      );
    });
  } catch (error) {
    logger.error('Error adding watermark', error, {
      component: 'socialSharingService',
      action: 'addWatermark'
    });
    throw error;
  }
};

/**
 * Génère un lien WhatsApp pour partager une photo
 * @param photoUrl - URL de la photo
 * @param restaurantName - Nom du restaurant
 * @param caption - Légende (optionnel)
 * @returns URL WhatsApp
 */
export const shareToWhatsApp = (
  photoUrl: string,
  restaurantName: string,
  caption?: string
): string => {
  const text = caption 
    ? `${caption}\n\n📍 ${restaurantName}`
    : `📍 ${restaurantName}`;
  
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(photoUrl);
  
  // WhatsApp Web ne supporte pas directement les images via URL
  // On retourne juste le texte avec le lien
  return `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
};

/**
 * Télécharge un Blob en tant que fichier
 * @param blob - Blob à télécharger
 * @param filename - Nom du fichier
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

