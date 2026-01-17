/**
 * Rate limiter et retry avec backoff exponentiel pour les appels Gemini API
 * Évite les erreurs 429 (Too Many Requests)
 */

import { logger } from './logger';

interface QueuedCall {
  fn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  retries: number;
}

class GeminiRateLimiter {
  private queue: QueuedCall[] = [];
  private processing = false;
  private lastCallTime = 0;
  
  // Limite : 1 appel toutes les 100ms (10 appels/seconde max)
  private readonly MIN_INTERVAL_MS = 100;
  
  // Limite : 60 appels par minute (pour éviter les quotas)
  private readonly MAX_CALLS_PER_MINUTE = 60;
  private callsInLastMinute: number[] = [];
  
  // Retry config
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_BACKOFF_MS = 1000; // 1 seconde
  private readonly MAX_BACKOFF_MS = 10000; // 10 secondes max

  /**
   * Nettoie les appels anciens de plus d'une minute
   */
  private cleanOldCalls(): void {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    this.callsInLastMinute = this.callsInLastMinute.filter(time => time > oneMinuteAgo);
  }

  /**
   * Vérifie si on peut faire un appel maintenant
   */
  private canMakeCall(): boolean {
    this.cleanOldCalls();
    
    // Vérifier la limite par minute
    if (this.callsInLastMinute.length >= this.MAX_CALLS_PER_MINUTE) {
      return false;
    }
    
    // Vérifier l'intervalle minimum entre appels
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    return timeSinceLastCall >= this.MIN_INTERVAL_MS;
  }

  /**
   * Calcule le délai avant le prochain appel
   */
  private getDelayUntilNextCall(): number {
    this.cleanOldCalls();
    
    // Si on a atteint la limite par minute, attendre jusqu'à ce qu'un appel expire
    if (this.callsInLastMinute.length >= this.MAX_CALLS_PER_MINUTE) {
      const oldestCall = Math.min(...this.callsInLastMinute);
      const delay = 60000 - (Date.now() - oldestCall);
      return Math.max(delay, 100); // Au moins 100ms
    }
    
    // Sinon, respecter l'intervalle minimum
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    return Math.max(0, this.MIN_INTERVAL_MS - timeSinceLastCall);
  }

  /**
   * Calcule le délai de backoff pour un retry
   */
  private getBackoffDelay(retryCount: number): number {
    const exponentialDelay = this.INITIAL_BACKOFF_MS * Math.pow(2, retryCount);
    const jitter = Math.random() * 1000; // Jitter aléatoire pour éviter les collisions
    return Math.min(exponentialDelay + jitter, this.MAX_BACKOFF_MS);
  }

  /**
   * Traite la queue des appels
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      // Attendre si nécessaire pour respecter le rate limiting
      const delay = this.getDelayUntilNextCall();
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const call = this.queue.shift();
      if (!call) continue;

      try {
        // Enregistrer l'appel
        this.lastCallTime = Date.now();
        this.callsInLastMinute.push(this.lastCallTime);

        // Faire l'appel
        const result = await call.fn();
        call.resolve(result);
      } catch (error: any) {
        // Vérifier si c'est une erreur 429 ou autre erreur réseau
        const isRateLimitError = error?.status === 429 || 
                                 error?.code === 429 ||
                                 error?.message?.includes('429') ||
                                 error?.message?.includes('Too Many Requests');
        
        const isRetryableError = isRateLimitError || 
                                 error?.status >= 500 ||
                                 error?.code >= 500 ||
                                 (error?.message && (
                                   error.message.includes('network') ||
                                   error.message.includes('timeout') ||
                                   error.message.includes('ECONNRESET')
                                 ));

        if (isRetryableError && call.retries < this.MAX_RETRIES) {
          // Retry avec backoff exponentiel
          call.retries++;
          const backoffDelay = this.getBackoffDelay(call.retries - 1);
          
          logger.warn(`Gemini API rate limit/error, retrying (${call.retries}/${this.MAX_RETRIES})`, error, {
            component: 'geminiRateLimiter',
            retryCount: call.retries,
            backoffDelay
          });

          // Remettre dans la queue après le backoff
          setTimeout(() => {
            this.queue.unshift(call); // Remettre au début de la queue
            this.processQueue();
          }, backoffDelay);
        } else {
          // Plus de retries ou erreur non retryable
          logger.error('Gemini API call failed after retries', error, {
            component: 'geminiRateLimiter',
            retries: call.retries,
            isRateLimitError
          });
          call.reject(error);
        }
      }
    }

    this.processing = false;
  }

  /**
   * Ajoute un appel à la queue avec rate limiting et retry automatique
   */
  async call<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        fn: fn as () => Promise<any>,
        resolve,
        reject,
        retries: 0
      });

      // Démarrer le traitement de la queue
      this.processQueue();
    });
  }

  /**
   * Réinitialise le rate limiter (utile pour les tests)
   */
  reset(): void {
    this.queue = [];
    this.processing = false;
    this.lastCallTime = 0;
    this.callsInLastMinute = [];
  }
}

// Instance singleton
export const geminiRateLimiter = new GeminiRateLimiter();

