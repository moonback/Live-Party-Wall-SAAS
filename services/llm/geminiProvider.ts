/**
 * Provider Gemini - Wrapper autour de l'API Gemini existante
 * Implémente l'interface LLMProvider pour permettre le fallback
 */

import { GoogleGenAI } from "@google/genai";
import { LLMProvider } from './llmProvider';
import { ImageAnalysis } from '../aiModerationService';
import { CombinedAnalysisResult } from '../aiService';
import { PhotoAnalysis } from '../aftermovieAIService';
import { Photo } from '../../types';
import { MODELS, DEFAULTS, PROMPTS } from '../../config/geminiConfig';
import { logger } from '../../utils/logger';
import { translateCaptionIfNeeded } from '../translationService';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
      component: 'geminiProvider', 
      action: 'imageUrlToBase64',
      imageUrl 
    });
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
 * Provider Gemini - Implémentation de l'interface LLMProvider
 */
export class GeminiProvider implements LLMProvider {
  async generateImageCaption(
    base64Image: string,
    eventContext?: string | null,
    authorName?: string | null,
    companions?: string[] | null
  ): Promise<string> {
    try {
      if (!base64Image || base64Image.trim().length === 0) {
        logger.warn('Empty base64 image provided to generateImageCaption', undefined, {
          component: 'geminiProvider',
          action: 'generateImageCaption'
        });
        return DEFAULTS.caption;
      }

      const cleanBase64 = base64Image.split(',')[1] || base64Image;
      const prompt = PROMPTS.caption.buildPersonalized(eventContext, authorName, companions);

      const response = await ai.models.generateContent({
        model: MODELS.caption,
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

      const caption = response.text?.trim();
      if (!caption || caption.trim().length === 0) {
        logger.warn('Empty caption returned from Gemini', undefined, {
          component: 'geminiProvider',
          action: 'generateImageCaption'
        });
        return DEFAULTS.caption;
      }
      
      return caption.trim();
    } catch (error) {
      logger.error('Error in GeminiProvider.generateImageCaption', error, {
        component: 'geminiProvider',
        action: 'generateImageCaption'
      });
      throw error; // Propager l'erreur pour permettre le fallback
    }
  }

  async analyzeImage(base64Image: string): Promise<ImageAnalysis> {
    try {
      if (!base64Image || base64Image.trim().length === 0) {
        logger.warn('Empty base64 image provided to analyzeImage', undefined, {
          component: 'geminiProvider',
          action: 'analyzeImage'
        });
        return DEFAULTS.analysis;
      }

      const cleanBase64 = base64Image.split(',')[1] || base64Image;
      const analysisPrompt = PROMPTS.moderation;

      const response = await ai.models.generateContent({
        model: MODELS.moderation,
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: 'image/jpeg',
              },
            },
            {
              text: analysisPrompt,
            },
          ],
        },
      });

      const responseText = response.text?.trim();
      if (!responseText || responseText.length === 0) {
        logger.warn('Empty response from Gemini in analyzeImage', undefined, {
          component: 'geminiProvider',
          action: 'analyzeImage'
        });
        return DEFAULTS.analysis;
      }
      
      const jsonText = cleanJsonResponse(responseText);
      let analysis: ImageAnalysis;
      
      try {
        analysis = JSON.parse(jsonText) as ImageAnalysis;
      } catch (parseError) {
        logger.error('Failed to parse Gemini response as JSON', parseError, {
          component: 'geminiProvider',
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
      logger.error('Error in GeminiProvider.analyzeImage', error, {
        component: 'geminiProvider',
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
        logger.warn('Empty base64 image provided to analyzeAndCaptionImage', undefined, {
          component: 'geminiProvider',
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
      const captionPrompt = PROMPTS.caption.buildPersonalized(eventContext, authorName, companions);
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

      const responseText = response.text?.trim();
      if (!responseText || responseText.length === 0) {
        logger.warn('Empty response from Gemini in analyzeAndCaptionImage', undefined, {
          component: 'geminiProvider',
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
        logger.error('Failed to parse Gemini response as JSON', parseError, {
          component: 'geminiProvider',
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

      if (captionLanguage && captionLanguage !== 'fr') {
        try {
          caption = await translateCaptionIfNeeded(caption, captionLanguage);
        } catch (translationError) {
          logger.warn('Translation failed, using original caption', {
            component: 'geminiProvider',
            action: 'analyzeAndCaptionImage',
            language: captionLanguage,
            error: translationError instanceof Error ? translationError.message : String(translationError)
          });
        }
      }

      const tags = Array.isArray(parsed.tags) && parsed.tags.length > 0 
        ? parsed.tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0).slice(0, 8)
        : [];

      return {
        analysis,
        caption,
        tags,
      };
    } catch (error) {
      logger.error('Error in GeminiProvider.analyzeAndCaptionImage', error, {
        component: 'geminiProvider',
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

      const languageName = targetLanguage; // Simplifié pour Gemini
      const translationPrompt = PROMPTS.translation(text, languageName);

      const response = await ai.models.generateContent({
        model: MODELS.translation,
        contents: {
          parts: [
            {
              text: translationPrompt,
            },
          ],
        },
      });

      const translated = response.text?.trim();
      if (!translated) {
        logger.warn('Empty translation returned from Gemini', undefined, {
          component: 'geminiProvider',
          action: 'translateText',
          targetLanguage
        });
        return text;
      }
      const cleanTranslation = translated.replace(/^["']|["']$/g, '');
      
      if (!cleanTranslation || cleanTranslation.length === 0) {
        logger.warn('Empty translation returned from Gemini', undefined, {
          component: 'geminiProvider',
          action: 'translateText',
          targetLanguage
        });
        return text;
      }
      
      return cleanTranslation;
    } catch (error) {
      logger.error('Error in GeminiProvider.translateText', error, {
        component: 'geminiProvider',
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
        .slice(0, 8);

      if (photoSamples.length === 0) {
        logger.debug('No photo samples available for context generation', {
          component: 'geminiProvider',
          action: 'generateEventContext'
        });
        return DEFAULTS.context;
      }

      const imageParts = await Promise.all(
        photoSamples.map(async (photo) => {
          try {
            const base64 = await imageUrlToBase64(photo.url);
            const cleanBase64 = base64.split(',')[1] || base64;
            return {
              inlineData: {
                data: cleanBase64,
                mimeType: 'image/jpeg',
              },
            };
          } catch (error) {
            logger.warn('Failed to convert photo to base64, skipping', {
              photoId: photo.id,
              component: 'geminiProvider',
              error: error instanceof Error ? error.message : String(error)
            });
            return null;
          }
        })
      );

      const validImageParts = imageParts.filter((part): part is NonNullable<typeof part> => part !== null);

      if (validImageParts.length === 0) {
        logger.warn('All image conversions failed for context generation', {
          component: 'geminiProvider',
          action: 'generateEventContext',
          photoCount: photoSamples.length
        });
        return DEFAULTS.context;
      }

      let analysisPrompt: string;
      if (existingContext && existingContext.trim()) {
        analysisPrompt = PROMPTS.eventContext.improve(existingContext.trim(), validImageParts.length);
      } else {
        analysisPrompt = PROMPTS.eventContext.create(validImageParts.length);
      }

      const response = await ai.models.generateContent({
        model: MODELS.context,
        contents: {
          parts: [
            ...validImageParts,
            {
              text: analysisPrompt,
            },
          ],
        },
      });

      const suggestion = response.text?.trim() || '';
      if (!suggestion || suggestion.length === 0) {
        logger.warn('Empty suggestion returned from Gemini', undefined, {
          component: 'geminiProvider',
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
      logger.error('Error in GeminiProvider.generateEventContext', error instanceof Error ? error : new Error(String(error)), {
        component: 'geminiProvider',
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
      const prompt = PROMPTS.aftermovieAnalysis(eventContext);

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
              text: prompt,
            },
          ],
        },
      });

      const responseText = response.text?.trim();
      if (!responseText || responseText.length === 0) {
        throw new Error('Empty response from Gemini in analyzePhotoForAftermovie');
      }
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
      logger.error('Error in GeminiProvider.analyzePhotoForAftermovie', error, {
        component: 'geminiProvider',
        action: 'analyzePhotoForAftermovie',
        photoId: photo.id
      });
      throw error;
    }
  }
}

