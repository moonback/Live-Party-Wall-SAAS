/**
 * Cache en mémoire simple par event_id
 * Utilisé pour réduire les appels Supabase répétitifs
 * Le cache est invalidé uniquement si l'event_id change
 */

type CacheKey = string;
type CacheValue<T> = {
  data: T;
  timestamp: number;
  eventId: string;
};

class MemoryCache {
  private cache = new Map<CacheKey, CacheValue<any>>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes TTL par défaut

  /**
   * Récupère une valeur du cache si elle existe et n'est pas expirée
   */
  get<T>(key: CacheKey, eventId: string): T | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    // Vérifier que l'event_id correspond
    if (cached.eventId !== eventId) {
      this.cache.delete(key);
      return null;
    }

    // Vérifier l'expiration
    const now = Date.now();
    if (now - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Stocke une valeur dans le cache
   */
  set<T>(key: CacheKey, eventId: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      eventId
    });
  }

  /**
   * Invalide le cache pour un event_id spécifique
   */
  invalidate(eventId: string): void {
    const keysToDelete: CacheKey[] = [];
    
    for (const [key, value] of this.cache.entries()) {
      if (value.eventId === eventId) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Invalide une clé spécifique
   */
  invalidateKey(key: CacheKey): void {
    this.cache.delete(key);
  }

  /**
   * Vide tout le cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Nettoie les entrées expirées
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: CacheKey[] = [];

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.TTL) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Instance singleton
export const memoryCache = new MemoryCache();

// Nettoyer le cache toutes les 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    memoryCache.cleanup();
  }, 10 * 60 * 1000);
}

