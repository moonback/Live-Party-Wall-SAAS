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
    <div className="absolute top-14 sm:top-20 left-1/2 -translate-x-1/2 z-30 bg-black/80 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl p-2 sm:p-3 flex gap-1.5 sm:gap-2 animate-scale-in max-w-[95%] sm:max-w-[90%] overflow-x-auto scrollbar-hide">
      {showFilters && (
        <>
          {(['none', 'vintage', 'blackwhite', 'warm', 'cool'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold capitalize whitespace-nowrap transition-colors touch-manipulation ${
                activeFilter === f ? 'bg-pink-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {f === 'blackwhite' ? 'N&B' : f}
            </button>
          ))}
        </>
      )}
      {showFrames && (
        <>
          {(['none', 'polaroid', 'neon', 'gold', 'simple'] as FrameType[]).map(f => (
            <button
              key={f}
              onClick={() => onFrameChange(f)}
              className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold capitalize whitespace-nowrap transition-colors touch-manipulation ${
                activeFrame === f ? 'bg-pink-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {f}
            </button>
          ))}
        </>
      )}
    </div>
  );
};

