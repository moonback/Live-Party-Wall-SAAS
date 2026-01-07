/**
 * Web Worker pour la compression d'images
 * Évite de bloquer le thread principal pendant la compression
 */

interface CompressionMessage {
  type: 'compress';
  file: File;
  maxWidth: number;
  quality: number;
}

interface CompressionResponse {
  type: 'compressed';
  blob: Blob;
  originalSize: number;
  compressedSize: number;
}

interface ErrorResponse {
  type: 'error';
  error: string;
}

self.onmessage = async (e: MessageEvent<CompressionMessage>) => {
  if (e.data.type !== 'compress') {
    return;
  }

  const { file, maxWidth, quality } = e.data;

  try {
    // Créer un ImageBitmap depuis le fichier
    const imageBitmap = await createImageBitmap(file);
    
    // Calculer les nouvelles dimensions
    let newWidth = imageBitmap.width;
    let newHeight = imageBitmap.height;
    
    if (imageBitmap.width > maxWidth) {
      const scale = maxWidth / imageBitmap.width;
      newWidth = maxWidth;
      newHeight = Math.round(imageBitmap.height * scale);
    }
    
    // Créer un canvas avec les nouvelles dimensions
    const canvas = new OffscreenCanvas(newWidth, newHeight);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas context not available');
    }
    
    // Dessiner l'image redimensionnée
    ctx.drawImage(imageBitmap, 0, 0, newWidth, newHeight);
    
    // Convertir en blob JPEG
    const blob = await canvas.convertToBlob({
      type: 'image/jpeg',
      quality: quality
    });
    
    // Envoyer le résultat
    const response: CompressionResponse = {
      type: 'compressed',
      blob,
      originalSize: file.size,
      compressedSize: blob.size
    };
    
    self.postMessage(response);
    
    // Nettoyer
    imageBitmap.close();
    
  } catch (error) {
    const errorResponse: ErrorResponse = {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    self.postMessage(errorResponse);
  }
};

