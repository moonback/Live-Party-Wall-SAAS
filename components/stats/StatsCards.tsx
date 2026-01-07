import React from 'react';
import { Camera, Heart, Users, Zap } from 'lucide-react';

interface StatsCardsProps {
  totalPhotos: number;
  photoCount: number;
  videoCount: number;
  totalLikes: number;
  averageLikesPerPhoto: string;
  totalReactions: number;
  averageReactionsPerPhoto: string;
  uniqueAuthors: number;
  recentPhotos: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  totalPhotos,
  photoCount,
  videoCount,
  totalLikes,
  averageLikesPerPhoto,
  totalReactions,
  averageReactionsPerPhoto,
  uniqueAuthors,
  recentPhotos,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3 mb-4 md:mb-6">
      <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg border border-white/5 p-2.5 md:p-4">
        <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-1.5">
          <Camera className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400 flex-shrink-0" />
          <span className="text-gray-400 text-[10px] md:text-xs truncate">Total Photos</span>
        </div>
        <p className="font-bold text-white text-lg md:text-xl">{totalPhotos}</p>
        <p className="text-gray-500 mt-0.5 md:mt-1 text-[9px] md:text-[10px] line-clamp-2">
          {photoCount} photos • {videoCount} vidéos
        </p>
      </div>

      <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg border border-white/5 p-2.5 md:p-4">
        <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-1.5">
          <Heart className="w-3.5 h-3.5 md:w-4 md:h-4 text-pink-400 flex-shrink-0" />
          <span className="text-gray-400 text-[10px] md:text-xs truncate">Total Likes</span>
        </div>
        <p className="font-bold text-white text-lg md:text-xl">{totalLikes}</p>
        <p className="text-gray-500 mt-0.5 md:mt-1 text-[9px] md:text-[10px] line-clamp-2">
          {averageLikesPerPhoto} moy./photo
        </p>
      </div>

      <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg border border-white/5 p-2.5 md:p-4">
        <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-1.5">
          <span className="text-base md:text-lg flex-shrink-0">💬</span>
          <span className="text-gray-400 text-[10px] md:text-xs truncate">Total Réactions</span>
        </div>
        <p className="font-bold text-white text-lg md:text-xl">{totalReactions}</p>
        <p className="text-gray-500 mt-0.5 md:mt-1 text-[9px] md:text-[10px] line-clamp-2">
          {averageReactionsPerPhoto} moy./photo
        </p>
      </div>

      <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg border border-white/5 p-2.5 md:p-4">
        <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-1.5">
          <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-400 flex-shrink-0" />
          <span className="text-gray-400 text-[10px] md:text-xs truncate">Participants</span>
        </div>
        <p className="font-bold text-white text-lg md:text-xl">{uniqueAuthors}</p>
        <p className="text-gray-500 mt-0.5 md:mt-1 text-[9px] md:text-[10px] line-clamp-2">Invités actifs</p>
      </div>

      <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg border border-white/5 p-2.5 md:p-4 col-span-2 sm:col-span-1">
        <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-1.5">
          <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-400 flex-shrink-0" />
          <span className="text-gray-400 text-[10px] md:text-xs truncate">Dernières 5min</span>
        </div>
        <p className="font-bold text-white text-lg md:text-xl">{recentPhotos}</p>
        <p className="text-gray-500 mt-0.5 md:mt-1 text-[9px] md:text-[10px] line-clamp-2">Photos récentes</p>
      </div>
    </div>
  );
};

