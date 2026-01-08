import { analyzeAndCaptionImage } from './aiService';
import { enhanceImageQuality } from '../utils/imageFilters';
import { addPhotoToWall, addVideoToWall } from './photoService';
import { composeDataUrlWithPngOverlay } from '../utils/imageOverlay';
import { Photo } from '../types';
import { IMAGE_QUALITY } from '../constants';
import { EventSettings } from './settingsService';
import { logger } from '../utils/logger';
import { saveUserAvatar, getCurrentUserAvatar } from '../utils/userAvatar';

interface SubmitPhotoParams {
  imageDataUrl: string;
  authorName: string;
  eventId: string;
  eventSettings: EventSettings;
  activeFilter: string;
  activeFrame: string;
}

interface SubmitVideoParams {
  videoBlob: Blob;
  authorName: string;
  eventId: string;
  videoDuration: number;
  eventSettings: EventSettings;
}

export const submitPhoto = async ({
  imageDataUrl,
  authorName,
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
        IMAGE_QUALITY
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

  // Amélioration de la qualité si nécessaire
  let finalImage = imageForAnalysis;
  if (activeFilter === 'none' && activeFrame === 'none' && (analysis.quality === 'poor' || analysis.quality === 'fair')) {
    try {
      finalImage = await enhanceImageQuality(imageForAnalysis);
    } catch (enhanceError) {
      logger.warn("Quality enhancement failed", { component: 'photoboothService', action: 'submitPhoto' }, enhanceError);
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
    tags
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
    videoDuration
  );

  // Sauvegarder l'avatar si disponible
  const currentAvatar = getCurrentUserAvatar();
  if (currentAvatar && finalAuthorName === localStorage.getItem('party_user_name')) {
    saveUserAvatar(finalAuthorName, currentAvatar);
  }

  return photo;
};

