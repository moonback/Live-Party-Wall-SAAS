import { Photo } from '../types';
import { logger } from '../utils/logger';
import { DEFAULTS } from '../config/geminiConfig';
import { llmManager } from './llm/llmManager';


/**
 * Génère une suggestion de contexte d'événement basée sur l'analyse IA des photos existantes
 * Analyse un échantillon de photos pour détecter le type d'événement et suggérer un contexte approprié
 * Si un contexte existant est fourni, l'améliore pour le rendre plus humoristique et festif
 * 
 * @param photos - Liste de photos à analyser (prendra les 8 premières si plus)
 * @param existingContext - Contexte existant optionnel à améliorer
 * @returns Promise<string> - Suggestion de contexte améliorée et humoristique
 */
export const generateEventContextSuggestion = async (
  photos: Photo[],
  existingContext?: string | null
): Promise<string> => {
  try {
    // Filtrer uniquement les photos (pas les vidéos) et prendre un échantillon représentatif
    const photoSamples = photos
      .filter(p => p.type === 'photo')
      .slice(0, 8); // Maximum 8 photos pour éviter les coûts excessifs

    if (photoSamples.length === 0) {
      logger.debug('No photo samples available for context generation', {
        component: 'eventContextService',
        action: 'generateEventContextSuggestion'
      });
      return DEFAULTS.context; // Fallback si aucune photo
    }

      logger.debug('Generating event context suggestion', { 
      photoCount: photoSamples.length,
      component: 'eventContextService' 
    });

    // Utiliser llmManager qui gère automatiquement le fallback
    const suggestion = await llmManager.generateEventContext(photoSamples, existingContext);
    
    // Nettoyer la suggestion (enlever les émojis si présents, on les ajoutera si nécessaire)
    const cleanSuggestion = suggestion.replace(/^["']|["']$/g, '').trim();
    
    // Si après nettoyage la suggestion est vide, retourner le fallback
    if (cleanSuggestion.length === 0) {
      return DEFAULTS.context;
    }
    
    return cleanSuggestion;

  } catch (error) {
    // Logger l'erreur (llmManager a déjà géré le fallback)
    logger.error('Error in generateEventContextSuggestion after fallback', error, {
      component: 'eventContextService',
      action: 'generateEventContextSuggestion',
      photoCount: photos.length,
      hasExistingContext: !!existingContext
    });
    
    // Toujours retourner un contexte par défaut pour éviter que l'application plante
    return DEFAULTS.context; // Fallback en cas d'erreur
  }
};

