import { useState, useEffect, useRef, useCallback } from 'react';
import { Photo } from '../../types';

interface UsePhotoCarouselProps {
  photos: Photo[];
  newPhotoIndicator: Photo | null;
  displayDuration?: number; // Durée d'affichage de chaque photo (ms)
  idleTimeout?: number; // Timeout avant de reprendre le cycle si pas de nouvelle photo (ms)
}

/**
 * Hook pour gérer le carrousel automatique des photos
 * - Chaque photo s'ouvre et se referme automatiquement
 * - Durée d'affichage : 4 secondes par défaut
 * - Si nouvelle photo : réinitialise le cycle
 * - Si pas de nouvelle photo pendant 1 minute : reprend le cycle automatique
 */
export const usePhotoCarousel = ({
  photos,
  newPhotoIndicator,
  displayDuration = 4000, // 4 secondes
  idleTimeout = 60000 // 1 minute
}: UsePhotoCarouselProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  // null = toutes les photos visibles, Set = seulement les photos dans le Set sont visibles
  const [visiblePhotoIds, setVisiblePhotoIds] = useState<Set<string> | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPhotoTimeRef = useRef<number>(Date.now());
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startCarouselRef = useRef<((startIndex: number) => void) | null>(null);

  // Démarrer le carrousel automatique
  const startCarousel = useCallback((startIndex: number = 0) => {
    // Nettoyer les timers existants
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (photos.length === 0) return;

    let currentIndex = startIndex;

    const cycle = () => {
      // Fermer la photo actuelle
      setIsOpen(false);
      setVisiblePhotoIds(new Set());
      
      // Attendre la fermeture avant d'ouvrir la suivante
      timeoutRef.current = setTimeout(() => {
        // Passer à la photo suivante
        currentIndex = (currentIndex + 1) % photos.length;
        setCurrentPhotoIndex(currentIndex);
        setIsOpen(true);
        
        const currentPhoto = photos[currentIndex];
        setVisiblePhotoIds(new Set([currentPhoto.id]));
        
        // Programmer la fermeture après displayDuration
        timeoutRef.current = setTimeout(() => {
          setIsOpen(false);
          setVisiblePhotoIds(new Set());
        }, displayDuration);
      }, 500); // Délai pour l'animation de fermeture
    };

    // Démarrer le cycle
    setIsOpen(true);
    setCurrentPhotoIndex(currentIndex);
    const currentPhoto = photos[currentIndex];
    setVisiblePhotoIds(new Set([currentPhoto.id]));

    // Programmer la première fermeture
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setVisiblePhotoIds(new Set());
      
      // Démarrer l'intervalle pour le cycle automatique
      intervalRef.current = setInterval(cycle, displayDuration + 500); // +500ms pour l'animation
    }, displayDuration);
  }, [photos, displayDuration]);

  // Stocker la référence pour l'utiliser dans les useEffect
  startCarouselRef.current = startCarousel;

  // Réinitialiser le cycle quand une nouvelle photo arrive
  useEffect(() => {
    if (newPhotoIndicator && startCarouselRef.current) {
      // Réinitialiser tous les timers
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
        idleTimeoutRef.current = null;
      }

      // Trouver l'index de la nouvelle photo
      const newIndex = photos.findIndex(p => p.id === newPhotoIndicator.id);
      if (newIndex !== -1) {
        setCurrentPhotoIndex(newIndex);
        setIsOpen(true);
        setVisiblePhotoIds(new Set([newPhotoIndicator.id]));
        lastPhotoTimeRef.current = Date.now();
        
        // Démarrer le cycle automatique après l'affichage de la nouvelle photo
        startCarouselRef.current(newIndex);
      }
    }
  }, [newPhotoIndicator, photos]);

  // Démarrer le carrousel au chargement si on a des photos
  useEffect(() => {
    if (photos.length > 0 && currentPhotoIndex === null && !newPhotoIndicator && startCarouselRef.current) {
      // Démarrer immédiatement sans délai pour que la première photo s'affiche tout de suite
      if (startCarouselRef.current) {
        startCarouselRef.current(0);
      }
    }
  }, [photos.length, currentPhotoIndex, newPhotoIndicator]);

  // Gérer le timeout d'inactivité (1 minute sans nouvelle photo)
  useEffect(() => {
    if (newPhotoIndicator) {
      // Réinitialiser le timer d'inactivité
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      
      lastPhotoTimeRef.current = Date.now();
      
      // Programmer le redémarrage du cycle après 1 minute
      idleTimeoutRef.current = setTimeout(() => {
        const timeSinceLastPhoto = Date.now() - lastPhotoTimeRef.current;
        if (timeSinceLastPhoto >= idleTimeout && startCarouselRef.current) {
          // Reprendre le cycle automatique
          const currentIndex = photos.findIndex(p => p.id === newPhotoIndicator.id);
          if (currentIndex !== -1) {
            startCarouselRef.current(currentIndex);
          }
        }
      }, idleTimeout);
    }

    return () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, [newPhotoIndicator, photos, idleTimeout]);

  // Nettoyage
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, []);

  return {
    currentPhotoIndex,
    isOpen,
    visiblePhotoIds,
    startCarousel
  };
};

