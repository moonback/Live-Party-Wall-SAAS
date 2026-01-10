import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Photo } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { useEvent } from '../../context/EventContext';
import { shouldResumeAmbientDisplay } from '../../utils/sessionUtils';
import { MediaDisplay } from './MediaDisplay';

interface AmbientDisplayProps {
  photos: Photo[];
  onBack?: () => void;
}

/**
 * Mode écran ambiant pour restaurateurs
 * Affichage lent et discret en boucle, avec pause automatique
 */
export const AmbientDisplay: React.FC<AmbientDisplayProps> = ({
  photos,
  onBack
}) => {
  const { settings } = useSettings();
  const { currentEvent } = useEvent();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const checkResumeRef = useRef<NodeJS.Timeout | null>(null);

  // Filtrer les photos (seulement celles de la session du jour si événement permanent)
  const displayedPhotos = useMemo(() => {
    if (!photos || photos.length === 0) return [];
    return photos;
  }, [photos]);

  // Calculer la durée d'affichage selon la vitesse configurée
  const displayDuration = useMemo(() => {
    switch (settings.ambient_display_speed) {
      case 'very_slow':
        return 15000; // 15 secondes
      case 'slow':
        return 10000; // 10 secondes
      case 'normal':
        return 7000; // 7 secondes
      default:
        return 15000;
    }
  }, [settings.ambient_display_speed]);

  const transitionDuration = 2000; // 2 secondes de transition douce

  // Pause automatique si aucune photo et auto_pause_when_empty activé
  useEffect(() => {
    if (settings.auto_pause_when_empty && displayedPhotos.length === 0) {
      setIsPaused(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else if (displayedPhotos.length > 0 && isPaused) {
      // Reprendre si des photos arrivent
      setIsPaused(false);
    }
  }, [displayedPhotos.length, settings.auto_pause_when_empty, isPaused]);

  // Vérifier périodiquement si on doit reprendre (le soir)
  useEffect(() => {
    if (isPaused && settings.auto_pause_when_empty) {
      checkResumeRef.current = setInterval(() => {
        if (shouldResumeAmbientDisplay() && displayedPhotos.length > 0) {
          setIsPaused(false);
        }
      }, 60000); // Vérifier toutes les minutes

      return () => {
        if (checkResumeRef.current) {
          clearInterval(checkResumeRef.current);
        }
      };
    }
  }, [isPaused, settings.auto_pause_when_empty, displayedPhotos.length]);

  // Gérer le carrousel automatique
  useEffect(() => {
    if (displayedPhotos.length === 0 || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Démarrer le carrousel
    const startCarousel = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          const next = (prev + 1) % displayedPhotos.length;
          setIsTransitioning(true);
          
          setTimeout(() => {
            setIsTransitioning(false);
          }, transitionDuration);

          return next;
        });
      }, displayDuration);
    };

    startCarousel();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [displayedPhotos.length, displayDuration, isPaused, transitionDuration]);

  // Gérer les erreurs de chargement
  const handleMediaError = () => {
    // Passer à la photo suivante en cas d'erreur
    setCurrentIndex((prev) => (prev + 1) % displayedPhotos.length);
  };

  const currentPhoto = displayedPhotos[currentIndex];

  // Écran vide si aucune photo
  if (displayedPhotos.length === 0) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📸</div>
          <p className="text-2xl text-slate-400 mb-2">Aucune photo</p>
          {currentEvent && (
            <p className="text-lg text-slate-500">{currentEvent.name}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <AnimatePresence mode="wait">
        {currentPhoto && (
          <motion.div
            key={currentPhoto.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: isTransitioning ? 0.3 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: transitionDuration / 1000 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <MediaDisplay
              photo={currentPhoto}
              transitionDuration={transitionDuration}
              transitionType="fade"
              isTransitioning={isTransitioning}
              onError={handleMediaError}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Branding discret en bas à droite */}
      {currentEvent && (
        <div className="absolute bottom-8 right-8 text-right">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            className="text-white/30 text-sm"
          >
            <p className="font-semibold">{currentEvent.name}</p>
            <p className="text-xs">Live Party Wall</p>
          </motion.div>
        </div>
      )}

      {/* Indicateur de pause (très discret) */}
      {isPaused && (
        <div className="absolute top-8 left-8">
          <div className="bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg">
            <p className="text-white/50 text-xs">⏸ Pause</p>
          </div>
        </div>
      )}
    </div>
  );
};

