import React from 'react';
import { Camera, Heart, Zap, Users, Activity, Clock, Download, Shield, TrendingUp, Image as ImageIcon, Video } from 'lucide-react';
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
  // Calculer le ratio likes/photos
  const likesPerPhoto = stats.totalPhotos > 0 ? (stats.totalLikes / stats.totalPhotos).toFixed(1) : '0';
  const reactionsPerPhoto = stats.totalPhotos > 0 ? (stats.totalReactions / stats.totalPhotos).toFixed(1) : '0';
  const photosPerAuthor = stats.uniqueAuthors > 0 ? (stats.totalPhotos / stats.uniqueAuthors).toFixed(1) : '0';

  // Compter les photos vs vidéos
  const photoCount = stats.recentPhotos.filter(p => p.type === 'photo').length;
  const videoCount = stats.recentPhotos.filter(p => p.type === 'video').length;

  const statCards = [
    {
      label: 'Photos',
      value: stats.totalPhotos,
      icon: Camera,
      color: 'pink',
      gradient: 'from-pink-500/20 to-rose-500/20',
      borderColor: 'border-pink-500/30',
      iconBg: 'bg-pink-500/20',
      iconColor: 'text-pink-400',
      detail: `${photoCount} photos, ${videoCount} vidéos`,
      trend: stats.recentActivity > 0
    },
    {
      label: 'Likes',
      value: stats.totalLikes,
      icon: Heart,
      color: 'red',
      gradient: 'from-red-500/20 to-rose-500/20',
      borderColor: 'border-red-500/30',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
      detail: `${likesPerPhoto} par photo`,
      trend: stats.totalLikes > 0
    },
    {
      label: 'Réactions',
      value: stats.totalReactions,
      icon: Zap,
      color: 'yellow',
      gradient: 'from-yellow-500/20 to-amber-500/20',
      borderColor: 'border-yellow-500/30',
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-400',
      detail: `${reactionsPerPhoto} par photo`,
      trend: stats.totalReactions > 0
    },
    {
      label: 'Auteurs',
      value: stats.uniqueAuthors,
      icon: Users,
      color: 'blue',
      gradient: 'from-blue-500/20 to-cyan-500/20',
      borderColor: 'border-blue-500/30',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      detail: `${photosPerAuthor} photos/aut.`,
      trend: stats.uniqueAuthors > 0
    },
    {
      label: 'Activité récente',
      value: stats.recentActivity,
      icon: Activity,
      color: 'green',
      gradient: 'from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-500/30',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400',
      detail: 'Dernière heure',
      trend: stats.recentActivity > 0
    }
  ];

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Statistiques principales - Design compact et moderne */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 md:gap-3">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="group relative bg-gradient-to-br bg-white/5 backdrop-blur-md rounded-xl p-3 md:p-3.5 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/10 hover:-translate-y-0.5 cursor-default overflow-hidden"
            >
              {/* Gradient overlay au hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              {/* Contenu */}
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-1.5 rounded-lg ${card.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${card.iconColor}`} />
                  </div>
                  {card.trend && (
                    <TrendingUp className="w-3 h-3 md:w-3.5 md:h-3.5 text-green-400 opacity-60" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <div className="text-xl md:text-2xl font-bold text-white tabular-nums">{card.value.toLocaleString()}</div>
                  <div className="text-[10px] md:text-xs text-white/60 font-medium leading-tight">{card.label}</div>
                  <div className="text-[9px] md:text-[10px] text-white/40 mt-1 leading-tight">{card.detail}</div>
                </div>
              </div>

              {/* Effet de brillance au hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Dernières photos - Design amélioré */}
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 md:p-4 border border-white/10 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/10 border border-white/10">
              <Clock className="w-4 h-4 md:w-5 md:h-5 text-white/80" />
            </div>
            <h2 className="text-base md:text-lg font-semibold text-white">Dernières photos</h2>
            <span className="text-xs text-white/50 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
              {stats.recentPhotos.length}
            </span>
          </div>
        </div>
        
        {stats.recentPhotos.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-2.5">
            {stats.recentPhotos.slice(0, 12).map((photo, index) => {
              const reactions = photosReactions.get(photo.id);
              const totalReactions = reactions ? Object.values(reactions).reduce((sum, count) => sum + count, 0) : 0;
              
              return (
                <div
                  key={photo.id}
                  onClick={() => onPhotoClick(photo)}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10 hover:border-white/30 active:scale-95 transition-all duration-300 cursor-pointer touch-manipulation shadow-md hover:shadow-xl hover:shadow-pink-500/20 hover:-translate-y-1"
                >
                  {photo.type === 'video' ? (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex items-center justify-center relative">
                      <Video className="w-6 h-6 md:w-8 md:h-8 text-white/40" />
                      <div className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] text-white/80 font-medium border border-white/10">
                        VID
                      </div>
                    </div>
                  ) : (
                    <img
                      src={photo.url}
                      alt={photo.caption || 'Photo'}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  )}
                  
                  {/* Overlay avec infos */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-2 md:p-2.5 space-y-1">
                      <div className="text-[10px] md:text-xs font-semibold truncate text-white drop-shadow-lg">
                        {photo.author || 'Anonyme'}
                      </div>
                      {photo.caption && (
                        <div className="text-[9px] md:text-[10px] text-white/90 truncate line-clamp-1 drop-shadow">
                          {photo.caption}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[9px] text-white/70">
                        <span className="flex items-center gap-1 bg-black/30 px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/10">
                          <Heart className="w-2.5 h-2.5 fill-red-400 text-red-400" />
                          {photo.likes_count || 0}
                        </span>
                        {totalReactions > 0 && (
                          <span className="flex items-center gap-1 bg-black/30 px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/10">
                            <Zap className="w-2.5 h-2.5 text-yellow-400" />
                            {totalReactions}
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] text-white/60">{getTimeAgo(photo.timestamp)}</div>
                    </div>
                  </div>

                  {/* Badge type en haut */}
                  {photo.type === 'photo' && (
                    <div className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] text-white/80 font-medium border border-white/10 flex items-center gap-1">
                        <ImageIcon className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  )}

                  {/* Indicateur de nouveau contenu */}
                  {index < 3 && (
                    <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-white/40">
            <Camera className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucune photo pour le moment</p>
          </div>
        )}
      </div>

      {/* Actions rapides - Design moderne */}
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 md:p-4 border border-white/10 shadow-lg">
        <h2 className="text-base md:text-lg font-semibold mb-3 text-white flex items-center gap-2">
          <div className="w-1 h-4 bg-gradient-to-b from-pink-400 to-purple-400 rounded-full" />
          Actions rapides
        </h2>
        <div className="grid grid-cols-2 gap-2.5 md:gap-3">
          <button
            onClick={onExport}
            disabled={isExporting}
            className="group relative flex items-center justify-center gap-2 p-3 md:p-3.5 rounded-xl bg-gradient-to-br from-pink-500/20 via-rose-500/20 to-pink-600/20 hover:from-pink-500/30 hover:via-rose-500/30 hover:to-pink-600/30 active:from-pink-500/40 active:to-pink-600/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation border border-pink-500/30 shadow-md hover:shadow-lg hover:shadow-pink-500/20 hover:-translate-y-0.5 active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Download className={`w-4 h-4 md:w-5 md:h-5 relative z-10 ${isExporting ? 'animate-spin' : ''}`} />
            <span className="text-sm md:text-base font-semibold relative z-10">Exporter</span>
          </button>
          <button
            onClick={onNavigateToModeration}
            className="group relative flex items-center justify-center gap-2 p-3 md:p-3.5 rounded-xl bg-gradient-to-br from-red-500/20 via-rose-500/20 to-red-600/20 hover:from-red-500/30 hover:via-rose-500/30 hover:to-red-600/30 active:from-red-500/40 active:to-red-600/40 transition-all duration-300 touch-manipulation border border-red-500/30 shadow-md hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-0.5 active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Shield className="w-4 h-4 md:w-5 md:h-5 relative z-10" />
            <span className="text-sm md:text-base font-semibold relative z-10">Modérer</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;

