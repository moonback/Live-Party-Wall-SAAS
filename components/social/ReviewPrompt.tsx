import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, MapPin, ExternalLink } from 'lucide-react';
import { useEvent } from '../../context/EventContext';
import { useSettings } from '../../context/SettingsContext';

interface ReviewPromptProps {
  photoId: string;
  isVisible: boolean;
  onClose: () => void;
}

/**
 * Composant pour demander un avis après upload
 * Affiche un CTA léger vers Google Maps / TripAdvisor
 */
export const ReviewPrompt: React.FC<ReviewPromptProps> = ({
  photoId,
  isVisible,
  onClose
}) => {
  const { currentEvent } = useEvent();
  const { settings } = useSettings();

  // Ne pas afficher si désactivé
  if (!settings.review_prompt_enabled || !isVisible) {
    return null;
  }

  const restaurantName = currentEvent?.name || 'ce lieu';

  // Générer les liens de review (à adapter selon les besoins)
  const getGoogleMapsLink = (): string => {
    // Format: https://www.google.com/maps/search/?api=1&query=Restaurant+Name
    const query = encodeURIComponent(restaurantName);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  const getTripAdvisorLink = (): string => {
    // Format: https://www.tripadvisor.com/Search?q=Restaurant+Name
    const query = encodeURIComponent(restaurantName);
    return `https://www.tripadvisor.com/Search?q=${query}`;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 max-w-md w-full mx-4"
        >
          <div className="bg-gradient-to-r from-yellow-500/90 to-orange-500/90 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-yellow-400/30">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="text-center mb-4">
              <div className="flex justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-6 h-6 text-yellow-200 fill-yellow-200"
                  />
                ))}
              </div>
              <p className="text-white font-semibold text-lg mb-1">
                Vous avez aimé la soirée ?
              </p>
              <p className="text-white/90 text-sm">
                Partagez votre expérience sur {restaurantName}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <a
                href={getGoogleMapsLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg px-4 py-3 text-white font-semibold transition-all"
                onClick={onClose}
              >
                <MapPin className="w-5 h-5" />
                <span>Google Maps</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href={getTripAdvisorLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg px-4 py-3 text-white font-semibold transition-all"
                onClick={onClose}
              >
                <MapPin className="w-5 h-5" />
                <span>TripAdvisor</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

