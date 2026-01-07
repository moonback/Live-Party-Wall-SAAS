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
      className={`fixed bottom-0 left-0 w-full bg-gradient-to-r from-black/90 via-black/80 to-black/90 backdrop-blur-xl border-t border-white/20 p-3 md:p-4 flex flex-wrap items-center justify-between gap-4 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]`}
      onMouseEnter={() => isHoveringControls(true)}
      onMouseLeave={() => isHoveringControls(false)}
      style={{ pointerEvents: showControls ? 'auto' : 'none' }}
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-2 bg-gradient-to-r from-pink-500/30 via-pink-600/25 to-pink-500/30 px-4 py-2 rounded-full border-2 border-pink-400/40 shadow-lg shadow-pink-500/30 backdrop-blur-sm shrink-0">
          <div className="relative">
            <div className="w-2.5 h-2.5 bg-pink-400 rounded-full animate-pulse shadow-lg shadow-pink-400/70"></div>
            <div className="absolute inset-0 w-2.5 h-2.5 bg-pink-400 rounded-full animate-ping opacity-75"></div>
          </div>
          <p className="text-pink-200 text-xs font-extrabold uppercase tracking-wider drop-shadow-md">En Direct</p>
        </div>
        
        {/* Ticker - Bandeau Défilant */}
        <div className="flex-1 overflow-hidden relative h-6 mask-linear-fade">
          <div className="absolute whitespace-nowrap animate-ticker flex gap-8">
             {tickerMessage ? (
                 <>
                   <span className="text-slate-300 text-sm font-medium">{tickerMessage}</span>
                   <span className="text-slate-500">•</span>
                   <span className="text-slate-300 text-sm font-medium">{tickerMessage}</span>
                   <span className="text-slate-500">•</span>
                   <span className="text-slate-300 text-sm font-medium">{tickerMessage}</span>
                 </>
             ) : (
                 <>
                   <span className="text-slate-300 text-sm font-medium">✨ Envoyez vos photos pour apparaître ici !</span>
                   <span className="text-slate-500">•</span>
                   <span className="text-slate-300 text-sm font-medium">📸 Partagez vos meilleurs moments</span>
                   <span className="text-slate-500">•</span>
                   <span className="text-slate-300 text-sm font-medium">❤️ Likez les photos en direct</span>
                 </>
             )}
          </div>
        </div>
      </div>

      {autoScroll && (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 shrink-0 ${
          isPaused 
            ? 'bg-yellow-500/20 border-yellow-500/30' 
            : 'bg-cyan-500/20 border-cyan-500/30'
        }`}>
          {isPaused ? <Pause className="w-4 h-4 text-yellow-400" /> : <Play className="w-4 h-4 text-cyan-400 ml-0.5" />}
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider" style={{ color: isPaused ? '#fbbf24' : '#22d3ee' }}>
            {isPaused ? 'En pause' : 'Auto-scroll'}
          </p>
        </div>
      )}
    </motion.div>
  );
});

