import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Plan, Subscription, EventPayment, PlanType } from '../types';
import { logger } from '../utils/logger';

/**
 * Service pour gérer la monétisation, les paiements Stripe et les abonnements.
 */

/**
 * Récupère tous les plans disponibles
 */
export const getPlans = async (): Promise<Plan[]> => {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('price_cents', { ascending: true });

    if (error) throw error;
    return (data || []).map(row => ({
      ...row,
      features: typeof row.features === 'string' ? JSON.parse(row.features) : row.features
    }));
  } catch (error) {
    logger.error("Error fetching plans", error, { component: 'paymentService', action: 'getPlans' });
    return [];
  }
};

/**
 * Récupère l'abonnement actif d'un utilisateur
 */
export const getUserSubscription = async (userId: string): Promise<Subscription | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) throw error;
    return data as Subscription;
  } catch (error) {
    logger.error("Error fetching user subscription", error, { component: 'paymentService', action: 'getUserSubscription', userId });
    return null;
  }
};

/**
 * Initialise une session de paiement Stripe pour un plan
 * Note: Dans une vraie implémentation, cela appellerait une Edge Function Supabase
 * qui communique avec l'API Stripe.
 */
export const createCheckoutSession = async (
  planId: string,
  userId: string,
  eventId?: string
): Promise<{ url: string } | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    logger.info("Creating checkout session", { planId, userId, eventId });
    
    // Simulation d'appel à une Edge Function Supabase
    // const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
    //   body: { planId, userId, eventId, successUrl: window.location.origin + '/success', cancelUrl: window.location.origin + '/cancel' }
    // });
    
    // if (error) throw error;
    // return data;

    // Pour la démo, on simule une redirection
    alert("Redirection vers Stripe Checkout simulée... (Plan ID: " + planId + ")");
    return { url: window.location.href };
  } catch (error) {
    logger.error("Error creating checkout session", error, { component: 'paymentService', action: 'createCheckoutSession', planId });
    throw error;
  }
};

/**
 * Récupère l'historique des paiements d'un événement
 */
export const getEventPayments = async (eventId: string): Promise<EventPayment[]> => {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('event_payments')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as EventPayment[];
  } catch (error) {
    logger.error("Error fetching event payments", error, { component: 'paymentService', action: 'getEventPayments', eventId });
    return [];
  }
};

/**
 * Vérifie si un événement a accès à une fonctionnalité spécifique basée sur son plan
 */
export const hasFeatureAccess = async (
  eventId: string,
  feature: string
): Promise<boolean> => {
  if (!isSupabaseConfigured()) return true; // Fallback permissif si non configuré

  try {
    // Récupérer l'événement et son plan
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('plan_id, owner_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) return false;

    // 1. Vérifier si le proprio a un abonnement global (Studio ou Pro Mensuel)
    const subscription = await getUserSubscription(event.owner_id);
    if (subscription) {
      const { data: plan } = await supabase.from('plans').select('features').eq('id', subscription.plan_id).single();
      const features = plan?.features || [];
      if (features.includes(feature) || features.includes("all")) return true;
    }

    // 2. Vérifier si l'événement lui-même a un plan payé
    if (event.plan_id) {
      const { data: plan } = await supabase.from('plans').select('features').eq('id', event.plan_id).single();
      const features = plan?.features || [];
      if (features.includes(feature)) return true;
    }

    // Plan gratuit (par défaut) n'a que les features de base
    const defaultFeatures = ["Mur de photos en temps réel", "Upload illimité de photos"];
    return defaultFeatures.includes(feature);
  } catch (error) {
    logger.error("Error checking feature access", error, { component: 'paymentService', action: 'hasFeatureAccess', eventId, feature });
    return false;
  }
};

