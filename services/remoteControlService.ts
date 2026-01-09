import { supabase, isSupabaseConfigured } from './supabaseClient';
import { logger } from '../utils/logger';

/**
 * Types de commandes supportées par la télécommande ESP32
 */
export type RemoteCommandType = 
  | 'TOGGLE_AUTO_SCROLL'
  | 'TRIGGER_AR_EFFECT'
  | 'TOGGLE_QR_CODES'
  | 'SHOW_RANDOM_PHOTO'
  | 'CLOSE_RANDOM_PHOTO';

/**
 * Interface pour une commande distante
 */
export interface RemoteCommand {
  id: string;
  event_id: string;
  command_type: RemoteCommandType;
  command_value: string | null;
  processed: boolean;
  created_at: string;
}

/**
 * Interface pour une ligne de commande dans la base de données
 */
interface RemoteCommandRow {
  id: string;
  event_id: string;
  command_type: string;
  command_value: string | null;
  processed: boolean;
  created_at: string;
}

/**
 * S'abonne aux nouvelles commandes distantes pour un événement
 * @param eventId - ID de l'événement
 * @param onCommand - Callback appelé lorsqu'une nouvelle commande est reçue
 * @returns Channel de subscription avec méthode unsubscribe
 */
export const subscribeToRemoteCommands = (
  eventId: string,
  onCommand: (command: RemoteCommand) => void
) => {
  if (!isSupabaseConfigured()) {
    logger.warn('Supabase not configured, remote commands subscription disabled', {
      component: 'remoteControlService',
      action: 'subscribeToRemoteCommands'
    });
    return { unsubscribe: () => {} };
  }

  const channelId = `public:remote_commands:${eventId}:${Math.floor(Math.random() * 1000000)}`;
  
  logger.info('Subscribing to remote commands', {
    component: 'remoteControlService',
    action: 'subscribeToRemoteCommands',
    eventId,
    channelId
  });
  
  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'remote_commands',
        filter: `event_id=eq.${eventId}`
      },
      async (payload) => {
        logger.info('Realtime payload received', {
          component: 'remoteControlService',
          action: 'subscribeToRemoteCommands',
          eventId,
          payload: JSON.stringify(payload)
        });

        const commandRow = payload.new as RemoteCommandRow & { event_id?: string };
        
        if (!commandRow) {
          logger.warn('No command data in payload', {
            component: 'remoteControlService',
            action: 'subscribeToRemoteCommands',
            eventId
          });
          return;
        }

        // Filtrer par event_id côté client (double vérification)
        if (commandRow.event_id !== eventId) {
          logger.warn('Command event_id mismatch', {
            component: 'remoteControlService',
            action: 'subscribeToRemoteCommands',
            expectedEventId: eventId,
            receivedEventId: commandRow.event_id
          });
          return;
        }

        // Ne traiter que les commandes non traitées
        if (commandRow.processed) {
          logger.info('Command already processed, skipping', {
            component: 'remoteControlService',
            action: 'subscribeToRemoteCommands',
            commandId: commandRow.id
          });
          return;
        }

        // Valider le type de commande
        const validCommandTypes: RemoteCommandType[] = [
          'TOGGLE_AUTO_SCROLL',
          'TRIGGER_AR_EFFECT',
          'TOGGLE_QR_CODES',
          'SHOW_RANDOM_PHOTO',
          'CLOSE_RANDOM_PHOTO',
          'START_BATTLE'
        ];

        if (!validCommandTypes.includes(commandRow.command_type as RemoteCommandType)) {
          logger.warn('Invalid command type received', {
            component: 'remoteControlService',
            action: 'subscribeToRemoteCommands',
            eventId,
            commandType: commandRow.command_type
          });
          // Marquer comme traitée même si invalide pour éviter les boucles
          await markCommandAsProcessed(commandRow.id);
          return;
        }

        const command: RemoteCommand = {
          id: commandRow.id,
          event_id: commandRow.event_id,
          command_type: commandRow.command_type as RemoteCommandType,
          command_value: commandRow.command_value,
          processed: commandRow.processed,
          created_at: commandRow.created_at
        };

        logger.info('✅ Remote command received and validated', {
          component: 'remoteControlService',
          action: 'subscribeToRemoteCommands',
          eventId,
          commandType: command.command_type,
          commandId: command.id,
          commandValue: command.command_value
        });

        // Appeler le callback AVANT de marquer comme traitée
        // pour éviter que la commande soit marquée comme traitée
        // avant d'être exécutée
        try {
          onCommand(command);
          logger.info('✅ Remote command callback executed', {
            component: 'remoteControlService',
            action: 'subscribeToRemoteCommands',
            commandId: command.id,
            commandType: command.command_type
          });
        } catch (error) {
          logger.error('❌ Error executing remote command callback', {
            component: 'remoteControlService',
            action: 'subscribeToRemoteCommands',
            commandId: command.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

        // Marquer la commande comme traitée après exécution
        await markCommandAsProcessed(command.id);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        logger.info('✅ Subscribed to remote_commands Realtime updates', {
          component: 'remoteControlService',
          action: 'subscribeToRemoteCommands',
          eventId,
          channelId
        });
      } else if (status === 'CHANNEL_ERROR') {
        logger.error('❌ Error subscribing to remote_commands Realtime', {
          component: 'remoteControlService',
          action: 'subscribeToRemoteCommands',
          eventId,
          status,
          channelId
        });
      } else {
        logger.info('Realtime subscription status changed', {
          component: 'remoteControlService',
          action: 'subscribeToRemoteCommands',
          eventId,
          status,
          channelId
        });
      }
    });

  // Mécanisme de polling de secours (vérifie toutes les 2 secondes)
  // au cas où Realtime ne fonctionnerait pas
  let pollingInterval: NodeJS.Timeout | null = null;
  let lastCheckedCommandId: string | null = null;

  const startPolling = () => {
    pollingInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('remote_commands')
          .select('*')
          .eq('event_id', eventId)
          .eq('processed', false)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          logger.warn('Polling error', {
            component: 'remoteControlService',
            action: 'subscribeToRemoteCommands',
            eventId,
            error: error.message
          });
          return;
        }

        if (data && data.length > 0) {
          const commandRow = data[0] as RemoteCommandRow;
          
          // Éviter de traiter deux fois la même commande
          if (commandRow.id === lastCheckedCommandId) {
            return;
          }
          lastCheckedCommandId = commandRow.id;

          logger.info('📡 Command found via polling (Realtime may not be working)', {
            component: 'remoteControlService',
            action: 'subscribeToRemoteCommands',
            eventId,
            commandId: commandRow.id,
            commandType: commandRow.command_type
          });

          const command: RemoteCommand = {
            id: commandRow.id,
            event_id: commandRow.event_id,
            command_type: commandRow.command_type as RemoteCommandType,
            command_value: commandRow.command_value,
            processed: commandRow.processed,
            created_at: commandRow.created_at
          };

          try {
            onCommand(command);
            await markCommandAsProcessed(command.id);
          } catch (error) {
            logger.error('Error processing command from polling', {
              component: 'remoteControlService',
              action: 'subscribeToRemoteCommands',
              commandId: command.id,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      } catch (error) {
        logger.error('Polling exception', {
          component: 'remoteControlService',
          action: 'subscribeToRemoteCommands',
          eventId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }, 2000); // Vérifie toutes les 2 secondes
  };

  // Démarrer le polling de secours
  startPolling();

  return {
    unsubscribe: () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
      supabase.removeChannel(channel);
      logger.info('Unsubscribed from remote_commands Realtime updates', {
        component: 'remoteControlService',
        action: 'subscribeToRemoteCommands',
        eventId
      });
    }
  };
};

/**
 * Marque une commande comme traitée dans la base de données
 * @param commandId - ID de la commande à marquer comme traitée
 */
const markCommandAsProcessed = async (commandId: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    const { error } = await supabase
      .from('remote_commands')
      .update({ processed: true })
      .eq('id', commandId);

    if (error) {
      logger.error('Error marking command as processed', {
        component: 'remoteControlService',
        action: 'markCommandAsProcessed',
        commandId,
        error: error.message
      });
    }
  } catch (error) {
    logger.error('Exception marking command as processed', {
      component: 'remoteControlService',
      action: 'markCommandAsProcessed',
      commandId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

