/**
 * Service combiné pour l'IA Gemini
 * Combine modération et génération de légende en 1 seul appel API
 * Réduit les coûts de 50% (1 appel au lieu de 2)
 * Cache les résultats pour éviter les appels API pour images identiques
 */

import { GoogleGenAI } from "@google/genai";
import { ImageAnalysis } from './aiModerationService';
import { logger } from '../utils/logger';
import { getImageHash } from '../utils/imageHash';
import { 
  detectGeminiErrorType, 
  logGeminiError 
} from '../utils/geminiErrorHandler';
import { translateCaptionIfNeeded } from './translationService';
import { MODELS, DEFAULTS, PROMPTS } from '../config/geminiConfig';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Cache en mémoire pour les analyses (évite les appels API pour images identiques)
// Structure : Map<hash, { result: CombinedAnalysisResult, timestamp: number }>
const analysisCache = new Map<string, { result: CombinedAnalysisResult; timestamp: number }>();

// Durée de vie du cache : 1 heure (3600000 ms)
const CACHE_TTL = 60 * 60 * 1000;

// Taille max du cache : 100 entrées (évite la consommation mémoire excessive)
const MAX_CACHE_SIZE = 100;

/**
 * Nettoie le cache des entrées expirées ou trop anciennes
 */
function cleanCache(): void {
  const now = Date.now();
  const entries = Array.from(analysisCache.entries());
  
  // Supprimer les entrées expirées
  for (const [hash, value] of entries) {
    if (now - value.timestamp > CACHE_TTL) {
      analysisCache.delete(hash);
    }
  }
  
  // Si le cache est encore trop grand, supprimer les plus anciennes
  if (analysisCache.size > MAX_CACHE_SIZE) {
    const sorted = Array.from(analysisCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toDelete = sorted.slice(0, analysisCache.size - MAX_CACHE_SIZE);
    for (const [hash] of toDelete) {
      analysisCache.delete(hash);
    }
  }
}

export interface CombinedAnalysisResult {
  analysis: ImageAnalysis;
  caption: string;
  tags: string[]; // Tags suggérés par l'IA (ex: ['sourire', 'groupe', 'danse', 'fête'])
}

/**
 * Analyse une image et génère une légende en 1 seul appel API Gemini
 * Combine modération + légende pour réduire les coûts
 * 
 * @param base64Image - Image en base64
 * @param eventContext - Contexte optionnel de l'événement pour personnaliser les légendes
 * @param captionLanguage - Code langue ISO 639-1 pour la traduction de la légende (ex: 'en', 'es', 'de')
 * @returns Promise<CombinedAnalysisResult> - Analyse complète + légende (traduite si nécessaire)
 */
export const analyzeAndCaptionImage = async (
  base64Image: string,
  eventContext?: string | null,
  captionLanguage?: string | null
): Promise<CombinedAnalysisResult> => {
  try {
    // Validation de l'input
    if (!base64Image || base64Image.trim().length === 0) {
      logger.warn('Empty base64 image provided to analyzeAndCaptionImage', null, {
        component: 'aiService',
        action: 'analyzeAndCaptionImage'
      });
      // Retourner un fallback immédiatement
      return {
        analysis: {
          hasFaces: false,
          faceCount: 0,
          isAppropriate: true,
          suggestedFilter: 'none',
          quality: 'fair',
          estimatedQuality: 'fair',
          suggestedImprovements: [],
        },
        caption: DEFAULTS.caption,
        tags: [],
      };
    }

    // Nettoyer le cache périodiquement
    cleanCache();
    
    // Générer un hash de l'image pour le cache
    // Le hash inclut aussi le contexte de l'événement et la langue (car la légende dépend du contexte et de la langue)
    const imageHash = await getImageHash(base64Image);
    const cacheKey = `${imageHash}_${eventContext || 'default'}_${captionLanguage || 'fr'}`;
    
    // Vérifier le cache
    const cached = analysisCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      logger.debug('Cache hit for image analysis', { hash: imageHash.substring(0, 8), language: captionLanguage });
      return cached.result;
    }
    
    logger.debug('Cache miss, calling Gemini API', { hash: imageHash.substring(0, 8) });
    
    // Strip the data:image/xyz;base64, prefix if present
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    // Construire le prompt personnalisé pour la légende
    const captionPrompt = PROMPTS.caption.buildPersonalized(eventContext);

    // Prompt combiné : modération + légende + tags + améliorations
    const combinedPrompt = PROMPTS.combinedAnalysis(captionPrompt);

    const response = await ai.models.generateContent({
      model: MODELS.analysis,
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/jpeg',
            },
          },
          {
            text: combinedPrompt,
          },
        ],
      },
    });

    const responseText = response.text.trim();
    
    if (!responseText || responseText.length === 0) {
      logger.warn('Empty response from Gemini in analyzeAndCaptionImage', null, {
        component: 'aiService',
        action: 'analyzeAndCaptionImage'
      });
      // Retourner un fallback
      return {
        analysis: {
          hasFaces: false,
          faceCount: 0,
          isAppropriate: true,
          suggestedFilter: 'none',
          quality: 'fair',
          estimatedQuality: 'fair',
          suggestedImprovements: [],
        },
        caption: DEFAULTS.caption,
        tags: [],
      };
    }
    
    // Nettoyer la réponse (enlever markdown si présent)
    let jsonText = responseText;
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    let parsed: {
      hasFaces?: boolean;
      faceCount?: number;
      isAppropriate?: boolean;
      moderationReason?: string | null;
      suggestedFilter?: 'none' | 'vintage' | 'blackwhite' | 'warm' | 'cool';
      quality?: 'good' | 'fair' | 'poor';
      estimatedQuality?: 'excellent' | 'good' | 'fair' | 'poor';
      suggestedImprovements?: string[];
      caption?: string;
      tags?: string[];
    };

    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      logger.error('Failed to parse Gemini response as JSON', parseError, {
        component: 'aiService',
        action: 'analyzeAndCaptionImage',
        responseText: responseText.substring(0, 200) // Log les 200 premiers caractères
      });
      // Retourner un fallback en cas d'erreur de parsing
      return {
        analysis: {
          hasFaces: false,
          faceCount: 0,
          isAppropriate: true,
          suggestedFilter: 'none',
          quality: 'fair',
          estimatedQuality: 'fair',
          suggestedImprovements: [],
        },
        caption: DEFAULTS.caption,
        tags: [],
      };
    }

    // Validation et valeurs par défaut pour l'analyse
    const analysis: ImageAnalysis = {
      hasFaces: parsed.hasFaces ?? false,
      faceCount: parsed.faceCount ?? 0,
      isAppropriate: parsed.isAppropriate ?? true,
      moderationReason: parsed.moderationReason || undefined,
      suggestedFilter: parsed.suggestedFilter || 'none',
      quality: parsed.quality || 'good',
      estimatedQuality: parsed.estimatedQuality || parsed.quality || 'good',
      suggestedImprovements: Array.isArray(parsed.suggestedImprovements) ? parsed.suggestedImprovements : [],
    };

    // Validation et fallback pour la légende
    let caption = parsed.caption?.trim() || DEFAULTS.caption;

    // Traduire la légende si une langue est spécifiée
    if (captionLanguage && captionLanguage !== 'fr') {
      try {
        caption = await translateCaptionIfNeeded(caption, captionLanguage);
        logger.debug('Caption translated', { 
          original: parsed.caption?.trim(), 
          translated: caption, 
          language: captionLanguage 
        });
      } catch (translationError) {
        logger.warn('Translation failed, using original caption', translationError, {
          component: 'aiService',
          action: 'analyzeAndCaptionImage',
          language: captionLanguage
        });
        // Continuer avec la légende originale en cas d'erreur de traduction
      }
    }

    // Validation et fallback pour les tags
    const tags = Array.isArray(parsed.tags) && parsed.tags.length > 0 
      ? parsed.tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0).slice(0, 8) // Max 8 tags
      : [];

    const result: CombinedAnalysisResult = {
      analysis,
      caption,
      tags,
    };
    
    // Mettre en cache le résultat (la langue est déjà dans cacheKey)
    analysisCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
    
    return result;

  } catch (error) {
    // Détecter le type d'erreur
    const errorType = detectGeminiErrorType(error);
    
    // Logger l'erreur avec le contexte
    logGeminiError(error, errorType, {
      component: 'aiService',
      action: 'analyzeAndCaptionImage',
      eventContext: eventContext || 'none'
    });
    
    // Fallback en cas d'erreur - toujours retourner des valeurs sûres
    // pour éviter que l'application plante
    return {
      analysis: {
        hasFaces: false,
        faceCount: 0,
        isAppropriate: true, // Par défaut, on accepte (mais on log l'erreur)
        suggestedFilter: 'none',
        quality: 'fair',
        estimatedQuality: 'fair',
        suggestedImprovements: [],
      },
      caption: DEFAULTS.caption, // Légende par défaut cohérente avec geminiService
      tags: [],
    };
  }
};

/**
 * Vérifie si une image est appropriée pour le mur
 * Utilise le service combiné mais ne retourne que la partie modération
 * 
 * @param base64Image - Image en base64
 * @returns Promise avec approved, reason et analysis
 */
export const isImageAppropriate = async (base64Image: string): Promise<{ 
  approved: boolean; 
  reason?: string;
  analysis?: ImageAnalysis;
}> => {
  const result = await analyzeAndCaptionImage(base64Image);
  
  if (!result.analysis.isAppropriate) {
    return {
      approved: false,
      reason: result.analysis.moderationReason || "Contenu inapproprié détecté",
      analysis: result.analysis,
    };
  }

  return {
    approved: true,
    analysis: result.analysis,
  };
};

