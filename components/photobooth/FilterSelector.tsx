import React from 'react';
import { FilterType, FrameType } from '../../utils/imageFilters';

interface FilterSelectorProps {
  showFilters: boolean;
  showFrames: boolean;
  activeFilter: FilterType;
  activeFrame: FrameType;
  onFilterChange: (filter: FilterType) => void;
  onFrameChange: (frame: FrameType) => void;
  onToggleFilters: () => void;
  onToggleFrames: () => void;
}

export const FilterSelector: React.FC<FilterSelectorProps> = ({
  showFilters,
  showFrames,
  activeFilter,
  activeFrame,
  onFilterChange,
  onFrameChange,
  onToggleFilters,
  onToggleFrames
}) => {
  if (!showFilters && !showFrames) return null;

  return (
    <div className="absolute top-12 xs:top-14 sm:top-18 md:top-20 lg:top-24 left-1/2 -translate-x-1/2 z-30 bg-black/80 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl md:rounded-3xl p-2 xs:p-2.5 sm:p-3 md:p-3.5 flex gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3 animate-scale-in max-w-[95%] xs:max-w-[92%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[80%] overflow-x-auto scrollbar-hide">
      {showFilters && (
        <>
          {(['none', 'vintage', 'blackwhite', 'warm', 'cool', 'impressionist', 'popart', 'cinematic', 'vibrant', 'dreamy', 'dramatic', 'retro', 'neon'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`px-2 xs:px-2.5 sm:px-3 md:px-4 lg:px-5 py-1 xs:py-1.5 sm:py-1.5 md:py-2 lg:py-2.5 rounded-lg sm:rounded-xl md:rounded-2xl text-[9px] xs:text-[10px] sm:text-xs md:text-sm lg:text-base font-bold capitalize whitespace-nowrap transition-colors touch-manipulation ${
                activeFilter === f ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/50' : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {f === 'blackwhite' ? 'N&B' : f === 'impressionist' ? 'Impressionniste' : f === 'popart' ? 'Pop Art' : f === 'cinematic' ? 'Cinématique' : f === 'vibrant' ? 'Vibrant' : f === 'dreamy' ? 'Onirique' : f === 'dramatic' ? 'Dramatique' : f === 'retro' ? 'Rétro' : f === 'neon' ? 'Néon' : f}
            </button>
          ))}
        </>
      )}
      {/* Les cadres générés par code ont été retirés */}
      {/* Seuls les cadres PNG personnalisés sont disponibles via les settings */}
    </div>
  );
};

