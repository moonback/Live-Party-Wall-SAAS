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

    const scroll = () => {
      const now = Date.now();
      const delta = now - lastTime;

      if (delta >= 16 && scrollContainer) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;

        if (isAtBottom) {
          scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          scrollContainer.scrollTop += speed;
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

