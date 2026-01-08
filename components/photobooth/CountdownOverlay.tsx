import React from 'react';

interface CountdownOverlayProps {
  countdown: number;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ countdown }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/40 backdrop-blur-sm transition-all">
      <div key={countdown} className="flex flex-col items-center justify-center animate-[pulse_1s_ease-in-out]">
        {countdown > 0 ? (
          <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full bg-white/10 backdrop-blur-md border-2 sm:border-4 border-white/30 flex items-center justify-center shadow-[0_0_40px_rgba(236,72,153,0.4)] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/20 to-purple-500/20"></div>
            <span className="text-6xl sm:text-9xl font-black text-white drop-shadow-lg select-none relative z-10 pb-2">
              {countdown}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center animate-bounce">
            <span className="text-5xl sm:text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] select-none rotate-[-3deg]">
              SMILE!
            </span>
            <span className="text-4xl sm:text-6xl mt-4 filter drop-shadow-lg">✨</span>
          </div>
        )}
      </div>
    </div>
  );
};

