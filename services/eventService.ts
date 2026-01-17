import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Event, EventRow, EventOrganizer, EventOrganizerRow } from '../types';
import { logger } from '../utils/logger';
import { getActiveLicense } from './licenseService';
import { getMaxEvents, getEventLimitInfo } from '../utils/licenseUtils';
import { memoryCache } from '../utils/cache';

/**
 * Crée un nouvel événement
 * @param slug - Identifiant unique pour l'URL (ex: "mariage-sophie-marc")
 * @param name - Nom de l'événement
 * @param description - Description de l'événement (optionnel)
 * @param ownerId - ID de l'utilisateur propriétaire (optionnel, utilise auth.uid() si non fourni)
 * @returns Promise résolue avec l'événement créé
 */
export const createEvent = async (
  slug: string,
  name: string,
  description: string | null,
  ownerId?: string
): Promise<Event> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré. Impossible de créer l'événement.");
  }

  // Vérifier que l'utilisateur est authentifié
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user) {
    logger.error("User not authenticated", sessionError, { component: 'eventService', action: 'createEvent' });
    throw new Error("Vous devez être connecté pour créer un événement.");
  }

  // Utiliser auth.uid() directement depuis la session Supabase
  // C'est plus fiable que de se fier à ownerId passé en paramètre
  const authenticatedUserId = session.user.id;

  // Vérifier que ownerId correspond bien à l'utilisateur authentifié
  if (ownerId && ownerId !== authenticatedUserId) {
    logger.warn("OwnerId mismatch", undefined, { 
      component: 'eventService', 
      action: 'createEvent',
      providedOwnerId: ownerId,
      authenticatedUserId 
    });
    // Utiliser quand même l'ID authentifié pour éviter les erreurs RLS
  }

  // Valider le slug (alphanumérique, tirets, underscores uniquement)
  const slugRegex = /^[a-z0-9-_]+$/;
  if (!slugRegex.test(slug)) {
    throw new Error("Le slug doit contenir uniquement des lettres minuscules, chiffres, tirets et underscores.");
  }

  // Vérifier la limite d'événements selon la licence
  try {
    const activeLicense = await getActiveLicense(authenticatedUserId);
    const licenseKey = activeLicense?.license_key || null;
    const maxEvents = getMaxEvents(licenseKey);
    const currentEventsCount = await getUserEventsCount(authenticatedUserId);

    if (currentEventsCount >= maxEvents) {
      const limitInfo = getEventLimitInfo(licenseKey);
      if (limitInfo.type === 'PART') {
        throw new Error("Limite d'événements atteinte. Vous avez atteint la limite de 1 événement avec votre licence PART. Passez à Pro pour créer jusqu'à 20 événements.");
      } else if (limitInfo.type === 'DEMO') {
        throw new Error("Limite d'événements atteinte. Vous avez atteint la limite de 1 événement avec votre licence DEMO.");
      } else {
        throw new Error(`Limite d'événements atteinte. Vous avez atteint la limite de ${maxEvents} événements.`);
      }
    }

    // Avertissement pour les licences DEMO : vérifier le nombre total de photos
    const { getMaxPhotos, isDemoLicense } = await import('../utils/licenseUtils');
    if (isDemoLicense(licenseKey)) {
      const maxPhotos = getMaxPhotos(licenseKey);
      if (maxPhotos !== null) {
        // Compter le nombre total de photos dans tous les événements de l'utilisateur
        const { data: userEvents } = await supabase
          .from('events')
          .select('id')
          .eq('owner_id', authenticatedUserId);
        
        if (userEvents && userEvents.length > 0) {
          const eventIds = userEvents.map(e => e.id);
          const { count: totalPhotosCount } = await supabase
            .from('photos')
            .select('id', { count: 'exact', head: true })
            .in('event_id', eventIds);
          
          if (totalPhotosCount !== null && totalPhotosCount >= 40) {
            logger.warn("DEMO license: approaching photo limit", null, {
              component: 'eventService',
              action: 'createEvent',
              userId: authenticatedUserId,
              totalPhotos: totalPhotosCount,
              maxPhotos: maxPhotos,
              message: `Attention : Vous avez ${totalPhotosCount} photos sur ${maxPhotos} autorisées avec la licence DEMO.`
            });
          }
        }
      }
    }
  } catch (error) {
    // Si c'est déjà une erreur de limite, la propager
    if (error instanceof Error && error.message.includes("Limite d'événements atteinte")) {
      throw error;
    }
    // Sinon, logger l'erreur mais continuer (ne pas bloquer la création si la vérification échoue)
    logger.error("Error checking event limit", error, { 
      component: 'eventService', 
      action: 'createEvent',
      userId: authenticatedUserId 
    });
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .insert([
        {
          slug: slug.toLowerCase(),
          name,
          description,
          owner_id: authenticatedUserId, // Toujours utiliser l'ID authentifié
          is_active: true
        }
      ])
      .select()
      .single();

    if (error) {
      logger.error("Supabase error in createEvent", error, { 
        component: 'eventService', 
        action: 'createEvent',
        errorCode: error.code,
        errorMessage: error.message,
        authenticatedUserId 
      });
      
      if (error.code === '23505') { // Unique violation
        throw new Error("Un événement avec ce slug existe déjà.");
      }
      
      if (error.code === '42501') { // Insufficient privilege
        throw new Error("Permissions insuffisantes. Vérifiez que vous êtes bien connecté et que les politiques RLS sont correctement configurées.");
      }
      
      if (error.code === 'PGRST301') { // RLS policy violation
        throw new Error("Erreur de permissions. Vérifiez que les politiques RLS permettent la création d'événements pour les utilisateurs authentifiés.");
      }
      
      throw new Error(`Erreur lors de la création de l'événement: ${error.message}`);
    }

    // Créer automatiquement l'entrée dans event_organizers pour le owner
    try {
      await supabase
        .from('event_organizers')
        .insert([
          {
            event_id: data.id,
            user_id: authenticatedUserId, // Utiliser l'ID authentifié
            role: 'owner'
          }
        ]);
    } catch (err) {
      logger.error("Error creating event organizer entry", err, { 
        component: 'eventService', 
        action: 'createEvent', 
        eventId: data.id,
        authenticatedUserId 
      });
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
 * Permet de charger les événements suspendus pour afficher un message approprié
 * @param slug - Slug de l'événement
 * @returns Promise résolue avec l'événement ou null si non trouvé
 */
export const getEventBySlug = async (slug: string): Promise<Event | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    // Essayer d'abord de charger l'événement actif (pour les invités)
    // Sélection ciblée
    const { data: activeData, error: activeError } = await supabase
      .from('events')
      .select('id, slug, name, description, owner_id, created_at, updated_at, is_active')
      .eq('slug', slug.toLowerCase())
      .eq('is_active', true)
      .single();

    if (activeData && !activeError) {
      return mapEventRowToEvent(activeData as EventRow);
    }

    // Si l'événement actif n'est pas trouvé, essayer de charger sans filtre is_active
    // Cela permet aux organisateurs de voir leurs événements suspendus (via RLS)
    // Sélection ciblée
    const { data, error } = await supabase
      .from('events')
      .select('id, slug, name, description, owner_id, created_at, updated_at, is_active')
      .eq('slug', slug.toLowerCase())
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

  // Vérifier le cache
  const cacheKey = `event:${id}`;
  // Pour les événements, on utilise l'id comme eventId pour le cache
  const cached = memoryCache.get<Event>(cacheKey, id);
  if (cached) {
    return cached;
  }

  try {
    // Sélection ciblée
    const { data, error } = await supabase
      .from('events')
      .select('id, slug, name, description, owner_id, created_at, updated_at, is_active')
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
    // Récupérer les événements où l'utilisateur est owner (sélection ciblée)
    const { data: ownedEvents, error: ownedError } = await supabase
      .from('events')
      .select('id, slug, name, description, owner_id, created_at, updated_at, is_active')
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
      // Sélection ciblée
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, slug, name, description, owner_id, created_at, updated_at, is_active')
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
 * Compte le nombre d'événements créés par un utilisateur (en tant que owner)
 * @param userId - ID de l'utilisateur (optionnel, utilise auth.uid() si non fourni)
 * @returns Promise résolue avec le nombre d'événements
 */
export const getUserEventsCount = async (userId?: string): Promise<number> => {
  if (!isSupabaseConfigured()) return 0;

  try {
    let finalUserId = userId;
    if (!finalUserId) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        logger.error("User not authenticated", sessionError, { component: 'eventService', action: 'getUserEventsCount' });
        return 0;
      }
      finalUserId = session.user.id;
    }

    const { count, error } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', finalUserId);

    if (error) {
      logger.error("Error counting user events", error, { 
        component: 'eventService', 
        action: 'getUserEventsCount',
        userId: finalUserId 
      });
      return 0;
    }

    return count || 0;
  } catch (error) {
    logger.error("Error in getUserEventsCount", error, { component: 'eventService', action: 'getUserEventsCount', userId });
    return 0;
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

  // Vérifier que l'utilisateur est authentifié
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user) {
    logger.error("User not authenticated", sessionError, { component: 'eventService', action: 'updateEvent', eventId });
    throw new Error("Vous devez être connecté pour modifier un événement.");
  }

  const authenticatedUserId = session.user.id;

  // Vérifier que l'utilisateur a les permissions pour modifier l'événement
  const hasPermission = await canEditEvent(eventId, authenticatedUserId);
  if (!hasPermission) {
    logger.error("User does not have permission to update event", null, { 
      component: 'eventService', 
      action: 'updateEvent', 
      eventId, 
      authenticatedUserId 
    });
    throw new Error("Vous n'avez pas les permissions pour modifier cet événement.");
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
      
      if (error.code === '42501') { // Insufficient privilege
        throw new Error("Permissions insuffisantes. Vérifiez que vous êtes bien connecté et que les politiques RLS sont correctement configurées.");
      }
      
      if (error.code === 'PGRST301') { // RLS policy violation
        throw new Error("Erreur de permissions. Vérifiez que les politiques RLS permettent la modification d'événements pour les organisateurs.");
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
    // Sélection ciblée
    const { data, error } = await supabase
      .from('event_organizers')
      .select('id, event_id, user_id, role, created_at')
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

