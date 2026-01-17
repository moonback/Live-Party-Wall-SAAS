/**
 * Service de traitement chroma key (fond vert)
 * Remplace les pixels verts par un fond de remplacement
 */

export interface ChromaKeyOptions {
  sensitivity: number; // 0-100, sensibilité de détection du vert
  smoothness: number; // 0-100, lissage des bords
  targetColor?: { r: number; g: number; b: number }; // Couleur cible (vert par défaut)
}

const DEFAULT_GREEN = { r: 0, g: 255, b: 0 }; // Vert pur par défaut

/**
 * Convertit RGB vers HSV
 */
function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff) % 6;
    } else if (max === g) {
      h = (b - r) / diff + 2;
    } else {
      h = (r - g) / diff + 4;
    }
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : diff / max;
  const v = max;

  return { h, s, v };
}

/**
 * Calcule la distance colorimétrique entre deux couleurs RGB
 */
function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  // Distance euclidienne dans l'espace RGB
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Détecte si un pixel est vert (chroma key) selon la sensibilité
 */
function isGreenPixel(
  r: number,
  g: number,
  b: number,
  targetColor: { r: number; g: number; b: number },
  sensitivity: number
): boolean {
  // Convertir en HSV pour une meilleure détection du vert
  const pixelHsv = rgbToHsv(r, g, b);
  const targetHsv = rgbToHsv(targetColor.r, targetColor.g, targetColor.b);

  // Vérifier la teinte (H) - le vert est autour de 120° en HSV
  const hueDiff = Math.abs(pixelHsv.h - targetHsv.h);
  const hueDistance = Math.min(hueDiff, 360 - hueDiff); // Distance circulaire

  // Seuil de teinte basé sur la sensibilité (0-100 -> 0-60°)
  const hueThreshold = 60 - (sensitivity / 100) * 60;

  // Vérifier aussi la saturation et la luminosité
  // Un pixel vert doit avoir une saturation élevée et une luminosité modérée
  const isGreenHue = hueDistance <= hueThreshold;
  const hasGoodSaturation = pixelHsv.s > 0.3; // Saturation minimale
  const hasGoodBrightness = pixelHsv.v > 0.2 && pixelHsv.v < 0.9; // Luminosité raisonnable

  // Utiliser aussi la distance RGB comme fallback
  const rgbDist = colorDistance(r, g, b, targetColor.r, targetColor.g, targetColor.b);
  const rgbThreshold = 255 - (sensitivity / 100) * 200; // Plus sensible = seuil plus bas

  return (isGreenHue && hasGoodSaturation && hasGoodBrightness) || rgbDist < rgbThreshold;
}

/**
 * Calcule le facteur alpha pour le lissage des bords (feathering)
 */
function calculateFeatherAlpha(
  x: number,
  y: number,
  width: number,
  height: number,
  isGreen: boolean,
  smoothness: number
): number {
  if (!isGreen) return 1; // Pixel non vert = opaque

  // Distance au bord le plus proche
  const distToEdge = Math.min(x, y, width - x - 1, height - y - 1);
  
  // Zone de lissage basée sur smoothness (0-100 -> 0-10 pixels)
  const featherRadius = (smoothness / 100) * 10;
  
  if (distToEdge < featherRadius) {
    // Lissage progressif vers les bords
    return Math.max(0, distToEdge / featherRadius);
  }

  return 0; // Pixel vert = transparent
}

/**
 * Applique le chroma key (remplacement du fond vert) à une image
 * @param imageDataUrl - Image source en base64
 * @param backgroundUrl - URL de l'image de fond de remplacement
 * @param options - Options de traitement (sensibilité, lissage)
 * @returns Promise résolue avec l'image traitée en base64
 */
export async function applyChromaKey(
  imageDataUrl: string,
  backgroundUrl: string,
  options: ChromaKeyOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    const sourceImg = new Image();
    sourceImg.crossOrigin = 'anonymous';

    sourceImg.onload = () => {
      const backgroundImg = new Image();
      backgroundImg.crossOrigin = 'anonymous';

      backgroundImg.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const width = sourceImg.width;
          const height = sourceImg.height;
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d', {
            willReadFrequently: true
          });

          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          // Dessiner l'image de fond (redimensionnée si nécessaire)
          ctx.drawImage(backgroundImg, 0, 0, width, height);

          // Dessiner l'image source par-dessus
          ctx.drawImage(sourceImg, 0, 0, width, height);

          // Obtenir les données des pixels
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          const sourceData = new Uint8ClampedArray(data.length);

          // Charger l'image source dans un canvas temporaire pour lire les pixels
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = width;
          tempCanvas.height = height;
          const tempCtx = tempCanvas.getContext('2d');
          if (!tempCtx) {
            reject(new Error('Temporary canvas context not available'));
            return;
          }
          tempCtx.drawImage(sourceImg, 0, 0, width, height);
          const sourceImageData = tempCtx.getImageData(0, 0, width, height);
          const sourcePixels = sourceImageData.data;

          // Traiter chaque pixel
          const targetColor = options.targetColor || DEFAULT_GREEN;
          const sensitivity = Math.max(0, Math.min(100, options.sensitivity));
          const smoothness = Math.max(0, Math.min(100, options.smoothness));

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = (y * width + x) * 4;
              const r = sourcePixels[idx];
              const g = sourcePixels[idx + 1];
              const b = sourcePixels[idx + 2];
              const a = sourcePixels[idx + 3];

              // Ignorer les pixels déjà transparents
              if (a === 0) continue;

              // Détecter si le pixel est vert
              const isGreen = isGreenPixel(r, g, b, targetColor, sensitivity);

              if (isGreen) {
                // Calculer l'alpha avec lissage
                const alpha = calculateFeatherAlpha(x, y, width, height, true, smoothness);
                
                // Mélanger le pixel source avec le fond selon l'alpha
                const bgR = data[idx];
                const bgG = data[idx + 1];
                const bgB = data[idx + 2];

                data[idx] = Math.round(r * (1 - alpha) + bgR * alpha);
                data[idx + 1] = Math.round(g * (1 - alpha) + bgG * alpha);
                data[idx + 2] = Math.round(b * (1 - alpha) + bgB * alpha);
                data[idx + 3] = Math.round(255 * (1 - alpha) + 255 * alpha);
              }
            }
          }

          // Appliquer les modifications
          ctx.putImageData(imageData, 0, 0);

          // Convertir en base64
          resolve(canvas.toDataURL('image/jpeg', 1.0));
        } catch (error) {
          reject(error);
        }
      };

      backgroundImg.onerror = () => {
        reject(new Error('Failed to load background image'));
      };

      backgroundImg.src = backgroundUrl;
    };

    sourceImg.onerror = () => {
      reject(new Error('Failed to load source image'));
    };

    sourceImg.src = imageDataUrl;
  });
}

