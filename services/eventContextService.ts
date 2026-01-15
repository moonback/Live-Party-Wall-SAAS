import { GoogleGenAI } from "@google/genai";
import { Photo } from '../types';
import { logger } from '../utils/logger';
import { 
  detectGeminiErrorType, 
  logGeminiError 
} from '../utils/geminiErrorHandler';
import { MODELS, DEFAULTS, PROMPTS } from '../config/geminiConfig';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Convertit une URL d'image en base64
 * @param imageUrl - URL de l'image
 * @returns Promise<string> - Image en base64
 */
const imageUrlToBase64 = async (imageUrl: string): Promise<string> => {
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
      component: 'eventContextService', 
      action: 'imageUrlToBase64',
      imageUrl 
    });
    throw error;
  }
};

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

    // Convertir les URLs en base64 (en parallèle)
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
            component: 'eventContextService',
            error: error instanceof Error ? error.message : String(error)
          });
          return null;
        }
      })
    );

    // Filtrer les nulls (photos qui ont échoué)
    const validImageParts = imageParts.filter((part): part is NonNullable<typeof part> => part !== null);

    if (validImageParts.length === 0) {
      logger.warn('All image conversions failed for context generation', {
        component: 'eventContextService',
        action: 'generateEventContextSuggestion',
        photoCount: photoSamples.length
      });
      return DEFAULTS.context; // Fallback si toutes les conversions ont échoué
    }

    // Construire le prompt selon qu'on a un contexte existant ou non
    let analysisPrompt: string;
    
    if (existingContext && existingContext.trim()) {
      // Mode amélioration : prendre le contexte existant et le rendre plus humoristique
      analysisPrompt = PROMPTS.eventContext.improve(existingContext.trim(), validImageParts.length);
    } else {
      // Mode création : générer un contexte basé sur les photos avec un ton humoristique
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
      logger.warn('Empty suggestion returned from Gemini', {
        component: 'eventContextService',
        action: 'generateEventContextSuggestion'
      });
      return DEFAULTS.context; // Fallback
    }

    // Nettoyer la suggestion (enlever les émojis si présents, on les ajoutera si nécessaire)
    const cleanSuggestion = suggestion.replace(/^["']|["']$/g, '').trim();
    
    // Si après nettoyage la suggestion est vide, retourner le fallback
    if (cleanSuggestion.length === 0) {
      return DEFAULTS.context;
    }
    
    return cleanSuggestion;

  } catch (error) {
    // Détecter le type d'erreur
    const errorType = detectGeminiErrorType(error);
    
    // Logger l'erreur avec le contexte
    logGeminiError(error, errorType, {
      component: 'eventContextService',
      action: 'generateEventContextSuggestion',
      photoCount: photos.length,
      hasExistingContext: !!existingContext
    });
    
    // Toujours retourner un contexte par défaut pour éviter que l'application plante
    return DEFAULTS.context; // Fallback en cas d'erreur
  }
};

