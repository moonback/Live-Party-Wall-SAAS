import { GoogleGenAI } from "@google/genai";
import { 
  detectGeminiErrorType, 
  logGeminiError, 
  GeminiErrorType 
} from '../utils/geminiErrorHandler';
import { logger } from '../utils/logger';
import { getImageHash } from '../utils/imageHash';
import { MODELS, DEFAULTS, PROMPTS } from '../config/geminiConfig';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Cache en mémoire pour les légendes (évite les appels API pour images identiques)
// Structure : Map<cacheKey, { caption: string, timestamp: number }>
const captionCache = new Map<string, { caption: string; timestamp: number }>();

// Durée de vie du cache : 1 heure (3600000 ms)
const CACHE_TTL = 60 * 60 * 1000;

// Taille max du cache : 100 entrées (évite la consommation mémoire excessive)
const MAX_CACHE_SIZE = 100;

/**
 * Nettoie le cache des entrées expirées ou trop anciennes
 */
function cleanCache(): void {
  const now = Date.now();
  const entries = Array.from(captionCache.entries());
  
  // Supprimer les entrées expirées
  for (const [key, value] of entries) {
    if (now - value.timestamp > CACHE_TTL) {
      captionCache.delete(key);
    }
  }
  
  // Si le cache est encore trop grand, supprimer les plus anciennes
  if (captionCache.size > MAX_CACHE_SIZE) {
    const sorted = Array.from(captionCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toDelete = sorted.slice(0, captionCache.size - MAX_CACHE_SIZE);
    for (const [key] of toDelete) {
      captionCache.delete(key);
    }
  }
}

/**
 * Generates a caption for a given base64 image using Gemini.
 * Le prompt est automatiquement personnalisé selon le type d'événement détecté dans eventContext.
 * 
 * En cas d'erreur (API indisponible, quota dépassé, rate limiting, etc.), retourne systématiquement
 * une légende par défaut pour éviter que l'application plante.
 * 
 * @param base64Image - Image en base64
 * @param eventContext - Contexte optionnel de l'événement pour personnaliser les légendes
 *                       Exemples : "Mariage de Sophie et Marc", "Anniversaire 30 ans", 
 *                                  "Soirée entreprise", "Fête de famille", etc.
 * @returns Promise<string> - Légende personnalisée selon le type d'événement, ou légende par défaut en cas d'erreur
 */
export const generateImageCaption = async (base64Image: string, eventContext?: string | null): Promise<string> => {
  try {
    // Validation de l'input
    if (!base64Image || base64Image.trim().length === 0) {
      logger.warn('Empty base64 image provided to generateImageCaption', null, {
        component: 'geminiService',
        action: 'generateImageCaption'
      });
      return DEFAULTS.caption;
    }

    // Nettoyer le cache périodiquement
    cleanCache();
    
    // Générer un hash de l'image pour le cache
    // Le hash inclut aussi le contexte de l'événement (car la légende dépend du contexte)
    const imageHash = await getImageHash(base64Image);
    const cacheKey = `${imageHash}_${eventContext || 'default'}`;
    
    // Vérifier le cache
    const cached = captionCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      logger.debug('Cache hit for image caption', { 
        hash: imageHash.substring(0, 8), 
        eventContext: eventContext || 'default' 
      });
      return cached.caption;
    }
    
    logger.debug('Cache miss, calling Gemini API for caption', { 
      hash: imageHash.substring(0, 8) 
    });

    // Strip the data:image/xyz;base64, prefix if present
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    // Construire le prompt personnalisé selon le contexte de l'événement
    const prompt = PROMPTS.caption.buildPersonalized(eventContext);

    const response = await ai.models.generateContent({
      model: MODELS.caption,
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/jpeg', // Assuming JPEG for simplicity from canvas export
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    const caption = response.text;
    if (!caption || caption.trim().length === 0) {
      logger.warn('Empty caption returned from Gemini', null, {
        component: 'geminiService',
        action: 'generateImageCaption'
      });
      return DEFAULTS.caption;
    }
    
    const trimmedCaption = caption.trim();
    
    // Mettre en cache le résultat
    captionCache.set(cacheKey, {
      caption: trimmedCaption,
      timestamp: Date.now()
    });
    
    return trimmedCaption;

  } catch (error) {
    // Détecter le type d'erreur
    const errorType = detectGeminiErrorType(error);
    
    // Logger l'erreur avec le contexte
    logGeminiError(error, errorType, {
      component: 'geminiService',
      action: 'generateImageCaption',
      eventContext: eventContext || 'none'
    });

    // Toujours retourner une légende par défaut pour éviter que l'application plante
    // L'utilisateur ne verra pas d'erreur, juste une légende générique
    // Ne pas mettre en cache les erreurs
    return DEFAULTS.caption;
  }
};
