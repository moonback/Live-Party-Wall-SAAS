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

// Messages ticker/répétition
const defaultTicker = [
  '✨ Envoyez vos photos pour apparaître ici !',
  '•',
  '📸 Partagez vos meilleurs moments',
  '•',
  '❤️ Likez les photos en direct',
];

export const WallFooter = React.memo(({
  showControls,
  isKiosqueMode,
  autoScroll,
  isPaused,
  isHoveringControls,
  tickerMessage,
}: WallFooterProps) => {
  if (isKiosqueMode) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: showControls ? 0 : 20, opacity: showControls ? 1 : 0 }}
      transition={{ duration: 0.5 }}
      className="fixed bottom-0 left-0 w-full bg-gradient-to-r from-black/90 via-black/80 to-black/90 backdrop-blur-xl border-t-2 border-white/20 p-2 md:p-3 flex items-center justify-between gap-2 md:gap-4 z-50 shadow-[0_-6px_30px_rgba(0,0,0,0.4)]"
      onMouseEnter={() => isHoveringControls(true)}
      onMouseLeave={() => isHoveringControls(false)}
      style={{ pointerEvents: showControls ? 'auto' : 'none' }}
    >

      {/* LIVE pill + Ticker */}
      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
        <div className="flex items-center gap-1 md:gap-2 bg-pink-700/20 px-3 md:px-4 py-1 rounded-full border border-pink-400/30 shadow shadow-pink-700/20 backdrop-blur-sm shrink-0">
          <span className="relative flex">
            <span className="w-2.5 h-2.5 md:w-3 md:h-3 bg-pink-400 rounded-full animate-pulse shadow-pink-400/60 shadow" />
            <span className="absolute inset-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-pink-400 rounded-full animate-ping opacity-40" />
          </span>
          <span className="text-pink-200 text-xs md:text-base font-extrabold uppercase tracking-wide">En Direct</span>
        </div>
        <div className="flex-1 overflow-hidden relative h-7 md:h-9 mask-linear-fade">
          <div className="absolute whitespace-nowrap animate-ticker flex gap-6 md:gap-10 items-center">
            {tickerMessage
              ? [0, 1, 2].map(i => (
                  <React.Fragment key={i}>
                    <span className="text-slate-300 text-xs md:text-lg font-medium">{tickerMessage}</span>
                    {i < 2 && <span className="text-slate-500 text-base">•</span>}
                  </React.Fragment>
                ))
              : defaultTicker.map((msg, idx) => (
                  <span key={idx} className={`text-slate-300 text-xs md:text-lg font-medium${msg === '•' ? ' text-slate-500 text-base md:text-xl font-normal' : ''}`}>{msg}</span>
                ))
            }
          </div>
        </div>
      </div>

      {/* Auto-scroll status (pause/play) */}
      {autoScroll && (
        <div className={`flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full border text-xs md:text-sm font-bold uppercase tracking-wide shrink-0 transition-all duration-200
          ${isPaused ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'}
        `}>
          {isPaused
            ? <Pause className="w-4 h-4 md:w-5 md:h-5" />
            : <Play className="w-4 h-4 md:w-5 md:h-5" />}
          <span>{isPaused ? 'En pause' : 'Auto-scroll'}</span>
        </div>
      )}
    </motion.div>
  );
});

