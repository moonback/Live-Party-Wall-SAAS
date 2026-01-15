/**
 * Utilitaires pour appliquer des filtres esthétiques aux images
 * Utilise des Web Workers pour éviter de bloquer le thread principal
 */

export type FilterType = 'none' | 'vintage' | 'blackwhite' | 'warm' | 'cool';
export type FrameType = 'none';

// Cache pour les workers (singleton pattern)
let filterWorker: Worker | null = null;
let enhancementWorker: Worker | null = null;

/**
 * Vérifie si les Web Workers sont supportés
 */
const isWorkerSupported = (): boolean => {
  return typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined';
};

/**
 * Obtient ou crée le worker de filtres
 */
const getFilterWorker = (): Worker | null => {
  if (!isWorkerSupported()) {
    return null;
  }
  
  if (!filterWorker) {
    try {
      filterWorker = new Worker(
        new URL('../workers/imageFilters.worker.ts', import.meta.url),
        { type: 'module' }
      );
    } catch (error) {
      console.warn('Failed to create filter worker, falling back to sync processing', error);
      return null;
    }
  }
  
  return filterWorker;
};

/**
 * Obtient ou crée le worker d'amélioration
 */
const getEnhancementWorker = (): Worker | null => {
  if (!isWorkerSupported()) {
    return null;
  }
  
  if (!enhancementWorker) {
    try {
      enhancementWorker = new Worker(
        new URL('../workers/imageEnhancement.worker.ts', import.meta.url),
        { type: 'module' }
      );
    } catch (error) {
      console.warn('Failed to create enhancement worker, falling back to sync processing', error);
      return null;
    }
  }
  
  return enhancementWorker;
};

/**
 * Applique un filtre CSS à une image via canvas (version synchrone pour fallback)
 */
const applyImageFilterSync = (
  imageDataUrl: string,
  filter: FilterType,
  frame: FrameType = 'none'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvasWidth = img.width;
      const canvasHeight = img.height;
      const offsetX = 0;
      const offsetY = 0;

      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

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

      ctx.drawImage(img, offsetX, offsetY, img.width, img.height);
      ctx.restore();

      resolve(canvas.toDataURL('image/jpeg', 1.0));
    };

    img.onerror = reject;
    img.src = imageDataUrl;
  });
};

/**
 * Applique un filtre CSS à une image via canvas
 * Utilise un Web Worker si disponible, sinon fallback synchrone
 */
export const applyImageFilter = (
  imageDataUrl: string,
  filter: FilterType,
  frame: FrameType = 'none'
): Promise<string> => {
  const worker = getFilterWorker();
  
  // Si pas de worker, utiliser la version synchrone
  if (!worker) {
    return applyImageFilterSync(imageDataUrl, filter, frame);
  }
  
  return new Promise((resolve, reject) => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'filtered') {
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
        resolve(e.data.imageDataUrl);
      } else if (e.data.type === 'error') {
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
        // Fallback vers synchrone en cas d'erreur
        applyImageFilterSync(imageDataUrl, filter, frame).then(resolve).catch(reject);
      }
    };

    const handleError = (error: ErrorEvent) => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      // Fallback vers synchrone en cas d'erreur
      applyImageFilterSync(imageDataUrl, filter, frame).then(resolve).catch(reject);
    };

    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);

    worker.postMessage({
      type: 'apply-filter',
      imageDataUrl,
      filter
    });
  });
};

/**
 * Interface pour les métriques d'image
 */
export interface ImageMetrics {
  brightness: number; // 0-255, moyenne de la luminosité
  contrast: number; // 0-1, écart-type des valeurs de luminosité
  sharpness: number; // 0-1, mesure de la netteté basée sur les gradients
  isUnderexposed: boolean; // Luminosité moyenne < 80
  isOverexposed: boolean; // Luminosité moyenne > 200
  needsSharpening: boolean; // Netteté < 0.3
  needsContrastBoost: boolean; // Contraste < 0.15
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
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number = 0.5
): void => {
  // Créer un canvas temporaire pour le flou
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d', {
    willReadFrequently: true
  });
  
  if (!tempCtx) return;
  
  // Copier l'image actuelle
  const imageData = ctx.getImageData(0, 0, width, height);
  tempCtx.putImageData(imageData, 0, 0);
  
  // Créer un canvas source pour le flou
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = width;
  sourceCanvas.height = height;
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
  ctx: CanvasRenderingContext2D,
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
  ctx: CanvasRenderingContext2D,
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
 * Améliore la qualité d'une image de manière intelligente et poussée (version synchrone pour fallback)
 */
const enhanceImageQualitySync = (
  imageDataUrl: string,
  suggestedImprovements?: string[],
  aggressiveMode: boolean = false
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      
      // Utiliser les dimensions originales de l'image sans redimensionnement
      const width = img.width;
      const height = img.height;
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', {
        willReadFrequently: true, // Optimisation pour les lectures fréquentes
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
      });
      
      if (!ctx || !(ctx instanceof CanvasRenderingContext2D)) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Dessiner l'image à la nouvelle taille (redimensionnement de qualité)
      ctx.drawImage(img, 0, 0, width, height);
      
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
        brightnessAdjust = 1.0 + (80 - metrics.brightness) / 255 * (0.4 * aggressiveness); // Jusqu'à 60% en mode agressif
        needsExposureFix = true;
        needsDenoising = true; // Les images sous-exposées ont souvent plus de bruit
      } else if (metrics.isOverexposed) {
        brightnessAdjust = 1.0 - (metrics.brightness - 200) / 255 * (0.3 * aggressiveness); // Jusqu'à 45% en mode agressif
        needsExposureFix = true;
      }
      
      if (metrics.needsContrastBoost) {
        contrastAdjust = 1.0 + (0.15 - metrics.contrast) * 2 * aggressiveness; // Contraste plus fort en mode agressif
      }
      
      // Détection automatique du besoin de débruitage (basé sur la netteté)
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
      // Si l'écart est > 15%, corriger la balance des blancs
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
            brightnessAdjust = 1.0 + (0.1 * aggressiveness); // Jusqu'à 15% en mode agressif
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
        // Construire le filtre CSS
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
          // Créer un canvas temporaire pour appliquer les filtres
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = width;
          tempCanvas.height = height;
          const tempCtx = tempCanvas.getContext('2d');
          
          if (tempCtx && tempCtx instanceof CanvasRenderingContext2D) {
            tempCtx.filter = filters.join(' ');
            tempCtx.drawImage(canvas, 0, 0);
            // Copier le résultat vers le canvas principal
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(tempCanvas, 0, 0);
          }
        }
      }
      
      // Appliquer la correction de balance des blancs en premier (avant autres corrections)
      if (needsWhiteBalance) {
        applyWhiteBalance(ctx, width, height);
      }
      
      // Appliquer le débruitage avant le sharpening (pour éviter d'amplifier le bruit)
      if (needsDenoising) {
        applyDenoising(ctx, width, height, aggressiveMode ? 0.4 : 0.3);
      }
      
      // Appliquer le sharpening si nécessaire (après débruitage)
      if (needsSharpening) {
        applySharpening(ctx, width, height, aggressiveMode ? 0.8 : 0.6); // Plus agressif en mode poussé
      }
      
      // Qualité JPEG maximale (1.0) sans compression
      resolve(canvas.toDataURL('image/jpeg', 1.0));
    };

    img.onerror = reject;
    img.src = imageDataUrl;
  });
};

/**
 * Améliore la qualité d'une image de manière intelligente et poussée
 * Détecte automatiquement les problèmes et applique des corrections ciblées avancées
 * Optimisé pour la projection sur grand écran
 * 
 * Techniques utilisées :
 * - Correction automatique de l'exposition (sous/surexposition)
 * - Amélioration du contraste adaptatif
 * - Correction de la balance des blancs
 * - Débruitage intelligent
 * - Netteté avancée (unsharp mask)
 * - Correction de la saturation
 * 
 * Utilise un Web Worker si disponible, sinon fallback synchrone
 * 
 * @param imageDataUrl - Image en base64
 * @param suggestedImprovements - Suggestions d'amélioration de l'IA (optionnel)
 * @param aggressiveMode - Mode agressif pour améliorations plus poussées (défaut: false)
 * @returns Promise<string> - Image optimisée en base64
 */
export const enhanceImageQuality = (
  imageDataUrl: string,
  suggestedImprovements?: string[],
  aggressiveMode: boolean = false
): Promise<string> => {
  const worker = getEnhancementWorker();
  
  // Si pas de worker, utiliser la version synchrone
  if (!worker) {
    return enhanceImageQualitySync(imageDataUrl, suggestedImprovements, aggressiveMode);
  }
  
  return new Promise((resolve, reject) => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'enhanced') {
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
        resolve(e.data.imageDataUrl);
      } else if (e.data.type === 'error') {
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
        // Fallback vers synchrone en cas d'erreur
        enhanceImageQualitySync(imageDataUrl, suggestedImprovements, aggressiveMode).then(resolve).catch(reject);
      }
    };

    const handleError = (error: ErrorEvent) => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      // Fallback vers synchrone en cas d'erreur
      enhanceImageQualitySync(imageDataUrl, suggestedImprovements, aggressiveMode).then(resolve).catch(reject);
    };

    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);

    worker.postMessage({
      type: 'enhance-quality',
      imageDataUrl,
      suggestedImprovements,
      aggressiveMode
    });
  });
};
