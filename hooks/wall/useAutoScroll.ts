import { useState, useEffect, useRef } from 'react';

interface UseAutoScrollProps {
  enabled: boolean;
  speed: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  hasContent: boolean;
}

export const useAutoScroll = ({ enabled, speed, containerRef, hasContent }: UseAutoScrollProps) => {
  const [isPaused, setIsPaused] = useState(false);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || isPaused || !containerRef.current || !hasContent) {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    const scrollContainer = containerRef.current;
    let lastTime = Date.now();

    // ⚡ OPTIMISATION : Optimiser le scroll pour réduire les violations de performance
    const scroll = () => {
      const now = Date.now();
      const delta = now - lastTime;

      // ⚡ OPTIMISATION : Utiliser delta time pour un scroll fluide et éviter les reflows
      // Limiter le delta max à 100ms pour éviter les sauts lors de pauses
      const clampedDelta = Math.min(delta, 100);
      
      if (clampedDelta >= 16 && scrollContainer) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;

        if (isAtBottom) {
          // ⚡ OPTIMISATION : Utiliser scrollTo avec behavior: 'auto' pour éviter les animations coûteuses
          scrollContainer.scrollTo({ top: 0, behavior: 'auto' });
        } else {
          // ⚡ OPTIMISATION : Calculer le scroll avec delta time normalisé pour éviter les reflows
          // Utiliser Math.round pour éviter les calculs flottants coûteux
          const scrollAmount = Math.round(speed * (clampedDelta / 16)); // Normaliser par rapport à 60fps
          if (scrollAmount > 0) {
            scrollContainer.scrollTop += scrollAmount;
          }
        }

        lastTime = now;
      }

      rafIdRef.current = requestAnimationFrame(scroll);
    };

    rafIdRef.current = requestAnimationFrame(scroll);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [enabled, isPaused, speed, hasContent]);

  return { isPaused, setIsPaused };
};

