import { useState, useEffect, useRef, RefObject } from 'react';

interface UseSmartLazyImageOptions {
  /**
   * Délai avant de charger l'image (ms)
   * Utile pour différer le chargement des images non prioritaires
   */
  loadDelay?: number;
  /**
   * Marge autour du viewport pour précharger (px)
   * Ex: '200px' = précharger 200px avant que l'image soit visible
   */
  rootMargin?: string;
  /**
   * Priorité de chargement
   * 'high' = charger immédiatement (above the fold)
   * 'low' = différer le chargement
   */
  priority?: 'high' | 'low';
  /**
   * Seuil de visibilité (0-1)
   * 0 = dès qu'un pixel est visible
   * 1 = quand 100% est visible
   */
  threshold?: number;
}

interface UseSmartLazyImageReturn {
  /**
   * Ref à attacher au conteneur de l'image
   */
  containerRef: RefObject<HTMLDivElement>;
  /**
   * Si l'image doit être chargée maintenant
   */
  shouldLoad: boolean;
  /**
   * Si l'image est en cours de chargement
   */
  isLoading: boolean;
  /**
   * Si l'image est visible dans le viewport
   */
  isVisible: boolean;
}

/**
 * ⚡ OPTIMISATION : Hook pour lazy loading intelligent des images
 * 
 * Utilise Intersection Observer pour détecter quand une image entre dans le viewport
 * et gère la priorisation du chargement.
 * 
 * @param options - Options de configuration
 * @returns Objet avec ref, shouldLoad, isLoading, isVisible
 * 
 * @example
 * ```tsx
 * const { containerRef, shouldLoad, isLoading } = useSmartLazyImage({
 *   loadDelay: index < 10 ? 0 : 100,
 *   rootMargin: '200px',
 *   priority: index < 10 ? 'high' : 'low',
 * });
 * 
 * return (
 *   <div ref={containerRef}>
 *     {shouldLoad ? (
 *       <img src={photo.url} loading="lazy" />
 *     ) : (
 *       <SkeletonLoader />
 *     )}
 *   </div>
 * );
 * ```
 */
export const useSmartLazyImage = (
  options: UseSmartLazyImageOptions = {}
): UseSmartLazyImageReturn => {
  const {
    loadDelay = 0,
    rootMargin = '200px',
    priority = 'low',
    threshold = 0.1,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(priority === 'high');
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // ⚡ OPTIMISATION : Si priorité haute, charger immédiatement
    if (priority === 'high') {
      setShouldLoad(true);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // ⚡ OPTIMISATION : Intersection Observer pour détecter la visibilité
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const isIntersecting = entry.isIntersecting;

        setIsVisible(isIntersecting);

        if (isIntersecting && !shouldLoad) {
          // ⚡ OPTIMISATION : Appliquer le délai si configuré
          if (loadDelay > 0) {
            setIsLoading(true);
            timeoutRef.current = setTimeout(() => {
              setShouldLoad(true);
              setIsLoading(false);
            }, loadDelay);
          } else {
            setShouldLoad(true);
          }
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [priority, loadDelay, rootMargin, threshold, shouldLoad]);

  return {
    containerRef,
    shouldLoad,
    isLoading,
    isVisible,
  };
};

