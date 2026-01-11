/**
 * Service de traduction multilingue pour les légendes
 * Utilise Gemini pour traduire les légendes dans différentes langues
 */

import { GoogleGenAI } from "@google/genai";
import { logger } from '../utils/logger';
import { 
  detectGeminiErrorType, 
  logGeminiError 
} from '../utils/geminiErrorHandler';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Langues supportées avec leurs codes ISO 639-1
 */
export const SUPPORTED_LANGUAGES = {
  'fr': 'Français',
  'en': 'English',
  'es': 'Español',
  'de': 'Deutsch',
  'it': 'Italiano',
  'pt': 'Português',
  'nl': 'Nederlands',
  'pl': 'Polski',
  'ru': 'Русский',
  'ja': '日本語',
  'zh': '中文',
  'ko': '한국어',
  'ar': 'العربية',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

/**
 * Traduit une légende dans la langue spécifiée
 * 
 * @param caption - Légende originale (en français)
 * @param targetLanguage - Code langue ISO 639-1 (ex: 'en', 'es', 'de')
 * @returns Promise<string> - Légende traduite ou originale en cas d'erreur
 */
export const translateCaption = async (
  caption: string,
  targetLanguage: string
): Promise<string> => {
  // Si la langue cible est le français ou non supportée, retourner l'original
  if (targetLanguage === 'fr' || !SUPPORTED_LANGUAGES[targetLanguage as SupportedLanguage]) {
    return caption;
  }

  // Si la légende est vide ou trop courte, pas besoin de traduction
  if (!caption || caption.trim().length < 3) {
    return caption;
  }

  try {
    const languageName = SUPPORTED_LANGUAGES[targetLanguage as SupportedLanguage] || targetLanguage;
    
    const translationPrompt = `Traduis cette légende de photo de fête en ${languageName}. 
Conserve le ton festif, énergique et humoristique.
Conserve les emojis exactement tels quels.
La longueur doit rester similaire (maximum 12 mots).
Réponds UNIQUEMENT avec la traduction, sans explication, sans guillemets, sans formatage.

Légende à traduire: "${caption}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            text: translationPrompt,
          },
        ],
      },
    });

    const translated = response.text.trim();
    
    // Nettoyer la réponse (enlever guillemets si présents)
    let cleanTranslation = translated.replace(/^["']|["']$/g, '');
    
    if (!cleanTranslation || cleanTranslation.length === 0) {
      logger.warn('Empty translation returned from Gemini', null, {
        component: 'translationService',
        action: 'translateCaption',
        targetLanguage
      });
      return caption; // Retourner l'original en cas d'erreur
    }
    
    return cleanTranslation;

  } catch (error) {
    // Logger l'erreur mais retourner l'original pour ne pas bloquer l'application
    const errorType = detectGeminiErrorType(error);
    logGeminiError(error, errorType, {
      component: 'translationService',
      action: 'translateCaption',
      targetLanguage
    });

    // Retourner l'original en cas d'erreur
    return caption;
  }
};

/**
 * Traduit une légende selon la langue configurée dans les paramètres
 * 
 * @param caption - Légende originale
 * @param language - Code langue ISO 639-1 depuis EventSettings
 * @returns Promise<string> - Légende traduite si nécessaire
 */
export const translateCaptionIfNeeded = async (
  caption: string,
  language?: string | null
): Promise<string> => {
  if (!language || language === 'fr') {
    return caption;
  }
  
  return translateCaption(caption, language);
};

