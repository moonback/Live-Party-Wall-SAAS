/**
 * Web Worker pour l'amélioration de qualité d'images
 * Évite de bloquer le thread principal pendant les traitements lourds
 * (sharpening, denoising, white balance, analyse de métriques)
 */

interface ImageMetrics {
  brightness: number;
  contrast: number;
  sharpness: number;
  isUnderexposed: boolean;
  isOverexposed: boolean;
  needsSharpening: boolean;
  needsContrastBoost: boolean;
}

interface EnhanceQualityMessage {
  type: 'enhance-quality';
  imageDataUrl: string;
  suggestedImprovements?: string[];
  aggressiveMode?: boolean;
}

interface EnhanceQualityResponse {
  type: 'enhanced';
  imageDataUrl: string;
}

interface ErrorResponse {
  type: 'error';
  error: string;
}

/**
 * Analyse les métriques d'une image pour détecter les problèmes de qualité
 */
const analyzeImageMetrics = (imageData: ImageData): ImageMetrics => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const pixelCount = width * height;
  
  let totalBrightness = 0;
  const brightnessValues: number[] = [];
  
  // Calculer la luminosité moyenne et collecter les valeurs
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Formule de luminosité perceptuelle
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    totalBrightness += brightness;
    brightnessValues.push(brightness);
  }
  
  const avgBrightness = totalBrightness / pixelCount;
  
  // Calculer l'écart-type pour le contraste
  const variance = brightnessValues.reduce((acc, val) => {
    return acc + Math.pow(val - avgBrightness, 2);
  }, 0) / pixelCount;
  const contrast = Math.sqrt(variance) / 255; // Normalisé entre 0 et 1
  
  // Calculer la netteté basée sur les gradients (Laplacien simplifié)
  let sharpnessSum = 0;
  let sharpnessCount = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const center = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      
      const right = 0.299 * data[idx + 4] + 0.587 * data[idx + 5] + 0.114 * data[idx + 6];
      const bottom = 0.299 * data[(y + 1) * width * 4 + x * 4] + 
                     0.587 * data[(y + 1) * width * 4 + x * 4 + 1] + 
                     0.114 * data[(y + 1) * width * 4 + x * 4 + 2];
      
      const gradient = Math.abs(center - right) + Math.abs(center - bottom);
      sharpnessSum += gradient;
      sharpnessCount++;
    }
  }
  const sharpness = (sharpnessSum / sharpnessCount) / 255; // Normalisé entre 0 et 1
  
  return {
    brightness: avgBrightness,
    contrast,
    sharpness,
    isUnderexposed: avgBrightness < 80,
    isOverexposed: avgBrightness > 200,
    needsSharpening: sharpness < 0.3,
    needsContrastBoost: contrast < 0.15,
  };
};

/**
 * Applique un filtre de netteté (unsharp mask) à une image
 */
const applySharpening = (
  ctx: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number = 0.5
): void => {
  // Créer un canvas temporaire pour le flou
  const tempCanvas = new OffscreenCanvas(width, height);
  const tempCtx = tempCanvas.getContext('2d', {
    willReadFrequently: true
  });
  
  if (!tempCtx) return;
  
  // Copier l'image actuelle
  const imageData = ctx.getImageData(0, 0, width, height);
  tempCtx.putImageData(imageData, 0, 0);
  
  // Créer un canvas source pour le flou
  const sourceCanvas = new OffscreenCanvas(width, height);
  const sourceCtx = sourceCanvas.getContext('2d');
  
  if (!sourceCtx) return;
  
  sourceCtx.putImageData(imageData, 0, 0);
  
  // Appliquer un flou gaussien léger
  tempCtx.filter = 'blur(1px)';
  tempCtx.drawImage(sourceCanvas, 0, 0);
  const blurredData = tempCtx.getImageData(0, 0, width, height);
  
  // Appliquer l'unsharp mask : original - blurred * intensity
  const originalData = imageData.data;
  const blurred = blurredData.data;
  
  for (let i = 0; i < originalData.length; i += 4) {
    const diff = originalData[i] - blurred[i];
    originalData[i] = Math.max(0, Math.min(255, originalData[i] + diff * intensity));
    originalData[i + 1] = Math.max(0, Math.min(255, originalData[i + 1] + (originalData[i + 1] - blurred[i + 1]) * intensity));
    originalData[i + 2] = Math.max(0, Math.min(255, originalData[i + 2] + (originalData[i + 2] - blurred[i + 2]) * intensity));
  }
  
  ctx.putImageData(imageData, 0, 0);
};

/**
 * Applique un débruitage léger à une image (filtre médian simplifié)
 */
const applyDenoising = (
  ctx: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number = 0.3
): void => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const newData = new Uint8ClampedArray(data);
  
  // Filtre médian 3x3 simplifié (seulement pour les pixels avec bruit détecté)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // Détecter le bruit (variation locale élevée)
      const centerR = data[idx];
      const centerG = data[idx + 1];
      const centerB = data[idx + 2];
      
      let variance = 0;
      const neighbors: number[] = [];
      
      // Collecter les voisins
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nIdx = ((y + dy) * width + (x + dx)) * 4;
          const brightness = 0.299 * data[nIdx] + 0.587 * data[nIdx + 1] + 0.114 * data[nIdx + 2];
          neighbors.push(brightness);
          variance += Math.pow(brightness - (0.299 * centerR + 0.587 * centerG + 0.114 * centerB), 2);
        }
      }
      
      variance /= 9;
      
      // Appliquer le débruitage seulement si le bruit est détecté
      if (variance > 100 * intensity) {
        // Médiane des voisins pour chaque canal
        const rValues: number[] = [];
        const gValues: number[] = [];
        const bValues: number[] = [];
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            rValues.push(data[nIdx]);
            gValues.push(data[nIdx + 1]);
            bValues.push(data[nIdx + 2]);
          }
        }
        
        rValues.sort((a, b) => a - b);
        gValues.sort((a, b) => a - b);
        bValues.sort((a, b) => a - b);
        
        // Mélanger la médiane avec l'original selon l'intensité
        const blend = intensity;
        newData[idx] = Math.round(data[idx] * (1 - blend) + rValues[4] * blend);
        newData[idx + 1] = Math.round(data[idx + 1] * (1 - blend) + gValues[4] * blend);
        newData[idx + 2] = Math.round(data[idx + 2] * (1 - blend) + bValues[4] * blend);
      }
    }
  }
  
  ctx.putImageData(new ImageData(newData, width, height), 0, 0);
};

/**
 * Corrige la balance des blancs automatiquement
 */
const applyWhiteBalance = (
  ctx: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number
): void => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Calculer la moyenne des canaux RGB
  let totalR = 0, totalG = 0, totalB = 0;
  const pixelCount = width * height;
  
  for (let i = 0; i < data.length; i += 4) {
    totalR += data[i];
    totalG += data[i + 1];
    totalB += data[i + 2];
  }
  
  const avgR = totalR / pixelCount;
  const avgG = totalG / pixelCount;
  const avgB = totalB / pixelCount;
  
  // La moyenne devrait être égale pour une balance neutre
  const avgGray = (avgR + avgG + avgB) / 3;
  
  // Calculer les facteurs de correction
  const factorR = avgGray / avgR;
  const factorG = avgGray / avgG;
  const factorB = avgGray / avgB;
  
  // Limiter les corrections extrêmes (max 1.5x)
  const maxFactor = 1.5;
  const limitedFactorR = Math.min(maxFactor, Math.max(1 / maxFactor, factorR));
  const limitedFactorG = Math.min(maxFactor, Math.max(1 / maxFactor, factorG));
  const limitedFactorB = Math.min(maxFactor, Math.max(1 / maxFactor, factorB));
  
  // Appliquer la correction
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, data[i] * limitedFactorR));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * limitedFactorG));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * limitedFactorB));
  }
  
  ctx.putImageData(imageData, 0, 0);
};

/**
 * Charge une image depuis une data URL et retourne un ImageBitmap
 */
const loadImageBitmap = async (imageDataUrl: string): Promise<ImageBitmap> => {
  const response = await fetch(imageDataUrl);
  const blob = await response.blob();
  return await createImageBitmap(blob);
};

self.onmessage = async (e: MessageEvent<EnhanceQualityMessage>) => {
  if (e.data.type !== 'enhance-quality') {
    return;
  }

  const { imageDataUrl, suggestedImprovements, aggressiveMode = false } = e.data;

  try {
    // Charger l'image en ImageBitmap
    const imageBitmap = await loadImageBitmap(imageDataUrl);
    const width = imageBitmap.width;
    const height = imageBitmap.height;
    
    // Créer un OffscreenCanvas
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d', {
      willReadFrequently: true,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high'
    });
    
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    // Dessiner l'image
    ctx.drawImage(imageBitmap, 0, 0, width, height);
    
    // Analyser les métriques de l'image
    const imageData = ctx.getImageData(0, 0, width, height);
    const metrics = analyzeImageMetrics(imageData);
    
    // Déterminer les corrections à appliquer
    let brightnessAdjust = 1.0;
    let contrastAdjust = 1.0;
    let saturationAdjust = 1.0;
    let needsSharpening = metrics.needsSharpening;
    let needsExposureFix = false;
    let needsDenoising = false;
    let needsWhiteBalance = false;
    
    // Facteur d'agressivité selon le mode
    const aggressiveness = aggressiveMode ? 1.5 : 1.0;
    
    // Ajustements basés sur les métriques
    if (metrics.isUnderexposed) {
      brightnessAdjust = 1.0 + (80 - metrics.brightness) / 255 * (0.4 * aggressiveness);
      needsExposureFix = true;
      needsDenoising = true;
    } else if (metrics.isOverexposed) {
      brightnessAdjust = 1.0 - (metrics.brightness - 200) / 255 * (0.3 * aggressiveness);
      needsExposureFix = true;
    }
    
    if (metrics.needsContrastBoost) {
      contrastAdjust = 1.0 + (0.15 - metrics.contrast) * 2 * aggressiveness;
    }
    
    // Détection automatique du besoin de débruitage
    if (metrics.sharpness < 0.25) {
      needsDenoising = true;
    }
    
    // Détection de déséquilibre de couleur (balance des blancs)
    const imageDataForWB = ctx.getImageData(0, 0, width, height);
    const wbData = imageDataForWB.data;
    let totalR = 0, totalG = 0, totalB = 0;
    const pixelCount = width * height;
    for (let i = 0; i < wbData.length; i += 4) {
      totalR += wbData[i];
      totalG += wbData[i + 1];
      totalB += wbData[i + 2];
    }
    const avgR = totalR / pixelCount;
    const avgG = totalG / pixelCount;
    const avgB = totalB / pixelCount;
    const avgGray = (avgR + avgG + avgB) / 3;
    if (Math.abs(avgR - avgGray) > avgGray * 0.15 || 
        Math.abs(avgG - avgGray) > avgGray * 0.15 || 
        Math.abs(avgB - avgGray) > avgGray * 0.15) {
      needsWhiteBalance = true;
    }
    
    // Ajustements basés sur les suggestions de l'IA
    if (suggestedImprovements) {
      const improvements = suggestedImprovements.map(imp => imp.toLowerCase());
      
      if (improvements.some(imp => imp.includes('luminosité') || imp.includes('luminosite') || imp.includes('brightness'))) {
        if (!needsExposureFix) {
          brightnessAdjust = 1.0 + (0.1 * aggressiveness);
        }
      }
      
      if (improvements.some(imp => imp.includes('contraste') || imp.includes('contrast'))) {
        contrastAdjust = Math.max(contrastAdjust, 1.0 + (0.15 * aggressiveness));
      }
      
      if (improvements.some(imp => imp.includes('netteté') || imp.includes('netete') || imp.includes('sharp') || imp.includes('flou'))) {
        needsSharpening = true;
      }
      
      if (improvements.some(imp => imp.includes('saturation') || imp.includes('couleur') || imp.includes('color'))) {
        saturationAdjust = 1.0 + (0.1 * aggressiveness);
      }
      
      if (improvements.some(imp => imp.includes('bruit') || imp.includes('noise') || imp.includes('grain'))) {
        needsDenoising = true;
      }
      
      if (improvements.some(imp => imp.includes('balance') || imp.includes('blanc') || imp.includes('white balance'))) {
        needsWhiteBalance = true;
      }
    }
    
    // Appliquer les corrections de base (luminosité, contraste, saturation)
    if (brightnessAdjust !== 1.0 || contrastAdjust !== 1.0 || saturationAdjust !== 1.0) {
      const filters: string[] = [];
      
      if (brightnessAdjust !== 1.0) {
        filters.push(`brightness(${brightnessAdjust})`);
      }
      
      if (contrastAdjust !== 1.0) {
        filters.push(`contrast(${contrastAdjust})`);
      }
      
      if (saturationAdjust !== 1.0) {
        filters.push(`saturate(${saturationAdjust})`);
      }
      
      if (filters.length > 0) {
        const tempCanvas = new OffscreenCanvas(width, height);
        const tempCtx = tempCanvas.getContext('2d');
        
        if (tempCtx) {
          tempCtx.filter = filters.join(' ');
          tempCtx.drawImage(canvas, 0, 0);
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(tempCanvas, 0, 0);
        }
      }
    }
    
    // Appliquer la correction de balance des blancs
    if (needsWhiteBalance) {
      applyWhiteBalance(ctx, width, height);
    }
    
    // Appliquer le débruitage avant le sharpening
    if (needsDenoising) {
      applyDenoising(ctx, width, height, aggressiveMode ? 0.4 : 0.3);
    }
    
    // Appliquer le sharpening si nécessaire
    if (needsSharpening) {
      applySharpening(ctx, width, height, aggressiveMode ? 0.8 : 0.6);
    }
    
    // Convertir en blob puis en data URL
    const blob = await canvas.convertToBlob({
      type: 'image/jpeg',
      quality: 1.0
    });
    
    // Convertir blob en data URL (FileReader est disponible dans les workers modernes)
    // Fallback : utiliser Response pour convertir en base64 si FileReader n'est pas disponible
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
    const response: EnhanceQualityResponse = {
      type: 'enhanced',
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

