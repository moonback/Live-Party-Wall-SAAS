/**
 * Chargement + cache d'overlay PNG (via fetch -> Blob -> ImageBitmap) pour éviter les soucis CORS.
 */

const overlayCache = new Map<string, ImageBitmap | HTMLImageElement>();

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
 * Compose une image (dataURL) + un overlay PNG (URL) en une nouvelle image (JPEG dataURL).
 * Qualité maximale HD par défaut (1.0)
 */
export async function composeDataUrlWithPngOverlay(
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


