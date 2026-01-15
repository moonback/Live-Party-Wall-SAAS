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
  // Vérifier la limite de photos pour les licences DEMO avant de traiter l'image
  try {
    const { getEventPhotosCount } = await import('./photoService');
    const { getMaxPhotos, isDemoLicense } = await import('../utils/licenseUtils');
    const { supabase } = await import('./supabaseClient');
    const { getActiveLicense } = await import('./licenseService');
    
    const { data: { session } } = await supabase.auth.getSession();
    let licenseKey: string | null = null;
    
    if (session?.user) {
      const activeLicense = await getActiveLicense(session.user.id);
      licenseKey = activeLicense?.license_key || null;
    } else {
      const storedLicenseKey = localStorage.getItem('partywall_license_key');
      if (storedLicenseKey) {
        licenseKey = storedLicenseKey;
      }
    }
    
    const maxPhotos = getMaxPhotos(licenseKey);
    
    if (maxPhotos !== null && isDemoLicense(licenseKey)) {
      const photosCount = await getEventPhotosCount(eventId);
      if (photosCount >= maxPhotos) {
        throw new Error(`Limite de photos atteinte. La licence DEMO permet un maximum de ${maxPhotos} photos par événement.`);
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Limite de photos atteinte')) {
      throw error;
    }
    // Logger l'erreur mais continuer si ce n'est pas une erreur de limite
    logger.warn("Error checking DEMO license limit in submitPhoto", error, {
      component: 'photoboothService',
      action: 'submitPhoto'
    });
  }

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
  // Détecter les compagnons basé sur le nombre de visages détectés
  // Pour l'instant, on passe juste authorName, les compagnons seront détectés automatiquement par l'IA
  const aiResult = await analyzeAndCaptionImage(
    imageForAnalysis,
    eventSettings.caption_generation_enabled ? eventSettings.event_context : null,
    eventSettings.caption_language || 'fr', // Langue pour la traduction
    authorName, // Nom de l'auteur
    undefined // Companions seront détectés automatiquement par l'IA basé sur faceCount
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
      // Mode agressif activé pour améliorations plus poussées
      finalImage = await enhanceImageQuality(
        imageForAnalysis,
        analysis.suggestedImprovements,
        true // Mode agressif activé
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

  // Sauvegarder l'avatar si disponible (de manière asynchrone, ne pas bloquer)
  const currentAvatar = getCurrentUserAvatar();
  if (currentAvatar && finalAuthorName === localStorage.getItem('party_user_name')) {
    saveUserAvatar(finalAuthorName, currentAvatar).catch(error => {
      logger.warn('Failed to save user avatar', { component: 'photoboothService', action: 'submitPhoto' }, error);
    });
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
  // Vérifier la limite de photos pour les licences DEMO avant de traiter la vidéo
  try {
    const { getEventPhotosCount } = await import('./photoService');
    const { getMaxPhotos, isDemoLicense } = await import('../utils/licenseUtils');
    const { supabase } = await import('./supabaseClient');
    const { getActiveLicense } = await import('./licenseService');
    
    const { data: { session } } = await supabase.auth.getSession();
    let licenseKey: string | null = null;
    
    if (session?.user) {
      const activeLicense = await getActiveLicense(session.user.id);
      licenseKey = activeLicense?.license_key || null;
    } else {
      const storedLicenseKey = localStorage.getItem('partywall_license_key');
      if (storedLicenseKey) {
        licenseKey = storedLicenseKey;
      }
    }
    
    const maxPhotos = getMaxPhotos(licenseKey);
    
    if (maxPhotos !== null && isDemoLicense(licenseKey)) {
      const photosCount = await getEventPhotosCount(eventId);
      if (photosCount >= maxPhotos) {
        throw new Error(`Limite de photos atteinte. La licence DEMO permet un maximum de ${maxPhotos} photos par événement.`);
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Limite de photos atteinte')) {
      throw error;
    }
    // Logger l'erreur mais continuer si ce n'est pas une erreur de limite
    logger.warn("Error checking DEMO license limit in submitVideo", error, {
      component: 'photoboothService',
      action: 'submitVideo'
    });
  }

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

  // Sauvegarder l'avatar si disponible (de manière asynchrone, ne pas bloquer)
  const currentAvatar = getCurrentUserAvatar();
  if (currentAvatar && finalAuthorName === localStorage.getItem('party_user_name')) {
    saveUserAvatar(finalAuthorName, currentAvatar).catch(error => {
      logger.warn('Failed to save user avatar', { component: 'photoboothService', action: 'submitVideo' }, error);
    });
  }

  return photo;
};

