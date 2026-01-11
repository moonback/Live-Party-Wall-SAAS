import { supabase, isSupabaseConfigured } from './supabaseClient';
import { logger } from '../utils/logger';

export interface StreamRecording {
  id: string;
  stream_id: string;
  event_id: string;
  url: string;
  storage_path: string;
  title: string | null;
  filename: string;
  file_size: number | null;
  duration_seconds: number | null;
  started_at: string;
  ended_at: string;
  created_at: string;
  view_count: number;
}

export interface StreamRecordingRow {
  id: string;
  stream_id: string;
  event_id: string;
  url: string;
  storage_path: string;
  title: string | null;
  filename: string;
  file_size: number | null;
  duration_seconds: number | null;
  started_at: string;
  ended_at: string;
  created_at: string;
  view_count: number;
}

/**
 * Upload un enregistrement de stream vers Supabase Storage
 * @param eventId - ID de l'événement
 * @param streamId - ID du stream
 * @param blob - Blob vidéo de l'enregistrement
 * @param title - Titre de l'enregistrement
 * @param durationSeconds - Durée en secondes
 * @param startedAt - Date de début de l'enregistrement
 * @param endedAt - Date de fin de l'enregistrement
 * @returns Promise résolue avec l'enregistrement créé
 */
export const uploadStreamRecording = async (
  eventId: string,
  streamId: string,
  blob: Blob,
  title?: string,
  durationSeconds?: number,
  startedAt?: string,
  endedAt?: string
): Promise<StreamRecording> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  try {
    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const filename = `stream_recording_${streamId}_${timestamp}.webm`;
    const path = `stream-recordings/${eventId}/${filename}`;

    // Upload vers Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('party-photos')
      .upload(path, blob, {
        contentType: 'video/webm',
        upsert: false
      });

    if (uploadError) {
      logger.error("Error uploading stream recording", uploadError, {
        component: 'streamRecordingService',
        action: 'uploadStreamRecording',
        eventId,
        streamId,
        path
      });
      throw uploadError;
    }

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('party-photos')
      .getPublicUrl(path);

    // Enregistrer dans la base de données
    const { data, error: insertError } = await supabase
      .from('stream_recordings')
      .insert([
        {
          stream_id: streamId,
          event_id: eventId,
          url: publicUrl,
          storage_path: path,
          title: title || null,
          filename,
          file_size: blob.size,
          duration_seconds: durationSeconds || null,
          started_at: startedAt || new Date().toISOString(),
          ended_at: endedAt || new Date().toISOString(),
          view_count: 0
        }
      ])
      .select()
      .single();

    if (insertError) {
      logger.error("Error inserting stream recording", insertError, {
        component: 'streamRecordingService',
        action: 'uploadStreamRecording',
        eventId,
        streamId
      });
      throw insertError;
    }

    return mapRowToStreamRecording(data);
  } catch (error) {
    logger.error("Unexpected error uploading stream recording", error, {
      component: 'streamRecordingService',
      action: 'uploadStreamRecording'
    });
    throw error instanceof Error ? error : new Error("Erreur lors de l'upload de l'enregistrement");
  }
};

/**
 * Récupère tous les enregistrements d'un événement
 * @param eventId - ID de l'événement
 * @returns Promise résolue avec la liste des enregistrements
 */
export const getStreamRecordings = async (eventId: string): Promise<StreamRecording[]> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  try {
    const { data, error } = await supabase
      .from('stream_recordings')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error("Error fetching stream recordings", error, {
        component: 'streamRecordingService',
        action: 'getStreamRecordings',
        eventId
      });
      throw error;
    }

    return (data || []).map(mapRowToStreamRecording);
  } catch (error) {
    logger.error("Unexpected error fetching stream recordings", error, {
      component: 'streamRecordingService',
      action: 'getStreamRecordings'
    });
    throw error instanceof Error ? error : new Error("Erreur lors de la récupération des enregistrements");
  }
};

/**
 * Incrémente le compteur de vues d'un enregistrement
 * @param recordingId - ID de l'enregistrement
 */
export const incrementRecordingViewCount = async (recordingId: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    // Récupérer le compteur actuel
    const { data: recording } = await supabase
      .from('stream_recordings')
      .select('view_count')
      .eq('id', recordingId)
      .single();

    if (recording) {
      const { error } = await supabase
        .from('stream_recordings')
        .update({ view_count: (recording.view_count || 0) + 1 })
        .eq('id', recordingId);

      if (error) {
        logger.error("Error incrementing recording view count", error, {
          component: 'streamRecordingService',
          action: 'incrementRecordingViewCount',
          recordingId
        });
      }
    }
  } catch (error) {
    logger.error("Unexpected error incrementing recording view count", error, {
      component: 'streamRecordingService',
      action: 'incrementRecordingViewCount'
    });
  }
};

/**
 * Convertit une ligne de base de données en objet StreamRecording
 */
const mapRowToStreamRecording = (row: StreamRecordingRow): StreamRecording => {
  return {
    id: row.id,
    stream_id: row.stream_id,
    event_id: row.event_id,
    url: row.url,
    storage_path: row.storage_path,
    title: row.title,
    filename: row.filename,
    file_size: row.file_size,
    duration_seconds: row.duration_seconds ? Number(row.duration_seconds) : null,
    started_at: row.started_at,
    ended_at: row.ended_at,
    created_at: row.created_at,
    view_count: row.view_count
  };
};

