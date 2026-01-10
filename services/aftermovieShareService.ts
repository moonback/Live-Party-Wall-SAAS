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
          created_by: createdBy || null
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
      created_by: aftermovieData.created_by || undefined
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
      created_by: createdBy
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
      created_by: row.created_by || undefined
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

