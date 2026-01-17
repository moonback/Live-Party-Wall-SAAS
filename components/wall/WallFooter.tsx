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
      className="fixed bottom-0 left-0 w-full bg-gradient-to-r from-black/90 via-black/80 to-black/90 backdrop-blur-xl border-t-2 border-white/20 p-2 md:p-3 lg:p-3.5 xl:p-4 2xl:p-5 flex items-center justify-between gap-2 md:gap-4 lg:gap-5 xl:gap-6 2xl:gap-8 z-50 shadow-[0_-6px_30px_rgba(0,0,0,0.4)]"
      onMouseEnter={() => isHoveringControls(true)}
      onMouseLeave={() => isHoveringControls(false)}
      style={{ pointerEvents: showControls ? 'auto' : 'none' }}
    >

      {/* LIVE pill + Ticker */}
      <div className="flex items-center gap-2 md:gap-4 lg:gap-5 xl:gap-6 2xl:gap-8 flex-1 min-w-0">
        <div className="flex items-center gap-1 md:gap-2 lg:gap-2.5 xl:gap-3 2xl:gap-4 bg-pink-700/20 px-3 md:px-4 lg:px-5 xl:px-6 2xl:px-8 py-1 md:py-1.5 lg:py-2 xl:py-2.5 2xl:py-3 rounded-full border border-pink-400/30 shadow shadow-pink-700/20 backdrop-blur-sm shrink-0">
          <span className="relative flex">
            <span className="w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 2xl:w-5 2xl:h-5 bg-pink-400 rounded-full animate-pulse shadow-pink-400/60 shadow" />
            <span className="absolute inset-0 w-2.5 h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 2xl:w-5 2xl:h-5 bg-pink-400 rounded-full animate-ping opacity-40" />
          </span>
          <span className="text-pink-200 text-xs md:text-base lg:text-lg xl:text-xl 2xl:text-2xl font-extrabold uppercase tracking-wide">En Direct</span>
        </div>
        <div className="flex-1 overflow-hidden relative h-7 md:h-9 lg:h-10 xl:h-11 2xl:h-[52px] mask-linear-fade">
          <div className="absolute whitespace-nowrap animate-ticker flex gap-6 md:gap-10 lg:gap-12 xl:gap-14 2xl:gap-16 items-center">
            {tickerMessage
              ? [0, 1, 2].map(i => (
                  <React.Fragment key={i}>
                    <span className="text-slate-300 text-xs md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-medium">{tickerMessage}</span>
                    {i < 2 && <span className="text-slate-500 text-base md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl">•</span>}
                  </React.Fragment>
                ))
              : defaultTicker.map((msg, idx) => (
                  <span key={idx} className={`text-slate-300 text-xs md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-medium${msg === '•' ? ' text-slate-500 text-base md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-normal' : ''}`}>{msg}</span>
                ))
            }
          </div>
        </div>
      </div>

      {/* Auto-scroll status (pause/play) */}
      {autoScroll && (
        <div className={`flex items-center gap-2 md:gap-2.5 lg:gap-3 xl:gap-4 2xl:gap-5 px-3 md:px-4 lg:px-5 xl:px-6 2xl:px-8 py-1.5 md:py-2 lg:py-2.5 xl:py-3 2xl:py-3.5 rounded-full border text-xs md:text-sm lg:text-base xl:text-lg 2xl:text-xl font-bold uppercase tracking-wide shrink-0 transition-all duration-200
          ${isPaused ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'}
        `}>
          {isPaused
            ? <Pause className="w-4 h-4 md:w-5 md:h-5 lg:w-[22px] lg:h-[22px] xl:w-6 xl:h-6 2xl:w-7 2xl:h-7" />
            : <Play className="w-4 h-4 md:w-5 md:h-5 lg:w-[22px] lg:h-[22px] xl:w-6 xl:h-6 2xl:w-7 2xl:h-7" />}
          <span>{isPaused ? 'En pause' : 'Auto-scroll'}</span>
        </div>
      )}
    </motion.div>
  );
});

