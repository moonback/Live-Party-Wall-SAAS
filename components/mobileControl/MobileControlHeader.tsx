import React from 'react';
import { ArrowLeft, RefreshCw, Radio } from 'lucide-react';

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
    <div className="sticky top-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/10 shadow-xl">
      <div className="flex items-center justify-between px-3 py-2.5 md:px-4 md:py-3">
        <button
          onClick={onBack}
          className="group relative p-2 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 transition-all duration-300 touch-manipulation border border-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-pink-500/10"
          aria-label="Retour"
        >
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-white/80 group-hover:text-white transition-colors" />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        </button>
        
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex flex-col items-center">
            <h1 className="text-sm md:text-base font-bold bg-gradient-to-r from-white via-pink-100 to-white bg-clip-text text-transparent m-0 p-0 leading-tight">
              Contrôle total
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="relative flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 backdrop-blur-sm">
                <Radio className="w-2.5 h-2.5 md:w-3 md:h-3 text-green-400" />
                <div
                  className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_4px_rgba(34,197,94,0.6)]"
                  title="Mise à jour en temps réel active"
                />
                <span className="text-[9px] md:text-[10px] text-green-400 font-medium hidden sm:inline ml-0.5">
                  Live
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <button
          onClick={onRefresh}
          disabled={isLoading || isRefreshing}
          className="group relative p-2 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation border border-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-pink-500/10"
          title="Actualiser manuellement"
          aria-label="Actualiser"
        >
          <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 text-white/80 group-hover:text-white transition-colors ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        </button>
      </div>
    </div>
  );
};

export default MobileControlHeader;

