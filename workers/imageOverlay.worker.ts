/**
 * Web Worker pour la composition d'images avec overlays PNG
 * Évite de bloquer le thread principal pendant la composition
 */

interface ComposeOverlayMessage {
  type: 'compose-overlay';
  baseImageDataUrl: string;
  overlayUrl: string;
  quality?: number;
}

interface ComposeOverlayResponse {
  type: 'composed';
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
  const response = await fetch(url, { mode: 'cors' });
  if (!response.ok) {
    throw new Error(`Impossible de charger le cadre (HTTP ${response.status})`);
  }
  const blob = await response.blob();
  return await createImageBitmap(blob);
};

/**
 * Charge une image depuis une data URL et retourne un ImageBitmap
 */
const loadImageBitmapFromDataUrl = async (imageDataUrl: string): Promise<ImageBitmap> => {
  const response = await fetch(imageDataUrl);
  const blob = await response.blob();
  return await createImageBitmap(blob);
};

self.onmessage = async (e: MessageEvent<ComposeOverlayMessage>) => {
  if (e.data.type !== 'compose-overlay') {
    return;
  }

  const { baseImageDataUrl, overlayUrl, quality = 1.0 } = e.data;

  try {
    // Charger les deux images en parallèle
    const [baseImageBitmap, overlayBitmap] = await Promise.all([
      loadImageBitmapFromDataUrl(baseImageDataUrl),
      loadImageBitmapFromUrl(overlayUrl)
    ]);
    
    const width = baseImageBitmap.width;
    const height = baseImageBitmap.height;
    
    // Créer un OffscreenCanvas
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    // Dessiner l'image de base
    ctx.drawImage(baseImageBitmap, 0, 0, width, height);
    
    // Dessiner l'overlay par-dessus (étiré pour couvrir toute la surface)
    ctx.drawImage(overlayBitmap, 0, 0, width, height);
    
    // Convertir en blob puis en data URL
    const blob = await canvas.convertToBlob({
      type: 'image/jpeg',
      quality: quality
    });
    
    // Convertir blob en data URL (FileReader est disponible dans les workers modernes)
    // Fallback : utiliser ArrayBuffer et base64 si FileReader n'est pas disponible
    let dataUrl: string;
    if (typeof FileReader !== 'undefined') {
      const reader = new FileReader();
      dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      // Fallback : convertir via ArrayBuffer et base64
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      dataUrl = `data:image/jpeg;base64,${btoa(binary)}`;
    }
    
    // Nettoyer
    baseImageBitmap.close();
    overlayBitmap.close();
    
    // Envoyer le résultat
    const response: ComposeOverlayResponse = {
      type: 'composed',
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

