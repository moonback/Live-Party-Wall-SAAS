import { GoogleGenAI } from "@google/genai";
import { 
  detectGeminiErrorType, 
  logGeminiError 
} from '../utils/geminiErrorHandler';
import { logger } from '../utils/logger';
import { MODELS, DEFAULTS, PROMPTS } from '../config/geminiConfig';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
      logger.warn('Empty base64 image provided to analyzeImage', null, {
        component: 'aiModerationService',
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

    const responseText = response.text.trim();
    
    if (!responseText || responseText.length === 0) {
      logger.warn('Empty response from Gemini in analyzeImage', null, {
        component: 'aiModerationService',
        action: 'analyzeImage'
      });
      return DEFAULTS.analysis;
    }
    
    // Nettoyer la réponse (enlever markdown si présent)
    let jsonText = responseText;
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    let analysis: ImageAnalysis;
    try {
      analysis = JSON.parse(jsonText) as ImageAnalysis;
    } catch (parseError) {
      logger.error('Failed to parse Gemini response as JSON', parseError, {
        component: 'aiModerationService',
        action: 'analyzeImage',
        responseText: responseText.substring(0, 200) // Log les 200 premiers caractères
      });
      return DEFAULTS.analysis;
    }

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
    // Détecter le type d'erreur
    const errorType = detectGeminiErrorType(error);
    
    // Logger l'erreur avec le contexte
    logGeminiError(error, errorType, {
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

