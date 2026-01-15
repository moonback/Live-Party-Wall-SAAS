/**
 * Utilitaires pour appliquer des filtres esthétiques aux images
 */

import { AIFilterParams } from '../types';

export type FilterType = 'none' | 'vintage' | 'blackwhite' | 'warm' | 'cool' | 'impressionist' | 'popart' | 'cinematic' | 'vibrant' | 'dreamy' | 'dramatic' | 'retro' | 'neon' | 'ai-custom';
export type ArtisticFilterType = 'impressionist' | 'popart' | 'cinematic' | 'vibrant' | 'dreamy' | 'dramatic' | 'retro' | 'neon';
export type FrameType = 'none';

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

      // 3. Appliquer le filtre
      ctx.save();
      
      // Pour les filtres artistiques avancés, utiliser les fonctions spécialisées
      if (['impressionist', 'popart', 'cinematic', 'vibrant', 'dreamy', 'dramatic', 'retro', 'neon'].includes(filter)) {
        // Dessiner l'image d'abord
        ctx.drawImage(img, offsetX, offsetY, img.width, img.height);
        // Appliquer le filtre artistique via traitement pixel
        applyArtisticFilterToCanvas(ctx, canvasWidth, canvasHeight, filter as ArtisticFilterType);
      } else {
        // Filtres CSS classiques
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
      }
      
      ctx.restore();

      // Les cadres générés par code ont été retirés
      // Seuls les cadres PNG personnalisés sont disponibles via les settings

      // Qualité maximale HD pour les cadres
      resolve(canvas.toDataURL('image/jpeg', 1.0));
    };

    img.onerror = reject;
    img.src = imageDataUrl;
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
 * Applique un filtre artistique prédéfini à un canvas
 */
const applyArtisticFilterToCanvas = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filter: ArtisticFilterType
): void => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  switch (filter) {
    case 'impressionist':
      applySoftBlur(data, width, height, 1.5);
      reduceContrast(data, 0.7);
      applyPastelColors(data);
      break;
    case 'popart':
      increaseSaturation(data, 1.5);
      increaseContrast(data, 1.4);
      applyVividColors(data);
      break;
    case 'cinematic':
      darkenImage(data, 0.85);
      increaseContrast(data, 1.3);
      applyColorTint(data, { r: 0.9, g: 0.95, b: 1.0 });
      break;
    case 'vibrant':
      increaseSaturation(data, 1.4);
      optimizeBrightness(data);
      break;
    case 'dreamy':
      applySoftBlur(data, width, height, 0.8);
      brightenImage(data, 1.15);
      reduceContrast(data, 0.85);
      break;
    case 'dramatic':
      increaseContrast(data, 1.5);
      darkenImage(data, 0.9);
      applyVignette(data, width, height, 0.3);
      break;
    case 'retro':
      applySepia(data, 0.4);
      applyGrain(data, width, height, 0.15);
      increaseContrast(data, 1.1);
      break;
    case 'neon':
      increaseSaturation(data, 1.6);
      increaseContrast(data, 1.4);
      applyNeonTint(data);
      break;
  }
  
  ctx.putImageData(imageData, 0, 0);
};

/**
 * Applique un filtre généré par IA avec paramètres personnalisés
 */
export const applyAIGeneratedFilter = (
  imageDataUrl: string,
  params: AIFilterParams
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, img.width, img.height);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const data = imageData.data;
      
      if (params.brightness !== 1.0) adjustBrightness(data, params.brightness);
      if (params.contrast !== 1.0) {
        if (params.contrast > 1.0) increaseContrast(data, params.contrast);
        else reduceContrast(data, params.contrast);
      }
      if (params.saturation !== 1.0) {
        if (params.saturation > 1.0) increaseSaturation(data, params.saturation);
        else reduceSaturation(data, params.saturation);
      }
      if (params.hue !== 0) adjustHue(data, params.hue);
      if (params.vignette > 0) applyVignette(data, img.width, img.height, params.vignette);
      if (params.grain > 0) applyGrain(data, img.width, img.height, params.grain);
      if (params.blur > 0) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.putImageData(imageData, 0, 0);
          tempCtx.filter = `blur(${params.blur}px)`;
          tempCtx.drawImage(tempCanvas, 0, 0);
          ctx.putImageData(tempCtx.getImageData(0, 0, img.width, img.height), 0, 0);
        } else {
          ctx.putImageData(imageData, 0, 0);
        }
      } else {
        ctx.putImageData(imageData, 0, 0);
      }
      if (params.colorMatrix && params.colorMatrix.length === 20) {
        applyColorMatrix(data, params.colorMatrix);
        ctx.putImageData(imageData, 0, 0);
      }
      
      resolve(canvas.toDataURL('image/jpeg', 1.0));
    };
    img.onerror = reject;
    img.src = imageDataUrl;
  });
};

// Fonctions utilitaires pour les effets de filtres
const adjustBrightness = (data: Uint8ClampedArray, factor: number): void => {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, data[i] * factor));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * factor));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * factor));
  }
};

const increaseContrast = (data: Uint8ClampedArray, factor: number): void => {
  const intercept = 128 * (1 - factor);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, data[i] * factor + intercept));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * factor + intercept));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * factor + intercept));
  }
};

const reduceContrast = (data: Uint8ClampedArray, factor: number): void => {
  const intercept = 128 * (1 - factor);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, data[i] * factor + intercept));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * factor + intercept));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * factor + intercept));
  }
};

const increaseSaturation = (data: Uint8ClampedArray, factor: number): void => {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    data[i] = Math.min(255, Math.max(0, gray + (r - gray) * factor));
    data[i + 1] = Math.min(255, Math.max(0, gray + (g - gray) * factor));
    data[i + 2] = Math.min(255, Math.max(0, gray + (b - gray) * factor));
  }
};

const reduceSaturation = (data: Uint8ClampedArray, factor: number): void => {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    data[i] = Math.min(255, Math.max(0, gray + (r - gray) * factor));
    data[i + 1] = Math.min(255, Math.max(0, gray + (g - gray) * factor));
    data[i + 2] = Math.min(255, Math.max(0, gray + (b - gray) * factor));
  }
};

const adjustHue = (data: Uint8ClampedArray, degrees: number): void => {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians), sin = Math.sin(radians);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const newR = r * (0.787 + 0.213 * cos - 0.213 * sin) + g * (0.213 - 0.213 * cos + 0.143 * sin) + b * (0.213 - 0.213 * cos - 0.143 * sin);
    const newG = r * (0.213 - 0.213 * cos - 0.143 * sin) + g * (0.787 + 0.213 * cos + 0.143 * sin) + b * (0.213 - 0.213 * cos + 0.143 * sin);
    const newB = r * (0.213 - 0.213 * cos + 0.143 * sin) + g * (0.213 - 0.213 * cos - 0.143 * sin) + b * (0.787 + 0.213 * cos + 0.213 * sin);
    data[i] = Math.min(255, Math.max(0, newR));
    data[i + 1] = Math.min(255, Math.max(0, newG));
    data[i + 2] = Math.min(255, Math.max(0, newB));
  }
};

const applyVignette = (data: Uint8ClampedArray, width: number, height: number, intensity: number): void => {
  const centerX = width / 2, centerY = height / 2;
  const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const factor = 1 - (distance / maxDistance) * intensity;
      data[idx] = Math.min(255, Math.max(0, data[idx] * factor));
      data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] * factor));
      data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] * factor));
    }
  }
};

const applyGrain = (data: Uint8ClampedArray, width: number, height: number, intensity: number): void => {
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * intensity * 255;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
};

const applySoftBlur = (data: Uint8ClampedArray, width: number, height: number, radius: number): void => {
  const kernelSize = Math.ceil(radius * 2);
  const kernel: number[] = [];
  let sum = 0;
  for (let i = -kernelSize; i <= kernelSize; i++) {
    const value = Math.exp(-(i * i) / (2 * radius * radius));
    kernel.push(value);
    sum += value;
  }
  for (let i = 0; i < kernel.length; i++) kernel[i] /= sum;
  const tempData = new Uint8ClampedArray(data);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      for (let k = 0; k < kernel.length; k++) {
        const px = Math.max(0, Math.min(width - 1, x + k - kernelSize));
        const idx = (y * width + px) * 4;
        r += tempData[idx] * kernel[k];
        g += tempData[idx + 1] * kernel[k];
        b += tempData[idx + 2] * kernel[k];
      }
      const idx = (y * width + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
    }
  }
};

const applyPastelColors = (data: Uint8ClampedArray): void => {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    data[i] = Math.min(255, Math.max(0, gray + (r - gray) * 0.5 + 30));
    data[i + 1] = Math.min(255, Math.max(0, gray + (g - gray) * 0.5 + 30));
    data[i + 2] = Math.min(255, Math.max(0, gray + (b - gray) * 0.5 + 30));
  }
};

const applyVividColors = (data: Uint8ClampedArray): void => {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    data[i] = Math.min(255, Math.max(0, gray + (r - gray) * 1.5));
    data[i + 1] = Math.min(255, Math.max(0, gray + (g - gray) * 1.5));
    data[i + 2] = Math.min(255, Math.max(0, gray + (b - gray) * 1.5));
  }
};

const applyColorTint = (data: Uint8ClampedArray, tint: { r: number; g: number; b: number }): void => {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, data[i] * tint.r));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * tint.g));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * tint.b));
  }
};

const darkenImage = (data: Uint8ClampedArray, factor: number): void => adjustBrightness(data, factor);
const brightenImage = (data: Uint8ClampedArray, factor: number): void => adjustBrightness(data, factor);

const optimizeBrightness = (data: Uint8ClampedArray): void => {
  let totalBrightness = 0;
  for (let i = 0; i < data.length; i += 4) {
    totalBrightness += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  const avgBrightness = totalBrightness / (data.length / 4);
  const factor = 128 / avgBrightness;
  if (factor < 0.9 || factor > 1.1) {
    adjustBrightness(data, Math.min(1.2, Math.max(0.8, factor)));
  }
};

const applySepia = (data: Uint8ClampedArray, intensity: number): void => {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const tr = (r * 0.393 + g * 0.769 + b * 0.189) * intensity + r * (1 - intensity);
    const tg = (r * 0.349 + g * 0.686 + b * 0.168) * intensity + g * (1 - intensity);
    const tb = (r * 0.272 + g * 0.534 + b * 0.131) * intensity + b * (1 - intensity);
    data[i] = Math.min(255, Math.max(0, tr));
    data[i + 1] = Math.min(255, Math.max(0, tg));
    data[i + 2] = Math.min(255, Math.max(0, tb));
  }
};

const applyNeonTint = (data: Uint8ClampedArray): void => {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const newR = r * 1.2 + g * 0.1 + b * 0.1;
    const newG = r * 0.1 + g * 0.8 + b * 0.3;
    const newB = r * 0.1 + g * 0.3 + b * 1.2;
    data[i] = Math.min(255, Math.max(0, newR));
    data[i + 1] = Math.min(255, Math.max(0, newG));
    data[i + 2] = Math.min(255, Math.max(0, newB));
  }
};

const applyColorMatrix = (data: Uint8ClampedArray, matrix: number[]): void => {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    const newR = r * matrix[0] + g * matrix[1] + b * matrix[2] + a * matrix[3] + matrix[4];
    const newG = r * matrix[5] + g * matrix[6] + b * matrix[7] + a * matrix[8] + matrix[9];
    const newB = r * matrix[10] + g * matrix[11] + b * matrix[12] + a * matrix[13] + matrix[14];
    const newA = r * matrix[15] + g * matrix[16] + b * matrix[17] + a * matrix[18] + matrix[19];
    data[i] = Math.min(255, Math.max(0, newR));
    data[i + 1] = Math.min(255, Math.max(0, newG));
    data[i + 2] = Math.min(255, Math.max(0, newB));
    data[i + 3] = Math.min(255, Math.max(0, newA));
  }
};
