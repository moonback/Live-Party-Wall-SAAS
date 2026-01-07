/**
 * Utilitaires pour appliquer des filtres esthétiques aux images
 */

export type FilterType = 'none' | 'vintage' | 'blackwhite' | 'warm' | 'cool';
export type FrameType = 'none' | 'polaroid' | 'neon' | 'gold' | 'simple';

/**
 * Applique un filtre CSS à une image via canvas
 */
export const applyImageFilter = (
  imageDataUrl: string,
  filter: FilterType,
  frame: FrameType = 'none'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // 1. Définir la taille du canvas
      // Pour le polaroid, on a besoin de plus de place
      let canvasWidth = img.width;
      let canvasHeight = img.height;
      let offsetX = 0;
      let offsetY = 0;

      if (frame === 'polaroid') {
        const padding = Math.max(img.width, img.height) * 0.1;
        const bottomPadding = padding * 3;
        canvasWidth = img.width + (padding * 2);
        canvasHeight = img.height + padding + bottomPadding;
        offsetX = padding;
        offsetY = padding;
      } else if (frame === 'simple' || frame === 'neon' || frame === 'gold') {
         // Bordure interne, pas de changement de taille
      }

      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // 2. Fond (pour polaroid)
      if (frame === 'polaroid') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Ombre légère interne
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      // 3. Appliquer le filtre
      ctx.save();
      switch (filter) {
        case 'vintage':
          ctx.filter = 'sepia(0.5) contrast(1.2) brightness(0.95)';
          break;
        case 'blackwhite':
          ctx.filter = 'grayscale(100%)';
          break;
        case 'warm':
          ctx.filter = 'sepia(0.3) saturate(1.2) brightness(1.05)';
          break;
        case 'cool':
          ctx.filter = 'hue-rotate(180deg) saturate(0.8) brightness(1.1)';
          break;
        default:
          ctx.filter = 'none';
      }

      // Dessiner l'image
      ctx.drawImage(img, offsetX, offsetY, img.width, img.height);
      ctx.restore();

      // 4. Appliquer les cadres (Overlay)
      if (frame === 'neon') {
        const lineWidth = Math.min(canvas.width, canvas.height) * 0.03;
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = '#ec4899'; // Pink-500
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 20;
        ctx.strokeRect(lineWidth/2, lineWidth/2, canvas.width - lineWidth, canvas.height - lineWidth);
      } else if (frame === 'gold') {
        const lineWidth = Math.min(canvas.width, canvas.height) * 0.04;
        ctx.lineWidth = lineWidth;
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#bf953f');
        gradient.addColorStop(0.25, '#fcf6ba');
        gradient.addColorStop(0.5, '#b38728');
        gradient.addColorStop(0.75, '#fbf5b7');
        gradient.addColorStop(1, '#aa771c');
        ctx.strokeStyle = gradient;
        ctx.strokeRect(lineWidth/2, lineWidth/2, canvas.width - lineWidth, canvas.height - lineWidth);
      } else if (frame === 'simple') {
        const lineWidth = Math.min(canvas.width, canvas.height) * 0.05;
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(lineWidth/2, lineWidth/2, canvas.width - lineWidth, canvas.height - lineWidth);
      }

      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };

    img.onerror = reject;
    img.src = imageDataUrl;
  });
};

/**
 * Améliore la qualité d'une image si nécessaire
 */
export const enhanceImageQuality = (imageDataUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Amélioration légère : contraste et netteté
      ctx.filter = 'contrast(1.1) brightness(1.02)';
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };

    img.onerror = reject;
    img.src = imageDataUrl;
  });
};
