import { useEffect, useRef, useState, useCallback } from 'react';
import { Photo } from '../../types';

interface UseAutoCarouselProps {
  photos: Photo[];
  lightboxIndex: number | null;
  setLightboxIndex: (index: number | null) => void;
  newPhotoIndicator: Photo | null;
  hasNewLike: boolean;
  hasNewReaction: boolean;
  enabled?: boolean;
  inactivityDelay?: number; // Délai d'inactivité en ms (défaut: 1 minute)
  photoDisplayDuration?: number; // Durée d'affichage de chaque photo en ms (défaut: 3 secondes)
}

/**
 * Hook pour gérer le carrousel automatique des photos après une période d'inactivité
 * 
 * Comportement:
 * - Après 1 minute d'inactivité, ouvre automatiquement la lightbox avec la première photo
 * - Fait défiler automatiquement toutes les photos comme un carrousel
 * - S'arrête dès qu'une nouvelle photo est postée, un like/réaction est ajouté, ou une interaction utilisateur se produit
 */
export const useAutoCarousel = ({
  photos,
  lightboxIndex,
  setLightboxIndex,
  newPhotoIndicator,
  hasNewLike,
  hasNewReaction,
  enabled = true,
  inactivityDelay = 60 * 1000, // 1 minute par défaut
  photoDisplayDuration = 3000 // 3 secondes par photo
}: UseAutoCarouselProps) => {
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const carouselIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isCarouselActive, setIsCarouselActive] = useState(false);
  const currentPhotoIndexRef = useRef<number>(0);
  const photosRef = useRef<Photo[]>(photos);
  const lightboxIndexRef = useRef<number | null>(lightboxIndex);
  const isCarouselActiveRef = useRef<boolean>(false);

  // Mettre à jour les refs
  useEffect(() => {
    photosRef.current = photos;
    lightboxIndexRef.current = lightboxIndex;
    isCarouselActiveRef.current = isCarouselActive;
  }, [photos, lightboxIndex, isCarouselActive]);

  // Arrêter le carrousel
  const stopCarousel = useCallback(() => {
    const wasActive = isCarouselActiveRef.current;
    setIsCarouselActive(false);
    isCarouselActiveRef.current = false;
    
    if (carouselIntervalRef.current) {
      clearInterval(carouselIntervalRef.current);
      carouselIntervalRef.current = null;
    }

    // Fermer la lightbox si elle était ouverte automatiquement par le carrousel
    if (lightboxIndexRef.current !== null && wasActive) {
      setLightboxIndex(null);
    }
  }, [setLightboxIndex]);

  // Démarrer le carrousel automatique
  const startCarousel = useCallback(() => {
    if (photosRef.current.length === 0 || lightboxIndexRef.current !== null) return;

    setIsCarouselActive(true);
    isCarouselActiveRef.current = true;
    currentPhotoIndexRef.current = 0;
    setLightboxIndex(0);

    // Démarrer le défilement automatique
    carouselIntervalRef.current = setInterval(() => {
      if (photosRef.current.length === 0) {
        if (carouselIntervalRef.current) {
          clearInterval(carouselIntervalRef.current);
          carouselIntervalRef.current = null;
        }
        return;
      }
      currentPhotoIndexRef.current = (currentPhotoIndexRef.current + 1) % photosRef.current.length;
      setLightboxIndex(currentPhotoIndexRef.current);
    }, photoDisplayDuration);
  }, [setLightboxIndex, photoDisplayDuration]);

  // Réinitialiser le timer d'inactivité lors d'interactions utilisateur
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }

    // Si le carrousel est actif, l'arrêter
    if (isCarouselActiveRef.current) {
      stopCarousel();
    }

    // Redémarrer le timer d'inactivité
    if (enabled && photosRef.current.length > 0 && lightboxIndexRef.current === null) {
      inactivityTimeoutRef.current = setTimeout(() => {
        startCarousel();
      }, inactivityDelay);
    }
  }, [enabled, inactivityDelay, startCarousel, stopCarousel]);

  // Détecter les interactions utilisateur
  useEffect(() => {
    if (!enabled) {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
      stopCarousel();
      return;
    }

    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll', 'wheel'];
    
    const handleInteraction = () => {
      resetInactivityTimer();
    };

    events.forEach(event => {
      window.addEventListener(event, handleInteraction, { passive: true });
    });

    // Initialiser le timer
    resetInactivityTimer();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleInteraction);
      });
      
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
      stopCarousel();
    };
  }, [enabled, resetInactivityTimer, stopCarousel]);

  // Arrêter le carrousel si une nouvelle photo est postée
  useEffect(() => {
    if (newPhotoIndicator && isCarouselActiveRef.current) {
      stopCarousel();
      resetInactivityTimer();
    }
  }, [newPhotoIndicator, stopCarousel, resetInactivityTimer]);

  // Arrêter le carrousel si un like est ajouté
  useEffect(() => {
    if (hasNewLike && isCarouselActiveRef.current) {
      stopCarousel();
      resetInactivityTimer();
    }
  }, [hasNewLike, stopCarousel, resetInactivityTimer]);

  // Arrêter le carrousel si une réaction est ajoutée
  useEffect(() => {
    if (hasNewReaction && isCarouselActiveRef.current) {
      stopCarousel();
      resetInactivityTimer();
    }
  }, [hasNewReaction, stopCarousel, resetInactivityTimer]);

  // Réinitialiser le timer quand la lightbox est fermée manuellement
  useEffect(() => {
    // Si la lightbox est fermée (passe de non-null à null) et que le carrousel n'était pas actif,
    // cela signifie que l'utilisateur l'a fermée manuellement, donc on réinitialise le timer
    if (lightboxIndex === null && enabled && photosRef.current.length > 0) {
      resetInactivityTimer();
    }
  }, [lightboxIndex, enabled, resetInactivityTimer]);

  // Nettoyer les timers au démontage
  useEffect(() => {
    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current);
        carouselIntervalRef.current = null;
      }
    };
  }, []);

  return {
    isCarouselActive,
    stopCarousel
  };
};

