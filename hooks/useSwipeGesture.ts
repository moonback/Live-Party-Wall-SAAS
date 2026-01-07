import { useRef, useEffect, useState } from 'react';

interface SwipeGestureOptions {
  onSwipeDown?: () => void;
  onSwipeUp?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number; // Distance minimale en px pour déclencher le swipe
  velocityThreshold?: number; // Vitesse minimale en px/ms
  enabled?: boolean;
}

/**
 * Hook pour détecter les gestes de swipe (glisser) sur mobile
 * Utilisé pour fermer les modals/lightbox avec un swipe vers le bas
 */
export const useSwipeGesture = ({
  onSwipeDown,
  onSwipeUp,
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  velocityThreshold = 0.3,
  enabled = true,
}: SwipeGestureOptions) => {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      setIsSwiping(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      
      // Empêcher le scroll pendant le swipe
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      
      // Si le swipe vertical est plus important que l'horizontal, empêcher le scroll
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) {
        setIsSwiping(false);
        return;
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;
      const velocity = Math.sqrt(deltaX ** 2 + deltaY ** 2) / deltaTime;

      // Vérifier si le swipe est assez rapide et assez long
      if (velocity > velocityThreshold) {
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        // Déterminer la direction principale
        if (absDeltaY > absDeltaX && absDeltaY > threshold) {
          // Swipe vertical
          if (deltaY > 0 && onSwipeDown) {
            onSwipeDown();
          } else if (deltaY < 0 && onSwipeUp) {
            onSwipeUp();
          }
        } else if (absDeltaX > absDeltaY && absDeltaX > threshold) {
          // Swipe horizontal
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight();
          } else if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft();
          }
        }
      }

      touchStartRef.current = null;
      setIsSwiping(false);
    };

    const element = document.body;
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeDown, onSwipeUp, onSwipeLeft, onSwipeRight, threshold, velocityThreshold, enabled]);

  return { isSwiping };
};

