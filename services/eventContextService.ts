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
      return DEFAULT_CONTEXT; // Fallback si toutes les conversions ont échoué
    }

    // Construire le prompt selon qu'on a un contexte existant ou non
    let analysisPrompt: string;
    
    if (existingContext && existingContext.trim()) {
      // Mode amélioration : prendre le contexte existant et le rendre plus humoristique
      analysisPrompt = `
Analyse ces ${validImageParts.length} photos d'un événement et améliore le contexte suivant pour le rendre plus humoristique, festif et mémorable.

CONTEXTE ACTUEL : "${existingContext.trim()}"

═══════════════════════════════════════════════════════════════
TA MISSION : CRÉER UN CONTEXTE RICHE ET HUMORISTIQUE
═══════════════════════════════════════════════════════════════

1. CONSERVE LES INFORMATIONS ESSENTIELLES :
   - Type d'événement (mariage, anniversaire, soirée, etc.)
   - Noms des personnes concernées (si présents)
   - Détails importants (âge, date, lieu, thème)
   - Informations spécifiques qui rendent l'événement unique

2. ENRICHIS AVEC DE L'HUMOUR ET DE LA PERSONNALITÉ :
   - Ajoute des jeux de mots subtils et respectueux
   - Utilise des expressions festives et énergiques
   - Intègre des références à l'ambiance visible dans les photos
   - Crée un ton complice et joyeux
   - Utilise des parenthèses pour ajouter des touches humoristiques

3. ADAPTE LE TON SELON LE TYPE D'ÉVÉNEMENT :
   - Mariage : romantique mais festif, mentionne l'amour et la célébration
   - Anniversaire : dynamique et complice, mentionne l'âge ou les années
   - Entreprise : professionnel mais chaleureux, mentionne l'esprit d'équipe
   - Famille : tendre et nostalgique, mentionne les liens familiaux
   - Amis : décontracté et complice, mentionne l'amitié et la rigolade

4. UTILISE LE CONTENU DES PHOTOS POUR ENRICHIR :
   - Si tu vois des éléments spécifiques (gâteau, bouquet, décoration), mentionne-les subtilement
   - Si l'ambiance est particulièrement festive, reflète-la dans le contexte
   - Si les personnes semblent joyeuses, capture cette énergie

EXEMPLES D'AMÉLIORATION INTELLIGENTE :
- "Mariage de Sophie et Marc" 
  → "Mariage de Sophie et Marc - Union de deux âmes qui s'aiment (et qui aiment faire la fête jusqu'au bout de la nuit !) 💍✨"

- "Anniversaire 30 ans de Marie" 
  → "Anniversaire 30 ans de Marie - Trente ans de folie, de rires et de moments magiques (et ça continue !) 🎂🎉"

- "Soirée entreprise" 
  → "Soirée entreprise - Parce que le succès se célèbre en équipe (et avec style !) 👥✨"

- "Fête de famille" 
  → "Fête de famille - Réunion annuelle où on refait le monde, on partage des fous rires et on crée des souvenirs inoubliables 👨‍👩‍👧‍👦💕"

- "Anniversaire de mariage - 25 ans" 
  → "Anniversaire de mariage - 25 ans d'amour, de complicité et de moments magiques (et toujours aussi amoureux !) 💍💕"

RÈGLES STRICTES :
- Maximum 50 mots (pour laisser de la place à l'humour et aux détails)
- Ton humoristique mais TOUJOURS respectueux et bienveillant
- Garde TOUTES les informations importantes du contexte original
- Ajoute de la personnalité, de l'énergie et de la créativité
- Évite les blagues qui pourraient blesser, être mal interprétées ou inappropriées
- Utilise des émojis pertinents (1-3 max) pour enrichir le contexte
- Le contexte doit être utilisable pour générer des légendes pertinentes et humoristiques

STRUCTURE RECOMMANDÉE :
"[Type d'événement] [Noms si présents] - [Description principale] ([Touche humoristique ou complémentaire]) [Émojis pertinents]"

IMPORTANT : Réponds UNIQUEMENT avec le contexte amélioré, rien d'autre. Pas de phrases d'introduction, pas d'explications, pas de guillemets autour du contexte.
`;
    } else {
      // Mode création : générer un contexte basé sur les photos avec un ton humoristique
      analysisPrompt = `
Analyse ces ${validImageParts.length} photos d'un événement et détermine le type de soirée/événement avec un ton humoristique, festif et mémorable.

═══════════════════════════════════════════════════════════════
OBSERVATION DÉTAILLÉE DES PHOTOS
═══════════════════════════════════════════════════════════════

Observe attentivement chaque photo pour identifier :

1. TYPE D'ÉVÉNEMENT :
   - Mariage : robe de mariée, costume, bouquet, alliance, décoration romantique
   - Anniversaire : gâteau avec bougies, nombre de bougies visible, décoration festive
   - Soirée entreprise : tenues professionnelles, ambiance corporate, esprit d'équipe
   - Fête de famille : plusieurs générations, ambiance chaleureuse, moments tendres
   - Soirée entre amis : ambiance décontractée, rires, complicité
   - Autre : détecte les indices visuels spécifiques

2. ÉLÉMENTS VISUELS SPÉCIFIQUES :
   - Décors et décorations (guirlandes, ballons, lumières, thème)
   - Objets symboliques (gâteau, bouquet, verres à champagne, cadeaux)
   - Tenues (formel, décontracté, costume, uniforme)
   - Ambiance visuelle (romantique, festive, corporate, intime, énergique)

3. AMBIANCE ET ÉNERGIE :
   - Expressions des personnes (sourires, rires, émotions)
   - Actions visibles (danse, toast, célébration, pose)
   - Couleurs dominantes et éclairage
   - Dynamisme général de l'événement

4. DÉTAILS UNIQUES :
   - Éléments qui rendent cet événement spécial
   - Moments particuliers capturés
   - Créativité ou originalité visible

═══════════════════════════════════════════════════════════════
TA MISSION : CRÉER UN CONTEXTE RICHE ET HUMORISTIQUE
═══════════════════════════════════════════════════════════════

Crée un contexte qui :
1. Identifie clairement le type d'événement (mariage, anniversaire, etc.)
2. Capture l'ambiance visible dans les photos
3. Ajoute une touche d'humour, de légèreté et de festivité
4. Reste respectueux et approprié
5. Rend l'événement mémorable et engageant
6. Utilise des expressions énergiques et complices

ADAPTE LE TON SELON LE TYPE DÉTECTÉ :
- Mariage : romantique mais festif, mentionne l'amour et la célébration
- Anniversaire : dynamique et complice, mentionne l'âge si visible
- Entreprise : professionnel mais chaleureux, mentionne l'esprit d'équipe
- Famille : tendre et nostalgique, mentionne les liens familiaux
- Amis : décontracté et complice, mentionne l'amitié et la rigolade

EXEMPLES DE CONTEXTES HUMORISTIQUES ET RICHES :
- "Mariage de Sophie et Marc - L'amour, l'amitié et la fête jusqu'au bout de la nuit ! 💍✨"
- "Anniversaire 30 ans de Marie - Trente ans de bonheur, de rires et de souvenirs inoubliables (et ça continue !) 🎂🎉"
- "Soirée entreprise - Parce que le succès se célèbre en équipe (et avec style !) 👥✨"
- "Fête de famille - Réunion annuelle où les souvenirs se créent et les fous rires explosent 👨‍👩‍👧‍👦💕"
- "Anniversaire de mariage - 25 ans d'amour, de complicité et de moments magiques (toujours aussi amoureux !) 💍💕"
- "Soirée entre amis - Où l'amitié se célèbre, les rires résonnent et les souvenirs se forgent 🍻🎉"

RÈGLES STRICTES :
- Maximum 50 mots (pour laisser de la place à l'humour et aux détails)
- Ton humoristique mais TOUJOURS respectueux et bienveillant
- Identifie clairement le type d'événement
- Ajoute de la personnalité, de l'énergie et de la créativité
- Utilise des émojis pertinents (1-3 max) pour enrichir le contexte
- Si tu ne peux pas déterminer clairement le type, utilise quelque chose de générique mais festif comme "Soirée festive - Où les moments magiques se créent et les sourires illuminent la nuit ✨🎉"
- Le contexte doit être utilisable pour générer des légendes pertinentes et humoristiques

STRUCTURE RECOMMANDÉE :
"[Type d'événement] [Noms si détectables] - [Description principale] ([Touche humoristique ou complémentaire]) [Émojis pertinents]"

IMPORTANT : Réponds UNIQUEMENT avec le contexte suggéré, rien d'autre. Pas de phrases d'introduction, pas d'explications, pas de guillemets autour du contexte.
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

    const suggestion = response.text?.trim() || '';
    
    if (!suggestion || suggestion.length === 0) {
      logger.warn('Empty suggestion returned from Gemini', {
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

