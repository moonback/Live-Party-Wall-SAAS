import React, { useState, useCallback } from 'react';
import { ImageOrientation } from '../../hooks/useImageOrientation';
import { getImageClasses } from '../../hooks/useImageOrientation';
import { get4KImageUrl, get4KImageSrcSet, get4KImageSizes } from '../../utils/imageUrl4K';

interface OptimizedImageProps {
  src: string;
  alt: string;
  orientation: ImageOrientation;
  isMobile: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Composant d'image optimisé avec :
 * - Lazy loading natif HTML5
 * - Placeholder animé pendant chargement
 * - Gestion d'erreur élégante
 * - GPU acceleration
 * - contain: strict pour isolation layout
 */
export const OptimizedImage = React.memo<OptimizedImageProps>(({
  src,
  alt,
  orientation,
  isMobile,
  className = '',
  style = {}
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setImageError(true);
    setImageLoaded(false);
  }, []);

  // Gestion d'erreur élégante
  if (imageError) {
    return (
      <div 
        className={`${getImageClasses(orientation, isMobile)} bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 flex items-center justify-center relative overflow-hidden`}
        style={{ 
          ...style,
          contain: 'strict'
        }}
      >
        {/* Icône d'erreur */}
        <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
          <svg 
            className="w-12 h-12 md:w-16 md:h-16" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
          <span className="text-xs md:text-sm font-medium">Image non disponible</span>
        </div>
      </div>
    );
  }

  // Image chargée avec succès ou en cours de chargement
  return (
    <div 
      className={`${getImageClasses(orientation, isMobile)} relative overflow-hidden`}
      style={{ contain: 'strict' }}
    >
      {/* Placeholder pendant chargement */}
      {!imageLoaded && !imageError && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 animate-pulse"
          style={{ willChange: 'background-color' }}
        >
          {/* Effet shimmer animé */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          
          {/* Icône de chargement */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-slate-600 border-t-pink-500 rounded-full animate-spin" />
          </div>
        </div>
      )}
      
      {/* Image réelle */}
      <img 
        src={get4KImageUrl(src, true)} 
        srcSet={get4KImageSrcSet(src)}
        sizes={get4KImageSizes()}
        alt={alt} 
        className={`${getImageClasses(orientation, isMobile)} ${className} transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'} relative z-10`}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        style={{ 
          maxWidth: '100%', 
          height: 'auto',
          contain: 'strict', // Isolation layout pour performance
          willChange: imageLoaded ? 'auto' : 'opacity' // Hint pour optimisation GPU
        }}
      />
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

