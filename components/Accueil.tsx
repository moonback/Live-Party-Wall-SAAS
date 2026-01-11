import React from 'react';
import { useAuth } from '../context/AuthContext';
import { getStaticAssetPath } from '../utils/electronPaths';

interface AccueilProps {
  onAdminClick: () => void;
}

/**
 * Page d'accueil simplifiée (sans événement sélectionné)
 */
const Accueil: React.FC<AccueilProps> = ({ onAdminClick }) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-transparent text-white relative overflow-hidden">
      {/* Background Image */}
      <img
        src={getStaticAssetPath('background-desktop.png')}
        alt="Background"
        className="fixed inset-0 w-full h-full object-cover z-0"
        style={{
          minWidth: '100%',
          minHeight: '100%',
        }}
      />

      {/* Overlay sombre */}
      <div className="fixed inset-0 bg-black/40 z-[1] pointer-events-none" />

      {/* Main Content */}
      <main className="relative z-[2] w-full max-w-4xl mx-auto flex flex-col items-center justify-center gap-8 px-4 py-16">
        {/* Logo et titre */}
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-[20px] scale-75"></div>
            <div className="relative flex items-center justify-center">
              <svg 
                className="relative w-20 h-20 text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)] z-[2]" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-center">
            <span className="bg-gradient-to-b from-white via-white/95 to-[#fbcfe8] bg-clip-text text-transparent">
              Partywall
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-white/75 text-center max-w-2xl">
            Transformez vos événements en expériences mémorables
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={onAdminClick}
          className="px-8 py-4 bg-white text-black font-semibold rounded-full text-lg flex items-center gap-2 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:-translate-y-1 transition-all"
        >
          {isAuthenticated ? 'Accéder au Dashboard' : 'Commencer'}
        </button>

        {/* Footer */}
        <footer className="mt-auto pt-8 text-center">
          <p className="text-sm text-white/50">
            © 2026 Partywall - Tous droits réservés
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Accueil;
