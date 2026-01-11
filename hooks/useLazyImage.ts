/**
 * Hook pour optimiser le chargement des images avec Intersection Observer
 * Améliore les performances en ne chargeant les images que lorsqu'elles sont visibles
 */

import { useState, useEffect, useRef, RefObject } from 'react';

interface UseLazyImageOptions {
  /**
   * Délai avant de charger l'image (en ms)
   * Utile pour éviter de charger trop d'images en même temps
   */
  loadDelay?: number;
  /**
   * Root margin pour l'Intersection Observer
   * Définit à quelle distance de la viewport commencer à charger
   */
  rootMargin?: string;
  /**
   * Seuil de visibilité (0-1)
   */
  threshold?: number;
}

interface UseLazyImageReturn {
  /**
   * Ref à attacher à l'élément conteneur de l'image
   */
  containerRef: RefObject<HTMLElement>;
  /**
   * Indique si l'image doit être chargée
   */
  shouldLoad: boolean;
  /**
   * Indique si l'image est en cours de chargement
   */
  isLoading: boolean;
  /**
   * Indique si l'image est chargée
   */
  isLoaded: boolean;
  /**
   * Fonction pour forcer le chargement de l'image
   */
  forceLoad: () => void;
}

/**
 * Hook pour charger les images de manière optimisée avec Intersection Observer
 */
export const useLazyImage = (options: UseLazyImageOptions = {}): UseLazyImageReturn => {
  const {
    loadDelay = 0,
    rootMargin = '50px', // Commencer à charger 50px avant que l'image soit visible
    threshold = 0.01,
  } = options;

  const [shouldLoad, setShouldLoad] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Si l'image doit déjà être chargée, ne rien faire
    if (shouldLoad) return;

    // Créer l'Intersection Observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // L'image est visible, programmer le chargement
            if (loadDelay > 0) {
              timeoutRef.current = window.setTimeout(() => {
                setShouldLoad(true);
                setIsLoading(true);
              }, loadDelay);
            } else {
              setShouldLoad(true);
              setIsLoading(true);
            }
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    // Observer le conteneur
    observerRef.current.observe(container);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [shouldLoad, loadDelay, rootMargin, threshold]);

  const forceLoad = () => {
    setShouldLoad(true);
    setIsLoading(true);
  };

  return {
    containerRef,
    shouldLoad,
    isLoading,
    isLoaded,
    forceLoad,
  };
};

/**
 * Hook simplifié pour les images avec gestion du chargement
 */
export const useImageLoad = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoaded(false);
    setHasError(true);
  };

  const reset = () => {
    setIsLoaded(false);
    setHasError(false);
  };

  return {
    isLoaded,
    hasError,
    handleLoad,
    handleError,
    reset,
  };
};

