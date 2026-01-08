import React from 'react';
import { MAX_VIDEO_DURATION } from '../../constants';

interface VideoTimerProps {
  duration: number;
}

export const VideoTimer: React.FC<VideoTimerProps> = ({ duration }) => {
  return (
    <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-40 bg-red-500/90 backdrop-blur-md px-4 py-2 sm:px-6 sm:py-3 rounded-full border-2 border-red-400 shadow-lg animate-pulse">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full animate-pulse"></div>
        <span className="text-white font-bold text-sm sm:text-lg">
          {Math.floor(duration)}s / {MAX_VIDEO_DURATION}s
        </span>
      </div>
    </div>
  );
};

