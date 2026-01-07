import React from 'react';

/**
 * Composant pour les effets de fond de la landing page
 */
export const LandingBackground: React.FC = () => {
  return (
    <>
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.15),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.15),transparent_50%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.3)_100%)] pointer-events-none"></div>

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-pink-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </>
  );
};

