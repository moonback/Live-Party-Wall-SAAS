import { createRandomBattle } from './battleService';
import { logger } from '../utils/logger';
import { getSettings, updateSettings } from './settingsService';

/**
 * Service pour gérer les battles automatiques
 * Crée une battle automatique toutes les 30 minutes
 */

let autoBattleInterval: NodeJS.Timeout | null = null;
let isAutoBattleEnabled = false;
let battleDurationMinutes = 30;
let intervalMinutes = 30;
let currentEventId: string | null = null; // ID de l'événement actuel
let nextBattleTimestamp: number | null = null; // Timestamp du prochain déclenchement

/**
 * Charge l'état des battles automatiques depuis la base de données
 * @param eventId - ID de l'événement (requis)
 */
export const loadAutoBattlesFromDB = async (eventId: string): Promise<void> => {
  if (!eventId) {
    logger.error('loadAutoBattlesFromDB: eventId is required');
    return;
  }

  try {
    const settings = await getSettings(eventId);
    if (settings.auto_battles_enabled) {
      // Si activé en BDD mais pas actif localement, démarrer
      if (!isAutoBattleActive()) {
        startAutoBattles(eventId, intervalMinutes, battleDurationMinutes);
      }
    } else {
      // Si désactivé en BDD mais actif localement, arrêter
      if (isAutoBattleActive()) {
        stopAutoBattles();
      }
    }
  } catch (error) {
    logger.error('Error loading auto battles from DB:', error);
  }
};

/**
 * Démarre le système de battles automatiques
 * @param eventId - ID de l'événement (requis)
 * @param intervalMinutes - Intervalle entre chaque battle (en minutes, défaut: 30)
 * @param durationMinutes - Durée de chaque battle (en minutes, défaut: 30)
 */
export const startAutoBattles = (
  eventId: string,
  intervalMinutesParam: number = 30,
  durationMinutes: number = 30
): void => {
  if (!eventId) {
    logger.error('startAutoBattles: eventId is required');
    return;
  }

  if (autoBattleInterval) {
    stopAutoBattles();
  }

  isAutoBattleEnabled = true;
  currentEventId = eventId;
  battleDurationMinutes = durationMinutes;
  intervalMinutes = intervalMinutesParam;

  // Sauvegarder dans la BDD (non-bloquant)
  updateSettings(eventId, { auto_battles_enabled: true }).catch(error => {
    logger.error('Error saving auto battles state to DB:', error);
  });

  // Convertir les minutes en millisecondes
  const intervalMs = intervalMinutesParam * 60 * 1000;

  // Calculer le timestamp du prochain déclenchement
  nextBattleTimestamp = Date.now() + intervalMs;

  // Créer une battle immédiatement au démarrage
  createRandomBattle(eventId, battleDurationMinutes).catch(error => {
    logger.error('Error creating initial auto battle:', error);
  });

  // Puis créer une battle toutes les X minutes
  autoBattleInterval = setInterval(() => {
    if (isAutoBattleEnabled && currentEventId) {
      // Mettre à jour le timestamp du prochain déclenchement
      nextBattleTimestamp = Date.now() + intervalMs;
      
      createRandomBattle(currentEventId, battleDurationMinutes)
        .then(battle => {
          if (battle) {
            logger.info(`Auto battle créée: ${battle.id}`);
          } else {
            logger.warn('Aucune battle automatique créée (pas assez de photos disponibles)');
          }
        })
        .catch(error => {
          logger.error('Error creating auto battle:', error);
        });
    }
  }, intervalMs);

  logger.info(`Auto battles démarrées: intervalle ${intervalMinutesParam} minutes, durée ${durationMinutes} minutes`);
};

/**
 * Arrête le système de battles automatiques
 */
export const stopAutoBattles = (): void => {
  if (autoBattleInterval) {
    clearInterval(autoBattleInterval);
    autoBattleInterval = null;
  }
  isAutoBattleEnabled = false;
  currentEventId = null;
  nextBattleTimestamp = null;
  
  // Sauvegarder dans la BDD
  if (currentEventId) {
    updateSettings(currentEventId, { auto_battles_enabled: false }).catch(error => {
      logger.error('Error saving auto battles state to DB:', error);
    });
  }
  
  logger.info('Auto battles arrêtées');
};

/**
 * Vérifie si les battles automatiques sont actives
 */
export const isAutoBattleActive = (): boolean => {
  return isAutoBattleEnabled && autoBattleInterval !== null;
};

/**
 * Obtient la configuration actuelle des battles automatiques
 */
export const getAutoBattleConfig = (): {
  enabled: boolean;
  intervalMinutes: number;
  durationMinutes: number;
} => {
  return {
    enabled: isAutoBattleEnabled,
    intervalMinutes,
    durationMinutes: battleDurationMinutes,
  };
};

/**
 * Obtient le temps restant en millisecondes avant la prochaine battle automatique
 * @returns Le temps restant en millisecondes, ou null si les battles automatiques ne sont pas actives
 */
export const getTimeUntilNextBattle = (): number | null => {
  if (!isAutoBattleEnabled || nextBattleTimestamp === null) {
    return null;
  }
  
  const timeRemaining = nextBattleTimestamp - Date.now();
  return timeRemaining > 0 ? timeRemaining : 0;
};

