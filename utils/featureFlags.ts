import { Event, EventSettings } from '../types';

/**
 * Détecte si le mode restaurateur est actif
 * @param event - Événement
 * @param settings - Paramètres de l'événement
 * @returns true si le mode restaurateur est actif
 */
export const isRestaurantMode = (
  event: Event | null,
  settings: EventSettings | null
): boolean => {
  if (!event || !settings) return false;
  
  // Mode restaurateur actif si :
  // 1. L'événement est de type permanent OU
  // 2. restaurant_mode_enabled est activé dans les settings OU
  // 3. restaurant_mode_enabled est activé sur l'événement
  return (
    event.event_type === 'permanent' ||
    settings.restaurant_mode_enabled === true ||
    event.restaurant_mode_enabled === true
  );
};

/**
 * Vérifie si l'événement est permanent
 * @param event - Événement
 * @returns true si l'événement est permanent
 */
export const isPermanentEvent = (event: Event | null): boolean => {
  return event?.event_type === 'permanent';
};

/**
 * Vérifie si l'événement est récurrent
 * @param event - Événement
 * @returns true si l'événement est récurrent
 */
export const isRecurringEvent = (event: Event | null): boolean => {
  return event?.event_type === 'recurring';
};

