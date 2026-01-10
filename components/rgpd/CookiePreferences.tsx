import React, { useState, useEffect } from 'react';
import { X, Cookie, Shield, Check, X as XIcon } from 'lucide-react';
import { 
  getConsentData, 
  saveConsentData, 
  CookiePreferences as CookiePrefs,
  CookieCategory,
  getCookieCategoryName,
  getCookieCategoryDescription
} from '../../services/rgpdService';

interface CookiePreferencesProps {
  onClose: () => void;
  onPrivacyClick?: () => void;
}

/**
 * Modal de gestion des préférences cookies
 */
const CookiePreferencesModal: React.FC<CookiePreferencesProps> = ({ 
  onClose,
  onPrivacyClick 
}) => {
  const [preferences, setPreferences] = useState<CookiePrefs>({
    essential: true,
    analytics: false,
    marketing: false,
    functional: false
  });

  useEffect(() => {
    // Charger les préférences existantes
    const consent = getConsentData();
    if (consent) {
      setPreferences(consent.cookiePreferences);
    }
  }, []);

  const handleToggle = (category: CookieCategory) => {
    if (category === 'essential') return; // Ne peut pas être désactivé
    
    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleSave = () => {
    saveConsentData(preferences);
    onClose();
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePrefs = {
      essential: true,
      analytics: true,
      marketing: true,
      functional: true
    };
    saveConsentData(allAccepted);
    onClose();
  };

  const handleRejectAll = () => {
    const onlyEssential: CookiePrefs = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false
    };
    saveConsentData(onlyEssential);
    onClose();
  };

  const categories: CookieCategory[] = ['essential', 'analytics', 'marketing', 'functional'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-white/10 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Cookie className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Préférences de cookies</h2>
                <p className="text-sm text-slate-400">Gérez vos préférences de cookies</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-slate-300">
            Nous respectons votre vie privée. Vous pouvez choisir quels types de cookies accepter.{' '}
            <button
              onClick={onPrivacyClick}
              className="text-blue-400 hover:text-blue-300 underline font-medium"
            >
              Lire notre politique de confidentialité
            </button>
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {categories.map((category) => {
            const isEnabled = preferences[category];
            const isEssential = category === 'essential';

            return (
              <div
                key={category}
                className={`p-4 rounded-xl border ${
                  isEnabled 
                    ? 'bg-blue-500/10 border-blue-500/30' 
                    : 'bg-slate-800/50 border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-white">
                        {getCookieCategoryName(category)}
                      </h3>
                      {isEssential && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">
                          Requis
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {getCookieCategoryDescription(category)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle(category)}
                    disabled={isEssential}
                    className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-all ${
                      isEnabled ? 'bg-blue-500' : 'bg-slate-600'
                    } ${isEssential ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    aria-label={`${isEnabled ? 'Désactiver' : 'Activer'} ${getCookieCategoryName(category)}`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        isEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={handleRejectAll}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-all"
          >
            Refuser tout
          </button>
          <div className="flex-1" />
          <button
            onClick={handleSave}
            className="px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg transition-all shadow-lg"
          >
            Enregistrer les préférences
          </button>
          <button
            onClick={handleAcceptAll}
            className="px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg transition-all shadow-lg"
          >
            Tout accepter
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookiePreferencesModal;

