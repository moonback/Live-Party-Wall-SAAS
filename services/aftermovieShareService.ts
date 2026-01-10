import { supabase, isSupabaseConfigured } from './supabaseClient';
import { logger } from '../utils/logger';
import { Aftermovie } from '../types';

export interface AftermovieShareResult {
  publicUrl: string;
  shareUrl: string;
  path: string;
  aftermovie: Aftermovie;
}

/**
 * Upload un aftermovie vers Supabase Storage et génère un lien de partage
 * @param eventId - ID de l'événement
 * @param blob - Blob de la vidéo aftermovie
 * @param filename - Nom du fichier (optionnel, généré automatiquement si non fourni)
 * @param title - Titre de l'aftermovie (optionnel)
 * @param durationSeconds - Durée en secondes (optionnel)
 * @param createdBy - Nom de l'organisateur/admin (optionnel)
 * @returns Promise résolue avec l'URL publique, le lien de partage et l'aftermovie créé
 */
export async function uploadAftermovieToStorage(
  eventId: string,
  blob: Blob,
  filename?: string,
  title?: string,
  durationSeconds?: number,
  createdBy?: string
): Promise<AftermovieShareResult> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré.");
  }

  // Valider la taille (max 500MB pour les vidéos)
  const MAX_AFTERMOVIE_SIZE = 500 * 1024 * 1024; // 500MB
  if (blob.size > MAX_AFTERMOVIE_SIZE) {
    throw new Error('Le fichier est trop volumineux (max 500MB)');
  }

  // Générer le nom de fichier si non fourni
  const sanitizedFilename = filename 
    ? filename.replace(/[^\w.\-]/g, '_')
    : `aftermovie-${Date.now()}-${Math.random().toString(36).slice(2)}.webm`;
  
  // Organiser par événement : party-photos/{eventId}/aftermovies/{filename}
  const path = `${eventId}/aftermovies/${sanitizedFilename}`;

  try {
    // Upload progressif vers Supabase Storage avec feedback
    // Note: Supabase Storage ne supporte pas encore le callback de progression natif
    // On utilise une approche avec chunks pour grandes vidéos (>50MB)
    const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB par chunk
    const useChunkedUpload = blob.size > CHUNK_SIZE;
    
    if (useChunkedUpload) {
      // Pour les grandes vidéos, on pourrait implémenter un upload par chunks
      // Pour l'instant, on fait un upload normal mais on pourrait améliorer plus tard
      logger.info("Large aftermovie detected, using standard upload", {
        component: 'aftermovieShareService',
        action: 'uploadAftermovieToStorage',
        size: blob.size,
        eventId
      });
    }
    
    // Upload vers Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('party-photos')
      .upload(path, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'video/webm'
      });

    if (uploadError) {
      logger.error("Error uploading aftermovie to storage", uploadError, {
        component: 'aftermovieShareService',
        action: 'uploadAftermovieToStorage',
        eventId,
        path
      });
      throw uploadError;
    }

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('party-photos')
      .getPublicUrl(path);

    // Générer un lien de partage (URL publique directe)
    const shareUrl = publicUrl;

    // Enregistrer l'aftermovie dans la base de données
    const { data: aftermovieData, error: insertError } = await supabase
      .from('aftermovies')
      .insert([
        {
          event_id: eventId,
          url: publicUrl,
          storage_path: path,
          title: title || null,
          filename: sanitizedFilename,
          file_size: blob.size,
          duration_seconds: durationSeconds || null,
          created_by: createdBy || null,
          download_count: 0
        }
      ])
      .select()
      .single();

    if (insertError) {
      logger.error("Error inserting aftermovie into database", insertError, {
        component: 'aftermovieShareService',
        action: 'uploadAftermovieToStorage',
        eventId,
        path
      });
      // Ne pas échouer si l'insertion échoue, l'upload a réussi
    }

    const aftermovie: Aftermovie = aftermovieData ? {
      id: aftermovieData.id,
      event_id: aftermovieData.event_id,
      url: aftermovieData.url,
      storage_path: aftermovieData.storage_path,
      title: aftermovieData.title || undefined,
      filename: aftermovieData.filename,
      file_size: aftermovieData.file_size || undefined,
      duration_seconds: aftermovieData.duration_seconds ? Number(aftermovieData.duration_seconds) : undefined,
      created_at: new Date(aftermovieData.created_at).getTime(),
      created_by: aftermovieData.created_by || undefined,
      download_count: aftermovieData.download_count || 0
    } : {
      id: '', // Fallback si l'insertion a échoué
      event_id: eventId,
      url: publicUrl,
      storage_path: path,
      title: title,
      filename: sanitizedFilename,
      file_size: blob.size,
      duration_seconds: durationSeconds,
      created_at: Date.now(),
      created_by: createdBy,
      download_count: 0
    };

    logger.info("Aftermovie uploaded successfully", {
      component: 'aftermovieShareService',
      action: 'uploadAftermovieToStorage',
      eventId,
      path,
      size: blob.size,
      aftermovieId: aftermovie.id
    });

    return {
      publicUrl,
      shareUrl,
      path,
      aftermovie
    };

  } catch (error) {
    logger.error("Error in uploadAftermovieToStorage", error, {
      component: 'aftermovieShareService',
      action: 'uploadAftermovieToStorage',
      eventId
    });
    throw error instanceof Error ? error : new Error("Erreur lors de l'upload de l'aftermovie");
  }
}

/**
 * Supprime un aftermovie du storage Supabase
 * @param eventId - ID de l'événement
 * @param path - Chemin du fichier à supprimer
 */
export async function deleteAftermovieFromStorage(
  eventId: string,
  path: string
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré.");
  }

  try {
    const { error } = await supabase.storage
      .from('party-photos')
      .remove([path]);

    if (error) {
      logger.error("Error deleting aftermovie from storage", error, {
        component: 'aftermovieShareService',
        action: 'deleteAftermovieFromStorage',
        eventId,
        path
      });
      throw error;
    }

    logger.info("Aftermovie deleted successfully", {
      component: 'aftermovieShareService',
      action: 'deleteAftermovieFromStorage',
      eventId,
      path
    });
  } catch (error) {
    logger.error("Error in deleteAftermovieFromStorage", error, {
      component: 'aftermovieShareService',
      action: 'deleteAftermovieFromStorage',
      eventId
    });
    throw error instanceof Error ? error : new Error("Erreur lors de la suppression de l'aftermovie");
  }
}

/**
 * Supprime complètement un aftermovie (fichier + enregistrement DB)
 * @param aftermovieId - ID de l'aftermovie à supprimer
 * @returns Promise résolue une fois la suppression terminée
 */
export async function deleteAftermovie(
  aftermovieId: string
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré.");
  }

  try {
    // 1. Récupérer l'aftermovie pour obtenir le storage_path
    const { data: aftermovieData, error: fetchError } = await supabase
      .from('aftermovies')
      .select('storage_path, event_id')
      .eq('id', aftermovieId)
      .single();

    if (fetchError || !aftermovieData) {
      logger.error("Error fetching aftermovie for deletion", fetchError, {
        component: 'aftermovieShareService',
        action: 'deleteAftermovie',
        aftermovieId
      });
      throw new Error("Aftermovie introuvable");
    }

    const { storage_path, event_id } = aftermovieData;

    // 2. Supprimer le fichier du storage
    try {
      const { error: storageError } = await supabase.storage
        .from('party-photos')
        .remove([storage_path]);

      if (storageError) {
        logger.warn("Error deleting aftermovie from storage (continuing with DB deletion)", storageError, {
          component: 'aftermovieShareService',
          action: 'deleteAftermovie',
          aftermovieId,
          storage_path
        });
        // On continue quand même avec la suppression DB même si le fichier n'existe plus
      }
    } catch (storageErr) {
      logger.warn("Storage deletion failed, continuing with DB deletion", storageErr, {
        component: 'aftermovieShareService',
        action: 'deleteAftermovie',
        aftermovieId
      });
    }

    // 3. Supprimer l'enregistrement de la base de données
    const { error: deleteError } = await supabase
      .from('aftermovies')
      .delete()
      .eq('id', aftermovieId);

    if (deleteError) {
      logger.error("Error deleting aftermovie from database", deleteError, {
        component: 'aftermovieShareService',
        action: 'deleteAftermovie',
        aftermovieId
      });
      throw deleteError;
    }

    logger.info("Aftermovie deleted completely", {
      component: 'aftermovieShareService',
      action: 'deleteAftermovie',
      aftermovieId,
      event_id,
      storage_path
    });

  } catch (error) {
    logger.error("Error in deleteAftermovie", error, {
      component: 'aftermovieShareService',
      action: 'deleteAftermovie',
      aftermovieId
    });
    throw error instanceof Error ? error : new Error("Erreur lors de la suppression de l'aftermovie");
  }
}

/**
 * Récupère tous les aftermovies d'un événement
 * @param eventId - ID de l'événement
 * @returns Promise résolue avec la liste des aftermovies
 */
export async function getAftermovies(eventId: string): Promise<Aftermovie[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('aftermovies')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error("Error fetching aftermovies", error, {
        component: 'aftermovieShareService',
        action: 'getAftermovies',
        eventId
      });
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      event_id: row.event_id,
      url: row.url,
      storage_path: row.storage_path,
      title: row.title || undefined,
      filename: row.filename,
      file_size: row.file_size || undefined,
      duration_seconds: row.duration_seconds ? Number(row.duration_seconds) : undefined,
      created_at: new Date(row.created_at).getTime(),
      created_by: row.created_by || undefined,
      download_count: row.download_count || 0
    }));

  } catch (error) {
    logger.error("Error in getAftermovies", error, {
      component: 'aftermovieShareService',
      action: 'getAftermovies',
      eventId
    });
    return [];
  }
}

/**
 * Incrémente le compteur de téléchargements d'un aftermovie
 * @param aftermovieId - ID de l'aftermovie
 * @returns Promise résolue avec le nouveau nombre de téléchargements
 */
export async function incrementAftermovieDownloadCount(aftermovieId: string): Promise<number> {
  if (!isSupabaseConfigured()) {
    return 0;
  }

  try {
    // Utiliser la fonction SQL pour incrémenter de manière atomique
    const { data, error } = await supabase.rpc('increment_aftermovie_download_count', {
      aftermovie_id: aftermovieId
    });

    if (error) {
      // Fallback : incrémenter manuellement si la fonction RPC n'existe pas
      logger.warn("RPC function not available, using manual increment", {
        component: 'aftermovieShareService',
        action: 'incrementAftermovieDownloadCount',
        aftermovieId,
        error
      });

      const { data: aftermovieData, error: fetchError } = await supabase
        .from('aftermovies')
        .select('download_count')
        .eq('id', aftermovieId)
        .single();

      if (fetchError || !aftermovieData) {
        logger.error("Error fetching aftermovie for download count", fetchError, {
          component: 'aftermovieShareService',
          action: 'incrementAftermovieDownloadCount',
          aftermovieId
        });
        return 0;
      }

      const newCount = (aftermovieData.download_count || 0) + 1;

      const { error: updateError } = await supabase
        .from('aftermovies')
        .update({ download_count: newCount })
        .eq('id', aftermovieId);

      if (updateError) {
        logger.error("Error updating download count", updateError, {
          component: 'aftermovieShareService',
          action: 'incrementAftermovieDownloadCount',
          aftermovieId
        });
        return aftermovieData.download_count || 0;
      }

      return newCount;
    }

    logger.info("Download count incremented", {
      component: 'aftermovieShareService',
      action: 'incrementAftermovieDownloadCount',
      aftermovieId,
      newCount: data
    });

    return data || 0;

  } catch (error) {
    logger.error("Error in incrementAftermovieDownloadCount", error, {
      component: 'aftermovieShareService',
      action: 'incrementAftermovieDownloadCount',
      aftermovieId
    });
    return 0;
  }
}

