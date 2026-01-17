/**
 * Web Worker pour le traitement chroma key (fond vert)
 * Évite de bloquer le thread principal pendant le traitement
 */

interface ChromaKeyOptions {
  sensitivity: number;
  smoothness: number;
  targetColor?: { r: number; g: number; b: number };
}

interface ApplyChromaKeyMessage {
  type: 'apply-chroma-key';
  imageDataUrl: string;
  backgroundUrl: string;
  options: ChromaKeyOptions;
}

interface ChromaKeyResponse {
  type: 'chroma-keyed';
  imageDataUrl: string;
}

interface ErrorResponse {
  type: 'error';
  error: string;
}

/**
 * Charge une image depuis une URL et retourne un ImageBitmap
 */
const loadImageBitmapFromUrl = async (url: string): Promise<ImageBitmap> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return await createImageBitmap(blob);
};

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
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Détecte si un pixel est vert (chroma key)
 */
function isGreenPixel(
  r: number,
  g: number,
  b: number,
  targetColor: { r: number; g: number; b: number },
  sensitivity: number
): boolean {
  const pixelHsv = rgbToHsv(r, g, b);
  const targetHsv = rgbToHsv(targetColor.r, targetColor.g, targetColor.b);

  const hueDiff = Math.abs(pixelHsv.h - targetHsv.h);
  const hueDistance = Math.min(hueDiff, 360 - hueDiff);

  const hueThreshold = 60 - (sensitivity / 100) * 60;
  const isGreenHue = hueDistance <= hueThreshold;
  const hasGoodSaturation = pixelHsv.s > 0.3;
  const hasGoodBrightness = pixelHsv.v > 0.2 && pixelHsv.v < 0.9;

  const rgbDist = colorDistance(r, g, b, targetColor.r, targetColor.g, targetColor.b);
  const rgbThreshold = 255 - (sensitivity / 100) * 200;

  return (isGreenHue && hasGoodSaturation && hasGoodBrightness) || rgbDist < rgbThreshold;
}

/**
 * Calcule le facteur alpha pour le lissage des bords
 */
function calculateFeatherAlpha(
  x: number,
  y: number,
  width: number,
  height: number,
  isGreen: boolean,
  smoothness: number
): number {
  if (!isGreen) return 1;

  const distToEdge = Math.min(x, y, width - x - 1, height - y - 1);
  const featherRadius = (smoothness / 100) * 10;

  if (distToEdge < featherRadius) {
    return Math.max(0, distToEdge / featherRadius);
  }

  return 0;
}

const DEFAULT_GREEN = { r: 0, g: 255, b: 0 };

self.onmessage = async (e: MessageEvent<ApplyChromaKeyMessage>) => {
  if (e.data.type !== 'apply-chroma-key') {
    return;
  }

  const { imageDataUrl, backgroundUrl, options } = e.data;

  try {
    // Charger les deux images
    const [sourceBitmap, backgroundBitmap] = await Promise.all([
      loadImageBitmapFromUrl(imageDataUrl),
      loadImageBitmapFromUrl(backgroundUrl)
    ]);

    const width = sourceBitmap.width;
    const height = sourceBitmap.height;

    // Créer un OffscreenCanvas pour le résultat
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    // Dessiner le fond (redimensionné si nécessaire)
    ctx.drawImage(backgroundBitmap, 0, 0, width, height);

    // Dessiner l'image source par-dessus
    ctx.drawImage(sourceBitmap, 0, 0, width, height);

    // Obtenir les données des pixels
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Charger l'image source dans un canvas temporaire pour lire les pixels
    const tempCanvas = new OffscreenCanvas(width, height);
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) {
      throw new Error('Temporary canvas context not available');
    }
    tempCtx.drawImage(sourceBitmap, 0, 0, width, height);
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

        if (a === 0) continue;

        const isGreen = isGreenPixel(r, g, b, targetColor, sensitivity);

        if (isGreen) {
          const alpha = calculateFeatherAlpha(x, y, width, height, true, smoothness);

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

    // Convertir en blob puis en data URL
    const blob = await canvas.convertToBlob({
      type: 'image/jpeg',
      quality: 1.0
    });

    let dataUrl: string;
    if (typeof FileReader !== 'undefined') {
      const reader = new FileReader();
      dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      dataUrl = `data:image/jpeg;base64,${btoa(binary)}`;
    }

    // Nettoyer
    sourceBitmap.close();
    backgroundBitmap.close();

    // Envoyer le résultat
    const response: ChromaKeyResponse = {
      type: 'chroma-keyed',
      imageDataUrl: dataUrl
    };

    self.postMessage(response);

  } catch (error) {
    const errorResponse: ErrorResponse = {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    self.postMessage(errorResponse);
  }
};

