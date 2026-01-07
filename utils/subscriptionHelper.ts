/**
 * Utilitaire pour gérer les abonnements Supabase Realtime de manière sécurisée
 * Évite les fuites de mémoire en garantissant le nettoyage des abonnements
 */

/**
 * Type pour un abonnement qui peut être nettoyé
 */
export interface CleanupSubscription {
  unsubscribe: () => void;
}

/**
 * Type pour un interval qui peut être nettoyé
 */
export type CleanupInterval = ReturnType<typeof setInterval>;

/**
 * Type pour un timeout qui peut être nettoyé
 */
export type CleanupTimeout = ReturnType<typeof setTimeout>;

/**
 * Combine plusieurs fonctions de nettoyage en une seule
 * Utile pour nettoyer plusieurs abonnements/intervals dans un useEffect
 * 
 * @param cleanups - Tableau de fonctions de nettoyage
 * @returns Fonction de nettoyage combinée
 * 
 * @example
 * ```typescript
 * useEffect(() => {
 *   const sub1 = subscribeToNewPhotos(handler1);
 *   const sub2 = subscribeToReactionsUpdates(handler2);
 *   const interval = setInterval(doSomething, 1000);
 * 
 *   return combineCleanups([
 *     () => sub1.unsubscribe(),
 *     () => sub2.unsubscribe(),
 *     () => clearInterval(interval)
 *   ]);
 * }, []);
 * ```
 */
export function combineCleanups(
  cleanups: Array<(() => void) | null | undefined>
): () => void {
  return () => {
    cleanups.forEach((cleanup) => {
      if (cleanup) {
        try {
          cleanup();
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
      }
    });
  };
}

/**
 * Nettoie un abonnement de manière sécurisée
 * Vérifie que l'abonnement existe et a une méthode unsubscribe avant de l'appeler
 * 
 * @param subscription - L'abonnement à nettoyer (peut être null/undefined)
 * 
 * @example
 * ```typescript
 * useEffect(() => {
 *   const sub = subscribeToNewPhotos(handler);
 *   return () => cleanupSubscription(sub);
 * }, []);
 * ```
 */
export function cleanupSubscription(
  subscription: CleanupSubscription | null | undefined
): void {
  if (subscription && typeof subscription.unsubscribe === 'function') {
    try {
      subscription.unsubscribe();
    } catch (error) {
      console.error('Error unsubscribing:', error);
    }
  }
}

/**
 * Nettoie un interval de manière sécurisée
 * 
 * @param interval - L'interval à nettoyer (peut être null/undefined)
 * 
 * @example
 * ```typescript
 * useEffect(() => {
 *   const interval = setInterval(doSomething, 1000);
 *   return () => cleanupInterval(interval);
 * }, []);
 * ```
 */
export function cleanupInterval(
  interval: CleanupInterval | null | undefined
): void {
  if (interval) {
    try {
      clearInterval(interval);
    } catch (error) {
      console.error('Error clearing interval:', error);
    }
  }
}

/**
 * Nettoie un timeout de manière sécurisée
 * 
 * @param timeout - Le timeout à nettoyer (peut être null/undefined)
 * 
 * @example
 * ```typescript
 * useEffect(() => {
 *   const timeout = setTimeout(doSomething, 1000);
 *   return () => cleanupTimeout(timeout);
 * }, []);
 * ```
 */
export function cleanupTimeout(
  timeout: CleanupTimeout | null | undefined
): void {
  if (timeout) {
    try {
      clearTimeout(timeout);
    } catch (error) {
      console.error('Error clearing timeout:', error);
    }
  }
}

/**
 * Crée un gestionnaire d'abonnements qui garantit le nettoyage
 * Utile pour gérer plusieurs abonnements dans un composant
 * 
 * @example
 * ```typescript
 * useEffect(() => {
 *   const manager = new SubscriptionManager();
 *   
 *   manager.add(subscribeToNewPhotos(handler1));
 *   manager.add(subscribeToReactionsUpdates(handler2));
 *   manager.addInterval(setInterval(doSomething, 1000));
 *   
 *   return () => manager.cleanup();
 * }, []);
 * ```
 */
export class SubscriptionManager {
  private subscriptions: CleanupSubscription[] = [];
  private intervals: CleanupInterval[] = [];
  private timeouts: CleanupTimeout[] = [];

  /**
   * Ajoute un abonnement à nettoyer
   */
  add(subscription: CleanupSubscription | null | undefined): void {
    if (subscription) {
      this.subscriptions.push(subscription);
    }
  }

  /**
   * Ajoute un interval à nettoyer
   */
  addInterval(interval: CleanupInterval | null | undefined): void {
    if (interval) {
      this.intervals.push(interval);
    }
  }

  /**
   * Ajoute un timeout à nettoyer
   */
  addTimeout(timeout: CleanupTimeout | null | undefined): void {
    if (timeout) {
      this.timeouts.push(timeout);
    }
  }

  /**
   * Nettoie tous les abonnements, intervals et timeouts
   */
  cleanup(): void {
    this.subscriptions.forEach(cleanupSubscription);
    this.intervals.forEach(cleanupInterval);
    this.timeouts.forEach(cleanupTimeout);
    
    this.subscriptions = [];
    this.intervals = [];
    this.timeouts = [];
  }
}

