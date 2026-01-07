import { useRef, useCallback } from 'react';

export interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export interface UseSwipeOptions {
  threshold?: number; // Distance minimale en pixels pour déclencher un swipe
  velocity?: number; // Vitesse minimale en pixels/ms
  preventDefault?: boolean; // Empêcher le comportement par défaut
}

export interface UseSwipeReturn {
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
  isSwiping: boolean;
  swipeDirection: 'left' | 'right' | 'up' | 'down' | null;
}

/**
 * Hook pour détecter les gestes de swipe sur mobile
 */
export const useSwipe = (
  handlers: SwipeHandlers,
  options: UseSwipeOptions = {}
): UseSwipeReturn => {
  const {
    threshold = 50,
    velocity = 0.3,
    preventDefault = true
  } = options;

  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchCurrent = useRef<{ x: number; y: number } | null>(null);
  const isSwipingRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    touchCurrent.current = {
      x: touch.clientX,
      y: touch.clientY
    };
    isSwipingRef.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current || e.touches.length !== 1) return;

    const touch = e.touches[0];
    touchCurrent.current = {
      x: touch.clientX,
      y: touch.clientY
    };

    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Si on a dépassé le seuil, on considère qu'on swipe
    if (distance > 10) {
      isSwipingRef.current = true;
      if (preventDefault) {
        e.preventDefault();
      }
    }
  }, [preventDefault]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current || !touchCurrent.current) {
      touchStart.current = null;
      touchCurrent.current = null;
      return;
    }

    const deltaX = touchCurrent.current.x - touchStart.current.x;
    const deltaY = touchCurrent.current.y - touchStart.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const time = Date.now() - touchStart.current.time;
    const velocityValue = distance / time;

    // Vérifier si c'est un swipe valide
    if (distance >= threshold && velocityValue >= velocity && isSwipingRef.current) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Déterminer la direction principale
      if (absX > absY) {
        // Swipe horizontal
        if (deltaX > 0) {
          handlers.onSwipeRight?.();
        } else {
          handlers.onSwipeLeft?.();
        }
      } else {
        // Swipe vertical
        if (deltaY > 0) {
          handlers.onSwipeDown?.();
        } else {
          handlers.onSwipeUp?.();
        }
      }
    }

    // Reset
    touchStart.current = null;
    touchCurrent.current = null;
    isSwipingRef.current = false;
  }, [handlers, threshold, velocity]);

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    },
    isSwiping: isSwipingRef.current,
    swipeDirection: null // Pourrait être calculé en temps réel si nécessaire
  };
};

