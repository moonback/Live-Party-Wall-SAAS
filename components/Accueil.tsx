import React, { useEffect, useState } from 'react';
import { getStaticAssetPath } from '../utils/electronPaths';

interface AccueilProps {
  onAdminClick: () => void;
}

/**
 * Page d'accueil simplifiée (sans événement sélectionné)
 */
const Accueil: React.FC<AccueilProps> = ({ onAdminClick }) => {
  const [progress, setProgress] = useState(0);

  // Redirection automatique vers le tableau de bord après 5 secondes avec barre de progression
  useEffect(() => {
    const duration = 2000; // 5 secondes
    const interval = 50; // Mise à jour toutes les 50ms
    const increment = (100 / duration) * interval;

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + increment;
        if (newProgress >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return newProgress;
      });
    }, interval);

    const redirectTimer = setTimeout(() => {
      onAdminClick();
    }, duration);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(redirectTimer);
    };
  }, [onAdminClick]);

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
              <img
                src={getStaticAssetPath('logo-accueil.png')}
                alt="Partywall Logo"
                className="relative w-20 h-20 drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)] z-[2] object-contain"
              />
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

        {/* Barre de chargement */}
        <div className="w-full max-w-md mt-8">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
              style={{ 
                width: `${progress}%`,
              }}
            >
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                style={{
                  animation: 'shimmer 2s infinite',
                  transform: 'translateX(-100%)',
                }}
              />
            </div>
          </div>
        </div>
        <style>{`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
        `}</style>

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
