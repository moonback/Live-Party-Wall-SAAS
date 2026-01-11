import { supabase, isSupabaseConfigured } from './supabaseClient';
import { logger } from '../utils/logger';

/**
 * Génère un ID unique pour un viewer
 */
export const generateViewerId = (): string => {
  return `viewer_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Enregistre un viewer comme actif pour un stream
 * @param streamId - ID du stream
 * @param eventId - ID de l'événement
 * @param viewerId - ID unique du viewer
 */
export const registerViewer = async (
  streamId: string,
  eventId: string,
  viewerId: string
): Promise<void> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  try {
    // Utiliser upsert pour éviter les doublons
    const { error } = await supabase
      .from('stream_viewers')
      .upsert(
        {
          stream_id: streamId,
          event_id: eventId,
          viewer_id: viewerId,
          last_seen_at: new Date().toISOString()
        },
        {
          onConflict: 'stream_id,viewer_id',
          ignoreDuplicates: false
        }
      );

    if (error) {
      logger.error("Error registering viewer", error, {
        component: 'streamViewersService',
        action: 'registerViewer',
        streamId,
        viewerId
      });
    }
  } catch (error) {
    logger.error("Unexpected error registering viewer", error, {
      component: 'streamViewersService',
      action: 'registerViewer'
    });
  }
};

/**
 * Met à jour le timestamp last_seen_at d'un viewer
 * @param streamId - ID du stream
 * @param viewerId - ID du viewer
 */
export const updateViewerLastSeen = async (
  streamId: string,
  viewerId: string
): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    const { error } = await supabase
      .from('stream_viewers')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('stream_id', streamId)
      .eq('viewer_id', viewerId);

    if (error) {
      logger.error("Error updating viewer last seen", error, {
        component: 'streamViewersService',
        action: 'updateViewerLastSeen',
        streamId,
        viewerId
      });
    }
  } catch (error) {
    logger.error("Unexpected error updating viewer last seen", error, {
      component: 'streamViewersService',
      action: 'updateViewerLastSeen'
    });
  }
};

/**
 * Retire un viewer d'un stream
 * @param streamId - ID du stream
 * @param viewerId - ID du viewer
 */
export const unregisterViewer = async (
  streamId: string,
  viewerId: string
): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    const { error } = await supabase
      .from('stream_viewers')
      .delete()
      .eq('stream_id', streamId)
      .eq('viewer_id', viewerId);

    if (error) {
      logger.error("Error unregistering viewer", error, {
        component: 'streamViewersService',
        action: 'unregisterViewer',
        streamId,
        viewerId
      });
    }
  } catch (error) {
    logger.error("Unexpected error unregistering viewer", error, {
      component: 'streamViewersService',
      action: 'unregisterViewer'
    });
  }
};

/**
 * Récupère le nombre de viewers actifs pour un stream
 * @param streamId - ID du stream
 * @returns Nombre de viewers actifs (dernière activité dans les 30 secondes)
 */
export const getActiveViewerCount = async (streamId: string): Promise<number> => {
  if (!isSupabaseConfigured()) {
    return 0;
  }

  try {
    const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
    
    const { count, error } = await supabase
      .from('stream_viewers')
      .select('*', { count: 'exact', head: true })
      .eq('stream_id', streamId)
      .gte('last_seen_at', thirtySecondsAgo);

    if (error) {
      logger.error("Error getting active viewer count", error, {
        component: 'streamViewersService',
        action: 'getActiveViewerCount',
        streamId
      });
      return 0;
    }

    return count || 0;
  } catch (error) {
    logger.error("Unexpected error getting active viewer count", error, {
      component: 'streamViewersService',
      action: 'getActiveViewerCount'
    });
    return 0;
  }
};

/**
 * S'abonne aux changements du nombre de viewers pour un stream
 * @param streamId - ID du stream
 * @param onViewerCountChange - Callback appelé lors des changements
 * @returns Fonction pour se désabonner
 */
export const subscribeToViewerCount = (
  streamId: string,
  onViewerCountChange: (count: number) => void
): (() => void) => {
  if (!isSupabaseConfigured()) {
    logger.warn("Supabase not configured, cannot subscribe to viewer count", null, {
      component: 'streamViewersService',
      action: 'subscribeToViewerCount'
    });
    return () => {};
  }

  const channel = supabase
    .channel(`stream_viewers:${streamId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'stream_viewers',
        filter: `stream_id=eq.${streamId}`
      },
      async () => {
        try {
          const count = await getActiveViewerCount(streamId);
          onViewerCountChange(count);
        } catch (error) {
          logger.error("Error in viewer count subscription callback", error, {
            component: 'streamViewersService',
            action: 'subscribeToViewerCount'
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
 * Nettoie les viewers inactifs (dernière activité > 1 minute)
 * @param streamId - ID du stream
 */
export const cleanupInactiveViewers = async (streamId: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    
    const { error } = await supabase
      .from('stream_viewers')
      .delete()
      .eq('stream_id', streamId)
      .lt('last_seen_at', oneMinuteAgo);

    if (error) {
      logger.error("Error cleaning up inactive viewers", error, {
        component: 'streamViewersService',
        action: 'cleanupInactiveViewers',
        streamId
      });
    }
  } catch (error) {
    logger.error("Unexpected error cleaning up inactive viewers", error, {
      component: 'streamViewersService',
      action: 'cleanupInactiveViewers'
    });
  }
};

