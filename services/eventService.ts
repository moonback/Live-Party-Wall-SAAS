import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Event, EventRow, EventOrganizer, EventOrganizerRow } from '../types';
import { logger } from '../utils/logger';

/**
 * Crée un nouvel événement
 * @param slug - Identifiant unique pour l'URL (ex: "mariage-sophie-marc")
 * @param name - Nom de l'événement
 * @param description - Description de l'événement (optionnel)
 * @param ownerId - ID de l'utilisateur propriétaire
 * @returns Promise résolue avec l'événement créé
 */
export const createEvent = async (
  slug: string,
  name: string,
  description: string | null,
  ownerId: string
): Promise<Event> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré. Impossible de créer l'événement.");
  }

  // Valider le slug (alphanumérique, tirets, underscores uniquement)
  const slugRegex = /^[a-z0-9-_]+$/;
  if (!slugRegex.test(slug)) {
    throw new Error("Le slug doit contenir uniquement des lettres minuscules, chiffres, tirets et underscores.");
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .insert([
        {
          slug: slug.toLowerCase(),
          name,
          description,
          owner_id: ownerId,
          is_active: true
        }
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error("Un événement avec ce slug existe déjà.");
      }
      throw error;
    }

    // Créer automatiquement l'entrée dans event_organizers pour le owner
    try {
      await supabase
        .from('event_organizers')
        .insert([
          {
            event_id: data.id,
            user_id: ownerId,
            role: 'owner'
          }
        ]);
    } catch (err) {
      logger.error("Error creating event organizer entry", err, { component: 'eventService', action: 'createEvent', eventId: data.id });
      // Ne pas faire échouer la création de l'événement si l'organizer échoue
    }

    return mapEventRowToEvent(data as EventRow);
  } catch (error) {
    logger.error("Error in createEvent", error, { component: 'eventService', action: 'createEvent', slug, name });
    throw error instanceof Error ? error : new Error("Erreur lors de la création de l'événement");
  }
};

/**
 * Récupère un événement par son slug
 * @param slug - Slug de l'événement
 * @returns Promise résolue avec l'événement ou null si non trouvé
 */
export const getEventBySlug = async (slug: string): Promise<Event | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('slug', slug.toLowerCase())
      .eq('is_active', true)
      .single();

    if (error || !data) return null;

    return mapEventRowToEvent(data as EventRow);
  } catch (error) {
    logger.error("Error in getEventBySlug", error, { component: 'eventService', action: 'getEventBySlug', slug });
    return null;
  }
};

/**
 * Récupère un événement par son ID
 * @param id - ID de l'événement
 * @returns Promise résolue avec l'événement ou null si non trouvé
 */
export const getEventById = async (id: string): Promise<Event | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return mapEventRowToEvent(data as EventRow);
  } catch (error) {
    logger.error("Error in getEventById", error, { component: 'eventService', action: 'getEventById', id });
    return null;
  }
};

/**
 * Récupère tous les événements d'un utilisateur (en tant que owner ou organizer)
 * @param userId - ID de l'utilisateur
 * @returns Promise résolue avec la liste des événements
 */
export const getUserEvents = async (userId: string): Promise<Event[]> => {
  if (!isSupabaseConfigured()) return [];

  try {
    // Récupérer les événements où l'utilisateur est owner
    const { data: ownedEvents, error: ownedError } = await supabase
      .from('events')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (ownedError) {
      logger.error("Error fetching owned events", ownedError, { component: 'eventService', action: 'getUserEvents', userId });
    }

    // Récupérer les IDs des événements où l'utilisateur est organizer
    const { data: organizerRows, error: organizedError } = await supabase
      .from('event_organizers')
      .select('event_id')
      .eq('user_id', userId);

    if (organizedError) {
      logger.error("Error fetching organized events", organizedError, { component: 'eventService', action: 'getUserEvents', userId });
    }

    // Récupérer les événements correspondants
    let organizedEventsData: EventRow[] = [];
    if (organizerRows && organizerRows.length > 0) {
      const eventIds = organizerRows.map(row => row.event_id);
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .in('id', eventIds);

      if (eventsError) {
        logger.error("Error fetching organized events data", eventsError, { component: 'eventService', action: 'getUserEvents', userId });
      } else if (eventsData) {
        organizedEventsData = eventsData as EventRow[];
      }
    }

    // Combiner et dédupliquer les événements
    const eventsMap = new Map<string, Event>();

    if (ownedEvents) {
      ownedEvents.forEach((row: EventRow) => {
        eventsMap.set(row.id, mapEventRowToEvent(row));
      });
    }

    organizedEventsData.forEach((row: EventRow) => {
      if (!eventsMap.has(row.id)) {
        eventsMap.set(row.id, mapEventRowToEvent(row));
      }
    });

    return Array.from(eventsMap.values()).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (error) {
    logger.error("Error in getUserEvents", error, { component: 'eventService', action: 'getUserEvents', userId });
    return [];
  }
};

/**
 * Met à jour un événement
 * @param eventId - ID de l'événement
 * @param updates - Objet avec les champs à mettre à jour
 * @returns Promise résolue avec l'événement mis à jour
 */
export const updateEvent = async (
  eventId: string,
  updates: Partial<Pick<Event, 'name' | 'description' | 'slug' | 'is_active'>>
): Promise<Event | null> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré. Impossible de mettre à jour l'événement.");
  }

  // Valider le slug si fourni
  if (updates.slug) {
    const slugRegex = /^[a-z0-9-_]+$/;
    if (!slugRegex.test(updates.slug)) {
      throw new Error("Le slug doit contenir uniquement des lettres minuscules, chiffres, tirets et underscores.");
    }
    updates.slug = updates.slug.toLowerCase();
  }

  try {
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error("Un événement avec ce slug existe déjà.");
      }
      throw error;
    }

    return data ? mapEventRowToEvent(data as EventRow) : null;
  } catch (error) {
    logger.error("Error in updateEvent", error, { component: 'eventService', action: 'updateEvent', eventId, updates });
    throw error instanceof Error ? error : new Error("Erreur lors de la mise à jour de l'événement");
  }
};

/**
 * Supprime un événement (cascade sur toutes les données liées)
 * @param eventId - ID de l'événement
 * @returns Promise résolue si la suppression réussit
 */
export const deleteEvent = async (eventId: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré. Impossible de supprimer l'événement.");
  }

  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;
  } catch (error) {
    logger.error("Error in deleteEvent", error, { component: 'eventService', action: 'deleteEvent', eventId });
    throw error instanceof Error ? error : new Error("Erreur lors de la suppression de l'événement");
  }
};

/**
 * Ajoute un organisateur à un événement
 * @param eventId - ID de l'événement
 * @param userId - ID de l'utilisateur à ajouter
 * @param role - Rôle de l'organisateur ('owner', 'organizer', 'viewer')
 * @returns Promise résolue avec l'organisateur créé
 */
export const addOrganizer = async (
  eventId: string,
  userId: string,
  role: 'owner' | 'organizer' | 'viewer' = 'organizer'
): Promise<EventOrganizer | null> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré. Impossible d'ajouter l'organisateur.");
  }

  try {
    const { data, error } = await supabase
      .from('event_organizers')
      .insert([
        {
          event_id: eventId,
          user_id: userId,
          role
        }
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error("Cet utilisateur est déjà organisateur de cet événement.");
      }
      throw error;
    }

    return data ? mapEventOrganizerRowToEventOrganizer(data as EventOrganizerRow) : null;
  } catch (error) {
    logger.error("Error in addOrganizer", error, { component: 'eventService', action: 'addOrganizer', eventId, userId, role });
    throw error instanceof Error ? error : new Error("Erreur lors de l'ajout de l'organisateur");
  }
};

/**
 * Retire un organisateur d'un événement
 * @param eventId - ID de l'événement
 * @param userId - ID de l'utilisateur à retirer
 * @returns Promise résolue si la suppression réussit
 */
export const removeOrganizer = async (eventId: string, userId: string): Promise<void> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré. Impossible de retirer l'organisateur.");
  }

  try {
    // Ne pas permettre de retirer le owner
    const event = await getEventById(eventId);
    if (event && event.owner_id === userId) {
      throw new Error("Impossible de retirer le propriétaire de l'événement.");
    }

    const { error } = await supabase
      .from('event_organizers')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    logger.error("Error in removeOrganizer", error, { component: 'eventService', action: 'removeOrganizer', eventId, userId });
    throw error instanceof Error ? error : new Error("Erreur lors du retrait de l'organisateur");
  }
};

/**
 * Récupère les organisateurs d'un événement
 * @param eventId - ID de l'événement
 * @returns Promise résolue avec la liste des organisateurs
 */
export const getEventOrganizers = async (eventId: string): Promise<EventOrganizer[]> => {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('event_organizers')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error("Error fetching event organizers", error, { component: 'eventService', action: 'getEventOrganizers', eventId });
      return [];
    }

    return (data || []).map((row: EventOrganizerRow) => mapEventOrganizerRowToEventOrganizer(row));
  } catch (error) {
    logger.error("Error in getEventOrganizers", error, { component: 'eventService', action: 'getEventOrganizers', eventId });
    return [];
  }
};

/**
 * Vérifie si un utilisateur est organisateur d'un événement
 * @param eventId - ID de l'événement
 * @param userId - ID de l'utilisateur
 * @returns Promise résolue avec true si organisateur, false sinon
 */
export const isEventOrganizer = async (eventId: string, userId: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  try {
    const event = await getEventById(eventId);
    if (!event) return false;

    // Vérifier si c'est le owner
    if (event.owner_id === userId) return true;

    // Vérifier dans event_organizers
    const { data, error } = await supabase
      .from('event_organizers')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error("Error checking event organizer", error, { component: 'eventService', action: 'isEventOrganizer', eventId, userId });
      return false;
    }

    return !!data;
  } catch (error) {
    logger.error("Error in isEventOrganizer", error, { component: 'eventService', action: 'isEventOrganizer', eventId, userId });
    return false;
  }
};

/**
 * Vérifie si un utilisateur peut modifier un événement
 * @param eventId - ID de l'événement
 * @param userId - ID de l'utilisateur
 * @returns Promise résolue avec true si peut modifier, false sinon
 */
export const canEditEvent = async (eventId: string, userId: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  try {
    const event = await getEventById(eventId);
    if (!event) return false;

    // Le owner peut toujours modifier
    if (event.owner_id === userId) return true;

    // Vérifier si l'utilisateur est organizer (pas viewer)
    const { data, error } = await supabase
      .from('event_organizers')
      .select('role')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error("Error checking edit permission", error, { component: 'eventService', action: 'canEditEvent', eventId, userId });
      return false;
    }

    return data ? (data.role === 'owner' || data.role === 'organizer') : false;
  } catch (error) {
    logger.error("Error in canEditEvent", error, { component: 'eventService', action: 'canEditEvent', eventId, userId });
    return false;
  }
};

/**
 * Fonction helper pour mapper EventRow vers Event
 */
const mapEventRowToEvent = (row: EventRow): Event => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  description: row.description,
  owner_id: row.owner_id,
  created_at: row.created_at,
  updated_at: row.updated_at,
  is_active: row.is_active
});

/**
 * Fonction helper pour mapper EventOrganizerRow vers EventOrganizer
 */
const mapEventOrganizerRowToEventOrganizer = (row: EventOrganizerRow): EventOrganizer => ({
  id: row.id,
  event_id: row.event_id,
  user_id: row.user_id,
  role: row.role,
  created_at: row.created_at
});

