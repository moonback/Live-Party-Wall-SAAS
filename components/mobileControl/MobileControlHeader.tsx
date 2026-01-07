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
    <div className="sticky top-0 z-50 bg-black/50 backdrop-blur-lg border-b border-white/10">
      <div className="flex items-center justify-between p-4 md:px-6 md:py-5">
        <button
          onClick={onBack}
          className="p-2 md:p-2.5 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 md:hover:scale-105 transition-all touch-manipulation"
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <div className="flex items-center gap-2 md:gap-3">
          <h1 className="text-lg md:text-xl lg:text-2xl font-bold">Contrôle total</h1>
          {/* Indicateur de mise à jour en temps réel */}
          <div className="flex items-center gap-1 text-xs md:text-sm text-white/60">
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-green-400 animate-pulse" title="Mise à jour en temps réel active" />
            <span className="hidden sm:inline">Temps réel</span>
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading || isRefreshing}
          className="p-2 md:p-2.5 rounded-lg bg-white/10 hover:bg-white/20 active:bg-white/30 md:hover:scale-105 transition-all disabled:opacity-50 touch-manipulation"
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

