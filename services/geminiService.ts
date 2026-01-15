import { logger } from '../utils/logger';
import { getImageHash } from '../utils/imageHash';
import { DEFAULTS } from '../config/geminiConfig';
import { llmManager } from './llm/llmManager';

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
 * @param authorName - Nom de l'invité qui poste la photo (prénom si seul, nom complet si avec compagnons)
 * @param companions - Liste des compagnons présents sur la photo (optionnel)
 * @returns Promise<string> - Légende personnalisée selon le type d'événement, ou légende par défaut en cas d'erreur
 */
export const generateImageCaption = async (
  base64Image: string, 
  eventContext?: string | null,
  authorName?: string | null,
  companions?: string[] | null
): Promise<string> => {
  try {
    // Validation de l'input
    if (!base64Image || base64Image.trim().length === 0) {
      logger.warn('Empty base64 image provided to generateImageCaption', undefined, {
        component: 'geminiService',
        action: 'generateImageCaption'
      });
      return DEFAULTS.caption;
    }

    // Nettoyer le cache périodiquement
    cleanCache();
    
    // Générer un hash de l'image pour le cache
    // Le hash inclut aussi le contexte de l'événement et l'auteur (car la légende dépend du contexte et de l'auteur)
    const imageHash = await getImageHash(base64Image);
    const authorKey = authorName ? `${authorName}_${companions?.join(',') || ''}` : 'no-author';
    const cacheKey = `${imageHash}_${eventContext || 'default'}_${authorKey}`;
    
    // Vérifier le cache
    const cached = captionCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      logger.debug('Cache hit for image caption', { 
        hash: imageHash.substring(0, 8), 
        eventContext: eventContext || 'default',
        authorName: authorName || 'none'
      });
      return cached.caption;
    }
    
    logger.debug('Cache miss, calling LLM API for caption', { 
      hash: imageHash.substring(0, 8),
      authorName: authorName || 'none'
    });

    // Utiliser llmManager qui gère automatiquement le fallback
    const caption = await llmManager.generateImageCaption(
      base64Image,
      eventContext,
      authorName,
      companions
    );
    
    const trimmedCaption = caption.trim();
    
    // Mettre en cache le résultat
    captionCache.set(cacheKey, {
      caption: trimmedCaption,
      timestamp: Date.now()
    });
    
    return trimmedCaption;

  } catch (error) {
    // Logger l'erreur (llmManager a déjà géré le fallback)
    logger.error('Error in generateImageCaption after fallback', error, {
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
