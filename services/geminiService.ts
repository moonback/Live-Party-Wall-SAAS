import { GoogleGenAI } from "@google/genai";
import { buildPersonalizedCaptionPrompt } from '../constants';
import { 
  detectGeminiErrorType, 
  logGeminiError, 
  GeminiErrorType 
} from '../utils/geminiErrorHandler';
import { logger } from '../utils/logger';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Légende par défaut en cas d'erreur
 */
const DEFAULT_CAPTION = "Party time! 🎉";

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
      return DEFAULT_CAPTION;
    }

    // Strip the data:image/xyz;base64, prefix if present
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    // Construire le prompt personnalisé selon le contexte de l'événement
    const prompt = buildPersonalizedCaptionPrompt(eventContext);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
      return DEFAULT_CAPTION;
    }
    return caption.trim();

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
    return DEFAULT_CAPTION;
  }
};
