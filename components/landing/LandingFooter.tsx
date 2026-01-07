import React from 'react';

/**
 * Footer de la landing page
 */
export const LandingFooter: React.FC = () => {
  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-pink-500/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center">
          
          <p className="text-sm text-pink-200/50 mb-4">
            Transformez vos événements en expériences mémorables
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            
            <span>© 2026 Live Party Wall</span>
            <span>Tous droits réservés</span>
            
          </div>
        </div>
      </div>
    </footer>
  );
};
