import React from 'react';
import { Star, Heart, Clock } from 'lucide-react';
import { Photo, ReactionCounts } from '../../types';
import { REACTIONS } from '../../constants';

interface StarPhotoCardProps {
  starPhoto: Photo | null;
  photosReactions: Map<string, ReactionCounts>;
  formatTime: (timestamp: number) => string;
  onClick?: () => void;
  variant?: 'display' | 'normal';
}

export const StarPhotoCard: React.FC<StarPhotoCardProps> = ({
  starPhoto,
  photosReactions,
  formatTime,
  onClick,
  variant = 'normal',
}) => {
  if (variant === 'display') {
    return (
      <div
        className="col-span-7 rounded-lg border border-white/5 bg-gray-900/50 backdrop-blur-sm p-3 overflow-hidden relative cursor-pointer hover:border-yellow-400/30 transition-colors"
        onClick={onClick}
      >
        <div className="absolute top-0 right-0 px-2 py-1 rounded-bl-lg bg-yellow-500/10 border-b border-l border-yellow-400/15 text-yellow-300 text-xs font-bold flex items-center gap-1.5">
          <Star className="w-3 h-3 fill-current" />
          Photo Star
        </div>
        {starPhoto ? (
          <div className="h-full flex items-center gap-3">
            <div className="h-full aspect-square rounded-lg overflow-hidden border border-white/5 bg-black/20">
              <img src={starPhoto.url} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-bold text-white truncate">{starPhoto.author}</div>
              <div className="text-xs text-white/50 truncate mt-0.5">
                {starPhoto.caption || 'Sans légende'}
              </div>
              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-pink-500/10 border border-pink-400/15 text-pink-200 text-xs font-semibold">
                  <Heart className="w-3 h-3 fill-current" />
                  {starPhoto.likes_count} likes
                </div>
                {photosReactions.get(starPhoto.id) && Object.entries(photosReactions.get(starPhoto.id)!).map(([type, count]) => {
                  if (count === 0) return null;
                  const reaction = REACTIONS[type as keyof typeof REACTIONS];
                  if (!reaction) return null;
                  return (
                    <div key={type} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-500/10 border border-orange-400/15 text-orange-200 text-xs font-semibold">
                      <span>{reaction.emoji}</span>
                      <span>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-white/40 text-sm font-medium">
            En attente de likes…
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="bg-gray-900/60 backdrop-blur-sm rounded-lg p-4 border border-white/5 cursor-pointer hover:border-yellow-400/30 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-4 h-4 text-yellow-400 fill-current" />
        <h3 className="text-base font-bold text-white">Photo Star ⭐</h3>
      </div>
      {starPhoto ? (
        <div className="space-y-1.5">
          <p className="text-gray-300 text-sm">
            <span className="font-semibold text-white">{starPhoto.author}</span>
          </p>
          <p className="text-xs text-gray-400">{starPhoto.caption}</p>
          <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-pink-400" />
              <span>{starPhoto.likes_count} likes</span>
            </div>
            {photosReactions.get(starPhoto.id) && Object.entries(photosReactions.get(starPhoto.id)!).map(([type, count]) => {
              if (count === 0) return null;
              const reaction = REACTIONS[type as keyof typeof REACTIONS];
              if (!reaction) return null;
              return (
                <div key={type} className="flex items-center gap-1">
                  <span>{reaction.emoji}</span>
                  <span>{count}</span>
                </div>
              );
            })}
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatTime(starPhoto.timestamp)}</span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-400 text-sm">En attente de likes…</p>
      )}
    </div>
  );
};

