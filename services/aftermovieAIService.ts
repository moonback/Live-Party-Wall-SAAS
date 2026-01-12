/**
 * Service IA pour améliorer les aftermovies
 * Utilise Gemini pour analyser les photos et rendre les aftermovies plus interactifs
 */

import { GoogleGenAI } from "@google/genai";
import { logger } from '../utils/logger';
import { Photo } from '../types';
import { 
  detectGeminiErrorType, 
  logGeminiError 
} from '../utils/geminiErrorHandler';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface PhotoAnalysis {
  photoId: string;
  score: number; // Score de qualité/importance (0-100)
  isKeyMoment: boolean; // Moment clé (émotions fortes, groupes, actions importantes)
  suggestedDuration: number; // Durée suggérée en ms (plus long pour moments clés)
  suggestedTransition: string; // Transition suggérée selon le contenu
  emotion: 'joy' | 'excitement' | 'tenderness' | 'celebration' | 'neutral';
  contentType: 'group' | 'couple' | 'individual' | 'object' | 'scene';
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  shouldInclude: boolean; // Si la photo doit être incluse dans l'aftermovie
  reason: string; // Raison de la décision
}

export interface SmartSelectionResult {
  selectedPhotos: Photo[];
  excludedPhotos: Photo[];
  keyMoments: Photo[];
  averageScore: number;
  analysis: PhotoAnalysis[];
}

export interface AftermovieEnhancementOptions {
  minScore?: number; // Score minimum pour inclure une photo (0-100)
  preferKeyMoments?: boolean; // Prioriser les moments clés
  maxPhotos?: number; // Nombre maximum de photos à sélectionner
  diversityWeight?: number; // Poids de la diversité (0-1)
  qualityWeight?: number; // Poids de la qualité (0-1)
}

/**
 * Analyse une photo pour déterminer sa qualité et son importance
 */
async function analyzePhoto(
  photo: Photo,
  eventContext?: string | null
): Promise<PhotoAnalysis> {
  try {
    // Convertir l'URL en base64 pour l'analyse
    const imageResponse = await fetch(photo.url);
    const imageBlob = await imageResponse.blob();
    const base64 = await blobToBase64(imageBlob);
    const cleanBase64 = base64.split(',')[1] || base64;

    const prompt = `
Analyse cette photo de fête et réponds UNIQUEMENT avec un JSON valide (sans markdown, sans code blocks) :

{
  "score": number (0-100, qualité + importance + émotion),
  "isKeyMoment": boolean (true si moment important : émotions fortes, groupes, actions spéciales),
  "suggestedDuration": number (durée en ms, 2000-6000, plus long pour moments clés),
  "suggestedTransition": string ("fade" | "zoom-in" | "zoom-out" | "slide-left" | "slide-right" | "cross-fade"),
  "emotion": string ("joy" | "excitement" | "tenderness" | "celebration" | "neutral"),
  "contentType": string ("group" | "couple" | "individual" | "object" | "scene"),
  "quality": string ("excellent" | "good" | "fair" | "poor"),
  "shouldInclude": boolean (true si la photo doit être dans l'aftermovie),
  "reason": string (raison courte de la décision, max 50 caractères)
}

CRITÈRES D'ANALYSE :
1. score : combine qualité technique (net, exposé) + importance (personnes, actions) + émotion (sourires, joie)
2. isKeyMoment : true si groupe nombreux, émotions fortes, actions spéciales (toast, danse, gâteau)
3. suggestedDuration : 3000-5000ms pour moments clés, 2000-3500ms pour photos normales
4. suggestedTransition : 
   - "zoom-in" pour portraits individuels
   - "zoom-out" pour groupes
   - "slide-left/right" pour panoramas
   - "fade" pour transitions douces
   - "cross-fade" pour moments émotionnels
5. emotion : détecte l'émotion principale visible
6. contentType : type de contenu principal
7. quality : qualité technique (net, exposé, composition)
8. shouldInclude : true sauf si flou, sombre, ou contenu inapproprié
9. reason : explication courte (ex: "Groupe joyeux", "Photo floue", "Moment clé")

${eventContext ? `Contexte de l'événement : ${eventContext}` : ''}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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

    const responseText = response.text.trim();
    let jsonText = responseText;
    
    // Nettoyer la réponse
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

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
    const errorType = detectGeminiErrorType(error);
    logGeminiError(error, errorType, {
      component: 'aftermovieAIService',
      action: 'analyzePhoto',
      photoId: photo.id
    });

    // Retourner une analyse par défaut en cas d'erreur
    return {
      photoId: photo.id,
      score: 50,
      isKeyMoment: false,
      suggestedDuration: 3500,
      suggestedTransition: 'fade',
      emotion: 'neutral',
      contentType: 'scene',
      quality: 'fair',
      shouldInclude: true,
      reason: 'Analyse par défaut (erreur IA)'
    };
  }
}

/**
 * Convertit un Blob en base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Sélection intelligente de photos pour l'aftermovie
 * Utilise l'IA pour analyser et sélectionner les meilleures photos
 */
export async function smartSelectPhotos(
  photos: Photo[],
  options: AftermovieEnhancementOptions = {},
  eventContext?: string | null,
  onProgress?: (current: number, total: number) => void
): Promise<SmartSelectionResult> {
  const {
    minScore = 30,
    preferKeyMoments = true,
    maxPhotos,
    diversityWeight = 0.3,
    qualityWeight = 0.7
  } = options;

  if (photos.length === 0) {
    return {
      selectedPhotos: [],
      excludedPhotos: [],
      keyMoments: [],
      averageScore: 0,
      analysis: []
    };
  }

  logger.info('Démarrage de l\'analyse IA des photos', {
    component: 'aftermovieAIService',
    action: 'smartSelectPhotos',
    photoCount: photos.length
  });

  // Analyser toutes les photos
  const analysisPromises = photos.map(async (photo, index) => {
    if (onProgress) {
      onProgress(index + 1, photos.length);
    }
    return analyzePhoto(photo, eventContext);
  });

  const analyses = await Promise.all(analysisPromises);

  // Calculer le score moyen
  const averageScore = analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length;

  // Identifier les moments clés
  const keyMoments = photos.filter((p, i) => analyses[i].isKeyMoment);

  // Filtrer les photos selon les critères
  let candidatePhotos = photos
    .map((photo, index) => ({
      photo,
      analysis: analyses[index]
    }))
    .filter(({ analysis }) => {
      // Exclure si shouldInclude est false
      if (!analysis.shouldInclude) return false;
      // Exclure si score trop bas
      if (analysis.score < minScore) return false;
      return true;
    });

  // Trier par score (avec bonus pour moments clés si activé)
  candidatePhotos.sort((a, b) => {
    let scoreA = a.analysis.score;
    let scoreB = b.analysis.score;

    if (preferKeyMoments) {
      if (a.analysis.isKeyMoment) scoreA += 20;
      if (b.analysis.isKeyMoment) scoreB += 20;
    }

    // Appliquer les poids qualité/diversité
    const qualityScoreA = scoreA * qualityWeight;
    const qualityScoreB = scoreB * qualityWeight;

    // Diversité : pénaliser les photos trop similaires (simplifié)
    // TODO: Implémenter une vraie détection de similarité
    const diversityScoreA = 100 * diversityWeight;
    const diversityScoreB = 100 * diversityWeight;

    return (qualityScoreB + diversityScoreB) - (qualityScoreA + diversityScoreA);
  });

  // Limiter le nombre si maxPhotos est défini
  if (maxPhotos && candidatePhotos.length > maxPhotos) {
    candidatePhotos = candidatePhotos.slice(0, maxPhotos);
  }

  const selectedPhotos = candidatePhotos.map(({ photo }) => photo);
  const excludedPhotos = photos.filter(
    p => !selectedPhotos.some(sp => sp.id === p.id)
  );

  logger.info('Analyse IA terminée', {
    component: 'aftermovieAIService',
    action: 'smartSelectPhotos',
    selected: selectedPhotos.length,
    excluded: excludedPhotos.length,
    keyMoments: keyMoments.length,
    averageScore
  });

  return {
    selectedPhotos,
    excludedPhotos,
    keyMoments,
    averageScore,
    analysis: analyses
  };
}

/**
 * Analyse un ensemble de photos pour détecter les moments clés
 */
export async function detectKeyMoments(
  photos: Photo[],
  eventContext?: string | null,
  onProgress?: (current: number, total: number) => void
): Promise<PhotoAnalysis[]> {
  if (photos.length === 0) return [];

  const analyses = await Promise.all(
    photos.map(async (photo, index) => {
      if (onProgress) {
        onProgress(index + 1, photos.length);
      }
      return analyzePhoto(photo, eventContext);
    })
  );

  return analyses;
}

/**
 * Suggère une transition pour une photo basée sur son contenu
 */
export async function suggestTransitionForPhoto(
  photo: Photo,
  eventContext?: string | null
): Promise<string> {
  try {
    const analysis = await analyzePhoto(photo, eventContext);
    return analysis.suggestedTransition;
  } catch (error) {
    logger.error('Erreur lors de la suggestion de transition', error, {
      component: 'aftermovieAIService',
      action: 'suggestTransitionForPhoto'
    });
    return 'fade'; // Fallback
  }
}

/**
 * Calcule la durée suggérée pour une photo basée sur son importance
 */
export async function suggestDurationForPhoto(
  photo: Photo,
  baseDuration: number,
  eventContext?: string | null
): Promise<number> {
  try {
    const analysis = await analyzePhoto(photo, eventContext);
    
    // Si c'est un moment clé, augmenter la durée
    if (analysis.isKeyMoment) {
      return Math.min(6000, baseDuration * 1.5);
    }
    
    // Utiliser la durée suggérée par l'IA
    return analysis.suggestedDuration;
  } catch (error) {
    logger.error('Erreur lors de la suggestion de durée', error, {
      component: 'aftermovieAIService',
      action: 'suggestDurationForPhoto'
    });
    return baseDuration; // Fallback
  }
}




