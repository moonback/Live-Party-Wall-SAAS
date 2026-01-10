/**
 * Service combiné pour l'IA Gemini
 * Combine modération et génération de légende en 1 seul appel API
 * Réduit les coûts de 50% (1 appel au lieu de 2)
 * Cache les résultats pour éviter les appels API pour images identiques
 */

import { GoogleGenAI } from "@google/genai";
import { buildPersonalizedCaptionPrompt } from '../constants';
import { ImageAnalysis } from './aiModerationService';
import { logger } from '../utils/logger';
import { getImageHash } from '../utils/imageHash';
import { 
  detectGeminiErrorType, 
  logGeminiError 
} from '../utils/geminiErrorHandler';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Cache en mémoire pour les analyses (évite les appels API pour images identiques)
// Structure : Map<hash, { result: CombinedAnalysisResult, timestamp: number }>
const analysisCache = new Map<string, { result: CombinedAnalysisResult; timestamp: number }>();

// Durée de vie du cache : 1 heure (3600000 ms)
const CACHE_TTL = 60 * 60 * 1000;

// Taille max du cache : 100 entrées (évite la consommation mémoire excessive)
const MAX_CACHE_SIZE = 100;

/**
 * Nettoie le cache des entrées expirées ou trop anciennes
 */
function cleanCache(): void {
  const now = Date.now();
  const entries = Array.from(analysisCache.entries());
  
  // Supprimer les entrées expirées
  for (const [hash, value] of entries) {
    if (now - value.timestamp > CACHE_TTL) {
      analysisCache.delete(hash);
    }
  }
  
  // Si le cache est encore trop grand, supprimer les plus anciennes
  if (analysisCache.size > MAX_CACHE_SIZE) {
    const sorted = Array.from(analysisCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toDelete = sorted.slice(0, analysisCache.size - MAX_CACHE_SIZE);
    for (const [hash] of toDelete) {
      analysisCache.delete(hash);
    }
  }
}

export interface CombinedAnalysisResult {
  analysis: ImageAnalysis;
  caption: string;
  tags: string[]; // Tags suggérés par l'IA (ex: ['sourire', 'groupe', 'danse', 'fête'])
}

/**
 * Analyse une image et génère une légende en 1 seul appel API Gemini
 * Combine modération + légende pour réduire les coûts
 * 
 * @param base64Image - Image en base64
 * @param eventContext - Contexte optionnel de l'événement pour personnaliser les légendes
 * @returns Promise<CombinedAnalysisResult> - Analyse complète + légende
 */
export const analyzeAndCaptionImage = async (
  base64Image: string,
  eventContext?: string | null
): Promise<CombinedAnalysisResult> => {
  try {
    // Validation de l'input
    if (!base64Image || base64Image.trim().length === 0) {
      logger.warn('Empty base64 image provided to analyzeAndCaptionImage', null, {
        component: 'aiService',
        action: 'analyzeAndCaptionImage'
      });
      // Retourner un fallback immédiatement
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
        caption: "Party time! 🎉",
        tags: [],
      };
    }

    // Nettoyer le cache périodiquement
    cleanCache();
    
    // Générer un hash de l'image pour le cache
    // Le hash inclut aussi le contexte de l'événement (car la légende dépend du contexte)
    const imageHash = await getImageHash(base64Image);
    const cacheKey = `${imageHash}_${eventContext || 'default'}`;
    
    // Vérifier le cache
    const cached = analysisCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      logger.debug('Cache hit for image analysis', { hash: imageHash.substring(0, 8) });
      return cached.result;
    }
    
    logger.debug('Cache miss, calling Gemini API', { hash: imageHash.substring(0, 8) });
    
    // Strip the data:image/xyz;base64, prefix if present
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    // Construire le prompt personnalisé pour la légende
    const captionPrompt = buildPersonalizedCaptionPrompt(eventContext);

    // Prompt combiné : modération + légende + tags + améliorations
    const combinedPrompt = `
Analyse cette photo de fête et réponds UNIQUEMENT avec un JSON valide (sans markdown, sans code blocks) avec cette structure exacte :
{
  "hasFaces": boolean,
  "faceCount": number,
  "isAppropriate": boolean,
  "moderationReason": string | null,
  "suggestedFilter": "none" | "vintage" | "blackwhite" | "warm" | "cool",
  "quality": "good" | "fair" | "poor",
  "estimatedQuality": "excellent" | "good" | "fair" | "poor",
  "suggestedImprovements": string[],
  "caption": string,
  "tags": string[]
}

═══════════════════════════════════════════════════════════════
RÈGLES DE MODÉRATION (ANALYSE TECHNIQUE)
═══════════════════════════════════════════════════════════════

1. hasFaces: true si la photo contient des visages humains clairement visibles (même partiels ou de profil)
2. faceCount: nombre exact de visages détectés (0 si aucun, compte même les visages partiels)
3. isAppropriate: false UNIQUEMENT si la photo contient du contenu inapproprié :
   - Nudité explicite ou suggestive
   - Violence, agression, contenu choquant
   - Contenu offensant, discriminatoire, haineux
   - Contenu illégal
   - Par défaut, isAppropriate = true (sois tolérant pour les photos de fête normales)
4. moderationReason: raison détaillée si isAppropriate est false, sinon null
5. suggestedFilter: suggère un filtre esthétique basé sur l'ambiance :
   - "vintage" : photos rétro, ambiance années 70-80, tons sépia
   - "warm" : ambiance chaleureuse, tons orangés/jaunes, intime
   - "cool" : ambiance moderne/froide, tons bleus/violets, dynamique
   - "blackwhite" : photos artistiques, contrastes forts, élégant
   - "none" : aucun filtre nécessaire, photo déjà optimale
6. quality: évalue la qualité technique :
   - "good" : nette, bien exposée, bonne composition
   - "fair" : acceptable, légèrement floue ou sous/exposée
   - "poor" : très floue, très mal exposée, composition problématique
7. estimatedQuality: évaluation plus précise :
   - "excellent" : parfaite, professionnelle
   - "good" : très bonne qualité
   - "fair" : correcte mais perfectible
   - "poor" : à améliorer significativement
8. suggestedImprovements: tableau de suggestions concrètes (max 5) :
   - Exemples : ["améliorer luminosité", "recadrer", "réduire bruit", "ajuster contraste"]
   - Tableau vide [] si aucune amélioration nécessaire

═══════════════════════════════════════════════════════════════
RÈGLES DE LÉGENDE (CRÉATIVITÉ ET PERSONNALISATION)
═══════════════════════════════════════════════════════════════

${captionPrompt}

⚠️ RAPPEL CRITIQUE POUR LA LÉGENDE :
- Analyse d'abord la photo en détail (personnes, objets, actions, expressions)
- La légende DOIT être spécifique à cette photo, pas générique
- Maximum 12 mots, uniquement en français
- Utilise 1-3 émojis pertinents maximum
- Base-toi sur ce que tu vois réellement, jamais d'invention
- Le champ "caption" doit contenir UNIQUEMENT la légende, rien d'autre
- Si un contexte d'événement est fourni, REPRENDS SON TON HUMORISTIQUE ET FESTIF dans ta légende
- Le contexte a été créé pour être humoristique - adapte cette énergie à chaque photo unique

═══════════════════════════════════════════════════════════════
RÈGLES DE TAGS (MÉTADONNÉES)
═══════════════════════════════════════════════════════════════

- tags: tableau de 3 à 8 tags pertinents en français décrivant la photo
- Tags possibles par catégorie :
  * Actions : danse, rire, célébrer, sourire, trinquer, embrasser, poser, jouer
  * Personnes : groupe, couple, famille, amis, individu, selfie
  * Ambiance : fête, joie, émotion, moment, complicité, tendresse
  * Objets : gâteau, décoration, musique, verre, bouquet, cadeau
  * Lieux : intérieur, extérieur, scène, salle, jardin, plage
  * Événements : mariage, anniversaire, célébration, toast, danse
- Utilise des mots simples et descriptifs, en minuscules
- Choisis les tags les plus pertinents pour cette photo spécifique
- Exemples :
  * Photo de groupe qui danse : ["groupe", "danse", "fête", "joie", "mouvement"]
  * Photo de couple qui trinque : ["couple", "toast", "célébration", "complicité", "verre"]
  * Photo de gâteau : ["gâteau", "anniversaire", "célébration", "bougies", "fête"]

═══════════════════════════════════════════════════════════════
INSTRUCTIONS FINALES
═══════════════════════════════════════════════════════════════

1. Analyse d'abord la photo en détail (modération + contenu)
2. Génère ensuite la légende selon les règles détaillées ci-dessus
3. Crée les tags pertinents basés sur l'analyse
4. Réponds UNIQUEMENT avec le JSON valide, sans markdown, sans code blocks
5. Vérifie que tous les champs sont présents et correctement typés
6. Le JSON doit être valide et parsable directement

FORMAT DE RÉPONSE ATTENDU (exemple) :
{
  "hasFaces": true,
  "faceCount": 3,
  "isAppropriate": true,
  "moderationReason": null,
  "suggestedFilter": "warm",
  "quality": "good",
  "estimatedQuality": "good",
  "suggestedImprovements": [],
  "caption": "Sourires radieux qui illuminent la soirée ! 😊✨",
  "tags": ["groupe", "sourire", "fête", "joie", "complicité"]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Modèle moins cher que gemini-3-flash-preview
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

    const responseText = response.text.trim();
    
    if (!responseText || responseText.length === 0) {
      logger.warn('Empty response from Gemini in analyzeAndCaptionImage', null, {
        component: 'aiService',
        action: 'analyzeAndCaptionImage'
      });
      // Retourner un fallback
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
        caption: "Party time! 🎉",
        tags: [],
      };
    }
    
    // Nettoyer la réponse (enlever markdown si présent)
    let jsonText = responseText;
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

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
        component: 'aiService',
        action: 'analyzeAndCaptionImage',
        responseText: responseText.substring(0, 200) // Log les 200 premiers caractères
      });
      // Retourner un fallback en cas d'erreur de parsing
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
        caption: "Party time! 🎉",
        tags: [],
      };
    }

    // Validation et valeurs par défaut pour l'analyse
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

    // Validation et fallback pour la légende
    const caption = parsed.caption?.trim() || "Party time! 🎉";

    // Validation et fallback pour les tags
    const tags = Array.isArray(parsed.tags) && parsed.tags.length > 0 
      ? parsed.tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0).slice(0, 8) // Max 8 tags
      : [];

    const result: CombinedAnalysisResult = {
      analysis,
      caption,
      tags,
    };
    
    // Mettre en cache le résultat
    analysisCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
    
    return result;

  } catch (error) {
    // Détecter le type d'erreur
    const errorType = detectGeminiErrorType(error);
    
    // Logger l'erreur avec le contexte
    logGeminiError(error, errorType, {
      component: 'aiService',
      action: 'analyzeAndCaptionImage',
      eventContext: eventContext || 'none'
    });
    
    // Fallback en cas d'erreur - toujours retourner des valeurs sûres
    // pour éviter que l'application plante
    return {
      analysis: {
        hasFaces: false,
        faceCount: 0,
        isAppropriate: true, // Par défaut, on accepte (mais on log l'erreur)
        suggestedFilter: 'none',
        quality: 'fair',
        estimatedQuality: 'fair',
        suggestedImprovements: [],
      },
      caption: "Party time! 🎉", // Légende par défaut cohérente avec geminiService
      tags: [],
    };
  }
};

/**
 * Vérifie si une image est appropriée pour le mur
 * Utilise le service combiné mais ne retourne que la partie modération
 * 
 * @param base64Image - Image en base64
 * @returns Promise avec approved, reason et analysis
 */
export const isImageAppropriate = async (base64Image: string): Promise<{ 
  approved: boolean; 
  reason?: string;
  analysis?: ImageAnalysis;
}> => {
  const result = await analyzeAndCaptionImage(base64Image);
  
  if (!result.analysis.isAppropriate) {
    return {
      approved: false,
      reason: result.analysis.moderationReason || "Contenu inapproprié détecté",
      analysis: result.analysis,
    };
  }

  return {
    approved: true,
    analysis: result.analysis,
  };
};

