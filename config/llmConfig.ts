/**
 * Configuration centralisée pour les LLM (Gemini, Hugging Face, etc.)
 * Gère les modèles, les prompts adaptés et les paramètres par provider
 */

/// <reference types="vite/client" />

// ============================================================================
// CONFIGURATION DES PROVIDERS
// ============================================================================

/**
 * Provider LLM disponible
 */
export type LLMProviderType = 'gemini' | 'huggingface';

/**
 * Configuration par défaut du provider
 * Peut être forcé via VITE_LLM_PROVIDER
 */
export const DEFAULT_PROVIDER: LLMProviderType = 'gemini';

/**
 * Récupère le provider à utiliser (depuis env ou défaut)
 */
export function getProvider(): LLMProviderType {
  const envProvider = (import.meta.env as { VITE_LLM_PROVIDER?: string }).VITE_LLM_PROVIDER;
  if (envProvider === 'huggingface' || envProvider === 'gemini') {
    return envProvider;
  }
  return DEFAULT_PROVIDER;
}

// ============================================================================
// CONFIGURATION HUGGING FACE
// ============================================================================

/**
 * Modèles Hugging Face par tâche
 */
export const HUGGINGFACE_MODELS = {
  /** Modèle pour la génération de légendes et analyse d'images */
  caption: 'Salesforce/blip2-opt-2.7b',
  
  /** Modèle pour l'analyse complète (modération + légende) */
  analysis: 'llava-hf/llava-1.5-7b-hf',
  
  /** Modèle pour la traduction (text-only) */
  translation: 'Helsinki-NLP/opus-mt-fr-en', // Base FR->EN, peut être étendu
  
  /** Modèle pour la génération de contexte */
  context: 'llava-hf/llava-1.5-7b-hf',
  
  /** Modèle pour l'analyse aftermovie */
  aftermovie: 'llava-hf/llava-1.5-7b-hf',
} as const;

/**
 * Clé API Hugging Face (optionnelle, gratuit sans clé mais limité)
 */
export function getHuggingFaceApiKey(): string | undefined {
  return (import.meta.env as { VITE_HUGGINGFACE_API_KEY?: string }).VITE_HUGGINGFACE_API_KEY;
}

/**
 * Endpoint de base pour l'API Hugging Face Inference
 */
export const HUGGINGFACE_API_BASE = 'https://api-inference.huggingface.co/models';

/**
 * Timeout pour les requêtes Hugging Face (peut être lent)
 */
export const HUGGINGFACE_TIMEOUT = 30000; // 30 secondes

// ============================================================================
// ADAPTATION DES PROMPTS POUR HUGGING FACE
// ============================================================================

/**
 * Adapte un prompt Gemini pour Hugging Face
 * Hugging Face nécessite des prompts plus directs et moins formatés
 */
export function adaptPromptForHuggingFace(geminiPrompt: string): string {
  // Simplifier le prompt en enlevant les séparateurs excessifs
  let adapted = geminiPrompt
    // Enlever les séparateurs de style ASCII art
    .replace(/═+/g, '')
    .replace(/─+/g, '')
    // Simplifier les sections
    .replace(/══════════════════════════════/g, '')
    .replace(/═══════════════════════════════════════════════════════════════/g, '')
    // Garder les instructions importantes mais simplifier
    .trim();
  
  // Ajouter une instruction claire au début pour Hugging Face
  adapted = `Tu es un assistant IA qui analyse des images de fête. ${adapted}`;
  
  return adapted;
}

/**
 * Adapte un prompt de légende pour Hugging Face
 * @param _geminiPrompt - Prompt Gemini original (non utilisé actuellement, conservé pour compatibilité future)
 */
export function adaptCaptionPromptForHuggingFace(_geminiPrompt: string): string {
  // Extraire les règles essentielles du prompt Gemini
  // On simplifie le prompt pour Hugging Face qui nécessite des instructions plus directes
  // Note: Le paramètre geminiPrompt pourrait être utilisé à l'avenir pour extraire le contexte d'événement
  const essentialRules = [
    'Analyse précisément le contenu visible de la photo',
    'Retourne uniquement la légende finale',
    '1 seule phrase, 6 à 12 mots EXACTEMENT',
    'Français uniquement',
    '1 à 3 émojis maximum',
    'Aucun hashtag',
    'Aucun retour à la ligne',
  ].join('. ');
  
  return `Analyse cette photo de fête et génère une légende. ${essentialRules}. Légende:`;
}

/**
 * Adapte un prompt de modération pour Hugging Face
 */
export function adaptModerationPromptForHuggingFace(): string {
  return `Analyse cette photo de fête et réponds UNIQUEMENT avec un JSON valide (sans markdown) avec cette structure exacte :
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
5. suggestedFilter: suggère un filtre esthétique basé sur l'ambiance
6. quality: évalue la qualité technique (good: nette et bien exposée, fair: acceptable, poor: floue ou mal exposée)

Réponds UNIQUEMENT avec le JSON, rien d'autre.`;
}

/**
 * Adapte un prompt d'analyse combinée pour Hugging Face
 */
export function adaptCombinedAnalysisPromptForHuggingFace(captionPrompt: string): string {
  const adaptedCaption = adaptCaptionPromptForHuggingFace(captionPrompt);
  
  return `Analyse cette photo de fête et réponds UNIQUEMENT avec un JSON valide (sans markdown) avec cette structure exacte :
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

Règles de modération :
- hasFaces: true si visages visibles
- faceCount: nombre de visages
- isAppropriate: false si contenu inapproprié
- moderationReason: raison si inapproprié, sinon null
- suggestedFilter: filtre esthétique suggéré
- quality: qualité technique
- estimatedQuality: évaluation précise
- suggestedImprovements: suggestions d'amélioration (max 5)

Règles de légende :
${adaptedCaption}
- Maximum 12 mots, français uniquement
- 1-3 émojis pertinents maximum

Règles de tags :
- Tableau de 3 à 8 tags pertinents en français
- Mots simples et descriptifs, en minuscules

Réponds UNIQUEMENT avec le JSON valide, rien d'autre.`;
}

/**
 * Adapte un prompt de traduction pour Hugging Face
 */
export function adaptTranslationPromptForHuggingFace(caption: string, languageName: string): string {
  return `Traduis cette légende de photo de fête en ${languageName}. 
Conserve le ton festif, énergique et humoristique.
Conserve les emojis exactement tels quels.
La longueur doit rester similaire (maximum 12 mots).
Réponds UNIQUEMENT avec la traduction, sans explication, sans guillemets, sans formatage.

Légende à traduire: "${caption}"`;
}

/**
 * Adapte un prompt d'analyse aftermovie pour Hugging Face
 */
export function adaptAftermoviePromptForHuggingFace(eventContext?: string | null): string {
  return `Analyse cette photo de fête et réponds UNIQUEMENT avec un JSON valide (sans markdown) :
{
  "score": number (0-100, qualité + importance + émotion),
  "isKeyMoment": boolean (true si moment important),
  "suggestedDuration": number (durée en ms, 2000-6000),
  "suggestedTransition": string ("fade" | "zoom-in" | "zoom-out" | "slide-left" | "slide-right" | "cross-fade"),
  "emotion": string ("joy" | "excitement" | "tenderness" | "celebration" | "neutral"),
  "contentType": string ("group" | "couple" | "individual" | "object" | "scene"),
  "quality": string ("excellent" | "good" | "fair" | "poor"),
  "shouldInclude": boolean (true si la photo doit être dans l'aftermovie),
  "reason": string (raison courte de la décision, max 50 caractères)
}

CRITÈRES D'ANALYSE :
1. score : combine qualité technique + importance + émotion
2. isKeyMoment : true si groupe nombreux, émotions fortes, actions spéciales
3. suggestedDuration : 3000-5000ms pour moments clés, 2000-3500ms pour photos normales
4. suggestedTransition : selon le type de contenu
5. emotion : détecte l'émotion principale visible
6. contentType : type de contenu principal
7. quality : qualité technique
8. shouldInclude : true sauf si flou, sombre, ou contenu inapproprié
9. reason : explication courte

${eventContext ? `Contexte de l'événement : ${eventContext}` : ''}

Réponds UNIQUEMENT avec le JSON valide, rien d'autre.`;
}

/**
 * Adapte un prompt de contexte d'événement pour Hugging Face
 */
export function adaptEventContextPromptForHuggingFace(
  photoCount: number,
  existingContext?: string | null
): string {
  if (existingContext) {
    return `Analyse ces ${photoCount} photos d'un événement et améliore le contexte suivant pour le rendre plus humoristique, festif et mémorable.

CONTEXTE ACTUEL : "${existingContext.trim()}"

Crée un contexte qui :
1. Conserve les informations essentielles (type d'événement, noms, détails)
2. Enrichit avec de l'humour et de la personnalité
3. Adapte le ton selon le type d'événement
4. Utilise le contenu des photos pour enrichir

Règles :
- Maximum 50 mots
- Ton humoristique mais respectueux
- Utilise des émojis pertinents (1-3 max)

Réponds UNIQUEMENT avec le contexte amélioré, rien d'autre.`;
  }
  
  return `Analyse ces ${photoCount} photos d'un événement et détermine le type de soirée/événement avec un ton humoristique, festif et mémorable.

Crée un contexte qui :
1. Identifie clairement le type d'événement (mariage, anniversaire, etc.)
2. Capture l'ambiance visible dans les photos
3. Ajoute une touche d'humour, de légèreté et de festivité
4. Reste respectueux et approprié

Règles :
- Maximum 50 mots
- Ton humoristique mais respectueux
- Utilise des émojis pertinents (1-3 max)

Réponds UNIQUEMENT avec le contexte suggéré, rien d'autre.`;
}

