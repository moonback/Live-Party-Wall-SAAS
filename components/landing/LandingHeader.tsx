import React from 'react';
import { Camera, Sparkles } from 'lucide-react';

interface LandingHeaderProps {
  title: string;
  subtitle: string;
  mounted: boolean;
}

/**
 * Header de la page Landing avec titre et sous-titre
 */
export const LandingHeader: React.FC<LandingHeaderProps> = ({
  title,
  subtitle,
  mounted,
}) => {
  return (
    <header
      className={`w-full flex flex-col items-center text-center flex-shrink-0 transition-all duration-1000 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="pointer-events-auto flex flex-col items-center relative z-10">
        {/* Glow Effect Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-pink-500/20 rounded-full blur-[60px] -z-10 pointer-events-none" />
        
        <div className="relative group cursor-default flex flex-col items-center gap-3">
          
          {/* Logo Container */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 transform transition-transform duration-500 group-hover:scale-[1.02]">
            {/* Icon Wrapper */}
            <div className="relative hidden sm:block">
              <div className="absolute inset-0 bg-white/20 blur-xl rounded-full transform scale-75"></div>
              <Camera className="relative w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-lg" strokeWidth={1.5} />
              <Sparkles className="absolute -top-2 -right-2 w-4 h-4 text-pink-300 animate-pulse drop-shadow-md" />
            </div>

            {/* Title */}
            <h1 className="relative font-handwriting text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] leading-tight">
              <span className="bg-gradient-to-b from-white via-pink-50 to-pink-200 bg-clip-text text-transparent filter drop-shadow-sm">
                {title}
              </span>
              <span className="text-pink-400 ml-1 inline-block animate-pulse">.</span>
            </h1>
          </div>

          {/* Subtitle & Decorative Lines */}
          <div className="flex items-center gap-4 sm:gap-6 mt-1">
            <div className="h-px w-8 sm:w-16 bg-gradient-to-r from-transparent via-pink-400/60 to-transparent"></div>
            <span className="text-xs sm:text-sm md:text-base font-medium tracking-[0.3em] text-white/90 uppercase drop-shadow-md">
              {subtitle}
            </span>
            <div className="h-px w-8 sm:w-16 bg-gradient-to-l from-transparent via-cyan-400/60 to-transparent"></div>
          </div>

          
        </div>
      </div>
    </header>
  );
};

