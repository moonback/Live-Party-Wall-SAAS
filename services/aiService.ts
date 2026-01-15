/**
 * Service combiné pour l'IA Gemini
 * Combine modération et génération de légende en 1 seul appel API
 * Réduit les coûts de 50% (1 appel au lieu de 2)
 * Cache les résultats pour éviter les appels API pour images identiques
 */

import { ImageAnalysis } from './aiModerationService';
import { logger } from '../utils/logger';
import { getImageHash } from '../utils/imageHash';
import { DEFAULTS } from '../config/geminiConfig';
import { llmManager } from './llm/llmManager';

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
 * @param authorName - Nom de l'invité qui poste la photo (prénom si seul, nom complet si avec compagnons)
 * @param companions - Liste des compagnons présents sur la photo (optionnel)
 * @returns Promise<CombinedAnalysisResult> - Analyse complète + légende (traduite si nécessaire)
 */
export const analyzeAndCaptionImage = async (
  base64Image: string,
  eventContext?: string | null,
  captionLanguage?: string | null,
  authorName?: string | null,
  companions?: string[] | null
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
    // Le hash inclut aussi le contexte de l'événement, la langue et l'auteur (car la légende dépend de ces éléments)
    const imageHash = await getImageHash(base64Image);
    const authorKey = authorName ? `${authorName}_${companions?.join(',') || ''}` : 'no-author';
    const cacheKey = `${imageHash}_${eventContext || 'default'}_${captionLanguage || 'fr'}_${authorKey}`;
    
    // Vérifier le cache
    const cached = analysisCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      logger.debug('Cache hit for image analysis', { 
        hash: imageHash.substring(0, 8), 
        language: captionLanguage,
        authorName: authorName || 'none'
      });
      return cached.result;
    }
    
    logger.debug('Cache miss, calling LLM API', { 
      hash: imageHash.substring(0, 8),
      authorName: authorName || 'none'
    });

    // Utiliser llmManager qui gère automatiquement le fallback
    // Note: La traduction est gérée dans llmManager si nécessaire
    const result = await llmManager.analyzeAndCaptionImage(
      base64Image,
      eventContext,
      captionLanguage,
      authorName,
      companions
    );
    
    // Mettre en cache le résultat (la langue est déjà dans cacheKey)
    analysisCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
    
    return result;

  } catch (error) {
    // Logger l'erreur (llmManager a déjà géré le fallback)
    logger.error('Error in analyzeAndCaptionImage after fallback', error, {
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

