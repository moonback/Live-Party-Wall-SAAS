import React from 'react';

/**
 * Skip links pour l'accessibilité - Navigation clavier
 * Permet aux utilisateurs de clavier de sauter directement au contenu principal
 */
export const SkipLinks: React.FC = () => {
  return (
    <div className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:z-[100] focus-within:top-4 focus-within:left-4">
      <a
        href="#main-content"
        className="block px-4 py-2 bg-pink-500 text-white rounded-lg font-semibold mb-2 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 focus:ring-offset-black"
      >
        Aller au contenu principal
      </a>
      <a
        href="#features"
        className="block px-4 py-2 bg-purple-500 text-white rounded-lg font-semibold mb-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-black"
      >
        Aller aux fonctionnalités
      </a>
      <a
        href="#pricing"
        className="block px-4 py-2 bg-indigo-500 text-white rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-black"
      >
        Aller à la tarification
      </a>
    </div>
  );
};

