/**
 * Web Worker pour l'application de filtres d'image
 * Évite de bloquer le thread principal pendant l'application de filtres CSS
 */

export type FilterType = 'none' | 'vintage' | 'blackwhite' | 'warm' | 'cool';

interface ApplyFilterMessage {
  type: 'apply-filter';
  imageDataUrl: string;
  filter: FilterType;
}

interface ApplyFilterResponse {
  type: 'filtered';
  imageDataUrl: string;
}

interface ErrorResponse {
  type: 'error';
  error: string;
}

/**
 * Charge une image depuis une data URL et retourne un ImageBitmap
 */
const loadImageBitmap = async (imageDataUrl: string): Promise<ImageBitmap> => {
  const response = await fetch(imageDataUrl);
  const blob = await response.blob();
  return await createImageBitmap(blob);
};

self.onmessage = async (e: MessageEvent<ApplyFilterMessage>) => {
  if (e.data.type !== 'apply-filter') {
    return;
  }

  const { imageDataUrl, filter } = e.data;

  try {
    // Charger l'image en ImageBitmap
    const imageBitmap = await loadImageBitmap(imageDataUrl);
    const width = imageBitmap.width;
    const height = imageBitmap.height;
    
    // Créer un OffscreenCanvas
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    // Appliquer le filtre
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
    ctx.drawImage(imageBitmap, 0, 0, width, height);
    ctx.restore();
    
    // Convertir en blob puis en data URL
    const blob = await canvas.convertToBlob({
      type: 'image/jpeg',
      quality: 1.0
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
    imageBitmap.close();
    
    // Envoyer le résultat
    const response: ApplyFilterResponse = {
      type: 'filtered',
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

