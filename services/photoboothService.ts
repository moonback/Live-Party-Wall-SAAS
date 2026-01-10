import { analyzeAndCaptionImage } from './aiService';
import { enhanceImageQuality } from '../utils/imageFilters';
import { addPhotoToWall, addVideoToWall } from './photoService';
import { composeDataUrlWithPngOverlay } from '../utils/imageOverlay';
import { Photo } from '../types';
import { EventSettings } from './settingsService';
import { logger } from '../utils/logger';
import { saveUserAvatar, getCurrentUserAvatar } from '../utils/userAvatar';

interface SubmitPhotoParams {
  imageDataUrl: string;
  authorName: string;
  userDescription?: string;
  eventId: string;
  eventSettings: EventSettings;
  activeFilter: string;
  activeFrame: string;
}

interface SubmitVideoParams {
  videoBlob: Blob;
  authorName: string;
  userDescription?: string;
  eventId: string;
  videoDuration: number;
  eventSettings: EventSettings;
}

export const submitPhoto = async ({
  imageDataUrl,
  authorName,
  userDescription,
  eventId,
  eventSettings,
  activeFilter,
  activeFrame
}: SubmitPhotoParams): Promise<Photo> => {
  let imageForAnalysis = imageDataUrl;
  
  // Incruster le cadre décoratif si activé
  if (eventSettings.decorative_frame_enabled && eventSettings.decorative_frame_url) {
    try {
      imageForAnalysis = await composeDataUrlWithPngOverlay(
        imageForAnalysis,
        eventSettings.decorative_frame_url,
        1.0 // Qualité maximale sans compression
      );
    } catch (e) {
      logger.warn('Overlay composition failed', { component: 'photoboothService', action: 'submitPhoto' }, e);
    }
  }

  // Analyse IA et génération de légende
  const aiResult = await analyzeAndCaptionImage(
    imageForAnalysis,
    eventSettings.caption_generation_enabled ? eventSettings.event_context : null
  );
  
  // Vérifier la modération
  if (!aiResult.analysis.isAppropriate) {
    throw new Error(
      aiResult.analysis.moderationReason || "Cette photo ne peut pas être publiée pour des raisons de modération."
    );
  }

  const analysis = aiResult.analysis;

  // Amélioration automatique de la qualité si nécessaire
  // Utilise estimatedQuality pour une détection plus précise
  // Optimise automatiquement pour la projection sur grand écran
  let finalImage = imageForAnalysis;
  const shouldEnhance = activeFilter === 'none' && activeFrame === 'none' && (
    analysis.quality === 'poor' || 
    analysis.quality === 'fair' ||
    analysis.estimatedQuality === 'poor' ||
    analysis.estimatedQuality === 'fair' ||
    (analysis.suggestedImprovements && analysis.suggestedImprovements.length > 0)
  );
  
  if (shouldEnhance) {
    try {
      logger.info('Optimisation automatique de la qualité activée', {
        component: 'photoboothService',
        action: 'submitPhoto',
        quality: analysis.quality,
        estimatedQuality: analysis.estimatedQuality,
        improvements: analysis.suggestedImprovements
      });
      
      // Passer les suggestions d'amélioration de l'IA pour un traitement ciblé
      finalImage = await enhanceImageQuality(
        imageForAnalysis,
        analysis.suggestedImprovements
      );
      
      logger.info('Optimisation de la qualité terminée avec succès', {
        component: 'photoboothService',
        action: 'submitPhoto'
      });
    } catch (enhanceError) {
      logger.warn("Quality enhancement failed", { component: 'photoboothService', action: 'submitPhoto' }, enhanceError);
      // En cas d'erreur, continuer avec l'image originale
    }
  }

  const caption = eventSettings.caption_generation_enabled ? aiResult.caption : '';
  const tags = eventSettings.tags_generation_enabled && aiResult.tags && aiResult.tags.length > 0 
    ? aiResult.tags 
    : undefined;

  const finalAuthorName = authorName || 'Invité VIP';
  const photo = await addPhotoToWall(
    eventId,
    finalImage,
    caption,
    finalAuthorName,
    tags,
    userDescription
  );

  // Sauvegarder l'avatar si disponible
  const currentAvatar = getCurrentUserAvatar();
  if (currentAvatar && finalAuthorName === localStorage.getItem('party_user_name')) {
    saveUserAvatar(finalAuthorName, currentAvatar);
  }

  return photo;
};

export const submitVideo = async ({
  videoBlob,
  authorName,
  userDescription,
  eventId,
  videoDuration,
  eventSettings
}: SubmitVideoParams): Promise<Photo> => {
  let caption = '';
  if (eventSettings.caption_generation_enabled) {
    caption = 'Vidéo de la fête ! 🎉';
  }

  const finalAuthorName = authorName || 'Invité VIP';
  const photo = await addVideoToWall(
    eventId,
    videoBlob,
    caption,
    finalAuthorName,
    videoDuration,
    userDescription
  );

  // Sauvegarder l'avatar si disponible
  const currentAvatar = getCurrentUserAvatar();
  if (currentAvatar && finalAuthorName === localStorage.getItem('party_user_name')) {
    saveUserAvatar(finalAuthorName, currentAvatar);
  }

  return photo;
};

