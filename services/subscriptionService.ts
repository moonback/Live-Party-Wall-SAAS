import { supabase, isSupabaseConfigured } from './supabaseClient';
import { 
  Subscription, 
  SubscriptionRow, 
  SubscriptionPlanType, 
  SubscriptionStatus,
  SubscriptionFeatures,
  SubscriptionEvent,
  SubscriptionEventRow
} from '../types';
import { logger } from '../utils/logger';

/**
 * Configuration des plans avec leurs limites et fonctionnalités
 */
const PLAN_CONFIG: Record<SubscriptionPlanType, {
  events_limit: number | null;
  photos_per_event_limit: number | null;
  features: SubscriptionFeatures;
}> = {
  monthly_pro: {
    events_limit: null, // Illimité pour abonnements mensuels
    photos_per_event_limit: null, // Illimité
    features: {
      frames_enabled: true,
      aftermovie_enabled: true,
      branding_enabled: true,
      advanced_stats_enabled: true,
      priority_support_enabled: true,
    },
  },
  monthly_studio: {
    events_limit: null, // Illimité
    photos_per_event_limit: null, // Illimité
    features: {
      frames_enabled: true,
      aftermovie_enabled: true,
      branding_enabled: true,
      advanced_stats_enabled: true,
      white_label_enabled: true,
      api_access_enabled: true,
      multi_screen_enabled: true,
      custom_frames_enabled: true,
      priority_support_enabled: true,
    },
  },
  event_starter: {
    events_limit: 1,
    photos_per_event_limit: 100,
    features: {
      frames_enabled: false,
      aftermovie_enabled: false,
      branding_enabled: false,
      advanced_stats_enabled: false,
    },
  },
  event_pro: {
    events_limit: 1,
    photos_per_event_limit: null, // Illimité
    features: {
      frames_enabled: true,
      aftermovie_enabled: true,
      branding_enabled: true,
      advanced_stats_enabled: true,
      priority_support_enabled: true,
    },
  },
  event_premium: {
    events_limit: 1,
    photos_per_event_limit: null, // Illimité
    features: {
      frames_enabled: true,
      aftermovie_enabled: true,
      branding_enabled: true,
      advanced_stats_enabled: true,
      custom_frames_enabled: true,
      priority_support_enabled: true,
    },
  },
  volume_10: {
    events_limit: 10,
    photos_per_event_limit: null, // Illimité
    features: {
      frames_enabled: true,
      aftermovie_enabled: true,
      branding_enabled: true,
      advanced_stats_enabled: true,
      priority_support_enabled: true,
    },
  },
  volume_50: {
    events_limit: 50,
    photos_per_event_limit: null, // Illimité
    features: {
      frames_enabled: true,
      aftermovie_enabled: true,
      branding_enabled: true,
      advanced_stats_enabled: true,
      custom_frames_enabled: true,
      priority_support_enabled: true,
    },
  },
};

/**
 * Récupère l'abonnement actif d'un utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Promise résolue avec l'abonnement actif ou null
 */
export const getUserActiveSubscription = async (userId: string): Promise<Subscription | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .or(`end_date.is.null,end_date.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error("Error fetching active subscription", error, { 
        component: 'subscriptionService', 
        action: 'getUserActiveSubscription', 
        userId 
      });
      return null;
    }

    return data ? mapSubscriptionRowToSubscription(data as SubscriptionRow) : null;
  } catch (error) {
    logger.error("Error in getUserActiveSubscription", error, { 
      component: 'subscriptionService', 
      action: 'getUserActiveSubscription', 
      userId 
    });
    return null;
  }
};

/**
 * Récupère les limites d'un abonnement
 * @param subscriptionId - ID de l'abonnement
 * @returns Promise résolue avec les limites ou null
 */
export const getSubscriptionLimits = async (subscriptionId: string): Promise<{
  events_limit: number | null;
  photos_per_event_limit: number | null;
  features: SubscriptionFeatures;
} | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('events_limit, photos_per_event_limit, features')
      .eq('id', subscriptionId)
      .single();

    if (error || !data) {
      logger.error("Error fetching subscription limits", error, { 
        component: 'subscriptionService', 
        action: 'getSubscriptionLimits', 
        subscriptionId 
      });
      return null;
    }

    return {
      events_limit: data.events_limit,
      photos_per_event_limit: data.photos_per_event_limit,
      features: data.features as SubscriptionFeatures,
    };
  } catch (error) {
    logger.error("Error in getSubscriptionLimits", error, { 
      component: 'subscriptionService', 
      action: 'getSubscriptionLimits', 
      subscriptionId 
    });
    return null;
  }
};

/**
 * Vérifie si un utilisateur peut créer un événement
 * @param userId - ID de l'utilisateur
 * @returns Promise résolue avec un objet indiquant si l'utilisateur peut créer un événement et pourquoi
 */
export const canCreateEvent = async (userId: string): Promise<{
  can: boolean;
  reason?: string;
  subscriptionId?: string;
}> => {
  if (!isSupabaseConfigured()) {
    return { can: false, reason: "Supabase n'est pas configuré" };
  }

  try {
    const subscription = await getUserActiveSubscription(userId);
    
    if (!subscription) {
      return { 
        can: false, 
        reason: "Aucun abonnement actif. Veuillez souscrire à un abonnement pour créer des événements." 
      };
    }

    // Pour les abonnements mensuels, pas de limite d'événements
    if (subscription.events_limit === null) {
      return { can: true, subscriptionId: subscription.id };
    }

    // Pour les packs volume, vérifier combien d'événements ont été utilisés
    const { data: usedEvents, error } = await supabase
      .from('subscription_events')
      .select('id')
      .eq('subscription_id', subscription.id);

    if (error) {
      logger.error("Error counting used events", error, { 
        component: 'subscriptionService', 
        action: 'canCreateEvent', 
        userId, 
        subscriptionId: subscription.id 
      });
      return { can: false, reason: "Erreur lors de la vérification des limites" };
    }

    const usedCount = usedEvents?.length || 0;
    const remaining = subscription.events_limit - usedCount;

    if (remaining <= 0) {
      return { 
        can: false, 
        reason: `Vous avez utilisé tous les événements de votre pack (${subscription.events_limit} événements). Veuillez souscrire à un nouveau pack.`,
        subscriptionId: subscription.id
      };
    }

    return { 
      can: true, 
      reason: `${remaining} événement(s) restant(s)`,
      subscriptionId: subscription.id 
    };
  } catch (error) {
    logger.error("Error in canCreateEvent", error, { 
      component: 'subscriptionService', 
      action: 'canCreateEvent', 
      userId 
    });
    return { can: false, reason: "Erreur lors de la vérification des limites" };
  }
};

/**
 * Vérifie si on peut uploader une photo pour un événement
 * @param eventId - ID de l'événement
 * @param currentPhotoCount - Nombre actuel de photos pour cet événement
 * @returns Promise résolue avec un objet indiquant si on peut uploader et pourquoi
 */
export const canUploadPhoto = async (
  eventId: string, 
  currentPhotoCount: number
): Promise<{
  can: boolean;
  reason?: string;
  limit?: number;
  remaining?: number;
}> => {
  if (!isSupabaseConfigured()) {
    return { can: false, reason: "Supabase n'est pas configuré" };
  }

  try {
    // Récupérer l'événement pour obtenir son subscription_id
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('subscription_id, owner_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      logger.error("Error fetching event", eventError, { 
        component: 'subscriptionService', 
        action: 'canUploadPhoto', 
        eventId 
      });
      return { can: false, reason: "Événement introuvable" };
    }

    // Si pas d'abonnement lié, vérifier l'abonnement actif de l'owner
    let subscriptionId = event.subscription_id;
    
    if (!subscriptionId) {
      const ownerSubscription = await getUserActiveSubscription(event.owner_id);
      if (!ownerSubscription) {
        return { 
          can: false, 
          reason: "Aucun abonnement actif. Veuillez souscrire à un abonnement pour uploader des photos." 
        };
      }
      subscriptionId = ownerSubscription.id;
    }

    // Récupérer les limites de l'abonnement
    const limits = await getSubscriptionLimits(subscriptionId);
    if (!limits) {
      return { can: false, reason: "Impossible de récupérer les limites de l'abonnement" };
    }

    // Si pas de limite, c'est illimité
    if (limits.photos_per_event_limit === null) {
      return { can: true };
    }

    // Vérifier la limite
    if (currentPhotoCount >= limits.photos_per_event_limit) {
      return { 
        can: false, 
        reason: `Limite de photos atteinte (${limits.photos_per_event_limit} photos maximum). Veuillez upgrader votre abonnement.`,
        limit: limits.photos_per_event_limit,
        remaining: 0
      };
    }

    const remaining = limits.photos_per_event_limit - currentPhotoCount;
    return { 
      can: true, 
      limit: limits.photos_per_event_limit,
      remaining 
    };
  } catch (error) {
    logger.error("Error in canUploadPhoto", error, { 
      component: 'subscriptionService', 
      action: 'canUploadPhoto', 
      eventId, 
      currentPhotoCount 
    });
    return { can: false, reason: "Erreur lors de la vérification des limites" };
  }
};

/**
 * Consomme un événement d'un pack volume
 * @param subscriptionId - ID de l'abonnement
 * @param eventId - ID de l'événement
 * @returns Promise résolue si succès
 */
export const useSubscriptionEvent = async (
  subscriptionId: string, 
  eventId: string
): Promise<void> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  try {
    const { error } = await supabase
      .from('subscription_events')
      .insert([
        {
          subscription_id: subscriptionId,
          event_id: eventId,
        }
      ]);

    if (error) {
      if (error.code === '23505') { // Unique violation
        // L'événement est déjà lié à cet abonnement, c'est OK
        logger.info("Event already linked to subscription", null, { 
          component: 'subscriptionService', 
          action: 'useSubscriptionEvent', 
          subscriptionId, 
          eventId 
        });
        return;
      }
      throw error;
    }
  } catch (error) {
    logger.error("Error in useSubscriptionEvent", error, { 
      component: 'subscriptionService', 
      action: 'useSubscriptionEvent', 
      subscriptionId, 
      eventId 
    });
    throw error instanceof Error ? error : new Error("Erreur lors de la consommation de l'événement");
  }
};

/**
 * Récupère le nombre d'événements restants pour un pack volume
 * @param subscriptionId - ID de l'abonnement
 * @returns Promise résolue avec le nombre d'événements restants
 */
export const getRemainingEvents = async (subscriptionId: string): Promise<number> => {
  if (!isSupabaseConfigured()) return 0;

  try {
    // Récupérer l'abonnement
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('events_limit')
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) {
      logger.error("Error fetching subscription", subError, { 
        component: 'subscriptionService', 
        action: 'getRemainingEvents', 
        subscriptionId 
      });
      return 0;
    }

    // Si pas de limite, retourner -1 pour indiquer illimité
    if (subscription.events_limit === null) {
      return -1; // Illimité
    }

    // Compter les événements utilisés
    const { data: usedEvents, error: countError } = await supabase
      .from('subscription_events')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_id', subscriptionId);

    if (countError) {
      logger.error("Error counting used events", countError, { 
        component: 'subscriptionService', 
        action: 'getRemainingEvents', 
        subscriptionId 
      });
      return 0;
    }

    const usedCount = usedEvents?.length || 0;
    return Math.max(0, subscription.events_limit - usedCount);
  } catch (error) {
    logger.error("Error in getRemainingEvents", error, { 
      component: 'subscriptionService', 
      action: 'getRemainingEvents', 
      subscriptionId 
    });
    return 0;
  }
};

/**
 * Crée un nouvel abonnement (pour pending_activation)
 * @param userId - ID de l'utilisateur
 * @param planType - Type de plan
 * @returns Promise résolue avec l'abonnement créé
 */
export const createSubscription = async (
  userId: string,
  planType: SubscriptionPlanType
): Promise<Subscription> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  const config = PLAN_CONFIG[planType];
  if (!config) {
    throw new Error(`Type de plan invalide: ${planType}`);
  }

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([
        {
          user_id: userId,
          plan_type: planType,
          status: 'pending_activation',
          events_limit: config.events_limit,
          photos_per_event_limit: config.photos_per_event_limit,
          features: config.features,
        }
      ])
      .select()
      .single();

    if (error) {
      logger.error("Error creating subscription", error, { 
        component: 'subscriptionService', 
        action: 'createSubscription', 
        userId, 
        planType 
      });
      throw error;
    }

    return mapSubscriptionRowToSubscription(data as SubscriptionRow);
  } catch (error) {
    logger.error("Error in createSubscription", error, { 
      component: 'subscriptionService', 
      action: 'createSubscription', 
      userId, 
      planType 
    });
    throw error instanceof Error ? error : new Error("Erreur lors de la création de l'abonnement");
  }
};

/**
 * Active un abonnement (changement de status pending_activation → active)
 * @param subscriptionId - ID de l'abonnement
 * @returns Promise résolue avec l'abonnement mis à jour
 */
export const activateSubscription = async (subscriptionId: string): Promise<Subscription | null> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase n'est pas configuré");
  }

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'active',
        start_date: new Date().toISOString(),
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      logger.error("Error activating subscription", error, { 
        component: 'subscriptionService', 
        action: 'activateSubscription', 
        subscriptionId 
      });
      throw error;
    }

    return data ? mapSubscriptionRowToSubscription(data as SubscriptionRow) : null;
  } catch (error) {
    logger.error("Error in activateSubscription", error, { 
      component: 'subscriptionService', 
      action: 'activateSubscription', 
      subscriptionId 
    });
    throw error instanceof Error ? error : new Error("Erreur lors de l'activation de l'abonnement");
  }
};

/**
 * Récupère tous les abonnements d'un utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Promise résolue avec la liste des abonnements
 */
export const getUserSubscriptions = async (userId: string): Promise<Subscription[]> => {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error("Error fetching user subscriptions", error, { 
        component: 'subscriptionService', 
        action: 'getUserSubscriptions', 
        userId 
      });
      return [];
    }

    return (data || []).map((row: SubscriptionRow) => mapSubscriptionRowToSubscription(row));
  } catch (error) {
    logger.error("Error in getUserSubscriptions", error, { 
      component: 'subscriptionService', 
      action: 'getUserSubscriptions', 
      userId 
    });
    return [];
  }
};

/**
 * Fonction helper pour mapper SubscriptionRow vers Subscription
 */
const mapSubscriptionRowToSubscription = (row: SubscriptionRow): Subscription => ({
  id: row.id,
  user_id: row.user_id,
  plan_type: row.plan_type,
  status: row.status,
  start_date: row.start_date,
  end_date: row.end_date,
  events_limit: row.events_limit,
  photos_per_event_limit: row.photos_per_event_limit,
  features: row.features,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

