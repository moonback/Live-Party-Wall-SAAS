import { supabase, isSupabaseConfigured } from './supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Photo, ReactionType, ReactionCounts } from '../types';
import { logger } from '../utils/logger';
import { getPhotoReactions } from './photoService';

interface UnifiedSubscriptionCallbacks {
  onNewPhoto?: (photo: Photo) => void;
  onPhotoDeleted?: (photoId: string) => void;
  onLikesUpdate?: (photoId: string, newLikesCount: number) => void;
  onReactionsUpdate?: (photoId: string, reactions: ReactionCounts) => void;
}

/**
 * ⚡ OPTIMISATION : Subscription unifiée pour un événement
 * Un seul canal WebSocket au lieu de 3-4 connexions séparées
 * 
 * @param eventId - ID de l'événement
 * @param callbacks - Callbacks pour les différents types d'événements
 * @returns Objet avec méthode unsubscribe
 */
export const createUnifiedPhotoSubscription = (
  eventId: string,
  callbacks: UnifiedSubscriptionCallbacks
): { unsubscribe: () => void } => {
  if (!isSupabaseConfigured()) {
    logger.warn('Supabase not configured, returning no-op subscription');
    return { unsubscribe: () => {} };
  }

  const channelId = `photos:unified:${eventId}:${Math.floor(Math.random() * 1000000)}`;
  const channel = supabase.channel(channelId);

  // ⚡ OPTIMISATION : Photos - INSERT (nouvelles photos)
  if (callbacks.onNewPhoto) {
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'photos',
        filter: `event_id=eq.${eventId}`, // ⚡ Filtre côté serveur pour réduire le trafic
      },
      async (payload) => {
        try {
          const p = payload.new as any;
          const newPhoto: Photo = {
            id: p.id,
            url: p.url,
            caption: p.caption || '',
            author: p.author || '',
            timestamp: new Date(p.created_at).getTime(),
            likes_count: 0,
            type: (p.type || 'photo') as 'photo' | 'video',
            duration: p.duration ? Number(p.duration) : undefined,
            tags: Array.isArray(p.tags) ? p.tags : undefined,
            user_description: p.user_description || undefined,
          };
          callbacks.onNewPhoto(newPhoto);
        } catch (error) {
          logger.error('Error processing new photo in unified subscription', error, {
            component: 'unifiedRealtimeService',
            action: 'onNewPhoto',
            eventId,
          });
        }
      }
    );
  }

  // ⚡ OPTIMISATION : Photos - DELETE (suppressions)
  if (callbacks.onPhotoDeleted) {
    channel.on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'photos',
      },
      (payload) => {
        try {
          const deletedId = (payload.old as { id?: string })?.id;
          if (deletedId) {
            callbacks.onPhotoDeleted(deletedId);
          }
        } catch (error) {
          logger.error('Error processing photo deletion in unified subscription', error, {
            component: 'unifiedRealtimeService',
            action: 'onPhotoDeleted',
            eventId,
          });
        }
      }
    );
  }

  // ⚡ OPTIMISATION : Likes - INSERT/DELETE avec debounce et batching
  if (callbacks.onLikesUpdate) {
    const likesCountCache = new Map<string, number>();
    const likesDebounceTimers = new Map<string, NodeJS.Timeout>();
    const pendingLikesUpdates = new Set<string>();

    const updateLikesCount = async (photoId: string) => {
      try {
        const { count, error } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('photo_id', photoId);

        if (error) {
          logger.error('Error fetching likes count', error, {
            component: 'unifiedRealtimeService',
            action: 'updateLikesCount',
            photoId,
          });
          return;
        }

        if (count !== null && count !== likesCountCache.get(photoId)) {
          likesCountCache.set(photoId, count);
          callbacks.onLikesUpdate?.(photoId, count);
        }
        pendingLikesUpdates.delete(photoId);
      } catch (error) {
        logger.error('Error in updateLikesCount', error, {
          component: 'unifiedRealtimeService',
          action: 'updateLikesCount',
          photoId,
        });
      }
    };

    // ⚡ OPTIMISATION : Batch les updates de likes toutes les 300ms
    const processBatchedLikes = () => {
      if (pendingLikesUpdates.size === 0) return;

      const photoIds = Array.from(pendingLikesUpdates);
      pendingLikesUpdates.clear();

      // Traiter par batch de 10 pour éviter de surcharger
      const BATCH_SIZE = 10;
      for (let i = 0; i < photoIds.length; i += BATCH_SIZE) {
        const batch = photoIds.slice(i, i + BATCH_SIZE);
        batch.forEach(photoId => {
          updateLikesCount(photoId);
        });
      }
    };

    let batchLikesTimeout: NodeJS.Timeout | null = null;

    channel.on(
      'postgres_changes',
      {
        event: '*', // INSERT ou DELETE
        schema: 'public',
        table: 'likes',
      },
      (payload) => {
        const photoId = (payload.new as { photo_id?: string })?.photo_id ||
                       (payload.old as { photo_id?: string })?.photo_id;
        
        if (photoId) {
          pendingLikesUpdates.add(photoId);

          // ⚡ OPTIMISATION : Debounce et batch les updates
          if (batchLikesTimeout) {
            clearTimeout(batchLikesTimeout);
          }

          batchLikesTimeout = setTimeout(() => {
            processBatchedLikes();
            batchLikesTimeout = null;
          }, 300); // Batch toutes les 300ms
        }
      }
    );
  }

  // ⚡ OPTIMISATION : Reactions - INSERT/UPDATE/DELETE
  if (callbacks.onReactionsUpdate) {
    const reactionsDebounceTimers = new Map<string, NodeJS.Timeout>();
    const pendingReactionsUpdates = new Set<string>();

    const updateReactions = async (photoId: string) => {
      try {
        const reactions = await getPhotoReactions(photoId);
        callbacks.onReactionsUpdate?.(photoId, reactions);
        pendingReactionsUpdates.delete(photoId);
      } catch (error) {
        logger.error('Error fetching reactions in unified subscription', error, {
          component: 'unifiedRealtimeService',
          action: 'updateReactions',
          photoId,
        });
      }
    };

    // ⚡ OPTIMISATION : Batch les updates de réactions toutes les 200ms
    const processBatchedReactions = () => {
      if (pendingReactionsUpdates.size === 0) return;

      const photoIds = Array.from(pendingReactionsUpdates);
      pendingReactionsUpdates.clear();

      photoIds.forEach(photoId => {
        updateReactions(photoId);
      });
    };

    let batchReactionsTimeout: NodeJS.Timeout | null = null;

    channel.on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'reactions',
      },
      (payload) => {
        const photoId = (payload.new as { photo_id?: string })?.photo_id ||
                       (payload.old as { photo_id?: string })?.photo_id;
        
        if (photoId) {
          pendingReactionsUpdates.add(photoId);

          // ⚡ OPTIMISATION : Debounce et batch les updates
          if (batchReactionsTimeout) {
            clearTimeout(batchReactionsTimeout);
          }

          batchReactionsTimeout = setTimeout(() => {
            processBatchedReactions();
            batchReactionsTimeout = null;
          }, 200); // Batch toutes les 200ms (plus rapide que likes car moins fréquent)
        }
      }
    );
  }

  // Subscribe au canal
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      logger.info(`Unified subscription active for event ${eventId}`, {
        component: 'unifiedRealtimeService',
        action: 'subscribe',
        eventId,
        channelId,
      });
    } else if (status === 'CHANNEL_ERROR') {
      logger.error(`Unified subscription error for event ${eventId}`, {
        component: 'unifiedRealtimeService',
        action: 'subscribe',
        eventId,
        channelId,
        status,
      });
    }
  });

  return {
    unsubscribe: () => {
      channel.unsubscribe();
      logger.info(`Unified subscription closed for event ${eventId}`, {
        component: 'unifiedRealtimeService',
        action: 'unsubscribe',
        eventId,
        channelId,
      });
    },
  };
};

