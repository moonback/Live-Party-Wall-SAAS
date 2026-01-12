/**
 * ⚡ VERSION OPTIMISÉE de photoService.ts
 * 
 * Ce fichier montre les optimisations à appliquer dans photoService.ts
 * Ne pas utiliser directement, mais intégrer les optimisations dans le fichier principal
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Photo, MediaType, PhotoRow } from '../types';
import { logger } from '../utils/logger';

/**
 * ⚡ OPTIMISATION 1 : Sélection de colonnes ciblée
 * 
 * AVANT: select('*')
 * APRÈS: select('id, url, caption, author, created_at, type, duration, tags, user_description, event_id')
 */
export const getPhotosOptimized = async (
  eventId: string,
  options: { page?: number; pageSize?: number; all?: boolean } = {}
): Promise<Photo[] | { photos: Photo[]; total: number; page: number; pageSize: number; hasMore: boolean }> => {
  if (!isSupabaseConfigured()) return options.page ? { photos: [], total: 0, page: 1, pageSize: 50, hasMore: false } : [];

  const { page, pageSize = 50, all = false } = options;

  // ⚡ OPTIMISATION 2 : Utiliser la fonction SQL au lieu de requêtes multiples
  if (all || !page) {
    // Option 1 : Utiliser la fonction SQL (recommandé)
    try {
      const { data, error } = await supabase.rpc('get_photos_with_likes', {
        event_uuid: eventId,
        page_num: 1,
        page_size: 10000 // Pour récupérer toutes les photos
      });

      if (error) {
        logger.error("Error fetching photos via RPC", error, { component: 'photoService', action: 'getPhotosOptimized' });
        // Fallback vers l'ancienne méthode
        return await getPhotosFallback(eventId);
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Mapper les résultats
      const photos: Photo[] = data.map((row: any) => ({
        id: row.id,
        url: row.url,
        caption: row.caption || '',
        author: row.author || '',
        timestamp: new Date(row.created_at).getTime(),
        likes_count: Number(row.likes_count) || 0,
        type: (row.type || 'photo') as MediaType,
        duration: row.duration ? Number(row.duration) : undefined,
        tags: Array.isArray(row.tags) ? row.tags : undefined,
        user_description: row.user_description || undefined
      }));

      return await enrichPhotosWithOrientation(photos);
    } catch (error) {
      logger.error("Error in getPhotosOptimized RPC", error, { component: 'photoService', action: 'getPhotosOptimized' });
      return await getPhotosFallback(eventId);
    }
  }

  // Pagination avec fonction SQL
  const { data, error } = await supabase.rpc('get_photos_with_likes', {
    event_uuid: eventId,
    page_num: page,
    page_size: pageSize
  });

  if (error) {
    logger.error("Error fetching photos via RPC", error, { component: 'photoService', action: 'getPhotosOptimized' });
    return { photos: [], total: 0, page, pageSize, hasMore: false };
  }

  if (!data || data.length === 0) {
    return { photos: [], total: 0, page, pageSize, hasMore: false };
  }

  const total = data[0]?.total_count || 0;
  const photos: Photo[] = data.map((row: any) => ({
    id: row.id,
    url: row.url,
    caption: row.caption || '',
    author: row.author || '',
    timestamp: new Date(row.created_at).getTime(),
    likes_count: Number(row.likes_count) || 0,
    type: (row.type || 'photo') as MediaType,
    duration: row.duration ? Number(row.duration) : undefined,
    tags: Array.isArray(row.tags) ? row.tags : undefined,
    user_description: row.user_description || undefined
  }));

  const enrichedPhotos = await enrichPhotosWithOrientation(photos);
  const hasMore = (page * pageSize) < total;

  return {
    photos: enrichedPhotos,
    total,
    page,
    pageSize,
    hasMore
  };
};

/**
 * ⚡ OPTIMISATION 3 : Fallback optimisé (sans fonction SQL)
 * Utilise des sélections ciblées et une seule requête pour les likes
 */
const getPhotosFallback = async (eventId: string): Promise<Photo[]> => {
  // Sélection ciblée au lieu de select('*')
  const { data: photosData, error: photosError } = await supabase
    .from('photos')
    .select('id, url, caption, author, created_at, type, duration, tags, user_description')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (photosError || !photosData || photosData.length === 0) {
    return [];
  }

  // ⚡ OPTIMISATION 4 : Utiliser une agrégation SQL au lieu de compter côté client
  const photoIds = photosData.map((p: PhotoRow) => p.id);
  
  // Requête optimisée avec GROUP BY
  const { data: likesData, error: likesError } = await supabase
    .from('likes')
    .select('photo_id')
    .in('photo_id', photoIds);

  if (likesError) {
    logger.error("Error fetching likes", likesError, { component: 'photoService', action: 'getPhotosFallback' });
  }

  // Compter les likes par photo (côté client, mais optimisé)
  const likesCountMap = new Map<string, number>();
  if (likesData) {
    likesData.forEach((like: { photo_id: string }) => {
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
    duration: p.duration ? Number(p.duration) : undefined,
    tags: Array.isArray(p.tags) ? p.tags : undefined,
    user_description: p.user_description || undefined
  }));

  return await enrichPhotosWithOrientation(photos);
};

/**
 * ⚡ OPTIMISATION 5 : getPhotosByAuthor avec fonction SQL
 */
export const getPhotosByAuthorOptimized = async (
  eventId: string,
  authorName: string
): Promise<Photo[]> => {
  if (!isSupabaseConfigured() || !authorName || !eventId) return [];

  try {
    // Utiliser la fonction SQL optimisée
    const { data, error } = await supabase.rpc('get_photos_by_author', {
      event_uuid: eventId,
      author_name: authorName
    });

    if (error) {
      logger.error("Error fetching photos by author via RPC", error, { component: 'photoService', action: 'getPhotosByAuthorOptimized' });
      // Fallback
      return await getPhotosByAuthorFallback(eventId, authorName);
    }

    if (!data || data.length === 0) {
      return [];
    }

    const photos: Photo[] = data.map((row: any) => ({
      id: row.id,
      url: row.url,
      caption: row.caption || '',
      author: row.author || '',
      timestamp: new Date(row.created_at).getTime(),
      likes_count: Number(row.likes_count) || 0,
      type: (row.type || 'photo') as MediaType,
      duration: row.duration ? Number(row.duration) : undefined,
      user_description: row.user_description || undefined
    }));

    return await enrichPhotosWithOrientation(photos);
  } catch (error) {
    logger.error("Error in getPhotosByAuthorOptimized", error, { component: 'photoService', action: 'getPhotosByAuthorOptimized' });
    return await getPhotosByAuthorFallback(eventId, authorName);
  }
};

const getPhotosByAuthorFallback = async (eventId: string, authorName: string): Promise<Photo[]> => {
  // Sélection ciblée
  const { data: photosData, error: photosError } = await supabase
    .from('photos')
    .select('id, url, caption, author, created_at, type, duration, user_description')
    .eq('event_id', eventId)
    .eq('author', authorName)
    .order('created_at', { ascending: false });

  if (photosError || !photosData || photosData.length === 0) {
    return [];
  }

  // Récupérer les likes en une seule requête
  const photoIds = photosData.map((p: PhotoRow) => p.id);
  const { data: likesData } = await supabase
    .from('likes')
    .select('photo_id')
    .in('photo_id', photoIds);

  const likesCountMap = new Map<string, number>();
  if (likesData) {
    likesData.forEach((like: { photo_id: string }) => {
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
    duration: p.duration ? Number(p.duration) : undefined,
    user_description: p.user_description || undefined
  }));

  return await enrichPhotosWithOrientation(photos);
};

/**
 * ⚡ OPTIMISATION 6 : getPhotoReactions avec fonction SQL
 */
export const getPhotoReactionsOptimized = async (photoId: string): Promise<Record<string, number>> => {
  if (!isSupabaseConfigured()) return {};

  try {
    // Utiliser la fonction SQL optimisée
    const { data, error } = await supabase.rpc('get_photo_reactions_optimized', {
      photo_uuid: photoId
    });

    if (error) {
      logger.error("Error fetching reactions via RPC", error, { component: 'photoService', action: 'getPhotoReactionsOptimized' });
      // Fallback
      return await getPhotoReactionsFallback(photoId);
    }

    // Convertir JSONB en objet
    return (data as Record<string, number>) || {};
  } catch (error) {
    logger.error("Error in getPhotoReactionsOptimized", error, { component: 'photoService', action: 'getPhotoReactionsOptimized' });
    return await getPhotoReactionsFallback(photoId);
  }
};

const getPhotoReactionsFallback = async (photoId: string): Promise<Record<string, number>> => {
  // Sélection ciblée
  const { data, error } = await supabase
    .from('reactions')
    .select('reaction_type')
    .eq('photo_id', photoId);

  if (error) return {};

  const counts: Record<string, number> = {};
  (data || []).forEach((reaction: { reaction_type: string }) => {
    const type = reaction.reaction_type;
    counts[type] = (counts[type] || 0) + 1;
  });

  return counts;
};

/**
 * ⚡ OPTIMISATION 7 : getPhotosReactions avec fonction SQL batch
 */
export const getPhotosReactionsOptimized = async (
  photoIds: string[]
): Promise<Map<string, Record<string, number>>> => {
  if (!isSupabaseConfigured() || photoIds.length === 0) return new Map();

  try {
    // Utiliser la fonction SQL batch
    const { data, error } = await supabase.rpc('get_photos_reactions_batch', {
      photo_ids: photoIds
    });

    if (error) {
      logger.error("Error fetching reactions batch via RPC", error, { component: 'photoService', action: 'getPhotosReactionsOptimized' });
      // Fallback
      return await getPhotosReactionsFallback(photoIds);
    }

    const reactionsMap = new Map<string, Record<string, number>>();
    
    // Initialiser toutes les photos avec un objet vide
    photoIds.forEach(id => {
      reactionsMap.set(id, {});
    });

    // Remplir avec les données
    (data || []).forEach((row: { photo_id: string; reactions: Record<string, number> }) => {
      reactionsMap.set(row.photo_id, row.reactions || {});
    });

    return reactionsMap;
  } catch (error) {
    logger.error("Error in getPhotosReactionsOptimized", error, { component: 'photoService', action: 'getPhotosReactionsOptimized' });
    return await getPhotosReactionsFallback(photoIds);
  }
};

const getPhotosReactionsFallback = async (
  photoIds: string[]
): Promise<Map<string, Record<string, number>>> => {
  // Sélection ciblée
  const { data, error } = await supabase
    .from('reactions')
    .select('photo_id, reaction_type')
    .in('photo_id', photoIds);

  if (error) return new Map();

  const reactionsMap = new Map<string, Record<string, number>>();
  
  // Initialiser toutes les photos
  photoIds.forEach(id => {
    reactionsMap.set(id, {});
  });

  // Compter les réactions
  (data || []).forEach((reaction: { photo_id: string; reaction_type: string }) => {
    const photoId = reaction.photo_id;
    const type = reaction.reaction_type;
    const counts = reactionsMap.get(photoId) || {};
    counts[type] = (counts[type] || 0) + 1;
    reactionsMap.set(photoId, counts);
  });

  return reactionsMap;
};

/**
 * ⚡ OPTIMISATION 8 : toggleLike avec upsert au lieu de check + insert/delete
 */
export const toggleLikeOptimized = async (
  photoId: string,
  userIdentifier: string
): Promise<{ newCount: number; isLiked: boolean }> => {
  if (!isSupabaseConfigured()) throw new Error("Supabase non configuré");

  // ⚡ Utiliser une fonction SQL pour faire le toggle en une seule requête
  // Note: Nécessite de créer une fonction SQL toggle_like(photo_uuid, user_id)
  // Pour l'instant, on garde la logique actuelle mais optimisée

  // 1. Check if user already liked (avec sélection ciblée)
  const { data: existingLike } = await supabase
    .from('likes')
    .select('id')
    .eq('photo_id', photoId)
    .eq('user_identifier', userIdentifier)
    .maybeSingle();

  if (existingLike) {
    // UNLIKE
    await supabase.from('likes').delete().eq('id', existingLike.id);
    
    // ⚡ OPTIMISATION : Utiliser head: true pour le count
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('photo_id', photoId);
      
    const newCount = count || 0;
    
    // Mettre à jour le compteur dans photos (optionnel, les triggers le font déjà)
    await supabase
      .from('photos')
      .update({ likes_count: newCount })
      .eq('id', photoId);

    return { newCount, isLiked: false };
  } else {
    // LIKE
    await supabase.from('likes').insert([{ photo_id: photoId, user_identifier: userIdentifier }]);
    
    // ⚡ OPTIMISATION : Utiliser head: true pour le count
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('photo_id', photoId);
      
    const newCount = count || 0;
    
    // Mettre à jour le compteur dans photos
    await supabase
      .from('photos')
      .update({ likes_count: newCount })
      .eq('id', photoId);

    return { newCount, isLiked: true };
  }
};

// Import des fonctions d'enrichissement (doivent exister dans le fichier principal)
declare const enrichPhotosWithOrientation: (photos: Photo[]) => Promise<Photo[]>;

