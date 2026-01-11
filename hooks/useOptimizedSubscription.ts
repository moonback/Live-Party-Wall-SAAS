/**
 * Hook pour gérer les subscriptions Realtime de manière optimisée
 * Évite les subscriptions multiples et nettoie automatiquement
 */

import { useEffect, useRef, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

interface SubscriptionConfig {
  /**
   * Fonction pour créer la subscription
   */
  subscribe: () => RealtimeChannel;
  /**
   * Nom de la subscription (pour le logging)
   */
  name: string;
  /**
   * Dépendances pour recréer la subscription
   */
  dependencies?: unknown[];
  /**
   * Délai de debounce pour les mises à jour (en ms)
   */
  debounceMs?: number;
}

/**
 * Hook pour gérer une subscription Realtime optimisée
 * Gère automatiquement le cleanup et évite les subscriptions multiples
 */
export const useOptimizedSubscription = (config: SubscriptionConfig) => {
  const { subscribe, name, dependencies = [], debounceMs = 0 } = config;
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const debounceTimeoutRef = useRef<number | null>(null);
  const pendingUpdatesRef = useRef<unknown[]>([]);

  useEffect(() => {
    // Nettoyer la subscription précédente si elle existe
    if (subscriptionRef.current) {
      logger.info(`[Subscription] Cleaning up previous subscription: ${name}`);
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    // Créer la nouvelle subscription
    try {
      logger.info(`[Subscription] Creating subscription: ${name}`);
      subscriptionRef.current = subscribe();

      // Logger le statut de la subscription
      subscriptionRef.current.subscribe((status) => {
        logger.info(`[Subscription] ${name} status:`, status);
      });
    } catch (error) {
      logger.error(`[Subscription] Error creating subscription ${name}:`, error);
    }

    // Cleanup
    return () => {
      if (subscriptionRef.current) {
        logger.info(`[Subscription] Cleaning up subscription: ${name}`);
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      if (debounceTimeoutRef.current !== null) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
      pendingUpdatesRef.current = [];
    };
  }, dependencies);

  /**
   * Fonction pour appliquer des mises à jour avec debounce
   */
  const applyUpdate = useCallback(
    (update: unknown, callback: (updates: unknown[]) => void) => {
      pendingUpdatesRef.current.push(update);

      if (debounceMs > 0) {
        // Debounce : attendre avant d'appliquer les mises à jour
        if (debounceTimeoutRef.current !== null) {
          clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = window.setTimeout(() => {
          const updates = [...pendingUpdatesRef.current];
          pendingUpdatesRef.current = [];
          callback(updates);
          debounceTimeoutRef.current = null;
        }, debounceMs);
      } else {
        // Pas de debounce : appliquer immédiatement
        const updates = [...pendingUpdatesRef.current];
        pendingUpdatesRef.current = [];
        callback(updates);
      }
    },
    [debounceMs]
  );

  return {
    subscription: subscriptionRef.current,
    applyUpdate,
  };
};

/**
 * Hook pour gérer plusieurs subscriptions avec cleanup automatique
 */
export const useMultipleSubscriptions = (
  subscriptions: Array<{
    subscribe: () => RealtimeChannel;
    name: string;
    dependencies?: unknown[];
  }>
) => {
  const subscriptionsRef = useRef<Array<{ channel: RealtimeChannel; name: string }>>([]);

  useEffect(() => {
    // Nettoyer toutes les subscriptions précédentes
    subscriptionsRef.current.forEach(({ channel, name }) => {
      logger.info(`[Subscriptions] Cleaning up: ${name}`);
      channel.unsubscribe();
    });
    subscriptionsRef.current = [];

    // Créer toutes les nouvelles subscriptions
    subscriptions.forEach(({ subscribe, name, dependencies = [] }) => {
      try {
        logger.info(`[Subscriptions] Creating: ${name}`);
        const channel = subscribe();
        subscriptionsRef.current.push({ channel, name });
      } catch (error) {
        logger.error(`[Subscriptions] Error creating ${name}:`, error);
      }
    });

    // Cleanup
    return () => {
      subscriptionsRef.current.forEach(({ channel, name }) => {
        logger.info(`[Subscriptions] Cleaning up: ${name}`);
        channel.unsubscribe();
      });
      subscriptionsRef.current = [];
    };
  }, subscriptions.map((s) => s.dependencies || []).flat());
};

