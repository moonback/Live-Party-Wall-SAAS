/**
 * Interface commune pour tous les providers LLM multimodaux
 * Permet de basculer facilement entre différents services (Gemini, Hugging Face, etc.)
 */

import { ImageAnalysis } from '../aiModerationService';
import { CombinedAnalysisResult } from '../aiService';
import { PhotoAnalysis } from '../aftermovieAIService';
import { Photo } from '../../types';

/**
 * Interface que tous les providers LLM doivent implémenter
 */
export interface LLMProvider {
  /**
   * Génère une légende pour une image
   * @param base64Image - Image en base64
   * @param eventContext - Contexte optionnel de l'événement
   * @param authorName - Nom de l'auteur
   * @param companions - Liste des compagnons
   * @returns Promise<string> - Légende générée
   */
  generateImageCaption(
    base64Image: string,
    eventContext?: string | null,
    authorName?: string | null,
    companions?: string[] | null
  ): Promise<string>;

  /**
   * Analyse une image (modération, détection de visages, qualité)
   * @param base64Image - Image en base64
   * @returns Promise<ImageAnalysis> - Analyse complète
   */
  analyzeImage(base64Image: string): Promise<ImageAnalysis>;

  /**
   * Analyse une image et génère une légende en un seul appel
   * @param base64Image - Image en base64
   * @param eventContext - Contexte optionnel de l'événement
   * @param captionLanguage - Langue pour la légende
   * @param authorName - Nom de l'auteur
   * @param companions - Liste des compagnons
   * @returns Promise<CombinedAnalysisResult> - Analyse + légende + tags
   */
  analyzeAndCaptionImage(
    base64Image: string,
    eventContext?: string | null,
    captionLanguage?: string | null,
    authorName?: string | null,
    companions?: string[] | null
  ): Promise<CombinedAnalysisResult>;

  /**
   * Traduit un texte dans une langue cible
   * @param text - Texte à traduire
   * @param targetLanguage - Code langue ISO 639-1
   * @returns Promise<string> - Texte traduit
   */
  translateText(text: string, targetLanguage: string): Promise<string>;

  /**
   * Génère un contexte d'événement basé sur des photos
   * @param photos - Liste de photos à analyser
   * @param existingContext - Contexte existant optionnel à améliorer
   * @returns Promise<string> - Contexte généré ou amélioré
   */
  generateEventContext(
    photos: Photo[],
    existingContext?: string | null
  ): Promise<string>;

  /**
   * Analyse une photo pour l'aftermovie (score, transition, durée, etc.)
   * @param photo - Photo à analyser
   * @param eventContext - Contexte optionnel de l'événement
   * @returns Promise<PhotoAnalysis> - Analyse pour aftermovie
   */
  analyzePhotoForAftermovie(
    photo: Photo,
    eventContext?: string | null
  ): Promise<PhotoAnalysis>;
}

