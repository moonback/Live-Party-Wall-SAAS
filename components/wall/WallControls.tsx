import React from 'react';
import { Settings, Sparkles, Maximize2, X } from 'lucide-react';

interface WallControlsProps {
  showControls: boolean;
  setShowControls: (show: boolean) => void;
  autoScroll: boolean;
  setAutoScroll: (auto: boolean) => void;
  arEnabled: boolean;
  triggerArEffect: () => void;
  showQrCodes: boolean;
  setShowQrCodes: (show: boolean) => void;
  onBack: () => void;
  isKiosqueMode: boolean;
  isHoveringControls: (hovering: boolean) => void;
}

export const WallControls = React.memo(({
  showControls,
  setShowControls,
  autoScroll,
  setAutoScroll,
  arEnabled,
  triggerArEffect,
  showQrCodes,
  setShowQrCodes,
  onBack,
  isKiosqueMode,
  isHoveringControls
}: WallControlsProps) => {

  if (!showControls && !isKiosqueMode) {
    return (
      <button
        onClick={() => setShowControls(true)}
        className="fixed bottom-7 left-3 md:bottom-8 md:left-6 z-50 p-2.5 md:p-3
          bg-gradient-to-br from-pink-500/60 via-purple-600/40 to-cyan-500/50
          border border-white/20 rounded-full shadow-2xl shadow-pink-400/10
          backdrop-blur-2xl transition-all duration-300 hover:scale-110 pointer-events-auto group"
      >
        <span className="absolute -inset-1.5 bg-gradient-to-br from-pink-500/20 via-purple-600/15 to-cyan-500/15 rounded-full blur-[10px] opacity-100 pointer-events-none animate-pulse-slow"></span>
        <Settings className="w-[22px] h-[22px] text-white drop-shadow-[0_2px_12px_rgba(236,72,153,0.3)]" />
      </button>
    );
  }

  return (
    <div 
      className={`z-50 absolute top-4 right-4 md:right-8 transition-all duration-700 ${
        showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
      }`}
      onMouseEnter={() => isHoveringControls(true)}
      onMouseLeave={() => isHoveringControls(false)}
    >
        <div className="bg-gradient-to-br from-slate-900/70 via-slate-800/60 to-slate-900/70 backdrop-blur-xl border border-white/15 p-1.5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center gap-2 transform transition-all duration-300 hover:scale-105 hover:border-white/30 hover:bg-slate-900/90 pointer-events-auto">
        
        {/* Auto Scroll Toggle */}
        <button 
            onClick={() => setAutoScroll(!autoScroll)}
            className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 overflow-hidden group active:scale-95 ${
            autoScroll 
                ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-200 ring-1 ring-pink-500/50 hover:from-pink-500/30 hover:to-purple-500/30' 
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
        >
            <span className={`relative w-2 h-2 rounded-full transition-all duration-300 ${autoScroll ? 'bg-pink-400 animate-pulse shadow-lg shadow-pink-400/50' : 'bg-slate-600'}`}>
            {autoScroll && <span className="absolute inset-0 rounded-full bg-pink-400 animate-ping opacity-75" />}
            </span>
            <span className="uppercase tracking-wider hidden lg:inline">{autoScroll ? 'On Air' : 'Pause'}</span>
            <span className="uppercase tracking-wider lg:hidden">{autoScroll ? 'On' : 'Off'}</span>
        </button>

        <div className="w-[1px] h-6 bg-white/10 mx-1"></div>

        {/* Bouton Effets AR */}
        {arEnabled && (
            <>
            <button 
                onClick={triggerArEffect}
                className="p-2 md:p-2 min-h-[48px] min-w-[48px] touch-manipulation rounded-xl transition-all duration-300 group relative active:scale-95 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400/50"
            >
                <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
            <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
            </>
        )}

        {/* Toggle QR Codes */}
        <button 
            onClick={() => setShowQrCodes(!showQrCodes)}
            className={`p-2 md:p-2 min-h-[48px] min-w-[48px] touch-manipulation rounded-xl transition-all duration-300 group relative active:scale-95 ${
            showQrCodes
                ? 'text-purple-400 bg-purple-500/20 border border-purple-500/30' 
                : 'text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 border border-transparent'
            }`}
        >
            <span className="relative text-xs font-black">QR</span>
        </button>
        
        {/* Fullscreen Toggle */}
        <button
            onClick={() => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch((e) => console.log(e));
                } else {
                    if (document.exitFullscreen) document.exitFullscreen();
                }
            }}
            className="p-2 md:p-2 min-h-[48px] min-w-[48px] touch-manipulation rounded-xl text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-300 group relative hidden md:block"
        >
            <Maximize2 className="relative w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
        </button>

        {/* Sortir */}
        <button 
            onClick={onBack}
            className="p-2 md:p-2 min-h-[48px] min-w-[48px] touch-manipulation rounded-xl text-slate-400 hover:text-red-300 hover:bg-red-500/10 active:scale-95 transition-all duration-300 group relative"
        >
            <X className="relative w-5 h-5 group-hover:scale-110 group-hover:rotate-90 transition-all duration-300" />
        </button>
        </div>
    </div>
  );
});
