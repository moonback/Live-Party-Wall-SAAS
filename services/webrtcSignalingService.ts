import { supabase, isSupabaseConfigured } from './supabaseClient';
import { logger } from '../utils/logger';

export interface WebRTCSignalingMessage {
  id: string;
  stream_id: string;
  event_id: string;
  sender_type: 'broadcaster' | 'viewer';
  sender_id: string;
  message_type: 'offer' | 'answer' | 'ice-candidate';
  message_data: {
    sdp?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
    [key: string]: any;
  };
  created_at: string;
}

/**
 * Génère un ID unique pour un sender (session ID)
 */
export const generateSenderId = (): string => {
  return `sender_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Envoie un message de signalisation WebRTC
 * @param streamId - ID du stream
 * @param eventId - ID de l'événement
 * @param senderType - Type de sender ('broadcaster' ou 'viewer')
 * @param senderId - ID unique du sender
 * @param messageType - Type de message ('offer', 'answer', 'ice-candidate')
 * @param messageData - Données du message (SDP, ICE candidate, etc.)
 */
export const sendSignalingMessage = async (
  streamId: string,
  eventId: string,
  senderType: 'broadcaster' | 'viewer',
  senderId: string,
  messageType: 'offer' | 'answer' | 'ice-candidate',
  messageData: any
): Promise<void> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  try {
    const { error } = await supabase
      .from('webrtc_signaling')
      .insert([
        {
          stream_id: streamId,
          event_id: eventId,
          sender_type: senderType,
          sender_id: senderId,
          message_type: messageType,
          message_data: messageData
        }
      ]);

    if (error) {
      logger.error("Error sending signaling message", error, {
        component: 'webrtcSignalingService',
        action: 'sendSignalingMessage',
        streamId,
        messageType
      });
      throw error;
    }
  } catch (error) {
    logger.error("Unexpected error sending signaling message", error, {
      component: 'webrtcSignalingService',
      action: 'sendSignalingMessage'
    });
    throw error instanceof Error ? error : new Error("Erreur lors de l'envoi du message de signalisation");
  }
};

/**
 * S'abonne aux messages de signalisation WebRTC pour un stream
 * @param streamId - ID du stream
 * @param senderId - ID du sender (pour filtrer les messages qui ne nous concernent pas)
 * @param senderType - Type de sender ('broadcaster' ou 'viewer')
 * @param onMessage - Callback appelé lors de la réception d'un message
 * @returns Fonction pour se désabonner
 */
export const subscribeToSignalingMessages = (
  streamId: string,
  senderId: string,
  senderType: 'broadcaster' | 'viewer',
  onMessage: (message: WebRTCSignalingMessage) => void
): (() => void) => {
  if (!isSupabaseConfigured()) {
    logger.warn("Supabase not configured, cannot subscribe to signaling messages", null, {
      component: 'webrtcSignalingService',
      action: 'subscribeToSignalingMessages'
    });
    return () => {};
  }

  const channel = supabase
    .channel(`webrtc_signaling:${streamId}:${senderId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'webrtc_signaling',
        filter: `stream_id=eq.${streamId}`
      },
      (payload) => {
        try {
          const message = payload.new as WebRTCSignalingMessage;
          
          // Ignorer les messages de notre propre sender
          if (message.sender_id === senderId) {
            return;
          }

          // Filtrer selon le type de sender
          // Un broadcaster reçoit les messages des viewers (answers, ICE candidates)
          // Un viewer reçoit les messages du broadcaster (offers, ICE candidates)
          if (senderType === 'broadcaster' && message.sender_type === 'viewer') {
            onMessage(message);
          } else if (senderType === 'viewer' && message.sender_type === 'broadcaster') {
            onMessage(message);
          }
        } catch (error) {
          logger.error("Error processing signaling message", error, {
            component: 'webrtcSignalingService',
            action: 'subscribeToSignalingMessages'
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
 * Nettoie les anciens messages de signalisation (appelé périodiquement)
 */
export const cleanupOldSignalingMessages = async (): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    // Supprimer les messages de plus de 1 minute
    const { error } = await supabase
      .from('webrtc_signaling')
      .delete()
      .lt('created_at', new Date(Date.now() - 60000).toISOString());

    if (error) {
      logger.error("Error cleaning up old signaling messages", error, {
        component: 'webrtcSignalingService',
        action: 'cleanupOldSignalingMessages'
      });
    }
  } catch (error) {
    logger.error("Unexpected error cleaning up signaling messages", error, {
      component: 'webrtcSignalingService',
      action: 'cleanupOldSignalingMessages'
    });
  }
};

