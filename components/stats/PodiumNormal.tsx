import React from 'react';
import { Trophy, Camera, Star, Zap } from 'lucide-react';
import { LeaderboardEntry, Photo, ReactionCounts } from '../../types';
import { getUserAvatar } from '../../utils/userAvatar';
import { REACTIONS } from '../../constants';

interface PodiumNormalProps {
  top3: LeaderboardEntry[];
  photos: Photo[];
  photosReactions: Map<string, ReactionCounts>;
  guestAvatars?: Map<string, string>; // Mapping nom -> avatar_url depuis la BDD
}

const getRankIcon = (rank: number) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
};

const getRankColor = (rank: number) => {
  if (rank === 1) return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
  if (rank === 2) return 'from-gray-400/20 to-gray-500/20 border-gray-400/30';
  if (rank === 3) return 'from-amber-600/20 to-amber-700/20 border-amber-600/30';
  return 'from-gray-800/30 to-gray-800/30 border-gray-700/20';
};

export const PodiumNormal: React.FC<PodiumNormalProps> = ({ top3, photos, photosReactions, guestAvatars }) => {
  if (top3.length === 0) return null;

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg border border-white/5 mb-4 md:mb-6 p-3 md:p-5">
      <div className="flex items-center gap-2 mb-3 md:mb-4">
        <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 flex-shrink-0" />
        <h2 className="text-base md:text-lg font-bold text-white">Top 3 du Podium</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 md:gap-3">
        {top3.map((entry) => {
          const isFirst = entry.rank === 1;
          return (
            <div
              key={entry.author}
              className={`relative bg-gradient-to-b ${getRankColor(entry.rank)} backdrop-blur-sm rounded-lg border transition-all duration-300 hover:scale-[1.02] ${
                isFirst ? 'md:order-2 md:scale-105' : entry.rank === 2 ? 'md:order-1' : 'md:order-3'
              } p-3 md:p-4`}
            >
              {/* Badge de rang */}
              <div className="absolute -top-2.5 md:-top-3 left-1/2 transform -translate-x-1/2 rounded-full bg-gray-900 flex items-center justify-center border-2 border-gray-700 w-8 h-8 md:w-10 md:h-10 text-base md:text-lg">
                {getRankIcon(entry.rank)}
              </div>

              {/* Avatar */}
              <div className="flex justify-center mb-2 md:mb-3 mt-1.5 md:mt-2">
                {(guestAvatars?.get(entry.author) || getUserAvatar(entry.author)) ? (
                  <img
                    src={guestAvatars?.get(entry.author) || getUserAvatar(entry.author)!}
                    alt={entry.author}
                    className={`rounded-full object-cover border-2 border-gray-700 ${
                      isFirst ? 'w-16 h-16 md:w-20 md:h-20' : 'w-12 h-12 md:w-14 md:h-14'
                    }`}
                  />
                ) : (
                  <div
                    className={`rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center font-bold text-white border-2 border-gray-700 ${
                      isFirst ? 'w-16 h-16 md:w-20 md:h-20 text-xl md:text-2xl' : 'w-12 h-12 md:w-14 md:h-14 text-base md:text-lg'
                    }`}
                  >
                    {entry.author.substring(0, 1).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Nom */}
              <h3 className="text-center font-bold text-white mb-1.5 md:mb-2 text-xs md:text-sm truncate px-1">
                {entry.author}
              </h3>

              {/* Stats */}
              <div className="space-y-0.5 md:space-y-1 text-center">
                <div className="flex items-center justify-center gap-1 md:gap-1.5 text-gray-300 text-[10px] md:text-xs">
                  <Camera className="w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0" />
                  <span className="truncate">{entry.photoCount} photo{entry.photoCount > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center justify-center gap-1 md:gap-1.5 text-gray-300 text-[10px] md:text-xs">
                  <Star className="w-2.5 h-2.5 md:w-3 md:h-3 text-yellow-400 fill-current flex-shrink-0" />
                  <span className="truncate">{entry.totalLikes} like{entry.totalLikes > 1 ? 's' : ''}</span>
                </div>
                {entry.totalReactions > 0 && (
                  <div className="flex items-center justify-center gap-1 md:gap-1.5 text-gray-300 text-[10px] md:text-xs">
                    <span className="text-pink-400">❤️</span>
                    <span className="truncate">{entry.totalReactions} réaction{entry.totalReactions > 1 ? 's' : ''}</span>
                  </div>
                )}
                {entry.score > 0 && (
                  <div className="flex items-center justify-center gap-1 md:gap-1.5 text-blue-400 text-[10px] md:text-xs font-semibold">
                    <Zap className="w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0" />
                    <span className="truncate">{Math.round(entry.score)} pts</span>
                  </div>
                )}
                {(() => {
                  const authorReactionsMap: ReactionCounts = {};
                  photos
                    .filter(p => p.author === entry.author)
                    .forEach(p => {
                      const reactions = photosReactions.get(p.id);
                      if (reactions) {
                        Object.entries(reactions).forEach(([type, count]) => {
                          authorReactionsMap[type as keyof ReactionCounts] = (authorReactionsMap[type as keyof ReactionCounts] || 0) + (count || 0);
                        });
                      }
                    });
                  const hasReactions = Object.values(authorReactionsMap).some(count => count > 0);
                  if (!hasReactions) return null;
                  return (
                    <div className="flex items-center justify-center gap-1 md:gap-1.5 text-gray-300 text-[10px] md:text-xs flex-wrap px-1">
                      {Object.entries(authorReactionsMap).map(([type, count]) => {
                        if (count === 0) return null;
                        const reaction = REACTIONS[type as keyof typeof REACTIONS];
                        if (!reaction) return null;
                        return (
                          <span key={type} className="inline-flex items-center gap-0.5">
                            <span>{reaction.emoji}</span> {count}
                          </span>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Badges */}
              {entry.badges.length > 0 && (
                <div className="flex justify-center gap-1 md:gap-1.5 mt-1.5 md:mt-2 flex-wrap">
                  {entry.badges.map((badge) => (
                    <span
                      key={badge.type}
                      className={`flex items-center gap-0.5 md:gap-1 px-1 md:px-1.5 py-0.5 rounded-full bg-gradient-to-r ${badge.color} text-[9px] md:text-[10px] font-bold text-white`}
                      title={badge.description}
                    >
                      <span>{badge.emoji}</span>
                      <span className="hidden sm:inline">{badge.label}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

