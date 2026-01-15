/**
 * Provider Hugging Face - Implémentation pour Hugging Face Inference API
 * Utilise des modèles gratuits comme LLaVA et BLIP-2 pour les tâches multimodales
 */

import { LLMProvider } from './llmProvider';
import { ImageAnalysis } from '../aiModerationService';
import { CombinedAnalysisResult } from '../aiService';
import { PhotoAnalysis } from '../aftermovieAIService';
import { Photo } from '../types';
import { 
  HUGGINGFACE_MODELS, 
  HUGGINGFACE_API_BASE, 
  HUGGINGFACE_TIMEOUT,
  getHuggingFaceApiKey,
  adaptCaptionPromptForHuggingFace,
  adaptModerationPromptForHuggingFace,
  adaptCombinedAnalysisPromptForHuggingFace,
  adaptTranslationPromptForHuggingFace,
  adaptAftermoviePromptForHuggingFace,
  adaptEventContextPromptForHuggingFace
} from '../config/llmConfig';
import { DEFAULTS, PROMPTS } from '../config/geminiConfig';
import { logger } from '../utils/logger';

/**
 * Convertit une URL d'image en base64
 */
async function imageUrlToBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    logger.error('Error converting image URL to base64', error, { 
      component: 'huggingFaceProvider', 
      action: 'imageUrlToBase64',
      imageUrl 
    });
    throw error;
  }
}

/**
 * Appelle l'API Hugging Face Inference
 */
async function callHuggingFaceAPI(
  modelId: string,
  inputs: { image?: string; text?: string },
  timeout: number = HUGGINGFACE_TIMEOUT
): Promise<string> {
  const apiKey = getHuggingFaceApiKey();
  const url = `${HUGGINGFACE_API_BASE}/${modelId}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(inputs),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Si le modèle est en train de charger (503), attendre un peu et réessayer
      if (response.status === 503) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 10000;
        logger.info('Model is loading, waiting before retry', {
          component: 'huggingFaceProvider',
          waitTime
        });
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return callHuggingFaceAPI(modelId, inputs, timeout);
      }
      
      const errorText = await response.text();
      throw new Error(`Hugging Face API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    
    // Hugging Face retourne soit une string directement, soit un objet avec generated_text
    if (typeof result === 'string') {
      return result;
    }
    
    if (Array.isArray(result) && result.length > 0) {
      const firstResult = result[0];
      if (typeof firstResult === 'string') {
        return firstResult;
      }
      if (firstResult.generated_text) {
        return firstResult.generated_text;
      }
    }
    
    if (result.generated_text) {
      return result.generated_text;
    }
    
    // Si c'est déjà du JSON, le retourner tel quel
    if (typeof result === 'object') {
      return JSON.stringify(result);
    }
    
    throw new Error('Unexpected response format from Hugging Face API');
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Hugging Face API timeout');
    }
    throw error;
  }
}

/**
 * Nettoie une réponse JSON en enlevant le markdown
 */
function cleanJsonResponse(responseText: string): string {
  let jsonText = responseText.trim();
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```\n?/g, '');
  }
  return jsonText;
}

/**
 * Provider Hugging Face - Implémentation de l'interface LLMProvider
 */
export class HuggingFaceProvider implements LLMProvider {
  async generateImageCaption(
    base64Image: string,
    eventContext?: string | null,
    authorName?: string | null,
    companions?: string[] | null
  ): Promise<string> {
    try {
      if (!base64Image || base64Image.trim().length === 0) {
        logger.warn('Empty base64 image provided to generateImageCaption', undefined, {
          component: 'huggingFaceProvider',
          action: 'generateImageCaption'
        });
        return DEFAULTS.caption;
      }

      const cleanBase64 = base64Image.split(',')[1] || base64Image;
      const geminiPrompt = PROMPTS.caption.buildPersonalized(eventContext, authorName, companions);
      const prompt = adaptCaptionPromptForHuggingFace(geminiPrompt);

      // Pour BLIP-2, le format est différent - on envoie l'image et le prompt
      const response = await callHuggingFaceAPI(
        HUGGINGFACE_MODELS.caption,
        {
          image: cleanBase64,
          text: prompt,
        }
      );

      const caption = response.trim();
      if (!caption || caption.trim().length === 0) {
        logger.warn('Empty caption returned from Hugging Face', undefined, {
          component: 'huggingFaceProvider',
          action: 'generateImageCaption'
        });
        return DEFAULTS.caption;
      }
      
      // Nettoyer la réponse (enlever guillemets si présents)
      const cleanCaption = caption.replace(/^["']|["']$/g, '').trim();
      return cleanCaption || DEFAULTS.caption;
    } catch (error) {
      logger.error('Error in HuggingFaceProvider.generateImageCaption', error, {
        component: 'huggingFaceProvider',
        action: 'generateImageCaption'
      });
      throw error;
    }
  }

  async analyzeImage(base64Image: string): Promise<ImageAnalysis> {
    try {
      if (!base64Image || base64Image.trim().length === 0) {
        logger.warn('Empty base64 image provided to analyzeImage', undefined, {
          component: 'huggingFaceProvider',
          action: 'analyzeImage'
        });
        return DEFAULTS.analysis;
      }

      const cleanBase64 = base64Image.split(',')[1] || base64Image;
      const prompt = adaptModerationPromptForHuggingFace();

      const response = await callHuggingFaceAPI(
        HUGGINGFACE_MODELS.analysis,
        {
          image: cleanBase64,
          text: prompt,
        }
      );

      const responseText = response.trim();
      if (!responseText || responseText.length === 0) {
        logger.warn('Empty response from Hugging Face in analyzeImage', undefined, {
          component: 'huggingFaceProvider',
          action: 'analyzeImage'
        });
        return DEFAULTS.analysis;
      }
      
      const jsonText = cleanJsonResponse(responseText);
      let analysis: ImageAnalysis;
      
      try {
        analysis = JSON.parse(jsonText) as ImageAnalysis;
      } catch (parseError) {
        logger.error('Failed to parse Hugging Face response as JSON', parseError, {
          component: 'huggingFaceProvider',
          action: 'analyzeImage',
          responseText: responseText.substring(0, 200)
        });
        return DEFAULTS.analysis;
      }

      return {
        hasFaces: analysis.hasFaces ?? false,
        faceCount: analysis.faceCount ?? 0,
        isAppropriate: analysis.isAppropriate ?? true,
        moderationReason: analysis.moderationReason || undefined,
        suggestedFilter: analysis.suggestedFilter || 'none',
        quality: analysis.quality || 'good',
      };
    } catch (error) {
      logger.error('Error in HuggingFaceProvider.analyzeImage', error, {
        component: 'huggingFaceProvider',
        action: 'analyzeImage'
      });
      throw error;
    }
  }

  async analyzeAndCaptionImage(
    base64Image: string,
    eventContext?: string | null,
    captionLanguage?: string | null,
    authorName?: string | null,
    companions?: string[] | null
  ): Promise<CombinedAnalysisResult> {
    try {
      if (!base64Image || base64Image.trim().length === 0) {
        logger.warn('Empty base64 image provided to analyzeAndCaptionImage', null, {
          component: 'huggingFaceProvider',
          action: 'analyzeAndCaptionImage'
        });
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

      const cleanBase64 = base64Image.split(',')[1] || base64Image;
      const geminiCaptionPrompt = PROMPTS.caption.buildPersonalized(eventContext, authorName, companions);
      const prompt = adaptCombinedAnalysisPromptForHuggingFace(geminiCaptionPrompt);

      const response = await callHuggingFaceAPI(
        HUGGINGFACE_MODELS.analysis,
        {
          image: cleanBase64,
          text: prompt,
        }
      );

      const responseText = response.trim();
      if (!responseText || responseText.length === 0) {
        logger.warn('Empty response from Hugging Face in analyzeAndCaptionImage', null, {
          component: 'huggingFaceProvider',
          action: 'analyzeAndCaptionImage'
        });
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
      
      const jsonText = cleanJsonResponse(responseText);
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
        logger.error('Failed to parse Hugging Face response as JSON', parseError, {
          component: 'huggingFaceProvider',
          action: 'analyzeAndCaptionImage',
          responseText: responseText.substring(0, 200)
        });
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

      let caption = parsed.caption?.trim() || DEFAULTS.caption;
      const tags = Array.isArray(parsed.tags) && parsed.tags.length > 0 
        ? parsed.tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0).slice(0, 8)
        : [];

      // Note: La traduction n'est pas implémentée pour Hugging Face dans cette version
      // On pourrait utiliser un modèle de traduction séparé si nécessaire

      return {
        analysis,
        caption,
        tags,
      };
    } catch (error) {
      logger.error('Error in HuggingFaceProvider.analyzeAndCaptionImage', error, {
        component: 'huggingFaceProvider',
        action: 'analyzeAndCaptionImage'
      });
      throw error;
    }
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    try {
      if (!text || text.trim().length < 3) {
        return text;
      }

      // Hugging Face a des modèles de traduction spécifiques par paire de langues
      // Pour simplifier, on utilise un modèle général ou on retourne le texte original
      // TODO: Implémenter la traduction avec des modèles Hugging Face spécifiques
      logger.warn('Translation not fully implemented for Hugging Face', null, {
        component: 'huggingFaceProvider',
        action: 'translateText',
        targetLanguage
      });
      
      // Pour l'instant, retourner le texte original
      // On pourrait utiliser Helsinki-NLP/opus-mt-fr-{lang} pour chaque langue
      return text;
    } catch (error) {
      logger.error('Error in HuggingFaceProvider.translateText', error, {
        component: 'huggingFaceProvider',
        action: 'translateText'
      });
      throw error;
    }
  }

  async generateEventContext(
    photos: Photo[],
    existingContext?: string | null
  ): Promise<string> {
    try {
      const photoSamples = photos
        .filter(p => p.type === 'photo')
        .slice(0, 4); // Limiter à 4 pour Hugging Face (peut être plus lent)

      if (photoSamples.length === 0) {
        logger.debug('No photo samples available for context generation', {
          component: 'huggingFaceProvider',
          action: 'generateEventContext'
        });
        return DEFAULTS.context;
      }

      // Pour Hugging Face, on analyse une seule photo représentative
      // (l'API peut être lente avec plusieurs images)
      const representativePhoto = photoSamples[0];
      const base64 = await imageUrlToBase64(representativePhoto.url);
      const cleanBase64 = base64.split(',')[1] || base64;
      
      const prompt = adaptEventContextPromptForHuggingFace(photoSamples.length, existingContext);

      const response = await callHuggingFaceAPI(
        HUGGINGFACE_MODELS.context,
        {
          image: cleanBase64,
          text: prompt,
        }
      );

      const suggestion = response.trim();
      if (!suggestion || suggestion.length === 0) {
        logger.warn('Empty suggestion returned from Hugging Face', {
          component: 'huggingFaceProvider',
          action: 'generateEventContext'
        });
        return DEFAULTS.context;
      }

      const cleanSuggestion = suggestion.replace(/^["']|["']$/g, '').trim();
      if (cleanSuggestion.length === 0) {
        return DEFAULTS.context;
      }
      
      return cleanSuggestion;
    } catch (error) {
      logger.error('Error in HuggingFaceProvider.generateEventContext', error, {
        component: 'huggingFaceProvider',
        action: 'generateEventContext'
      });
      throw error;
    }
  }

  async analyzePhotoForAftermovie(
    photo: Photo,
    eventContext?: string | null
  ): Promise<PhotoAnalysis> {
    try {
      const imageResponse = await fetch(photo.url);
      const imageBlob = await imageResponse.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageBlob);
      });
      
      const cleanBase64 = base64.split(',')[1] || base64;
      const prompt = adaptAftermoviePromptForHuggingFace(eventContext);

      const response = await callHuggingFaceAPI(
        HUGGINGFACE_MODELS.aftermovie,
        {
          image: cleanBase64,
          text: prompt,
        }
      );

      const responseText = response.trim();
      const jsonText = cleanJsonResponse(responseText);
      const parsed = JSON.parse(jsonText);

      return {
        photoId: photo.id,
        score: Math.max(0, Math.min(100, parsed.score || 50)),
        isKeyMoment: parsed.isKeyMoment || false,
        suggestedDuration: Math.max(2000, Math.min(6000, parsed.suggestedDuration || 3500)),
        suggestedTransition: parsed.suggestedTransition || 'fade',
        emotion: parsed.emotion || 'neutral',
        contentType: parsed.contentType || 'scene',
        quality: parsed.quality || 'fair',
        shouldInclude: parsed.shouldInclude !== false,
        reason: parsed.reason || 'Analyse IA'
      };
    } catch (error) {
      logger.error('Error in HuggingFaceProvider.analyzePhotoForAftermovie', error, {
        component: 'huggingFaceProvider',
        action: 'analyzePhotoForAftermovie',
        photoId: photo.id
      });
      throw error;
    }
  }
}

