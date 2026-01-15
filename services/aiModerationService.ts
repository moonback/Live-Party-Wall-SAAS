import { logger } from '../utils/logger';
import { DEFAULTS } from '../config/geminiConfig';
import { llmManager } from './llm/llmManager';

export interface ImageAnalysis {
  hasFaces: boolean;
  faceCount: number;
  isAppropriate: boolean;
  moderationReason?: string;
  suggestedFilter?: 'none' | 'vintage' | 'blackwhite' | 'warm' | 'cool';
  quality: 'good' | 'fair' | 'poor';
  suggestedImprovements?: string[]; // Suggestions d'amélioration (ex: ["améliorer luminosité", "recadrer"])
  estimatedQuality?: 'excellent' | 'good' | 'fair' | 'poor'; // Estimation plus précise de la qualité
}


/**
 * Analyse complète d'une image avec Gemini Vision
 * - Détection de visages
 * - Modération automatique
 * - Suggestions de filtres
 * 
 * En cas d'erreur (API indisponible, quota dépassé, rate limiting, etc.), retourne systématiquement
 * une analyse par défaut qui accepte l'image pour éviter de bloquer l'expérience utilisateur.
 */
export const analyzeImage = async (base64Image: string): Promise<ImageAnalysis> => {
  try {
    // Validation de l'input
    if (!base64Image || base64Image.trim().length === 0) {
      logger.warn('Empty base64 image provided to analyzeImage', undefined, {
        component: 'aiModerationService',
        action: 'analyzeImage'
      });
      return DEFAULTS.analysis;
    }

    // Utiliser llmManager qui gère automatiquement le fallback
    const analysis = await llmManager.analyzeImage(base64Image);

    // Validation et valeurs par défaut
    return {
      hasFaces: analysis.hasFaces ?? false,
      faceCount: analysis.faceCount ?? 0,
      isAppropriate: analysis.isAppropriate ?? true,
      moderationReason: analysis.moderationReason || undefined,
      suggestedFilter: analysis.suggestedFilter || 'none',
      quality: analysis.quality || 'good',
    };

  } catch (error) {
    // Logger l'erreur (llmManager a déjà géré le fallback)
    logger.error('Error in analyzeImage after fallback', error, {
      component: 'aiModerationService',
      action: 'analyzeImage'
    });
    
    // En cas d'erreur, on accepte par défaut (pour ne pas bloquer l'expérience)
    // mais on log l'erreur pour monitoring
    return DEFAULTS.analysis;
  }
};

/**
 * Vérifie si une image est appropriée pour le mur
 * Retourne true si l'image peut être publiée, false sinon
 */
export const isImageAppropriate = async (base64Image: string): Promise<{ 
  approved: boolean; 
  reason?: string;
  analysis?: ImageAnalysis;
}> => {
  const analysis = await analyzeImage(base64Image);
  
  if (!analysis.isAppropriate) {
    return {
      approved: false,
      reason: analysis.moderationReason || "Contenu inapproprié détecté",
      analysis,
    };
  }

  return {
    approved: true,
    analysis,
  };
};

