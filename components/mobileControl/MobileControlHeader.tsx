import React from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';

interface MobileControlHeaderProps {
  onBack: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  isRefreshing: boolean;
}

const MobileControlHeader: React.FC<MobileControlHeaderProps> = ({
  onBack,
  onRefresh,
  isLoading,
  isRefreshing,
}) => {
  return (
    <div className="sticky top-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/20 shadow-lg md:bg-black/50 md:backdrop-blur-lg md:border-white/10">
      <div className="flex items-center justify-between p-4 md:px-6 md:py-5">
        <button
          onClick={onBack}
          className="p-2.5 md:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 active:scale-95 md:hover:scale-105 transition-all touch-manipulation shadow-sm"
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <div className="flex items-center gap-2 md:gap-3">
          <h1 className="text-xl md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
            Contrôle total
          </h1>
          {/* Indicateur de mise à jour en temps réel */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" title="Mise à jour en temps réel active" />
            <span className="text-[10px] md:text-sm text-green-400 font-medium hidden sm:inline">Temps réel</span>
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading || isRefreshing}
          className="p-2.5 md:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 active:scale-95 md:hover:scale-105 transition-all disabled:opacity-50 touch-manipulation shadow-sm"
          title="Actualiser manuellement"
          aria-label="Actualiser"
        >
          <RefreshCw className={`w-5 h-5 md:w-6 md:h-6 ${(isLoading || isRefreshing) ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
};

export default MobileControlHeader;

