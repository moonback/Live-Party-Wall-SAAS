import React, { useEffect, useState } from 'react';

interface CountdownOverlayProps {
  countdown: number;
  maxDuration?: number;
}

/**
 * Overlay transparent élégant pour le photobooth, n'obscurcit jamais la photo.
 * Amélioré avec animations fluides et optimisé pour mobile paysage.
 */
export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({
  countdown,
  maxDuration = 3,
}) => {
  const RADIUS = 70;
  const STROKE = 14;
  const SIZE = 160;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const [isAnimating, setIsAnimating] = useState(false);

  // Clamp pour le progress
  const safeCountdown = Math.max(0, Math.min(countdown, maxDuration));
  const progress = (safeCountdown / maxDuration) * CIRCUMFERENCE;

  // Animation au changement de chiffre
  useEffect(() => {
    if (countdown > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [countdown]);

  // Message dynamique selon l'étape
  const message =
    countdown === 1
      ? 'Prêt ?'
      : countdown === 2
      ? 'On y est presque !'
      : countdown > 2
      ? 'Prépare-toi...'
      : '';

  return (
    <div
      className="
        absolute inset-0 z-50 flex flex-col items-center justify-center 
        pointer-events-none
        bg-gradient-to-b from-black/5 via-black/10 to-black/0
        transition-all duration-500
      "
      style={{ /* On évite tout bg-blur ou opacité forte */ }}
    >
      <div
        key={countdown}
        className="flex flex-col items-center justify-center w-full h-full"
      >
        {countdown > 0 ? (
          <>
            {/* Cercle et chiffre centrés, pas de panneau */}
            <div className="relative flex flex-col items-center justify-center select-none pointer-events-none">
              {/* Halo externe animé */}
              <div className={`absolute inset-0 flex items-center justify-center ${isAnimating ? 'animate-pulse' : ''}`}>
                <div className="w-32 h-32 sm:w-56 sm:h-56 landscape:w-40 landscape:sm:w-48 rounded-full bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-indigo-500/20 blur-2xl animate-pulse-slow" />
              </div>
              
              <svg
                className={`w-28 h-28 sm:w-48 sm:h-48 landscape:w-36 landscape:sm:w-40 max-w-[85vw] max-h-[40vh] landscape:max-h-[35vh] relative z-10 transition-all duration-500 ${isAnimating ? 'scale-110' : 'scale-100'}`}
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                fill="none"
                aria-hidden="true"
              >
                {/* Halo subtil et cercles - Amélioré */}
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS + 16}
                  fill="url(#glow)"
                  opacity={isAnimating ? "0.35" : "0.20"}
                  filter="url(#glowBlur)"
                  className="transition-opacity duration-300"
                />
                {/* Cercle de pulse externe */}
                {isAnimating && (
                  <circle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS + 24}
                    fill="none"
                    stroke="url(#progressbar)"
                    strokeWidth="2"
                    opacity="0.4"
                    className="animate-ping"
                  />
                )}
                <defs>
                  <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fff1fa" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#ec4899" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                  </radialGradient>
                  <filter id="glowBlur" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="10" />
                  </filter>
                </defs>
                {/* Cercle progressif - Amélioré avec animation */}
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  stroke="url(#progressbar)"
                  strokeWidth={STROKE}
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={CIRCUMFERENCE - progress}
                  strokeLinecap="round"
                  className="origin-center -rotate-90 transition-all duration-700 ease-out"
                  style={{
                    filter: isAnimating 
                      ? 'drop-shadow(0 0 50px #ec4899cc) drop-shadow(0 0 30px #a78bfa99)' 
                      : 'drop-shadow(0 0 38px #ec489980)',
                    transition: 'filter 0.3s ease-out',
                  }}
                />
                {/* Cercle léger de fond */}
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  stroke="url(#allwhite)"
                  strokeWidth={STROKE}
                  opacity="0.12"
                />
                <defs>
                  <linearGradient
                    id="progressbar"
                    x1="0"
                    y1="0"
                    x2={SIZE}
                    y2={SIZE}
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#ec4899" />
                    <stop offset="0.45" stopColor="#a78bfa" />
                    <stop offset="1" stopColor="#818cf8" />
                  </linearGradient>
                  <linearGradient
                    id="allwhite"
                    x1="0"
                    y1={SIZE}
                    x2={SIZE}
                    y2="0"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#fff" />
                    <stop offset="1" stopColor="#f3e8ff" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Chiffre géant - Amélioré avec animation */}
              <span className="absolute inset-0 flex items-center justify-center select-none z-20">
                <span
                  key={countdown}
                  className={`text-7xl sm:text-8xl md:text-9xl landscape:text-6xl landscape:sm:text-7xl font-black text-white 
                  [text-shadow:0_0_20px_#ec4899aa,0_0_40px_#a78bfa88,0_4px_30px_#818cf866]
                  pointer-events-none transition-all duration-300
                  ${isAnimating ? 'scale-125 animate-count' : 'scale-100'}`}
                  aria-live="assertive"
                  style={{
                    filter: isAnimating 
                      ? 'drop-shadow(0 0 30px #ec4899) drop-shadow(0 0 50px #a78bfa)' 
                      : 'drop-shadow(0 0 20px #ec4899)',
                  }}
                >
                  {countdown}
                </span>
              </span>
            </div>
            {/* Message en dessous seulement si > 0, très discret - Amélioré */}
            {message && (
              <span 
                key={message}
                className="mt-4 landscape:mt-2 landscape:sm:mt-3 text-base sm:text-xl landscape:text-sm landscape:sm:text-base font-bold uppercase tracking-wider 
                bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400
                drop-shadow-[0_0_8px_#c4b5fd88] animate-pulse pointer-events-none
                animate-fade-in-up
              ">
                {message}
              </span>
            )}
          </>
        ) : (
          // Effet "Smile" ultra aéré, ne recouvrant jamais toute l'image - Amélioré
          <div className="flex flex-col items-center justify-center pointer-events-none select-none">
            {/* Halo animé pour SMILE */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 sm:w-72 sm:h-72 landscape:w-56 landscape:sm:w-64 rounded-full bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-indigo-500/30 blur-3xl animate-pulse-slow" />
            </div>
            
            <span
              className="
                text-5xl sm:text-7xl md:text-9xl landscape:text-4xl landscape:sm:text-6xl font-black uppercase 
                bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent
                drop-shadow-[0_6px_24px_rgba(236,72,153,0.5)] -rotate-2
                animate-pop pointer-events-none relative z-10
              "
              aria-live="polite"
              style={{
                letterSpacing: '-0.04em',
                textShadow: '0 4px 20px #c7d2fe88, 0 0 40px #ec489966',
                filter: 'drop-shadow(0 0 30px #ec4899)',
              }}
            >
              SMILE!
            </span>
            <span className="mt-4 landscape:mt-2 landscape:sm:mt-3 flex items-center relative z-10">
              <span
                className="text-3xl sm:text-5xl landscape:text-2xl landscape:sm:text-3xl animate-wiggle pointer-events-none"
                aria-hidden="true"
                style={{ 
                  filter: 'drop-shadow(0 0 16px #a78bfa) drop-shadow(0 0 24px #ec4899)',
                  animation: 'sparklePulse 1.5s ease-in-out infinite',
                }}
              >
                ✨
              </span>
            </span>
            <span className="text-xs sm:text-base landscape:text-[10px] landscape:sm:text-xs mt-5 landscape:mt-3 landscape:sm:mt-4 text-white/60 uppercase tracking-widest pointer-events-none relative z-10 animate-fade-in-up">
              (Ta photo arrive !)
            </span>
          </div>
        )}
      </div>
      {/* Animations personnalisées à fournir côté Tailwind si besoin */}
    </div>
  );
};
