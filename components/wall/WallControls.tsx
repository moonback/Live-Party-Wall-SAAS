import React from 'react';
import { Settings, Sparkles, Maximize2, X } from 'lucide-react';
import { logger } from '../../utils/logger';

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
        className="fixed bottom-7 left-3 md:bottom-8 md:left-6 lg:bottom-10 lg:left-8 z-50 p-3 md:p-4 lg:p-5
          bg-gradient-to-br from-pink-500/60 via-purple-600/40 to-cyan-500/50
          border-2 border-white/20 rounded-full shadow-2xl shadow-pink-400/10
          backdrop-blur-2xl transition-all duration-300 hover:scale-110 pointer-events-auto group"
        aria-label="Afficher les contrôles"
      >
        <span className="absolute -inset-1.5 md:-inset-2 bg-gradient-to-br from-pink-500/20 via-purple-600/15 to-cyan-500/15 rounded-full blur-[10px] opacity-100 pointer-events-none animate-pulse-slow"></span>
        <Settings className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-white drop-shadow-[0_2px_12px_rgba(236,72,153,0.3)]" />
      </button>
    );
  }

  return (
    <div 
      className={`z-50 fixed left-1/2 top-4 md:top-6 -translate-x-1/2 transition-all duration-700 ${
        showControls ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      }`}
      onMouseEnter={() => isHoveringControls(true)}
      onMouseLeave={() => isHoveringControls(false)}
    >
        <div className="bg-gradient-to-br from-slate-900/70 via-slate-800/60 to-slate-900/70 backdrop-blur-xl border-2 border-white/15 p-1.5 md:p-2 rounded-xl md:rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center gap-1.5 md:gap-2 transform transition-all duration-300 hover:scale-105 hover:border-white/30 hover:bg-slate-900/90 pointer-events-auto">
        
        {/* Auto Scroll Toggle */}
        <button 
            onClick={() => setAutoScroll(!autoScroll)}
            className={`relative px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all duration-300 flex items-center gap-1.5 md:gap-2 overflow-hidden group active:scale-95 ${
            autoScroll 
                ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-200 ring-2 ring-pink-500/50 hover:from-pink-500/30 hover:to-purple-500/30' 
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            aria-label={autoScroll ? "Désactiver le défilement automatique" : "Activer le défilement automatique"}
            aria-pressed={autoScroll}
        >
            <span className={`relative w-2.5 h-2.5 md:w-3 md:h-3 rounded-full transition-all duration-300 ${autoScroll ? 'bg-pink-400 animate-pulse shadow-lg shadow-pink-400/50' : 'bg-slate-600'}`}>
            {autoScroll && <span className="absolute inset-0 rounded-full bg-pink-400 animate-ping opacity-75" />}
            </span>
            <span className="uppercase tracking-wider hidden md:inline text-xs">{autoScroll ? 'On Air' : 'Pause'}</span>
            <span className="uppercase tracking-wider md:hidden text-xs">{autoScroll ? 'On' : 'Off'}</span>
        </button>

        <div className="w-[1px] h-5 md:h-6 bg-white/10 mx-0.5"></div>

        {/* Bouton Effets AR */}
        {arEnabled && (
            <>
            <button 
                onClick={triggerArEffect}
                className="p-2 md:p-2.5 min-h-[40px] md:min-h-[44px] min-w-[40px] md:min-w-[44px] touch-manipulation rounded-lg md:rounded-xl transition-all duration-300 group relative active:scale-95 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 border-2 border-cyan-500/30 hover:border-cyan-400/50"
                aria-label="Déclencher les effets de réalité augmentée"
            >
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
            </button>
            <div className="w-[1px] h-5 md:h-6 bg-white/10 mx-0.5"></div>
            </>
        )}

        {/* Toggle QR Codes */}
        <button 
            onClick={() => setShowQrCodes(!showQrCodes)}
            className={`p-2 md:p-2.5 min-h-[40px] md:min-h-[44px] min-w-[40px] md:min-w-[44px] touch-manipulation rounded-lg md:rounded-xl transition-all duration-300 group relative active:scale-95 ${
            showQrCodes
                ? 'text-purple-400 bg-purple-500/20 border-2 border-purple-500/30' 
                : 'text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 border-2 border-transparent'
            }`}
            aria-label={showQrCodes ? "Masquer les codes QR" : "Afficher les codes QR"}
            aria-pressed={showQrCodes}
        >
            <span className="relative text-xs md:text-sm font-black">QR</span>
        </button>
        
        {/* Fullscreen Toggle */}
        <button
            onClick={() => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch((error) => {
                        logger.error('Error entering fullscreen', error, { 
                            component: 'WallControls', 
                            action: 'requestFullscreen' 
                        });
                    });
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen().catch((error) => {
                            logger.error('Error exiting fullscreen', error, { 
                                component: 'WallControls', 
                                action: 'exitFullscreen' 
                            });
                        });
                    }
                }
            }}
            className="p-2 md:p-2.5 min-h-[40px] md:min-h-[44px] min-w-[40px] md:min-w-[44px] touch-manipulation rounded-lg md:rounded-xl text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-300 group relative hidden md:block"
            aria-label={document.fullscreenElement ? "Quitter le mode plein écran" : "Passer en mode plein écran"}
        >
            <Maximize2 className="relative w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform duration-300" />
        </button>

        {/* Sortir */}
        <button 
            onClick={onBack}
            className="p-2 md:p-2.5 min-h-[40px] md:min-h-[44px] min-w-[40px] md:min-w-[44px] touch-manipulation rounded-lg md:rounded-xl text-slate-400 hover:text-red-300 hover:bg-red-500/10 active:scale-95 transition-all duration-300 group relative"
            aria-label="Quitter le mur"
        >
            <X className="relative w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 group-hover:rotate-90 transition-all duration-300" />
        </button>
        </div>
    </div>
  );
});
