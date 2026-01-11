import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Photo } from '../../types';

interface MediaDisplayProps {
  photo: Photo;
  transitionDuration: number;
  transitionType: 'fade' | 'zoom' | 'slide' | 'blur';
  isTransitioning: boolean;
  onError: () => void;
}

/**
 * Composant pour afficher l'image ou la vidéo avec gestion d'erreur
 */
export const MediaDisplay: React.FC<MediaDisplayProps> = ({
  photo,
  transitionDuration,
  transitionType,
  isTransitioning,
  onError,
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);

  // Réinitialiser l'erreur quand la photo change
  useEffect(() => {
    setHasError(false);
  }, [photo.id]);

  // Classes CSS pour les différentes transitions (mémorisé)
  const transitionClasses = useMemo((): string => {
    if (!isTransitioning) {
      return 'opacity-100 scale-100 blur-0';
    }

    switch (transitionType) {
      case 'fade':
        return 'opacity-0';
      case 'zoom':
        return 'opacity-0 scale-110';
      case 'slide':
        return 'opacity-0 translate-x-full';
      case 'blur':
        return 'opacity-0 blur-xl';
      default:
        return 'opacity-0';
    }
  }, [isTransitioning, transitionType]);

  const transitionStyle = useMemo(
    () => ({
      transition: `opacity ${transitionDuration}ms ease-in-out, transform ${transitionDuration}ms ease-in-out, filter ${transitionDuration}ms ease-in-out`,
    }),
    [transitionDuration]
  );

  const handleMediaError = () => {
    setHasError(true);
    onError();
  };

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/50">
        <div className="text-center text-white/60">
          <p className="text-lg mb-2">⚠️</p>
          <p className="text-sm">Erreur de chargement</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={transitionStyle}
    >
      {photo.type === 'video' ? (
        <video
          ref={videoRef}
          key={photo.id}
          src={photo.url}
          className={`w-full h-full object-contain ${transitionClasses}`}
          style={transitionStyle}
          controls
          playsInline
          autoPlay
          loop
          preload="auto" // ⚡ OPTIMISATION : Précharger pour projection (priorité maximale)
          onError={handleMediaError}
          onLoadedData={() => {
            if (videoRef.current) {
              videoRef.current.style.opacity = '1';
            }
          }}
        />
      ) : (
        <img
          ref={imageRef}
          key={photo.id}
          src={photo.url}
          alt={photo.caption}
          className={`w-full h-full object-contain ${transitionClasses}`}
          style={transitionStyle}
          loading="eager" // ⚡ OPTIMISATION : Charger immédiatement pour projection (priorité maximale)
          decoding="async"
          fetchPriority="high" // ⚡ OPTIMISATION : Priorité haute pour projection
          onError={handleMediaError}
          onLoad={() => {
            if (imageRef.current) {
              imageRef.current.style.opacity = '1';
            }
          }}
        />
      )}
    </div>
  );
};

