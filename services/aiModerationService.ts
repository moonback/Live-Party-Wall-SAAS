import { GoogleGenAI } from "@google/genai";
import { 
  detectGeminiErrorType, 
  logGeminiError 
} from '../utils/geminiErrorHandler';
import { logger } from '../utils/logger';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ImageAnalysis {
  hasFaces: boolean;
  faceCount: number;
  isAppropriate: boolean;
  moderationReason?: string;
  suggestedFilter?: 'none' | 'vintage' | 'blackwhite' | 'warm' | 'cool';
  quality: 'good' | 'fair' | 'poor';
}

/**
 * Analyse par défaut en cas d'erreur
 * Par défaut, on accepte l'image pour ne pas bloquer l'expérience utilisateur
 */
const DEFAULT_ANALYSIS: ImageAnalysis = {
  hasFaces: false,
  faceCount: 0,
  isAppropriate: true, // Par défaut, on accepte (sécurité par défaut : ne pas bloquer)
  suggestedFilter: 'none',
  quality: 'fair',
};

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
      return DEFAULT_ANALYSIS;
    }

    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const analysisPrompt = `
Analyse cette photo de fête et réponds UNIQUEMENT avec un JSON valide (sans markdown, sans code blocks) avec cette structure exacte :
{
  "hasFaces": boolean,
  "faceCount": number,
  "isAppropriate": boolean,
  "moderationReason": string ou null,
  "suggestedFilter": "none" | "vintage" | "blackwhite" | "warm" | "cool",
  "quality": "good" | "fair" | "poor"
}

Règles :
1. hasFaces: true si la photo contient des visages humains clairement visibles
2. faceCount: nombre de visages détectés (0 si aucun)
3. isAppropriate: false si la photo contient du contenu inapproprié (nudité, violence, contenu offensant, contenu illégal)
4. moderationReason: raison si isAppropriate est false, sinon null
5. suggestedFilter: suggère un filtre esthétique basé sur l'ambiance (vintage pour photos rétro, warm pour ambiance chaleureuse, cool pour ambiance moderne/froide, blackwhite pour photos artistiques, none si aucun filtre nécessaire)
6. quality: évalue la qualité technique (good: nette et bien exposée, fair: acceptable, poor: floue ou mal exposée)

Réponds UNIQUEMENT avec le JSON, rien d'autre.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
      return DEFAULT_ANALYSIS;
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
      return DEFAULT_ANALYSIS;
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
    return DEFAULT_ANALYSIS;
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

