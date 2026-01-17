import React from 'react';
import {
  AFTERMOVIE_MAX_PHOTOS_RECOMMENDED,
  AFTERMOVIE_WARNING_PHOTOS_THRESHOLD
} from '../../../constants';

interface PerformanceIndicatorProps {
  photoCount: number;
}

export const PerformanceIndicator: React.FC<PerformanceIndicatorProps> = ({ photoCount }) => {
  if (photoCount === 0) return null;

  const isHigh = photoCount > AFTERMOVIE_MAX_PHOTOS_RECOMMENDED;
  const isWarning = photoCount > AFTERMOVIE_WARNING_PHOTOS_THRESHOLD;

  return (
    <div
      className={`mb-4 p-3 rounded-lg border ${
        isHigh
          ? 'bg-red-500/10 border-red-500/30'
          : isWarning
          ? 'bg-yellow-500/10 border-yellow-500/30'
          : 'bg-indigo-500/10 border-indigo-500/30'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-semibold ${
              isHigh ? 'text-red-300' : isWarning ? 'text-yellow-300' : 'text-indigo-300'
            }`}
          >
            {isHigh ? '⚠️' : 'ℹ️'}
          </span>
          <span className="text-sm text-slate-300">
            {photoCount} photo{photoCount > 1 ? 's' : ''} sélectionnée{photoCount > 1 ? 's' : ''}
          </span>
        </div>
        <div className="text-xs text-slate-400">
          {isHigh
            ? `Limite recommandée : ${AFTERMOVIE_MAX_PHOTOS_RECOMMENDED} photos`
            : isWarning
            ? `Génération peut être lente`
            : `Performance optimale`}
        </div>
      </div>
    </div>
  );
};

