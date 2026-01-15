/**
 * Service IA pour la génération de filtres artistiques
 * Utilise Google Gemini pour suggérer des styles artistiques et générer des paramètres de filtres personnalisés
 */

import { GoogleGenAI } from "@google/genai";
import { 
  detectGeminiErrorType, 
  logGeminiError 
} from '../utils/geminiErrorHandler';
import { logger } from '../utils/logger';
import { getImageHash } from '../utils/imageHash';
import { ArtisticFilterType } from '../utils/imageFilters';
import { AIFilterParams } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Cache en mémoire pour les suggestions de filtres
const filterCache = new Map<string, { result: ArtisticFilterSuggestion | CustomFilterParams; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 heure
const MAX_CACHE_SIZE = 100;

export interface ArtisticFilterSuggestion {
  style: ArtisticFilterType;
  confidence: number; // 0-1
  reason: string; // Explication de la suggestion
}

export interface CustomFilterParams extends AIFilterParams {
  styleDescription: string; // Description du style généré
}

/**
 * Nettoie le cache des entrées expirées
 */
function cleanCache(): void {
  const now = Date.now();
  const entries = Array.from(filterCache.entries());
  
  for (const [hash, value] of entries) {
    if (now - value.timestamp > CACHE_TTL) {
      filterCache.delete(hash);
    }
  }
  
  if (filterCache.size > MAX_CACHE_SIZE) {
    const sorted = Array.from(filterCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toDelete = sorted.slice(0, filterCache.size - MAX_CACHE_SIZE);
    for (const [hash] of toDelete) {
      filterCache.delete(hash);
    }
  }
}

/**
 * Suggère un style artistique prédéfini basé sur l'analyse de la photo
 */
export const generateArtisticFilterSuggestion = async (
  base64Image: string
): Promise<ArtisticFilterSuggestion> => {
  try {
    if (!base64Image || base64Image.trim().length === 0) {
      logger.warn('Empty base64 image provided to generateArtisticFilterSuggestion', null, {
        component: 'aiFilterService',
        action: 'generateArtisticFilterSuggestion'
      });
      return {
        style: 'vibrant',
        confidence: 0.5,
        reason: 'Image vide, suggestion par défaut'
      };
    }

    cleanCache();
    
    const imageHash = await getImageHash(base64Image);
    const cacheKey = `artistic_${imageHash}`;
    
    const cached = filterCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      if ('style' in cached.result) {
        logger.debug('Cache hit for artistic filter suggestion', { hash: imageHash.substring(0, 8) });
        return cached.result as ArtisticFilterSuggestion;
      }
    }
    
    logger.debug('Cache miss, calling Gemini API for artistic filter suggestion', { 
      hash: imageHash.substring(0, 8) 
    });

    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const prompt = `
Analyse cette photo de fête et suggère le style artistique le plus approprié parmi ces options :
- "impressionist" : Flou doux, couleurs pastel, contraste réduit (pour photos douces, romantiques)
- "popart" : Saturation élevée, contraste fort, couleurs vives (pour photos dynamiques, festives)
- "cinematic" : Tons sombres, contraste élevé, teinte bleue/verte (pour photos dramatiques, cinématographiques)
- "vibrant" : Saturation maximale, luminosité optimisée (pour photos colorées, énergiques)
- "dreamy" : Flou léger, tons doux, luminosité élevée (pour photos douces, oniriques)
- "dramatic" : Contraste extrême, tons sombres, vignettage (pour photos intenses, contrastées)
- "retro" : Sépie, grain, contraste modéré (pour photos vintage, nostalgiques)
- "neon" : Saturation élevée, teinte cyan/magenta, contraste fort (pour photos modernes, électriques)

Réponds UNIQUEMENT avec un JSON valide (sans markdown, sans code blocks) avec cette structure exacte :
{
  "style": "impressionist" | "popart" | "cinematic" | "vibrant" | "dreamy" | "dramatic" | "retro" | "neon",
  "confidence": number (entre 0 et 1),
  "reason": "string (explication courte de pourquoi ce style convient à cette photo)"
}

Analyse l'ambiance, les couleurs, la composition et le contenu de la photo pour faire la meilleure suggestion.
Réponds UNIQUEMENT avec le JSON, rien d'autre.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/jpeg',
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    const responseText = response.text.trim();
    
    if (!responseText || responseText.length === 0) {
      logger.warn('Empty response from Gemini in generateArtisticFilterSuggestion', null, {
        component: 'aiFilterService',
        action: 'generateArtisticFilterSuggestion'
      });
      return {
        style: 'vibrant',
        confidence: 0.5,
        reason: 'Réponse vide, suggestion par défaut'
      };
    }
    
    let jsonText = responseText;
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    try {
      const result = JSON.parse(jsonText) as ArtisticFilterSuggestion;
      
      // Valider le résultat
      if (!result.style || !['impressionist', 'popart', 'cinematic', 'vibrant', 'dreamy', 'dramatic', 'retro', 'neon'].includes(result.style)) {
        logger.warn('Invalid style in Gemini response', { style: result.style }, {
          component: 'aiFilterService',
          action: 'generateArtisticFilterSuggestion'
        });
        return {
          style: 'vibrant',
          confidence: 0.5,
          reason: 'Style invalide, suggestion par défaut'
        };
      }
      
      if (result.confidence === undefined || result.confidence < 0 || result.confidence > 1) {
        result.confidence = 0.7;
      }
      
      if (!result.reason) {
        result.reason = 'Style suggéré par IA';
      }
      
      // Mettre en cache
      filterCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });
      
      return result;
    } catch (parseError) {
      logger.error('Error parsing Gemini response in generateArtisticFilterSuggestion', parseError, {
        component: 'aiFilterService',
        action: 'generateArtisticFilterSuggestion',
        responseText: responseText.substring(0, 200)
      });
      return {
        style: 'vibrant',
        confidence: 0.5,
        reason: 'Erreur de parsing, suggestion par défaut'
      };
    }
  } catch (error) {
    const errorType = detectGeminiErrorType(error);
    logGeminiError(error, errorType, {
      component: 'aiFilterService',
      action: 'generateArtisticFilterSuggestion'
    });
    
    return {
      style: 'vibrant',
      confidence: 0.5,
      reason: 'Erreur API, suggestion par défaut'
    };
  }
};

/**
 * Génère des paramètres de filtres personnalisés optimisés pour la photo
 */
export const generateCustomFilterParams = async (
  base64Image: string
): Promise<CustomFilterParams> => {
  try {
    if (!base64Image || base64Image.trim().length === 0) {
      logger.warn('Empty base64 image provided to generateCustomFilterParams', null, {
        component: 'aiFilterService',
        action: 'generateCustomFilterParams'
      });
      return getDefaultFilterParams();
    }

    cleanCache();
    
    const imageHash = await getImageHash(base64Image);
    const cacheKey = `custom_${imageHash}`;
    
    const cached = filterCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      if ('brightness' in cached.result) {
        logger.debug('Cache hit for custom filter params', { hash: imageHash.substring(0, 8) });
        return cached.result as CustomFilterParams;
      }
    }
    
    logger.debug('Cache miss, calling Gemini API for custom filter params', { 
      hash: imageHash.substring(0, 8) 
    });

    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const prompt = `
Analyse cette photo de fête et génère des paramètres de filtres personnalisés pour l'optimiser esthétiquement.

Réponds UNIQUEMENT avec un JSON valide (sans markdown, sans code blocks) avec cette structure exacte :
{
  "brightness": number (entre 0.8 et 1.2),
  "contrast": number (entre 0.9 et 1.3),
  "saturation": number (entre 0.7 et 1.4),
  "hue": number (entre -30 et +30 degrés),
  "vignette": number (entre 0 et 0.3),
  "grain": number (entre 0 et 0.2),
  "blur": number (entre 0 et 2 pixels),
  "styleDescription": "string (description courte du style généré, ex: 'Ambiance chaleureuse avec tons dorés')"
}

Règles :
- brightness: Ajuste la luminosité globale (1.0 = normal, <1.0 = plus sombre, >1.0 = plus clair)
- contrast: Ajuste le contraste (1.0 = normal, <1.0 = moins de contraste, >1.0 = plus de contraste)
- saturation: Ajuste la saturation des couleurs (1.0 = normal, <1.0 = moins saturé, >1.0 = plus saturé)
- hue: Rotation de teinte en degrés (-30 à +30)
- vignette: Intensité du vignettage (0 = aucun, 0.3 = fort)
- grain: Intensité du grain (0 = aucun, 0.2 = fort)
- blur: Flou en pixels (0 = aucun, 2 = léger flou artistique)
- styleDescription: Description du style créé

Analyse la photo en détail (luminosité, couleurs, composition, ambiance) et génère des paramètres qui améliorent esthétiquement la photo tout en préservant son caractère naturel.
Réponds UNIQUEMENT avec le JSON, rien d'autre.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/jpeg',
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    const responseText = response.text.trim();
    
    if (!responseText || responseText.length === 0) {
      logger.warn('Empty response from Gemini in generateCustomFilterParams', null, {
        component: 'aiFilterService',
        action: 'generateCustomFilterParams'
      });
      return getDefaultFilterParams();
    }
    
    let jsonText = responseText;
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    try {
      const result = JSON.parse(jsonText) as CustomFilterParams;
      
      // Valider et normaliser les paramètres
      result.brightness = Math.max(0.8, Math.min(1.2, result.brightness || 1.0));
      result.contrast = Math.max(0.9, Math.min(1.3, result.contrast || 1.0));
      result.saturation = Math.max(0.7, Math.min(1.4, result.saturation || 1.0));
      result.hue = Math.max(-30, Math.min(30, result.hue || 0));
      result.vignette = Math.max(0, Math.min(0.3, result.vignette || 0));
      result.grain = Math.max(0, Math.min(0.2, result.grain || 0));
      result.blur = Math.max(0, Math.min(2, result.blur || 0));
      
      if (!result.styleDescription) {
        result.styleDescription = 'Style personnalisé optimisé par IA';
      }
      
      // Mettre en cache
      filterCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });
      
      return result;
    } catch (parseError) {
      logger.error('Error parsing Gemini response in generateCustomFilterParams', parseError, {
        component: 'aiFilterService',
        action: 'generateCustomFilterParams',
        responseText: responseText.substring(0, 200)
      });
      return getDefaultFilterParams();
    }
  } catch (error) {
    const errorType = detectGeminiErrorType(error);
    logGeminiError(error, errorType, {
      component: 'aiFilterService',
      action: 'generateCustomFilterParams'
    });
    
    return getDefaultFilterParams();
  }
};

/**
 * Retourne des paramètres de filtre par défaut (neutres)
 */
function getDefaultFilterParams(): CustomFilterParams {
  return {
    brightness: 1.0,
    contrast: 1.0,
    saturation: 1.0,
    hue: 0,
    vignette: 0,
    grain: 0,
    blur: 0,
    styleDescription: 'Aucun filtre appliqué'
  };
}

