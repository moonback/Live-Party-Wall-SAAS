import React from 'react';
import { BarChart3, Camera, Heart, Zap, Clock, RefreshCw, X } from 'lucide-react';

interface StatsTopBarProps {
  currentTime: number;
  totalPhotos: number;
  totalLikes: number;
  recentPhotos: number;
  uniqueAuthors: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  onBack?: () => void;
}

export const StatsTopBar: React.FC<StatsTopBarProps> = ({
  currentTime,
  totalPhotos,
  totalLikes,
  recentPhotos,
  uniqueAuthors,
  isRefreshing,
  onRefresh,
  onBack,
}) => {
  return (
    <div className="shrink-0 rounded-xl border border-white/5 bg-gray-900/60 backdrop-blur-sm px-3 md:px-5 py-2.5 md:py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
        <div className="p-1.5 md:p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 flex-shrink-0">
          <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5 md:gap-2">
            <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight truncate">
              Compétition en Direct
            </h1>
            <span className="text-[10px] md:text-xs text-white/50 font-medium">LIVE</span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-white/50 flex-wrap">
            <Clock className="w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0" />
            <span className="whitespace-nowrap">{new Date(currentTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="text-white/20 hidden sm:inline">•</span>
            <span className="whitespace-nowrap">{uniqueAuthors} joueurs</span>
            <span className="text-white/20 hidden sm:inline">•</span>
            <span className="whitespace-nowrap">{totalPhotos} posts</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-3 w-full md:w-auto justify-between md:justify-end">
        <div className="flex items-center gap-1 md:gap-2 flex-1 md:flex-none">
          <div className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 flex-1 md:flex-none">
            <Camera className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400 flex-shrink-0" />
            <div className="text-right min-w-0">
              <div className="text-base md:text-xl font-bold text-white leading-none truncate">{totalPhotos}</div>
              <div className="text-[9px] md:text-[10px] uppercase tracking-wide text-blue-300/70 hidden sm:block">Posts</div>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-lg bg-pink-500/10 border border-pink-500/20 flex-1 md:flex-none">
            <Heart className="w-3.5 h-3.5 md:w-4 md:h-4 text-pink-400 flex-shrink-0" />
            <div className="text-right min-w-0">
              <div className="text-base md:text-xl font-bold text-white leading-none truncate">{totalLikes}</div>
              <div className="text-[9px] md:text-[10px] uppercase tracking-wide text-pink-300/70 hidden sm:block">Likes</div>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex-1 md:flex-none">
            <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-400 flex-shrink-0" />
            <div className="text-right min-w-0">
              <div className="text-base md:text-xl font-bold text-white leading-none truncate">{recentPhotos}</div>
              <div className="text-[9px] md:text-[10px] uppercase tracking-wide text-yellow-300/70 hidden sm:block">5 min</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 md:p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/70 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Actualiser les données"
            aria-label="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 md:p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/70 hover:text-white transition-all duration-300"
              title="Quitter"
              aria-label="Quitter"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

