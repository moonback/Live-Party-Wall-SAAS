import React from 'react';
import { Play, Pause } from 'lucide-react';
import { motion } from 'framer-motion';

interface WallFooterProps {
  showControls: boolean;
  isKiosqueMode: boolean;
  autoScroll: boolean;
  isPaused: boolean;
  isHoveringControls: (hovering: boolean) => void;
  tickerMessage?: string;
}

export const WallFooter = React.memo(({ 
  showControls, 
  isKiosqueMode, 
  autoScroll, 
  isPaused, 
  isHoveringControls,
  tickerMessage
}: WallFooterProps) => {

  if (isKiosqueMode) return null;

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ 
        y: showControls ? 0 : 20, 
        opacity: showControls ? 1 : 0 
      }}
      transition={{ duration: 0.5 }}
      className={`fixed bottom-0 left-0 w-full bg-gradient-to-r from-black/90 via-black/80 to-black/90 backdrop-blur-xl border-t-2 border-white/20 p-4 md:p-5 lg:p-6 flex flex-wrap items-center justify-between gap-4 md:gap-6 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]`}
      onMouseEnter={() => isHoveringControls(true)}
      onMouseLeave={() => isHoveringControls(false)}
      style={{ pointerEvents: showControls ? 'auto' : 'none' }}
    >
      <div className="flex items-center gap-4 md:gap-6 flex-1">
        <div className="flex items-center gap-2 md:gap-3 bg-gradient-to-r from-pink-500/30 via-pink-600/25 to-pink-500/30 px-4 md:px-6 lg:px-8 py-2 md:py-3 lg:py-4 rounded-full border-2 md:border-[3px] border-pink-400/40 shadow-lg shadow-pink-500/30 backdrop-blur-sm shrink-0">
          <div className="relative">
            <div className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 bg-pink-400 rounded-full animate-pulse shadow-lg shadow-pink-400/70"></div>
            <div className="absolute inset-0 w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 bg-pink-400 rounded-full animate-ping opacity-75"></div>
          </div>
          <p className="text-pink-200 text-sm md:text-base lg:text-lg xl:text-xl font-extrabold uppercase tracking-wider drop-shadow-md">En Direct</p>
        </div>
        
        {/* Ticker - Bandeau Défilant */}
        <div className="flex-1 overflow-hidden relative h-8 md:h-10 lg:h-12 mask-linear-fade">
          <div className="absolute whitespace-nowrap animate-ticker flex gap-8 md:gap-12">
             {tickerMessage ? (
                 <>
                   <span className="text-slate-300 text-base md:text-lg lg:text-xl xl:text-2xl font-medium">{tickerMessage}</span>
                   <span className="text-slate-500 text-lg md:text-xl lg:text-2xl">•</span>
                   <span className="text-slate-300 text-base md:text-lg lg:text-xl xl:text-2xl font-medium">{tickerMessage}</span>
                   <span className="text-slate-500 text-lg md:text-xl lg:text-2xl">•</span>
                   <span className="text-slate-300 text-base md:text-lg lg:text-xl xl:text-2xl font-medium">{tickerMessage}</span>
                 </>
             ) : (
                 <>
                   <span className="text-slate-300 text-base md:text-lg lg:text-xl xl:text-2xl font-medium">✨ Envoyez vos photos pour apparaître ici !</span>
                   <span className="text-slate-500 text-lg md:text-xl lg:text-2xl">•</span>
                   <span className="text-slate-300 text-base md:text-lg lg:text-xl xl:text-2xl font-medium">📸 Partagez vos meilleurs moments</span>
                   <span className="text-slate-500 text-lg md:text-xl lg:text-2xl">•</span>
                   <span className="text-slate-300 text-base md:text-lg lg:text-xl xl:text-2xl font-medium">❤️ Likez les photos en direct</span>
                 </>
             )}
          </div>
        </div>
      </div>

      {autoScroll && (
        <div className={`flex items-center gap-2 md:gap-3 px-4 md:px-5 lg:px-6 py-2 md:py-2.5 lg:py-3 rounded-full border-2 transition-all duration-300 shrink-0 ${
          isPaused 
            ? 'bg-yellow-500/20 border-yellow-500/30' 
            : 'bg-cyan-500/20 border-cyan-500/30'
        }`}>
          {isPaused ? <Pause className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-yellow-400" /> : <Play className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-cyan-400 ml-0.5" />}
          <p className="text-xs md:text-sm lg:text-base xl:text-lg font-bold uppercase tracking-wider" style={{ color: isPaused ? '#fbbf24' : '#22d3ee' }}>
            {isPaused ? 'En pause' : 'Auto-scroll'}
          </p>
        </div>
      )}
    </motion.div>
  );
});

