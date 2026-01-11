import { supabase, isSupabaseConfigured } from './supabaseClient';
import { logger } from '../utils/logger';

export interface LiveStream {
  id: string;
  event_id: string;
  stream_key: string;
  title: string | null;
  is_active: boolean;
  started_at: string;
  ended_at: string | null;
  created_by: string | null;
  viewer_count: number;
  created_at: string;
  updated_at: string;
}

export interface LiveStreamRow {
  id: string;
  event_id: string;
  stream_key: string;
  title: string | null;
  is_active: boolean;
  started_at: string;
  ended_at: string | null;
  created_by: string | null;
  viewer_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Génère une clé unique pour un stream
 */
export const generateStreamKey = (): string => {
  return `stream_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Crée un nouveau stream live
 * @param eventId - ID de l'événement
 * @param title - Titre optionnel du stream
 * @param createdBy - Nom de l'organisateur
 * @returns Promise résolue avec le stream créé
 */
export const createLiveStream = async (
  eventId: string,
  title?: string,
  createdBy?: string
): Promise<LiveStream> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  try {
    const streamKey = generateStreamKey();
    
    const { data, error } = await supabase
      .from('live_streams')
      .insert([
        {
          event_id: eventId,
          stream_key: streamKey,
          title: title || null,
          is_active: true,
          created_by: createdBy || null,
          viewer_count: 0
        }
      ])
      .select()
      .single();

    if (error) {
      logger.error("Error creating live stream", error, {
        component: 'liveStreamService',
        action: 'createLiveStream',
        eventId
      });
      throw error;
    }

    return mapRowToLiveStream(data);
  } catch (error) {
    logger.error("Unexpected error creating live stream", error, {
      component: 'liveStreamService',
      action: 'createLiveStream',
      eventId
    });
    throw error instanceof Error ? error : new Error("Erreur lors de la création du stream");
  }
};

/**
 * Récupère le stream actif pour un événement
 * @param eventId - ID de l'événement
 * @returns Promise résolue avec le stream actif ou null
 */
export const getActiveLiveStream = async (eventId: string): Promise<LiveStream | null> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  try {
    const { data, error } = await supabase
      .from('live_streams')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_active', true)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error("Error fetching active live stream", error, {
        component: 'liveStreamService',
        action: 'getActiveLiveStream',
        eventId
      });
      return null;
    }

    return data ? mapRowToLiveStream(data) : null;
  } catch (error) {
    logger.error("Unexpected error fetching active live stream", error, {
      component: 'liveStreamService',
      action: 'getActiveLiveStream',
      eventId
    });
    return null;
  }
};

/**
 * Arrête un stream live
 * @param streamId - ID du stream
 * @returns Promise résolue avec le stream mis à jour
 */
export const stopLiveStream = async (streamId: string): Promise<LiveStream> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  try {
    const { data, error } = await supabase
      .from('live_streams')
      .update({
        is_active: false,
        ended_at: new Date().toISOString()
      })
      .eq('id', streamId)
      .select()
      .single();

    if (error) {
      logger.error("Error stopping live stream", error, {
        component: 'liveStreamService',
        action: 'stopLiveStream',
        streamId
      });
      throw error;
    }

    return mapRowToLiveStream(data);
  } catch (error) {
    logger.error("Unexpected error stopping live stream", error, {
      component: 'liveStreamService',
      action: 'stopLiveStream',
      streamId
    });
    throw error instanceof Error ? error : new Error("Erreur lors de l'arrêt du stream");
  }
};

/**
 * Met à jour le nombre de viewers d'un stream
 * @param streamId - ID du stream
 * @param viewerCount - Nouveau nombre de viewers
 */
export const updateViewerCount = async (streamId: string, viewerCount: number): Promise<void> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  try {
    const { error } = await supabase
      .from('live_streams')
      .update({ viewer_count: viewerCount })
      .eq('id', streamId);

    if (error) {
      logger.error("Error updating viewer count", error, {
        component: 'liveStreamService',
        action: 'updateViewerCount',
        streamId
      });
    }
  } catch (error) {
    logger.error("Unexpected error updating viewer count", error, {
      component: 'liveStreamService',
      action: 'updateViewerCount',
      streamId
    });
  }
};

/**
 * S'abonne aux changements de streams live pour un événement
 * @param eventId - ID de l'événement
 * @param callback - Callback appelé lors des changements
 * @returns Fonction pour se désabonner
 */
export const subscribeToLiveStreams = (
  eventId: string,
  callback: (stream: LiveStream | null) => void
): (() => void) => {
  if (!isSupabaseConfigured()) {
    logger.warn("Supabase not configured, cannot subscribe to live streams", null, {
      component: 'liveStreamService',
      action: 'subscribeToLiveStreams'
    });
    return () => {};
  }

  const channel = supabase
    .channel(`live_streams:${eventId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'live_streams',
        filter: `event_id=eq.${eventId}`
      },
      async (payload) => {
        try {
          // Récupérer le stream actif après chaque changement
          const activeStream = await getActiveLiveStream(eventId);
          callback(activeStream);
        } catch (error) {
          logger.error("Error in live stream subscription callback", error, {
            component: 'liveStreamService',
            action: 'subscribeToLiveStreams',
            eventId
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Convertit une ligne de base de données en objet LiveStream
 */
const mapRowToLiveStream = (row: LiveStreamRow): LiveStream => {
  return {
    id: row.id,
    event_id: row.event_id,
    stream_key: row.stream_key,
    title: row.title,
    is_active: row.is_active,
    started_at: row.started_at,
    ended_at: row.ended_at,
    created_by: row.created_by,
    viewer_count: row.viewer_count,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
};

