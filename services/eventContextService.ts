import { GoogleGenAI } from "@google/genai";
import { Photo } from '../types';
import { logger } from '../utils/logger';
import { 
  detectGeminiErrorType, 
  logGeminiError 
} from '../utils/geminiErrorHandler';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Contexte par défaut en cas d'erreur
 */
const DEFAULT_CONTEXT = "Soirée festive";

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
      return DEFAULT_CONTEXT; // Fallback si aucune photo
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
          logger.warn('Failed to convert photo to base64, skipping', error, {
            photoId: photo.id,
            component: 'eventContextService'
          });
          return null;
        }
      })
    );

    // Filtrer les nulls (photos qui ont échoué)
    const validImageParts = imageParts.filter((part): part is NonNullable<typeof part> => part !== null);

    if (validImageParts.length === 0) {
      logger.warn('All image conversions failed for context generation', null, {
        component: 'eventContextService',
        action: 'generateEventContextSuggestion',
        photoCount: photoSamples.length
      });
      return DEFAULT_CONTEXT; // Fallback si toutes les conversions ont échoué
    }

    // Construire le prompt selon qu'on a un contexte existant ou non
    let analysisPrompt: string;
    
    if (existingContext && existingContext.trim()) {
      // Mode amélioration : prendre le contexte existant et le rendre plus humoristique
      analysisPrompt = `
Analyse ces ${validImageParts.length} photos d'un événement et améliore le contexte suivant pour le rendre plus humoristique, festif et mémorable :

CONTEXTE ACTUEL : "${existingContext.trim()}"

TA MISSION :
1. Conserve les informations essentielles du contexte (type d'événement, noms, détails importants)
2. Ajoute une touche d'humour, de légèreté et de festivité
3. Rends le contexte plus vivant et engageant tout en restant respectueux
4. Utilise un ton décontracté et joyeux

EXEMPLES D'AMÉLIORATION :
- "Mariage de Sophie et Marc" → "Mariage de Sophie et Marc - Union de deux âmes qui s'aiment (et qui aiment faire la fête !)"
- "Anniversaire 30 ans de Marie" → "Anniversaire 30 ans de Marie - Trente ans de folie et ça continue !"
- "Soirée entreprise" → "Soirée entreprise - Parce que le travail en équipe mérite une célébration épique"
- "Fête de famille" → "Fête de famille - Réunion annuelle où on refait le monde (et on mange bien !)"

RÈGLES :
- Maximum 40 mots
- Ton humoristique mais respectueux
- Garde les informations importantes du contexte original
- Ajoute de la personnalité et de l'énergie
- Évite les blagues qui pourraient blesser ou être mal interprétées

IMPORTANT : Réponds UNIQUEMENT avec le contexte amélioré, rien d'autre. Pas de phrases d'introduction, pas d'explications.
`;
    } else {
      // Mode création : générer un contexte basé sur les photos avec un ton humoristique
      analysisPrompt = `
Analyse ces ${validImageParts.length} photos d'un événement et détermine le type de soirée/événement avec un ton humoristique et festif.

Observe attentivement :
- Les décors et l'ambiance (mariage, anniversaire, soirée entreprise, fête de famille, etc.)
- Les tenues des personnes (formel, décontracté, costume, etc.)
- Les éléments visuels spécifiques (gâteau d'anniversaire, bouquet de mariée, décoration, etc.)
- L'ambiance générale (romantique, festive, corporate, intime, etc.)

TA MISSION :
Créer un contexte qui :
1. Identifie clairement le type d'événement
2. Ajoute une touche d'humour et de légèreté
3. Reste respectueux et approprié
4. Rend l'événement mémorable et festif

EXEMPLES DE CONTEXTES HUMORISTIQUES :
- "Mariage de Sophie et Marc - L'amour, l'amitié et la fête jusqu'au bout de la nuit !"
- "Anniversaire 30 ans de Marie - Trente ans de bonheur, de rires et de souvenirs inoubliables"
- "Soirée entreprise - Parce que le succès se célèbre en équipe (et avec style !)"
- "Fête de famille - Réunion annuelle où les souvenirs se créent et les fous rires explosent"
- "Anniversaire de mariage - 25 ans d'amour, de complicité et de moments magiques"

RÈGLES :
- Maximum 40 mots
- Ton humoristique mais respectueux
- Identifie clairement le type d'événement
- Ajoute de la personnalité et de l'énergie
- Si tu ne peux pas déterminer clairement le type, utilise quelque chose de générique mais festif comme "Soirée festive - Où les moments magiques se créent"

IMPORTANT : Réponds UNIQUEMENT avec le contexte suggéré, rien d'autre. Pas de phrases d'introduction, pas d'explications.
`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          ...validImageParts,
          {
            text: analysisPrompt,
          },
        ],
      },
    });

    const suggestion = response.text.trim();
    
    if (!suggestion || suggestion.length === 0) {
      logger.warn('Empty suggestion returned from Gemini', null, {
        component: 'eventContextService',
        action: 'generateEventContextSuggestion'
      });
      return DEFAULT_CONTEXT; // Fallback
    }

    // Nettoyer la suggestion (enlever les émojis si présents, on les ajoutera si nécessaire)
    const cleanSuggestion = suggestion.replace(/^["']|["']$/g, '').trim();
    
    // Si après nettoyage la suggestion est vide, retourner le fallback
    if (cleanSuggestion.length === 0) {
      return DEFAULT_CONTEXT;
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
    return DEFAULT_CONTEXT; // Fallback en cas d'erreur
  }
};

