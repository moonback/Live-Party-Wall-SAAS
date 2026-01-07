import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';

export interface EventSettings {
  id?: number;
  event_title: string;
  event_subtitle: string;
  scroll_speed: 'slow' | 'normal' | 'fast';
  slide_transition: 'fade' | 'slide' | 'zoom';
  decorative_frame_enabled: boolean;
  decorative_frame_url: string | null;
  caption_generation_enabled: boolean;
  content_moderation_enabled: boolean;
  video_capture_enabled: boolean;
  collage_mode_enabled: boolean;
  stats_enabled: boolean;
  event_context: string | null;
  find_me_enabled: boolean;
  ar_scene_enabled: boolean;
  battle_mode_enabled: boolean;
  auto_battles_enabled: boolean;
  alert_text: string | null;
}

export const defaultSettings: EventSettings = {
  event_title: 'Party Wall',
  event_subtitle: 'Live',
  scroll_speed: 'normal',
  slide_transition: 'fade',
  decorative_frame_enabled: false,
  decorative_frame_url: null,
  caption_generation_enabled: true,
  content_moderation_enabled: true,
  video_capture_enabled: true,
  collage_mode_enabled: true,
  stats_enabled: true,
  event_context: null,
  find_me_enabled: true,
  ar_scene_enabled: true,
  battle_mode_enabled: true,
  auto_battles_enabled: false,
  alert_text: null
};

/**
 * Récupère les paramètres d'un événement
 * @param eventId - ID de l'événement
 * @returns Promise résolue avec les paramètres de l'événement
 */
export const getSettings = async (eventId: string): Promise<EventSettings> => {
  try {
    const { data, error } = await supabase
      .from('event_settings')
      .select('*')
      .eq('event_id', eventId)
      .limit(1)
      .maybeSingle();

    if (error) {
        logger.error('Error fetching settings', error, { component: 'settingsService', action: 'getSettings', eventId });
        // Fallback to defaults if table doesn't exist or empty
        return defaultSettings;
    }

    // Si pas de settings, retourner les valeurs par défaut
    if (!data) {
      return defaultSettings;
    }

    // Merge pour garantir les nouveaux champs avec des valeurs par défaut
    // Forcer la modération à toujours être activée
    return { ...defaultSettings, ...(data || {}), content_moderation_enabled: true } as EventSettings;
  } catch (error) {
    logger.error('Unexpected error fetching settings', error, { component: 'settingsService', action: 'getSettings', eventId });
    return defaultSettings;
  }
};

/**
 * Met à jour les paramètres d'un événement
 * @param eventId - ID de l'événement
 * @param settings - Paramètres à mettre à jour
 * @returns Promise résolue avec les paramètres mis à jour
 */
export const updateSettings = async (eventId: string, settings: Partial<EventSettings>): Promise<EventSettings | null> => {
  try {
    // Normaliser alert_text (null si vide ou seulement espaces)
    const alertText = settings.alert_text && settings.alert_text.trim() ? settings.alert_text.trim() : null;
    
    // Vérifier si des settings existent déjà pour cet événement
    const { data: existingSettings } = await supabase
      .from('event_settings')
      .select('id')
      .eq('event_id', eventId)
      .limit(1)
      .maybeSingle();
    
    // Forcer la modération à toujours être activée
    const settingsToUpdate = {
      ...settings,
      alert_text: alertText,
      content_moderation_enabled: true, // Toujours activée
      updated_at: new Date().toISOString(),
      event_id: eventId
    };
    
    logger.info('Updating settings', { 
      component: 'settingsService', 
      action: 'updateSettings', 
      eventId,
      alert_text: alertText,
      has_alert: !!alertText
    });
    
    let data;
    let error;
    
    if (existingSettings) {
      // Mise à jour
      const result = await supabase
        .from('event_settings')
        .update(settingsToUpdate)
        .eq('event_id', eventId)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Création
      const result = await supabase
        .from('event_settings')
        .insert([settingsToUpdate])
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      logger.error('Error in updateSettings upsert', error, { component: 'settingsService', action: 'updateSettings' });
      throw error;
    }

    // S'assurer que la valeur retournée a toujours content_moderation_enabled à true
    const result = data ? { ...defaultSettings, ...data, alert_text: alertText, content_moderation_enabled: true } : null;
    
    logger.info('Settings updated successfully', { 
      component: 'settingsService', 
      action: 'updateSettings', 
      alert_text: result?.alert_text,
      has_alert: !!result?.alert_text
    });
    
    return result;
  } catch (error) {
    logger.error('Error updating settings', error, { component: 'settingsService', action: 'updateSettings' });
    throw error;
  }
};

/**
 * S'abonne aux mises à jour des paramètres d'un événement en temps réel
 * @param eventId - ID de l'événement
 * @param onUpdate - Callback appelé lors des mises à jour
 * @returns Channel de subscription
 */
export const subscribeToSettings = (eventId: string, onUpdate: (settings: EventSettings) => void) => {
  const channelId = `public:event_settings:${eventId}:${Math.floor(Math.random() * 1000000)}`;
  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'event_settings' },
      (payload) => {
        if (payload.new) {
          const newSettings = payload.new as EventSettings & { event_id?: string };
          // Filtrer par event_id côté client (RLS devrait déjà le faire, mais on double-vérifie)
          if (newSettings.event_id !== eventId) {
            return;
          }
          logger.info('Settings updated via Realtime', { 
            component: 'settingsService', 
            action: 'subscribeToSettings', 
            eventId,
            alert_text: newSettings.alert_text,
            has_alert: !!newSettings.alert_text && newSettings.alert_text.trim().length > 0
          });
          // Merge avec les valeurs par défaut pour garantir que tous les champs sont présents
          // S'assurer que alert_text est null si vide ou seulement des espaces
          const alertText = newSettings.alert_text && newSettings.alert_text.trim() ? newSettings.alert_text.trim() : null;
          const updatedSettings = { 
            ...defaultSettings, 
            ...newSettings, 
            alert_text: alertText,
            content_moderation_enabled: true 
          };
          onUpdate(updatedSettings);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        logger.info('Subscribed to event_settings Realtime updates', { component: 'settingsService', action: 'subscribeToSettings', eventId });
      } else if (status === 'CHANNEL_ERROR') {
        logger.error('Error subscribing to event_settings Realtime', { component: 'settingsService', action: 'subscribeToSettings', eventId, status });
      }
    });
  
  return channel;
};

