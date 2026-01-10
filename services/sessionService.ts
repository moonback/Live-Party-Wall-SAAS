import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';
import { EventSession, EventSessionRow, SessionStats } from '../types';
import { getTodayDateString } from '../utils/sessionUtils';

/**
 * Récupère ou crée la session du jour pour un événement
 * @param eventId - ID de l'événement
 * @returns Promise résolue avec la session du jour
 */
export const getOrCreateTodaySession = async (eventId: string): Promise<EventSession> => {
  try {
    const today = getTodayDateString();
    
    // Chercher une session existante pour aujourd'hui
    const { data: existingSession, error: fetchError } = await supabase
      .from('event_sessions')
      .select('*')
      .eq('event_id', eventId)
      .eq('date', today)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      logger.error('Error fetching today session', fetchError, {
        component: 'sessionService',
        action: 'getOrCreateTodaySession',
        eventId,
        today
      });
      throw fetchError;
    }

    // Si la session existe, la retourner
    if (existingSession) {
      return mapSessionRowToSession(existingSession as EventSessionRow);
    }

    // Sinon, créer une nouvelle session
    const { data: newSession, error: createError } = await supabase
      .from('event_sessions')
      .insert({
        event_id: eventId,
        date: today,
        photo_count: 0,
        is_archived: false
      })
      .select()
      .single();

    if (createError) {
      logger.error('Error creating today session', createError, {
        component: 'sessionService',
        action: 'getOrCreateTodaySession',
        eventId,
        today
      });
      throw createError;
    }

    logger.info('Created new session for today', {
      component: 'sessionService',
      action: 'getOrCreateTodaySession',
      eventId,
      sessionId: newSession.id,
      today
    });

    return mapSessionRowToSession(newSession as EventSessionRow);
  } catch (error) {
    logger.error('Unexpected error in getOrCreateTodaySession', error, {
      component: 'sessionService',
      action: 'getOrCreateTodaySession',
      eventId
    });
    throw error;
  }
};

/**
 * Récupère toutes les sessions d'un événement
 * @param eventId - ID de l'événement
 * @param limit - Nombre maximum de sessions à retourner (optionnel)
 * @returns Promise résolue avec la liste des sessions
 */
export const getSessionsByEvent = async (
  eventId: string,
  limit?: number
): Promise<EventSession[]> => {
  try {
    let query = supabase
      .from('event_sessions')
      .select('*')
      .eq('event_id', eventId)
      .order('date', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching sessions', error, {
        component: 'sessionService',
        action: 'getSessionsByEvent',
        eventId
      });
      throw error;
    }

    return (data || []).map(mapSessionRowToSession);
  } catch (error) {
    logger.error('Unexpected error in getSessionsByEvent', error, {
      component: 'sessionService',
      action: 'getSessionsByEvent',
      eventId
    });
    throw error;
  }
};

/**
 * Archive une session (marque comme terminée)
 * @param sessionId - ID de la session
 * @returns Promise résolue quand la session est archivée
 */
export const archiveSession = async (sessionId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('event_sessions')
      .update({ is_archived: true })
      .eq('id', sessionId);

    if (error) {
      logger.error('Error archiving session', error, {
        component: 'sessionService',
        action: 'archiveSession',
        sessionId
      });
      throw error;
    }

    logger.info('Session archived', {
      component: 'sessionService',
      action: 'archiveSession',
      sessionId
    });
  } catch (error) {
    logger.error('Unexpected error in archiveSession', error, {
      component: 'sessionService',
      action: 'archiveSession',
      sessionId
    });
    throw error;
  }
};

/**
 * Récupère les statistiques d'une session
 * @param sessionId - ID de la session
 * @returns Promise résolue avec les statistiques de la session
 */
export const getSessionStats = async (sessionId: string): Promise<SessionStats> => {
  try {
    // Récupérer la session
    const { data: session, error: sessionError } = await supabase
      .from('event_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      logger.error('Error fetching session', sessionError, {
        component: 'sessionService',
        action: 'getSessionStats',
        sessionId
      });
      throw sessionError;
    }

    // Récupérer les photos de la session
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('id, author, likes_count')
      .eq('session_id', sessionId);

    if (photosError) {
      logger.error('Error fetching session photos', photosError, {
        component: 'sessionService',
        action: 'getSessionStats',
        sessionId
      });
      throw photosError;
    }

    // Calculer les statistiques
    const photoCount = photos?.length || 0;
    const totalLikes = photos?.reduce((sum, photo) => sum + (photo.likes_count || 0), 0) || 0;
    const uniqueAuthors = new Set(photos?.map(p => p.author).filter(Boolean)).size;

    return {
      sessionId,
      photoCount,
      totalLikes,
      uniqueAuthors,
      date: (session as EventSessionRow).date
    };
  } catch (error) {
    logger.error('Unexpected error in getSessionStats', error, {
      component: 'sessionService',
      action: 'getSessionStats',
      sessionId
    });
    throw error;
  }
};

/**
 * Crée une nouvelle session pour aujourd'hui (reset soirée)
 * @param eventId - ID de l'événement
 * @returns Promise résolue avec la nouvelle session
 */
export const createNewSession = async (eventId: string): Promise<EventSession> => {
  try {
    const today = getTodayDateString();
    
    // Vérifier si une session existe déjà pour aujourd'hui
    const { data: existingSession } = await supabase
      .from('event_sessions')
      .select('id')
      .eq('event_id', eventId)
      .eq('date', today)
      .maybeSingle();

    if (existingSession) {
      // Si une session existe, la réinitialiser (réarchiver l'ancienne et en créer une nouvelle)
      // Pour simplifier, on archive l'ancienne et on en crée une nouvelle
      await archiveSession(existingSession.id);
    }

    // Créer une nouvelle session
    const { data: newSession, error } = await supabase
      .from('event_sessions')
      .insert({
        event_id: eventId,
        date: today,
        photo_count: 0,
        is_archived: false
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating new session', error, {
        component: 'sessionService',
        action: 'createNewSession',
        eventId,
        today
      });
      throw error;
    }

    logger.info('Created new session', {
      component: 'sessionService',
      action: 'createNewSession',
      eventId,
      sessionId: newSession.id,
      today
    });

    return mapSessionRowToSession(newSession as EventSessionRow);
  } catch (error) {
    logger.error('Unexpected error in createNewSession', error, {
      component: 'sessionService',
      action: 'createNewSession',
      eventId
    });
    throw error;
  }
};

/**
 * Mappe une ligne de base de données vers un objet EventSession
 */
const mapSessionRowToSession = (row: EventSessionRow): EventSession => {
  return {
    id: row.id,
    event_id: row.event_id,
    date: row.date,
    photo_count: row.photo_count,
    is_archived: row.is_archived,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
};

