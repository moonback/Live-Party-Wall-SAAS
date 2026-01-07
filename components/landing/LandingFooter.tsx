import React from 'react';
import { Heart } from 'lucide-react';

interface LandingFooterProps {
  mounted: boolean;
}

/**
 * Footer de la page Landing
 */
export const LandingFooter: React.FC<LandingFooterProps> = ({ mounted }) => {
  return (
    <footer
      className={`flex flex-col items-center gap-0.5 sm:gap-1 text-white/40 text-[10px] sm:text-xs font-medium tracking-wider flex-shrink-0 mt-1 sm:mt-2 transition-all duration-1000 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ animationDelay: '400ms' }}
    >
      <div
        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded-full backdrop-blur-xl bg-white/5 border border-white/10"
        style={{
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-pink-500 fill-current animate-pulse" />
        <span className="uppercase tracking-wider text-[10px] sm:text-xs">Live Party Wall</span>
      </div>
      <span className="text-white/20 text-[9px] sm:text-[10px]">2026 By MAysson Dev</span>
    </footer>
  );
};

