/**
 * Fonction debounce pour limiter la fréquence d'appels
 * Utile pour les mises à jour de likes en temps réel
 */

export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Debounce avec accumulation des arguments
 * Utile pour les mises à jour de likes où on veut traiter plusieurs mises à jour en batch
 */
export function debounceAccumulate<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const accumulatedArgs: Parameters<T>[] = [];

  return function executedFunction(...args: Parameters<T>) {
    accumulatedArgs.push(args);

    const later = () => {
      timeout = null;
      // Appeler la fonction avec tous les arguments accumulés
      accumulatedArgs.forEach((accArgs) => {
        func(...accArgs);
      });
      accumulatedArgs.length = 0; // Clear
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

