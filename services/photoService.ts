import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Photo, MediaType, PhotoRow, LikeRow, ReactionType, ReactionCounts, ReactionRow } from '../types';
import { debounce } from '../utils/debounce';
import { logger } from '../utils/logger';
import { canUploadPhoto } from './subscriptionService';

/**
 * ⚡ Précalcule l'orientation d'une image pour éviter les recalculs à chaque render
 * @param imageUrl - URL de l'image
 * @returns Promise résolue avec l'orientation ('portrait' | 'landscape' | 'square' | 'unknown')
 */
export const loadPhotoOrientation = async (imageUrl: string | null): Promise<'portrait' | 'landscape' | 'square' | 'unknown'> => {
  if (!imageUrl) return 'unknown';

  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const ratio = width / height;

      if (ratio > 1.1) {
        resolve('landscape');
      } else if (ratio < 0.9) {
        resolve('portrait');
      } else {
        resolve('square');
      }
    };

    img.onerror = () => {
      resolve('unknown');
    };

    img.src = imageUrl;
  });
};

/**
 * ⚡ Précalcule l'orientation pour une photo et retourne la photo avec l'orientation
 * @param photo - Photo à enrichir avec l'orientation
 * @returns Promise résolue avec la photo enrichie
 */
export const enrichPhotoWithOrientation = async (photo: Photo): Promise<Photo> => {
  if (photo.type !== 'photo' || photo.orientation) {
    // Si déjà calculé ou si c'est une vidéo, retourner tel quel
    return photo;
  }

  const orientation = await loadPhotoOrientation(photo.url);
  return { ...photo, orientation };
};

/**
 * ⚡ Précalcule les orientations pour plusieurs photos en parallèle
 * @param photos - Liste de photos à enrichir
 * @returns Promise résolue avec les photos enrichies
 */
export const enrichPhotosWithOrientation = async (photos: Photo[]): Promise<Photo[]> => {
  // Filtrer les photos qui ont déjà une orientation ou qui sont des vidéos
  const photosToEnrich = photos.filter(p => p.type === 'photo' && !p.orientation);
  const photosAlreadyEnriched = photos.filter(p => p.type === 'video' || p.orientation);

  if (photosToEnrich.length === 0) {
    return photos;
  }

  // ⚡ Précalculer les orientations en parallèle (batch optimisé pour 200+ photos)
  // Batch de 20 pour améliorer les performances avec un grand nombre de photos
  const BATCH_SIZE = 20;
  const enrichedPhotos: Photo[] = [...photosAlreadyEnriched];

  for (let i = 0; i < photosToEnrich.length; i += BATCH_SIZE) {
    const batch = photosToEnrich.slice(i, i + BATCH_SIZE);
    const enrichedBatch = await Promise.all(
      batch.map(photo => enrichPhotoWithOrientation(photo))
    );
    enrichedPhotos.push(...enrichedBatch);
  }

  // Conserver l'ordre original
  return photos.map(photo => {
    const enriched = enrichedPhotos.find(p => p.id === photo.id);
    return enriched || photo;
  });
};

/**
 * Upload a photo to Supabase Storage and insert record into DB.
 * @param eventId - ID de l'événement
 * @param base64Image - Image en base64
 * @param caption - Légende de la photo
 * @param author - Nom de l'auteur
 * @param tags - Tags suggérés par l'IA (optionnel)
 */
export const addPhotoToWall = async (
  eventId: string,
  base64Image: string,
  caption: string,
  author: string,
  tags?: string[]
): Promise<Photo> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré. Impossible d'envoyer la photo.");
  }

  // ⚡ Valider l'image avant l'upload pour éviter les fichiers trop volumineux ou formats invalides
  const { validateBase64Image } = await import('../utils/validation');
  const validation = validateBase64Image(base64Image);
  if (!validation.valid) {
    throw new Error(validation.error || 'Image invalide');
  }

  // Vérifier les limites d'abonnement avant l'upload
  try {
    // Compter les photos existantes pour cet événement
    const { count, error: countError } = await supabase
      .from('photos')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId);

    if (countError) {
      logger.error("Error counting photos", countError, { 
        component: 'photoService', 
        action: 'addPhotoToWall', 
        eventId 
      });
      // Continuer même en cas d'erreur de comptage
    }

    const currentPhotoCount = count || 0;
    const canUpload = await canUploadPhoto(eventId, currentPhotoCount);
    
    if (!canUpload.can) {
      throw new Error(canUpload.reason || "Limite de photos atteinte. Veuillez upgrader votre abonnement.");
    }
  } catch (error) {
    // Si c'est déjà une erreur de limite, la propager
    if (error instanceof Error && error.message.includes('Limite')) {
      throw error;
    }
    // Sinon, logger et continuer (ne pas bloquer si erreur de vérification)
    logger.error("Error checking photo limits", error, { 
      component: 'photoService', 
      action: 'addPhotoToWall', 
      eventId 
    });
  }

  try {
    // 1. Convert Base64 to Blob - Optimisé
    const base64Data = base64Image.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteArray = Uint8Array.from(byteCharacters, c => c.charCodeAt(0));
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    // ⚡ Valider le blob également pour double vérification
    const { validateImageBlob } = await import('../utils/validation');
    const blobValidation = validateImageBlob(blob, 'image/jpeg');
    if (!blobValidation.valid) {
      throw new Error(blobValidation.error || 'Blob invalide');
    }

    // 2. Generate filename (organisé par événement)
    const filename = `${eventId}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

    // 3. Upload to Storage
    const { error: uploadError } = await supabase.storage
      .from('party-photos')
      .upload(filename, blob, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // 4. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('party-photos')
      .getPublicUrl(filename);

    // 5. Insert into Database
    const { data, error: insertError } = await supabase
      .from('photos')
      .insert([
        { 
          url: publicUrl, 
          caption, 
          author,
          likes_count: 0,
          type: 'photo',
          event_id: eventId,
          tags: tags && tags.length > 0 ? tags : null
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    // 6. ⚡ Précalculer l'orientation et retourner la photo enrichie
    const photo: Photo = {
      id: data.id,
      url: publicUrl, // Utiliser publicUrl au lieu de data.url pour être cohérent
      caption: data.caption || '',
      author: data.author || '',
      timestamp: new Date(data.created_at).getTime(),
      likes_count: 0,
      type: 'photo',
      tags: Array.isArray(data.tags) ? data.tags : (tags || [])
    };
    
    // Précalculer l'orientation (utiliser base64Image pour un chargement immédiat, sinon publicUrl)
    const imageUrlForOrientation = base64Image.includes('data:') ? base64Image : publicUrl;
    const orientation = await loadPhotoOrientation(imageUrlForOrientation);
    return { ...photo, orientation };

  } catch (error) {
    logger.error("Error in addPhotoToWall", error, { component: 'photoService', action: 'addPhotoToWall' });
    throw error instanceof Error ? error : new Error("Erreur lors de l'upload de la photo");
  }
};

/**
 * Upload a video to Supabase Storage and insert record into DB.
 * @param eventId - ID de l'événement
 */
export const addVideoToWall = async (
  eventId: string,
  videoBlob: Blob,
  caption: string,
  author: string,
  duration: number
): Promise<Photo> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré. Impossible d'envoyer la vidéo.");
  }

  // ⚡ Valider la vidéo avant l'upload pour éviter les fichiers trop volumineux ou formats invalides
  const { validateVideoBlob } = await import('../utils/validation');
  const videoType = videoBlob.type || 'video/mp4';
  const validation = validateVideoBlob(videoBlob, videoType);
  if (!validation.valid) {
    throw new Error(validation.error || 'Vidéo invalide');
  }

  // Vérifier les limites d'abonnement avant l'upload
  try {
    // Compter les photos/vidéos existantes pour cet événement
    const { count, error: countError } = await supabase
      .from('photos')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId);

    if (countError) {
      logger.error("Error counting photos", countError, { 
        component: 'photoService', 
        action: 'addVideoToWall', 
        eventId 
      });
      // Continuer même en cas d'erreur de comptage
    }

    const currentPhotoCount = count || 0;
    const canUpload = await canUploadPhoto(eventId, currentPhotoCount);
    
    if (!canUpload.can) {
      throw new Error(canUpload.reason || "Limite de photos atteinte. Veuillez upgrader votre abonnement.");
    }
  } catch (error) {
    // Si c'est déjà une erreur de limite, la propager
    if (error instanceof Error && error.message.includes('Limite')) {
      throw error;
    }
    // Sinon, logger et continuer (ne pas bloquer si erreur de vérification)
    logger.error("Error checking photo limits", error, { 
      component: 'photoService', 
      action: 'addVideoToWall', 
      eventId 
    });
  }

  try {
    // 1. Generate filename based on video type (organisé par événement)
    const extension = videoType.includes('webm') ? 'webm' : videoType.includes('quicktime') ? 'mov' : 'mp4';
    const filename = `${eventId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

    // 2. Upload to Storage
    const { error: uploadError } = await supabase.storage
      .from('party-photos')
      .upload(filename, videoBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: videoType
      });

    if (uploadError) throw uploadError;

    // 3. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('party-photos')
      .getPublicUrl(filename);

    // 4. Insert into Database
    const { data, error: insertError } = await supabase
      .from('photos')
      .insert([
        { 
          url: publicUrl, 
          caption, 
          author,
          likes_count: 0,
          type: 'video',
          duration: duration,
          event_id: eventId
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    // 5. Return mapped object
    return {
      id: data.id,
      url: data.url,
      caption: data.caption,
      author: data.author,
      timestamp: new Date(data.created_at).getTime(),
      likes_count: 0,
      type: 'video',
      duration: data.duration ? Number(data.duration) : undefined
    };

  } catch (error) {
    logger.error("Error in addVideoToWall", error, { component: 'photoService', action: 'addVideoToWall' });
    throw error instanceof Error ? error : new Error("Erreur lors de l'upload de la vidéo");
  }
};

/**
 * Fetch all photos from the DB for a specific event.
 * Calculates likes_count from the likes table to ensure accuracy.
 * ⚡ Optimisé pour gérer 200+ photos efficacement.
 * @param eventId - ID de l'événement
 */
export const getPhotos = async (eventId: string): Promise<Photo[]> => {
  if (!isSupabaseConfigured()) return [];

  // ⚡ Récupérer toutes les photos de l'événement (support jusqu'à 1000+ photos par défaut Supabase)
  const { data: photosData, error: photosError } = await supabase
    .from('photos')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (photosError) {
    logger.error("Error fetching photos", photosError, { component: 'photoService', action: 'getPhotos' });
    return [];
  }

  if (!photosData || photosData.length === 0) {
    return [];
  }

  // ⚡ Récupérer le nombre de likes pour chaque photo (optimisé pour 200+ photos)
  // Supabase supporte jusqu'à 1000 IDs dans une clause .in()
  const photoIds = photosData.map((p: PhotoRow) => p.id);
  const { data: likesData, error: likesError } = await supabase
    .from('likes')
    .select('photo_id')
    .in('photo_id', photoIds)
    .returns<Pick<LikeRow, 'photo_id'>[]>();

  if (likesError) {
    logger.error("Error fetching likes", likesError, { component: 'photoService', action: 'getPhotos' });
    // Continuer avec likes_count de la table photos en cas d'erreur
  }

  // Compter les likes par photo
  const likesCountMap = new Map<string, number>();
  if (likesData) {
    likesData.forEach((like: Pick<LikeRow, 'photo_id'>) => {
      const count = likesCountMap.get(like.photo_id) || 0;
      likesCountMap.set(like.photo_id, count + 1);
    });
  }

  const photos = photosData.map((p: PhotoRow) => ({
    id: p.id,
    url: p.url,
    caption: p.caption || '',
    author: p.author || '',
    timestamp: new Date(p.created_at).getTime(),
    likes_count: likesCountMap.get(p.id) || 0, // Utiliser le nombre réel depuis la table likes
    type: (p.type || 'photo') as MediaType,
    duration: p.duration ? Number(p.duration) : undefined,
    tags: Array.isArray(p.tags) ? p.tags : undefined
  }));

  // ⚡ Précalculer les orientations en parallèle (batch pour éviter de surcharger)
  try {
    return await enrichPhotosWithOrientation(photos);
  } catch (error) {
    logger.error("Error enriching photos with orientation", error, { component: 'photoService', action: 'getPhotos' });
    // En cas d'erreur, retourner les photos sans orientation
    return photos;
  }
};

/**
 * Récupère toutes les photos d'un auteur spécifique pour un événement
 * @param eventId - ID de l'événement
 * @param authorName - Nom de l'auteur
 * @returns Promise résolue avec la liste des photos de l'auteur
 */
export const getPhotosByAuthor = async (eventId: string, authorName: string): Promise<Photo[]> => {
  if (!isSupabaseConfigured() || !authorName || !eventId) return [];

  try {
    // Récupérer toutes les photos de l'auteur pour cet événement
    const { data: photosData, error: photosError } = await supabase
      .from('photos')
      .select('*')
      .eq('event_id', eventId)
      .eq('author', authorName)
      .order('created_at', { ascending: false });

    if (photosError) {
      logger.error("Error fetching photos by author", photosError, { component: 'photoService', action: 'getPhotosByAuthor' });
      return [];
    }

    if (!photosData || photosData.length === 0) {
      return [];
    }

    // Récupérer le nombre de likes pour chaque photo
    const photoIds = photosData.map((p: PhotoRow) => p.id);
    const { data: likesData, error: likesError } = await supabase
      .from('likes')
      .select('photo_id')
      .in('photo_id', photoIds)
      .returns<Pick<LikeRow, 'photo_id'>[]>();

    if (likesError) {
      logger.error("Error fetching likes", likesError, { component: 'photoService', action: 'getPhotosByAuthor' });
    }

    // Compter les likes par photo
    const likesCountMap = new Map<string, number>();
    if (likesData) {
      likesData.forEach((like: Pick<LikeRow, 'photo_id'>) => {
        const count = likesCountMap.get(like.photo_id) || 0;
        likesCountMap.set(like.photo_id, count + 1);
      });
    }

    const photos = photosData.map((p: PhotoRow) => ({
      id: p.id,
      url: p.url,
      caption: p.caption || '',
      author: p.author || '',
      timestamp: new Date(p.created_at).getTime(),
      likes_count: likesCountMap.get(p.id) || 0,
      type: (p.type || 'photo') as MediaType,
      duration: p.duration ? Number(p.duration) : undefined
    }));

    // Précalculer les orientations en parallèle
    try {
      return await enrichPhotosWithOrientation(photos);
    } catch (error) {
      logger.error("Error enriching photos with orientation", error, { component: 'photoService', action: 'getPhotosByAuthor' });
      return photos;
    }
  } catch (error) {
    logger.error("Error in getPhotosByAuthor", error, { component: 'photoService', action: 'getPhotosByAuthor' });
    return [];
  }
};

/**
 * Subscribe to new photo insertions for Realtime updates for a specific event.
 * @param eventId - ID de l'événement
 */
export const subscribeToNewPhotos = (eventId: string, onNewPhoto: (photo: Photo) => void) => {
  if (!isSupabaseConfigured()) {
    return { unsubscribe: () => {} };
  }

  // Utiliser un nom de canal unique
  const channelId = `public:photos:${eventId}:${Math.floor(Math.random() * 1000000)}`;
  return supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'photos' },
      async (payload) => {
        const p = payload.new as PhotoRow & { event_id?: string };
        // Filtrer par event_id côté client (RLS devrait déjà le faire, mais on double-vérifie)
        if (p.event_id !== eventId) {
          return;
        }
        const newPhoto: Photo = {
          id: p.id,
          url: p.url,
          caption: p.caption || '',
          author: p.author || '',
          timestamp: new Date(p.created_at).getTime(),
          likes_count: p.likes_count || 0,
          type: (p.type || 'photo') as MediaType,
          duration: p.duration ? Number(p.duration) : undefined
        };
        
        // ⚡ Précalculer l'orientation pour les nouvelles photos
        const enrichedPhoto = await enrichPhotoWithOrientation(newPhoto);
        onNewPhoto(enrichedPhoto);
      }
    )
    .subscribe();
};

/**
 * Toggle like for a photo.
 * Returns the new like count and whether the user liked it.
 */
export const toggleLike = async (photoId: string, userIdentifier: string): Promise<{ newCount: number; isLiked: boolean }> => {
  if (!isSupabaseConfigured()) throw new Error("Supabase non configuré");

  // 1. Check if user already liked
  const { data: existingLike } = await supabase
    .from('likes')
    .select('id')
    .eq('photo_id', photoId)
    .eq('user_identifier', userIdentifier)
    .maybeSingle();

  if (existingLike) {
    // UNLIKE
    await supabase.from('likes').delete().eq('id', existingLike.id);
    
    // Decrement counter (atomic update ideally, here simplified)
    const { data: photo } = await supabase
      .from('photos')
      .select('likes_count')
      .eq('id', photoId)
      .single();
      
    const newCount = Math.max(0, (photo?.likes_count || 0) - 1);
    
    await supabase
      .from('photos')
      .update({ likes_count: newCount })
      .eq('id', photoId);

    return { newCount, isLiked: false };
  } else {
    // LIKE
    await supabase.from('likes').insert([{ photo_id: photoId, user_identifier: userIdentifier }]);
    
    // Increment counter
    const { data: photo } = await supabase
      .from('photos')
      .select('likes_count')
      .eq('id', photoId)
      .single();
      
    const newCount = (photo?.likes_count || 0) + 1;
    
    await supabase
      .from('photos')
      .update({ likes_count: newCount })
      .eq('id', photoId);

    return { newCount, isLiked: true };
  }
};

/**
 * Get IDs of photos liked by user
 */
export const getUserLikes = async (userIdentifier: string): Promise<string[]> => {
  if (!isSupabaseConfigured()) return [];
  
  const { data } = await supabase
    .from('likes')
    .select('photo_id')
    .eq('user_identifier', userIdentifier);
    
  return (data || []).map((l: any) => l.photo_id);
};

/**
 * Subscribe to photo likes updates in real-time.
 * Listens to INSERT/DELETE on the likes table and recalculates counts.
 * Utilise un debounce pour éviter trop de requêtes simultanées.
 */
export const subscribeToLikesUpdates = (
  onLikesUpdate: (photoId: string, newLikesCount: number) => void,
  onLikeEvent?: (photoId: string, isLike: boolean) => void
) => {
  if (!isSupabaseConfigured()) {
    return { unsubscribe: () => {} };
  }

  // Map pour accumuler les mises à jour de likes par photo
  const pendingUpdates = new Map<string, number>();

  // Fonction pour récupérer le nombre de likes d'une photo
  // Compter directement depuis la table likes pour garantir l'exactitude
  const getLikesCount = async (photoId: string) => {
    try {
      const { count, error } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('photo_id', photoId);

      if (!error && count !== null) {
        onLikesUpdate(photoId, count);
        pendingUpdates.delete(photoId);
      } else if (error) {
        // En cas d'erreur, essayer de récupérer depuis photos.likes_count comme fallback
        const { data: photoData, error: photoError } = await supabase
          .from('photos')
          .select('likes_count')
          .eq('id', photoId)
          .single();

        if (!photoError && photoData) {
          onLikesUpdate(photoId, photoData.likes_count || 0);
          pendingUpdates.delete(photoId);
        }
      }
    } catch (error) {
      logger.error("Error in getLikesCount", error, { component: 'photoService', action: 'getLikesCount', photoId });
    }
  };

  // Debounce pour limiter les requêtes (300ms)
  // Avec le trigger PostgreSQL, on récupère juste la valeur depuis photos (plus rapide)
  const debouncedGetLikes = debounce((...args: unknown[]): void => {
    const photoId = args[0] as string;
    if (photoId) {
      getLikesCount(photoId);
    }
  }, 300);

  // Utiliser un nom de canal unique pour éviter les conflits si plusieurs abonnements
  const channelId = `public:likes:updates:${Math.floor(Math.random() * 1000000)}`;
  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'likes'
      },
      (payload) => {
        const newLike = payload.new as LikeRow;
        if (newLike?.photo_id) {
          // Trigger immédiat pour animation
          if (onLikeEvent) onLikeEvent(newLike.photo_id, true);
          
          // Annuler le debounce précédent pour cette photo si existe
          pendingUpdates.set(newLike.photo_id, (pendingUpdates.get(newLike.photo_id) || 0) + 1);
          debouncedGetLikes(newLike.photo_id);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'likes'
      },
      (payload) => {
        const oldLike = payload.old as LikeRow;
        if (oldLike?.photo_id) {
          // Trigger immédiat pour animation (optionnel pour unlike, mais utile pour debug ou effet 'cœur brisé')
          if (onLikeEvent) onLikeEvent(oldLike.photo_id, false);

          // Annuler le debounce précédent pour cette photo si existe
          pendingUpdates.set(oldLike.photo_id, (pendingUpdates.get(oldLike.photo_id) || 0) - 1);
          debouncedGetLikes(oldLike.photo_id);
        }
      }
    )
    .subscribe();

  return channel;
};

/**
 * Delete a photo (Admin only).
 */
export const deletePhoto = async (photoId: string, photoUrl: string): Promise<void> => {
  if (!isSupabaseConfigured()) throw new Error("Supabase n'est pas configuré");

  try {
    // 1. Delete from Database
    const { error: dbError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId);

    if (dbError) throw dbError;

    // 2. Delete from Storage
    // Extract filename from URL: .../party-photos/eventId/filename.jpg ou .../party-photos/filename.jpg (ancien format)
    const urlParts = photoUrl.split('/party-photos/');
    if (urlParts.length === 2) {
      const filename = urlParts[1];
      const { error: storageError } = await supabase.storage
        .from('party-photos')
        .remove([filename]);
      
      if (storageError) logger.error("Error deleting file from storage", storageError, { component: 'photoService', action: 'deletePhoto', photoId });
    }

  } catch (error) {
    logger.error("Error deleting photo", error, { component: 'photoService', action: 'deletePhoto', photoId });
    throw error;
  }
};

/**
 * Delete ALL photos for a specific event (Admin only).
 * WARNING: This is destructive and cannot be undone.
 * @param eventId - ID de l'événement
 */
export const deleteAllPhotos = async (eventId: string): Promise<void> => {
  if (!isSupabaseConfigured()) throw new Error("Supabase n'est pas configuré");

  try {
    // 1. Fetch all photos to get filenames for this event
    const { data: photos, error: fetchError } = await supabase
      .from('photos')
      .select('url')
      .eq('event_id', eventId);

    if (fetchError) throw fetchError;
    
    if (!photos || photos.length === 0) return;

    // 2. Extract filenames for storage deletion
    const filenames: string[] = [];
    photos.forEach((p: any) => {
      const urlParts = p.url.split('/party-photos/');
      if (urlParts.length === 2) {
        filenames.push(urlParts[1]);
      }
    });

    // 3. Delete from Database (truncate is not exposed in client usually, so we delete all)
    // We use a not-null filter on id to match all rows if needed, or just delete without filter if allowed?
    // Supabase client usually requires a filter for delete unless safety settings are off.
    // Using .neq('id', '00000000-0000-0000-0000-000000000000') is a hack, 
    // but typically we can iterate or use a massive IN clause.
    // However, if we know all IDs, we can use .in('id', allIds).
    
    // Actually, listing all IDs first is safer.
    const { data: allPhotosData } = await supabase
      .from('photos')
      .select('id')
      .eq('event_id', eventId);
    const allIds = (allPhotosData || []).map((p: any) => p.id);
    
    if (allIds.length > 0) {
        const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .in('id', allIds);

        if (dbError) throw dbError;
    }

    // 4. Delete from Storage
    if (filenames.length > 0) {
        // Delete in batches of 100 to be safe
        const BATCH_SIZE = 100;
        for (let i = 0; i < filenames.length; i += BATCH_SIZE) {
            const batch = filenames.slice(i, i + BATCH_SIZE);
            const { error: storageError } = await supabase.storage
                .from('party-photos')
                .remove(batch);
            
            if (storageError) logger.error("Error deleting files from storage", storageError, { component: 'photoService', action: 'deleteAllPhotos', batch: i });
        }
    }

  } catch (error) {
    logger.error("Error deleting all photos", error, { component: 'photoService', action: 'deleteAllPhotos' });
    throw error;
  }
};

/**
 * Toggle reaction for a photo.
 * If the user already has a reaction, it will be updated or removed if the same reaction is clicked.
 * @param photoId - ID de la photo
 * @param userIdentifier - Identifiant unique de l'utilisateur
 * @param reactionType - Type de réaction ('heart', 'laugh', 'cry', etc.) ou null pour supprimer
 * @returns Promise résolue avec les nouveaux compteurs de réactions et la réaction actuelle de l'utilisateur
 */
export const toggleReaction = async (
  photoId: string,
  userIdentifier: string,
  reactionType: ReactionType | null
): Promise<{ reactions: ReactionCounts; userReaction: ReactionType | null }> => {
  if (!isSupabaseConfigured()) throw new Error("Supabase non configuré");

  try {
    // 1. Vérifier si l'utilisateur a déjà une réaction
    const { data: existingReaction } = await supabase
      .from('reactions')
      .select('id, reaction_type')
      .eq('photo_id', photoId)
      .eq('user_identifier', userIdentifier)
      .maybeSingle();

    if (existingReaction) {
      if (reactionType === null || existingReaction.reaction_type === reactionType) {
        // Supprimer la réaction existante
        await supabase
          .from('reactions')
          .delete()
          .eq('id', existingReaction.id);
      } else {
        // Mettre à jour la réaction existante
        await supabase
          .from('reactions')
          .update({ reaction_type: reactionType, updated_at: new Date().toISOString() })
          .eq('id', existingReaction.id);
      }
    } else if (reactionType !== null) {
      // Créer une nouvelle réaction
      await supabase
        .from('reactions')
        .insert([{ photo_id: photoId, user_identifier: userIdentifier, reaction_type: reactionType }]);
    }

    // 2. Récupérer les nouveaux compteurs de réactions
    const reactions = await getPhotoReactions(photoId);
    const userReaction = await getUserReaction(photoId, userIdentifier);

    return { reactions, userReaction };
  } catch (error) {
    logger.error("Error in toggleReaction", error, { component: 'photoService', action: 'toggleReaction', photoId });
    throw error instanceof Error ? error : new Error("Erreur lors de la réaction");
  }
};

/**
 * Get reaction counts for a photo.
 * @param photoId - ID de la photo
 * @returns Promise résolue avec les compteurs de réactions
 */
export const getPhotoReactions = async (photoId: string): Promise<ReactionCounts> => {
  if (!isSupabaseConfigured()) return {};

  try {
    const { data, error } = await supabase
      .from('reactions')
      .select('reaction_type')
      .eq('photo_id', photoId);

    if (error) throw error;

    const counts: ReactionCounts = {};
    (data || []).forEach((reaction: Pick<ReactionRow, 'reaction_type'>) => {
      const type = reaction.reaction_type as ReactionType;
      counts[type] = (counts[type] || 0) + 1;
    });

    return counts;
  } catch (error) {
    logger.error("Error in getPhotoReactions", error, { component: 'photoService', action: 'getPhotoReactions', photoId });
    return {};
  }
};

/**
 * Get reaction counts for multiple photos in a single query (optimized).
 * @param photoIds - Array of photo IDs
 * @returns Promise résolue avec une Map de photoId -> ReactionCounts
 */
export const getPhotosReactions = async (photoIds: string[]): Promise<Map<string, ReactionCounts>> => {
  if (!isSupabaseConfigured() || photoIds.length === 0) return new Map();

  try {
    const { data, error } = await supabase
      .from('reactions')
      .select('photo_id, reaction_type')
      .in('photo_id', photoIds);

    if (error) throw error;

    const reactionsMap = new Map<string, ReactionCounts>();
    
    // Initialiser toutes les photos avec un objet vide
    photoIds.forEach(id => {
      reactionsMap.set(id, {});
    });

    // Compter les réactions par photo
    (data || []).forEach((reaction: Pick<ReactionRow, 'photo_id' | 'reaction_type'>) => {
      const photoId = reaction.photo_id;
      const type = reaction.reaction_type as ReactionType;
      const counts = reactionsMap.get(photoId) || {};
      counts[type] = (counts[type] || 0) + 1;
      reactionsMap.set(photoId, counts);
    });

    return reactionsMap;
  } catch (error) {
    logger.error("Error in getPhotosReactions", error, { component: 'photoService', action: 'getPhotosReactions' });
    return new Map();
  }
};

/**
 * Get user's reaction for a photo.
 * @param photoId - ID de la photo
 * @param userIdentifier - Identifiant unique de l'utilisateur
 * @returns Promise résolue avec le type de réaction de l'utilisateur ou null
 */
export const getUserReaction = async (photoId: string, userIdentifier: string): Promise<ReactionType | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data } = await supabase
      .from('reactions')
      .select('reaction_type')
      .eq('photo_id', photoId)
      .eq('user_identifier', userIdentifier)
      .maybeSingle();

    return data?.reaction_type as ReactionType || null;
  } catch (error) {
    // Pas de réaction trouvée (erreur normale)
    return null;
  }
};

/**
 * Get all user reactions (map photoId -> reactionType).
 * @param userIdentifier - Identifiant unique de l'utilisateur
 * @returns Promise résolue avec une Map des réactions de l'utilisateur
 */
export const getUserReactions = async (userIdentifier: string): Promise<Map<string, ReactionType>> => {
  if (!isSupabaseConfigured()) return new Map();

  try {
    const { data } = await supabase
      .from('reactions')
      .select('photo_id, reaction_type')
      .eq('user_identifier', userIdentifier);

    const reactionsMap = new Map<string, ReactionType>();
    (data || []).forEach((reaction: Pick<ReactionRow, 'photo_id' | 'reaction_type'>) => {
      reactionsMap.set(reaction.photo_id, reaction.reaction_type as ReactionType);
    });

    return reactionsMap;
  } catch (error) {
    logger.error("Error in getUserReactions", error, { component: 'photoService', action: 'getUserReactions' });
    return new Map();
  }
};

/**
 * Subscribe to reactions updates in real-time.
 * @param onReactionsUpdate - Callback appelé quand les réactions changent (après revalidation)
 * @param onReactionEvent - Callback optionnel appelé immédiatement à chaque événement (pour animations)
 * @returns Subscription object avec méthode unsubscribe
 */
export const subscribeToReactionsUpdates = (
  onReactionsUpdate: (photoId: string, reactions: ReactionCounts) => void,
  onReactionEvent?: (photoId: string, type: ReactionType) => void
) => {
  if (!isSupabaseConfigured()) {
    return { unsubscribe: () => {} };
  }

  // Utiliser un nom de canal unique
  const channelId = `public:reactions:updates:${Math.floor(Math.random() * 1000000)}`;
  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'reactions'
      },
      async (payload) => {
        const newReaction = payload.new as ReactionRow | null;
        const oldReaction = payload.old as ReactionRow | null;
        const photoId = newReaction?.photo_id || oldReaction?.photo_id;
        
        // Trigger immédiat pour animation
        if (onReactionEvent && payload.eventType === 'INSERT' && newReaction?.reaction_type) {
            onReactionEvent(newReaction.photo_id, newReaction.reaction_type as ReactionType);
        }

        if (photoId) {
          const reactions = await getPhotoReactions(photoId);
          onReactionsUpdate(photoId, reactions);
        }
      }
    )
    .subscribe();

  return channel;
};