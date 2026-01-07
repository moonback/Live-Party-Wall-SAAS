import { useState, useEffect } from 'react';

export type ImageOrientation = 'portrait' | 'landscape' | 'square' | 'unknown';

/**
 * Hook pour détecter l'orientation d'une image
 */
export const useImageOrientation = (imageUrl: string | null): ImageOrientation => {
  const [orientation, setOrientation] = useState<ImageOrientation>('unknown');

  useEffect(() => {
    if (!imageUrl) {
      setOrientation('unknown');
      return;
    }

    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const ratio = width / height;

      if (ratio > 1.1) {
        setOrientation('landscape');
      } else if (ratio < 0.9) {
        setOrientation('portrait');
      } else {
        setOrientation('square');
      }
    };

    img.onerror = () => {
      setOrientation('unknown');
    };

    img.src = imageUrl;
  }, [imageUrl]);

  return orientation;
};

/**
 * Fonction utilitaire pour obtenir les classes CSS appropriées selon l'orientation
 */
export const getImageClasses = (
  orientation: ImageOrientation,
  isMobile: boolean = false
): string => {
  const baseClasses = 'w-full object-contain transition-transform duration-700';
  
  if (!isMobile) {
    return `${baseClasses} group-hover:scale-105`;
  }

  // Sur mobile, adapter selon l'orientation
  switch (orientation) {
    case 'portrait':
      return `${baseClasses} max-h-[60vh] md:max-h-[500px]`;
    case 'landscape':
      return `${baseClasses} max-h-[40vh] md:max-h-[400px]`;
    case 'square':
      return `${baseClasses} max-h-[50vh] md:max-h-[500px]`;
    default:
      return `${baseClasses} max-h-[50vh] md:max-h-[500px]`;
  }
};

