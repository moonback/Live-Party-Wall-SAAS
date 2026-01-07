import React from 'react';
import { Star, Heart, Clock, X } from 'lucide-react';
import { Photo, ReactionCounts } from '../../types';
import { REACTIONS } from '../../constants';

interface StarPhotoModalProps {
  starPhoto: Photo;
  photosReactions: Map<string, ReactionCounts>;
  formatTime: (timestamp: number) => string;
  onClose: () => void;
}

export const StarPhotoModal: React.FC<StarPhotoModalProps> = ({
  starPhoto,
  photosReactions,
  formatTime,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
            <h3 className="text-lg font-bold text-white">Photo Star ⭐</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>
        <div className="p-6">
          <div className="aspect-square rounded-lg overflow-hidden border border-white/5 bg-black/20 mb-4">
            <img src={starPhoto.url} className="w-full h-full object-cover" alt={starPhoto.caption || ''} />
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-white/50 mb-1">Auteur</div>
              <div className="text-xl font-bold text-white">{starPhoto.author}</div>
            </div>
            {starPhoto.caption && (
              <div>
                <div className="text-sm text-white/50 mb-1">Légende</div>
                <div className="text-base text-white">{starPhoto.caption}</div>
              </div>
            )}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-pink-500/10 border border-pink-400/15 text-pink-200 text-sm font-semibold">
                <Heart className="w-4 h-4 fill-current" />
                {starPhoto.likes_count} likes
              </div>
              {photosReactions.get(starPhoto.id) && Object.entries(photosReactions.get(starPhoto.id)!).map(([type, count]) => {
                if (count === 0) return null;
                const reaction = REACTIONS[type as keyof typeof REACTIONS];
                if (!reaction) return null;
                return (
                  <div key={type} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-400/15 text-orange-200 text-sm font-semibold">
                    <span>{reaction.emoji}</span>
                    <span>{count}</span>
                  </div>
                );
              })}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/40 border border-white/5 text-white/70 text-sm">
                <Clock className="w-4 h-4" />
                {formatTime(starPhoto.timestamp)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

