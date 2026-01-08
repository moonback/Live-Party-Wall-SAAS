import { useEffect, useRef, useState } from 'react';

interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Hook personnalisé pour détecter si un élément est visible dans le viewport
 * Optimisé pour les performances avec Intersection Observer
 */
export const useInView = (options: UseInViewOptions = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    triggerOnce = false,
  } = options;

  const [isInView, setIsInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsInView(isVisible);
        
        if (isVisible && !hasBeenInView) {
          setHasBeenInView(true);
        }

        // Si triggerOnce est true, arrêter d'observer après la première vue
        if (triggerOnce && isVisible && hasBeenInView) {
          observer.unobserve(element);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold, rootMargin, triggerOnce, hasBeenInView]);

  return { ref, isInView, hasBeenInView };
};

