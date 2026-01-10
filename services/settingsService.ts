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
  tags_generation_enabled: boolean;
  alert_text: string | null;
  background_desktop_url: string | null;
  background_mobile_url: string | null;
  auto_carousel_enabled: boolean;
  auto_carousel_delay: number; // Délai en secondes avant activation du carrousel
  // Mode restaurateur
  restaurant_mode_enabled?: boolean;
  ambient_display_enabled?: boolean;
  ambient_display_speed?: 'very_slow' | 'slow' | 'normal';
  auto_pause_when_empty?: boolean;
  social_sharing_enabled?: boolean;
  social_watermark_enabled?: boolean;
  review_prompt_enabled?: boolean;
}

export const defaultSettings: EventSettings = {
  event_title: 'Live Party Wall',
  event_subtitle: '2026',
  scroll_speed: 'normal',
  slide_transition: 'fade',
  decorative_frame_enabled: false,
  decorative_frame_url: null,
  caption_generation_enabled: false,
  content_moderation_enabled: true,
  video_capture_enabled: false,
  collage_mode_enabled: false,
  stats_enabled: false,
  event_context: null,
  find_me_enabled: false,
  ar_scene_enabled: false,
  battle_mode_enabled: false,
  auto_battles_enabled: false,
  tags_generation_enabled: false,
  alert_text: null,
  background_desktop_url: null,
  background_mobile_url: null,
  auto_carousel_enabled: true,
  auto_carousel_delay: 20, // 20 secondes par défaut
  // Mode restaurateur - valeurs par défaut
  restaurant_mode_enabled: false,
  ambient_display_enabled: false,
  ambient_display_speed: 'very_slow',
  auto_pause_when_empty: true,
  social_sharing_enabled: false,
  social_watermark_enabled: true,
  review_prompt_enabled: false
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
    
    // Récupérer les settings existants directement depuis la base de données
    // pour préserver les valeurs non modifiées (sans passer par getSettings qui retourne des defaults)
    const { data: existingSettingsRow } = await supabase
      .from('event_settings')
      .select('*')
      .eq('event_id', eventId)
      .limit(1)
      .maybeSingle();
    
    // Forcer la modération à toujours être activée
    // Retirer l'id si présent pour éviter les conflits lors de l'upsert
    const { id, ...settingsWithoutId } = settings;
    
    // Si des settings existent, merger avec les nouveaux, sinon utiliser les defaults
    const baseSettings = existingSettingsRow 
      ? { ...defaultSettings, ...existingSettingsRow }
      : defaultSettings;
    
    // Merger les settings existants avec les nouveaux settings
    // Cela préserve les valeurs existantes pour les champs non modifiés
    const settingsToUpdate: any = {
      ...baseSettings,
      ...settingsWithoutId,
      alert_text: alertText !== undefined ? alertText : (baseSettings.alert_text || null),
      content_moderation_enabled: true, // Toujours activée
      updated_at: new Date().toISOString(),
      event_id: eventId
    };
    
    // Retirer l'id de settingsToUpdate pour éviter les conflits
    delete settingsToUpdate.id;
    
    // Si on a un ID existant, l'inclure pour l'update
    if (existingSettingsRow?.id) {
      settingsToUpdate.id = existingSettingsRow.id;
    }
    
    logger.info('Updating settings', { 
      component: 'settingsService', 
      action: 'updateSettings', 
      eventId,
      alert_text: alertText,
      has_alert: !!alertText,
      existingId: existingSettingsRow?.id
    });
    
    // Utiliser upsert avec onConflict sur event_id (qui est unique)
    const { data, error } = await supabase
      .from('event_settings')
      .upsert(settingsToUpdate, {
        onConflict: 'event_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

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

