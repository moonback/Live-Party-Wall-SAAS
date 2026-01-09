import React from 'react';

interface CountdownOverlayProps {
  countdown: number;
  maxDuration?: number; // Durée maximale du timer pour le calcul de la progression
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ countdown, maxDuration = 3 }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-lg transition-all duration-500">
      <div
        key={countdown}
        className="flex flex-col items-center justify-center w-full"
      >
        {countdown > 0 ? (
          <div className="relative flex flex-col items-center justify-center">
            {/* Cercle principal animé avec progress bar circulaire */}
            <div className="relative">
              <svg
                className="w-36 h-36 sm:w-56 sm:h-56"
                viewBox="0 0 160 160"
                fill="none"
              >
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="url(#gradient)"
                  strokeWidth="14"
                  className="opacity-40"
                />
                {/* Animation d'anneau progressif */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="url(#gradient)"
                  strokeWidth="14"
                  strokeDasharray={440}
                  strokeDashoffset={440 - (countdown / maxDuration) * 440}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                  style={{ filter: 'drop-shadow(0 0 40px #ec489988)' }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="160" y2="160" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ec4899" />
                    <stop offset="0.4" stopColor="#a78bfa" />
                    <stop offset="1" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Animation flash + nombre */}
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="text-7xl sm:text-9xl font-black text-white drop-shadow-[0_10px_30px_rgba(236,72,153,0.5)] select-none animate-in fade-in scale-in-110 duration-500 delay-100">
                  {countdown}
                </span>
              </span>
            </div>
            <span className="mt-6 text-xl sm:text-2xl font-bold uppercase tracking-widest text-pink-400 drop-shadow-pink-500/40 animate-pulse">{countdown === 1 ? "Prépare-toi..." : "On y est presque !"}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center animate-in fade-in scale-in-110 duration-300 animate-bounce">
            <span className="text-5xl sm:text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] select-none -rotate-3">
              SMILE!
            </span>
            <span className="text-4xl sm:text-6xl mt-4 animate-wiggle filter drop-shadow-lg">✨</span>
          </div>
        )}
      </div>
    </div>
  );
};

