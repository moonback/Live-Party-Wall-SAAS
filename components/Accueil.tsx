import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface AccueilProps {
  onAdminClick: () => void;
}

/**
 * Page d'accueil simplifiée pour Partywall
 */
const Accueil: React.FC<AccueilProps> = ({ onAdminClick }) => {
  const { isAuthenticated } = useAuth();

  // Toujours démarrer en haut de page
  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-900 via-black to-pink-900 relative overflow-hidden flex items-center justify-center">
      <div className="text-center z-10 px-4">
        <h1 className="text-5xl font-bold text-white mb-4">Partywall</h1>
        <p className="text-xl text-white/80 mb-8">Partagez vos moments en temps réel</p>
        {isAuthenticated && (
          <button
            onClick={onAdminClick}
            className="px-6 py-3 bg-pink-500 hover:bg-pink-600 rounded-lg text-white font-medium transition"
          >
            Accéder au Dashboard
          </button>
        )}
      </div>
    </div>
  );
};

export default Accueil;

