import React, { useState, useEffect } from 'react';
import { X, Cookie, Settings, Shield } from 'lucide-react';
import { shouldShowConsentBanner, saveConsentData, CookiePreferences } from '../../services/rgpdService';

interface ConsentBannerProps {
  onPreferencesClick?: () => void;
  onPrivacyClick?: () => void;
}

/**
 * Banner de consentement RGPD affiché en bas de l'écran
 */
const ConsentBanner: React.FC<ConsentBannerProps> = ({ 
  onPreferencesClick,
  onPrivacyClick 
}) => {
  const [show, setShow] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Vérifier si on doit afficher le banner
    if (shouldShowConsentBanner()) {
      setShow(true);
      // Animation d'apparition
      setTimeout(() => setIsVisible(true), 100);
    }
  }, []);

  const handleAcceptAll = () => {
    const preferences: CookiePreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      functional: true
    };
    
    saveConsentData(preferences);
    handleClose();
  };

  const handleAcceptEssential = () => {
    const preferences: CookiePreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false
    };
    
    saveConsentData(preferences);
    handleClose();
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setShow(false), 300);
  };

  if (!show) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-white/10 backdrop-blur-xl shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Icon and Text */}
            <div className="flex items-start gap-3 flex-1">
              <div className="flex-shrink-0 mt-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <Cookie className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Gestion des cookies
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Nous utilisons des cookies pour améliorer votre expérience, analyser l'utilisation de l'application 
                  et personnaliser le contenu.{' '}
                  <button
                    onClick={onPrivacyClick}
                    className="text-blue-400 hover:text-blue-300 underline font-medium"
                  >
                    En savoir plus
                  </button>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={handleAcceptEssential}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                Essentiels uniquement
              </button>
              <button
                onClick={onPreferencesClick}
                className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Personnaliser
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg transition-all shadow-lg hover:shadow-xl"
              >
                Tout accepter
              </button>
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 sm:relative sm:top-0 sm:right-0 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentBanner;

