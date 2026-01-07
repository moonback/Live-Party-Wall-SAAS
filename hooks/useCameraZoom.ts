import { useState, useEffect, useRef, RefObject } from 'react';

interface UseCameraZoomOptions {
  minZoom?: number;
  maxZoom?: number;
  initialZoom?: number;
  enabled?: boolean;
}

interface UseCameraZoomReturn {
  zoom: number;
  setZoom: (zoom: number) => void;
  resetZoom: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  containerProps: {
    onWheel: (e: React.WheelEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
    style: React.CSSProperties;
  };
}

/**
 * Hook pour gérer le zoom natif (pinch-to-zoom et wheel) sur la caméra
 */
export const useCameraZoom = (
  videoRef: RefObject<HTMLVideoElement>,
  options: UseCameraZoomOptions = {}
): UseCameraZoomReturn => {
  const {
    minZoom = 1,
    maxZoom = 3,
    initialZoom = 1,
    enabled = true
  } = options;

  const [zoom, setZoomState] = useState(initialZoom);
  const touchStartDistance = useRef<number | null>(null);
  const touchStartZoom = useRef<number>(initialZoom);
  const lastTouchTime = useRef<number>(0);

  const setZoom = (newZoom: number) => {
    const clamped = Math.max(minZoom, Math.min(maxZoom, newZoom));
    setZoomState(clamped);
    
    if (videoRef.current) {
      videoRef.current.style.transform = `scale(${clamped})`;
      videoRef.current.style.transition = 'transform 0.1s ease-out';
    }
  };

  const resetZoom = () => {
    setZoom(initialZoom);
  };

  const zoomIn = () => {
    setZoom(zoom + 0.1);
  };

  const zoomOut = () => {
    setZoom(zoom - 0.1);
  };

  // Calcul de la distance entre deux points de contact
  const getTouchDistance = (e: React.TouchEvent): number => {
    if (e.touches.length < 2) return 0;
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Gestion du pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enabled || !videoRef.current) return;
    
    if (e.touches.length === 2) {
      touchStartDistance.current = getTouchDistance(e);
      touchStartZoom.current = zoom;
      lastTouchTime.current = Date.now();
    } else if (e.touches.length === 1) {
      // Double tap pour reset zoom
      const now = Date.now();
      if (now - lastTouchTime.current < 300) {
        resetZoom();
      }
      lastTouchTime.current = now;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!enabled || !videoRef.current || touchStartDistance.current === null) return;
    
    if (e.touches.length === 2) {
      e.preventDefault(); // Empêcher le scroll pendant le zoom
      const currentDistance = getTouchDistance(e);
      const scale = currentDistance / touchStartDistance.current;
      const newZoom = touchStartZoom.current * scale;
      setZoom(newZoom);
    }
  };

  const handleTouchEnd = () => {
    touchStartDistance.current = null;
  };

  // Gestion du zoom avec la molette (desktop)
  const handleWheel = (e: React.WheelEvent) => {
    if (!enabled || !videoRef.current) return;
    
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(zoom + delta);
  };

  // Réinitialiser le zoom quand la vidéo change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.style.transformOrigin = 'center center';
      videoRef.current.style.transform = `scale(${zoom})`;
    }
  }, [zoom, videoRef]);

  return {
    zoom,
    setZoom,
    resetZoom,
    zoomIn,
    zoomOut,
    containerProps: {
      onWheel: handleWheel,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      style: {
        touchAction: enabled ? 'pan-x pan-y pinch-zoom' : 'auto',
        overflow: 'hidden',
        position: 'relative' as const
      }
    }
  };
};

