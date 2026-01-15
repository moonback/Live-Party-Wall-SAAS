/**
 * Chargement + cache d'overlay PNG (via fetch -> Blob -> ImageBitmap) pour éviter les soucis CORS.
 * Utilise des Web Workers pour éviter de bloquer le thread principal
 */

const overlayCache = new Map<string, ImageBitmap | HTMLImageElement>();

// Cache pour le worker (singleton pattern)
let overlayWorker: Worker | null = null;

/**
 * Vérifie si les Web Workers sont supportés
 */
const isWorkerSupported = (): boolean => {
  return typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined';
};

/**
 * Obtient ou crée le worker d'overlay
 */
const getOverlayWorker = (): Worker | null => {
  if (!isWorkerSupported()) {
    return null;
  }
  
  if (!overlayWorker) {
    try {
      overlayWorker = new Worker(
        new URL('../workers/imageOverlay.worker.ts', import.meta.url),
        { type: 'module' }
      );
    } catch (error) {
      console.warn('Failed to create overlay worker, falling back to sync processing', error);
      return null;
    }
  }
  
  return overlayWorker;
};

async function loadOverlay(url: string): Promise<ImageBitmap | HTMLImageElement> {
  const cached = overlayCache.get(url);
  if (cached) return cached;

  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) {
    throw new Error(`Impossible de charger le cadre (HTTP ${res.status})`);
  }

  const blob = await res.blob();

  if ('createImageBitmap' in window) {
    const bitmap = await createImageBitmap(blob);
    overlayCache.set(url, bitmap);
    return bitmap;
  }

  const objectUrl = URL.createObjectURL(blob);
  const img = new Image();
  img.src = objectUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Impossible de charger l'image du cadre"));
  });
  URL.revokeObjectURL(objectUrl);
  overlayCache.set(url, img);
  return img;
}

/**
 * Dessine un overlay (cadre) par-dessus le canvas, étiré pour couvrir toute la surface.
 */
export async function drawPngOverlay(
  ctx: CanvasRenderingContext2D,
  overlayUrl: string,
  width: number,
  height: number
): Promise<void> {
  const overlay = await loadOverlay(overlayUrl);
  // ImageBitmap et HTMLImageElement sont acceptés par drawImage
  ctx.drawImage(overlay as any, 0, 0, width, height);
}

/**
 * Compose une image (dataURL) + un overlay PNG (URL) en une nouvelle image (JPEG dataURL) - version synchrone pour fallback
 */
async function composeDataUrlWithPngOverlaySync(
  baseImageDataUrl: string,
  overlayUrl: string,
  quality = 1.0
): Promise<string> {
  const baseImg = new Image();
  baseImg.src = baseImageDataUrl;
  await new Promise<void>((resolve, reject) => {
    baseImg.onload = () => resolve();
    baseImg.onerror = () => reject(new Error("Impossible de charger l'image de base"));
  });

  const canvas = document.createElement('canvas');
  canvas.width = baseImg.width;
  canvas.height = baseImg.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);
  await drawPngOverlay(ctx, overlayUrl, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Compose une image (dataURL) + un overlay PNG (URL) en une nouvelle image (JPEG dataURL).
 * Qualité maximale HD par défaut (1.0)
 * Utilise un Web Worker si disponible, sinon fallback synchrone
 */
export async function composeDataUrlWithPngOverlay(
  baseImageDataUrl: string,
  overlayUrl: string,
  quality = 1.0
): Promise<string> {
  const worker = getOverlayWorker();
  
  // Si pas de worker, utiliser la version synchrone
  if (!worker) {
    return composeDataUrlWithPngOverlaySync(baseImageDataUrl, overlayUrl, quality);
  }
  
  return new Promise((resolve, reject) => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'composed') {
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
        resolve(e.data.imageDataUrl);
      } else if (e.data.type === 'error') {
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
        // Fallback vers synchrone en cas d'erreur
        composeDataUrlWithPngOverlaySync(baseImageDataUrl, overlayUrl, quality).then(resolve).catch(reject);
      }
    };

    const handleError = (error: ErrorEvent) => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      // Fallback vers synchrone en cas d'erreur
      composeDataUrlWithPngOverlaySync(baseImageDataUrl, overlayUrl, quality).then(resolve).catch(reject);
    };

    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);

    worker.postMessage({
      type: 'compose-overlay',
      baseImageDataUrl,
      overlayUrl,
      quality
    });
  });
}


