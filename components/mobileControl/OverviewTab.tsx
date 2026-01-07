import React from 'react';
import { Camera, Heart, Zap, Users, Activity, Clock, Download, Shield } from 'lucide-react';
import { Photo, ReactionCounts } from '../../types';

interface OverviewTabProps {
  stats: {
    totalPhotos: number;
    totalLikes: number;
    totalReactions: number;
    uniqueAuthors: number;
    recentActivity: number;
    recentPhotos: Photo[];
  };
  photosReactions: Map<string, ReactionCounts>;
  onPhotoClick: (photo: Photo) => void;
  onExport: () => void;
  onNavigateToModeration: () => void;
  isExporting: boolean;
  getTimeAgo: (timestamp: number) => string;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  stats,
  photosReactions,
  onPhotoClick,
  onExport,
  onNavigateToModeration,
  isExporting,
  getTimeAgo,
}) => {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Statistiques principales */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <div className="bg-white/10 rounded-xl p-4 md:p-5 backdrop-blur-sm md:hover:bg-white/15 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Camera className="w-5 h-5 md:w-6 md:h-6 text-pink-400" />
            <span className="text-sm md:text-base text-white/70">Photos</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold">{stats.totalPhotos}</div>
        </div>
        <div className="bg-white/10 rounded-xl p-4 md:p-5 backdrop-blur-sm md:hover:bg-white/15 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 md:w-6 md:h-6 text-red-400" />
            <span className="text-sm md:text-base text-white/70">Likes</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold">{stats.totalLikes}</div>
        </div>
        <div className="bg-white/10 rounded-xl p-4 md:p-5 backdrop-blur-sm md:hover:bg-white/15 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
            <span className="text-sm md:text-base text-white/70">Réactions</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold">{stats.totalReactions}</div>
        </div>
        <div className="bg-white/10 rounded-xl p-4 md:p-5 backdrop-blur-sm md:hover:bg-white/15 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
            <span className="text-sm md:text-base text-white/70">Auteurs</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold">{stats.uniqueAuthors}</div>
        </div>
        <div className="bg-white/10 rounded-xl p-4 md:p-5 backdrop-blur-sm md:hover:bg-white/15 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
            <span className="text-sm md:text-base text-white/70">Dernière heure</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold">{stats.recentActivity}</div>
        </div>
      </div>

      {/* Dernières photos */}
      <div className="bg-white/10 rounded-xl p-4 md:p-6 backdrop-blur-sm">
        <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 md:w-6 md:h-6" />
          Dernières photos
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 md:gap-3">
          {stats.recentPhotos.slice(0, 6).map((photo) => (
            <div
              key={photo.id}
              onClick={() => onPhotoClick(photo)}
              className="group relative aspect-square rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 active:bg-white/15 transition-all cursor-pointer touch-manipulation md:hover:scale-105"
            >
              {photo.type === 'video' ? (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <span className="text-xs text-white/50">VID</span>
                </div>
              ) : (
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-full object-cover"
                />
              )}
              {/* Overlay avec infos au hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <div className="text-xs font-medium truncate text-white">{photo.author}</div>
                  <div className="text-[10px] text-white/80 truncate">{photo.caption}</div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-white/70">
                    <span className="flex items-center gap-0.5">
                      <Heart className="w-2.5 h-2.5" />
                      {photo.likes_count || 0}
                    </span>
                    <span>{getTimeAgo(photo.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {/* Afficher les 6 photos suivantes sur desktop uniquement */}
          {stats.recentPhotos.slice(6, 12).map((photo) => (
            <div
              key={photo.id}
              onClick={() => onPhotoClick(photo)}
              className="hidden md:block group relative aspect-square rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-all cursor-pointer touch-manipulation hover:scale-105"
            >
              {photo.type === 'video' ? (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <span className="text-xs text-white/50">VID</span>
                </div>
              ) : (
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-full object-cover"
                />
              )}
              {/* Overlay avec infos au hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <div className="text-xs font-medium truncate text-white">{photo.author}</div>
                  <div className="text-[10px] text-white/80 truncate">{photo.caption}</div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-white/70">
                    <span className="flex items-center gap-0.5">
                      <Heart className="w-2.5 h-2.5" />
                      {photo.likes_count || 0}
                    </span>
                    <span>{getTimeAgo(photo.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {stats.recentPhotos.length === 0 && (
            <div className="col-span-2 md:col-span-6 text-center py-8 text-white/50">
              Aucune photo pour le moment
            </div>
          )}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white/10 rounded-xl p-4 md:p-6 backdrop-blur-sm">
        <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <button
            onClick={onExport}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 p-3 md:p-4 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 active:bg-pink-500/40 md:hover:scale-105 transition-all disabled:opacity-50 touch-manipulation"
          >
            <Download className="w-5 h-5 md:w-6 md:h-6" />
            <span className="text-sm md:text-base">Exporter</span>
          </button>
          <button
            onClick={onNavigateToModeration}
            className="flex items-center justify-center gap-2 p-3 md:p-4 rounded-lg bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 md:hover:scale-105 transition-all touch-manipulation"
          >
            <Shield className="w-5 h-5 md:w-6 md:h-6" />
            <span className="text-sm md:text-base">Modérer</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;

