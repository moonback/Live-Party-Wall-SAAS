/**
 * Gestionnaire LLM avec fallback automatique
 * Essaie d'abord Gemini, bascule vers Hugging Face en cas d'erreur récupérable
 */

import { LLMProvider } from './llmProvider';
import { GeminiProvider } from './geminiProvider';
import { HuggingFaceProvider } from './huggingFaceProvider';
import { ImageAnalysis } from '../aiModerationService';
import { CombinedAnalysisResult } from '../aiService';
import { PhotoAnalysis } from '../aftermovieAIService';
import { Photo } from '../../types';
import { getProvider } from '../../config/llmConfig';
import { detectGeminiErrorType, isRecoverableError } from '../../utils/geminiErrorHandler';
import { logger } from '../../utils/logger';

/**
 * Instance singleton du provider principal
 */
let primaryProvider: LLMProvider | null = null;
let fallbackProvider: LLMProvider | null = null;

/**
 * Initialise les providers
 */
function initializeProviders(): void {
  const providerType = getProvider();
  
  if (providerType === 'huggingface') {
    // Si Hugging Face est forcé, l'utiliser comme provider principal
    primaryProvider = new HuggingFaceProvider();
    fallbackProvider = new GeminiProvider(); // Gemini en fallback
  } else {
    // Par défaut, Gemini est le provider principal
    primaryProvider = new GeminiProvider();
    fallbackProvider = new HuggingFaceProvider(); // Hugging Face en fallback
  }
}

/**
 * Récupère le provider principal
 */
function getPrimaryProvider(): LLMProvider {
  if (!primaryProvider) {
    initializeProviders();
  }
  return primaryProvider!;
}

/**
 * Récupère le provider de fallback
 */
function getFallbackProvider(): LLMProvider {
  if (!fallbackProvider) {
    initializeProviders();
  }
  return fallbackProvider!;
}

/**
 * Exécute une opération avec fallback automatique
 */
async function executeWithFallback<T>(
  operation: (provider: LLMProvider) => Promise<T>,
  operationName: string
): Promise<T> {
  const primary = getPrimaryProvider();
  const fallback = getFallbackProvider();
  
  try {
    // Essayer d'abord avec le provider principal
    return await operation(primary);
  } catch (error) {
    // Détecter le type d'erreur
    const errorType = detectGeminiErrorType(error);
    
    // Logger l'erreur
    logger.warn(`Primary provider (${getProvider()}) failed, attempting fallback`, error, {
      component: 'llmManager',
      action: operationName,
      errorType
    });
    
    // Bascule vers le fallback si l'erreur est récupérable
    if (isRecoverableError(errorType)) {
      logger.info(`Falling back to ${getProvider() === 'gemini' ? 'Hugging Face' : 'Gemini'}`, {
        component: 'llmManager',
        action: operationName,
        errorType
      });
      
      try {
        return await operation(fallback);
      } catch (fallbackError) {
        logger.error('Fallback provider also failed', fallbackError, {
          component: 'llmManager',
          action: operationName
        });
        throw fallbackError; // Propager l'erreur du fallback
      }
    } else {
      // Erreur non récupérable (AUTH_ERROR, etc.) - ne pas basculer
      logger.error('Non-recoverable error, not attempting fallback', error, {
        component: 'llmManager',
        action: operationName,
        errorType
      });
      throw error;
    }
  }
}

/**
 * Gestionnaire LLM avec fallback automatique
 * Expose les mêmes méthodes que LLMProvider mais avec gestion du fallback
 */
export const llmManager = {
  /**
   * Génère une légende pour une image
   */
  async generateImageCaption(
    base64Image: string,
    eventContext?: string | null,
    authorName?: string | null,
    companions?: string[] | null
  ): Promise<string> {
    return executeWithFallback(
      (provider) => provider.generateImageCaption(base64Image, eventContext, authorName, companions),
      'generateImageCaption'
    );
  },

  /**
   * Analyse une image (modération, détection de visages, qualité)
   */
  async analyzeImage(base64Image: string): Promise<ImageAnalysis> {
    return executeWithFallback(
      (provider) => provider.analyzeImage(base64Image),
      'analyzeImage'
    );
  },

  /**
   * Analyse une image et génère une légende en un seul appel
   */
  async analyzeAndCaptionImage(
    base64Image: string,
    eventContext?: string | null,
    captionLanguage?: string | null,
    authorName?: string | null,
    companions?: string[] | null
  ): Promise<CombinedAnalysisResult> {
    return executeWithFallback(
      (provider) => provider.analyzeAndCaptionImage(base64Image, eventContext, captionLanguage, authorName, companions),
      'analyzeAndCaptionImage'
    );
  },

  /**
   * Traduit un texte dans une langue cible
   */
  async translateText(text: string, targetLanguage: string): Promise<string> {
    return executeWithFallback(
      (provider) => provider.translateText(text, targetLanguage),
      'translateText'
    );
  },

  /**
   * Génère un contexte d'événement basé sur des photos
   */
  async generateEventContext(
    photos: Photo[],
    existingContext?: string | null
  ): Promise<string> {
    return executeWithFallback(
      (provider) => provider.generateEventContext(photos, existingContext),
      'generateEventContext'
    );
  },

  /**
   * Analyse une photo pour l'aftermovie
   */
  async analyzePhotoForAftermovie(
    photo: Photo,
    eventContext?: string | null
  ): Promise<PhotoAnalysis> {
    return executeWithFallback(
      (provider) => provider.analyzePhotoForAftermovie(photo, eventContext),
      'analyzePhotoForAftermovie'
    );
  },
};

