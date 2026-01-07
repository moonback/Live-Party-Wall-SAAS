import React from 'react';
import { TrendingUp, Camera, Star, Trophy } from 'lucide-react';
import { LeaderboardEntry, Photo, ReactionCounts } from '../../types';
import { getUserAvatar } from '../../utils/userAvatar';
import { REACTIONS } from '../../constants';

interface LeaderboardNormalProps {
  leaderboard: LeaderboardEntry[];
  photos: Photo[];
  photosReactions: Map<string, ReactionCounts>;
  getRankIcon: (rank: number) => string;
  getRankColor: (rank: number) => string;
  guestAvatars?: Map<string, string>; // Mapping nom -> avatar_url depuis la BDD
}

export const LeaderboardNormal: React.FC<LeaderboardNormalProps> = ({
  leaderboard,
  photos,
  photosReactions,
  getRankIcon,
  getRankColor,
  guestAvatars,
}) => {
  return (
    <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg border border-white/5 p-3 md:p-5">
      <div className="flex items-center gap-2 mb-3 md:mb-4">
        <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-purple-400 flex-shrink-0" />
        <h2 className="text-base md:text-lg font-bold text-white">Classement Complet</h2>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-6 md:py-8 text-gray-400">
          <Trophy className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 opacity-30 text-gray-500" />
          <p className="text-sm md:text-base font-medium text-white">Aucun classement disponible</p>
          <p className="text-[10px] md:text-xs mt-1 md:mt-1.5 text-gray-500">Les premiers participants apparaîtront ici</p>
        </div>
      ) : (
        <div className="space-y-1.5 md:space-y-2">
          {leaderboard.map((entry) => (
            <div
              key={entry.author}
              className={`relative bg-gradient-to-r ${getRankColor(entry.rank)} backdrop-blur-sm rounded-lg p-2 md:p-3 border transition-all duration-300 hover:scale-[1.01]`}
            >
              <div className="flex items-center justify-between gap-2">
                {/* Rank & Author */}
                <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    {/* Avatar ou Initiale */}
                    {(guestAvatars?.get(entry.author) || getUserAvatar(entry.author)) ? (
                      <img
                        src={guestAvatars?.get(entry.author) || getUserAvatar(entry.author)!}
                        alt={entry.author}
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border border-gray-700"
                      />
                    ) : (
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center text-xs md:text-sm font-bold text-white border border-gray-700">
                        {entry.author.substring(0, 1).toUpperCase()}
                      </div>
                    )}
                    {/* Badge de rang */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 md:w-5 md:h-5 rounded-full bg-gray-900 flex items-center justify-center text-[9px] md:text-[10px] font-bold border border-gray-700">
                      {getRankIcon(entry.rank)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 md:gap-1.5 mb-0.5 flex-wrap">
                      <p className="font-bold text-white truncate text-xs md:text-sm">{entry.author}</p>
                      {entry.badges.map((badge) => (
                        <span
                          key={badge.type}
                          className={`flex items-center gap-0.5 px-1 md:px-1.5 py-0.5 rounded-full bg-gradient-to-r ${badge.color} text-[9px] md:text-[10px] font-bold text-white border border-white/10 flex-shrink-0`}
                          title={badge.description}
                        >
                          <span>{badge.emoji}</span>
                          <span className="hidden sm:inline">{badge.label}</span>
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 text-[9px] md:text-[10px] text-gray-400 flex-wrap">
                      <div className="flex items-center gap-0.5">
                        <Camera className="w-2 h-2 md:w-2.5 md:h-2.5 flex-shrink-0" />
                        <span className="whitespace-nowrap">{entry.photoCount} photo{entry.photoCount > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Star className="w-2 h-2 md:w-2.5 md:h-2.5 text-yellow-400 fill-current flex-shrink-0" />
                        <span className="whitespace-nowrap">{entry.totalLikes} like{entry.totalLikes > 1 ? 's' : ''}</span>
                      </div>
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
                        return Object.entries(authorReactionsMap).map(([type, count]) => {
                          if (count === 0) return null;
                          const reaction = REACTIONS[type as keyof typeof REACTIONS];
                          if (!reaction) return null;
                          return (
                            <div key={type} className="flex items-center gap-0.5 whitespace-nowrap">
                              <span>{reaction.emoji}</span>
                              <span>{count}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>

                {/* Score Indicator */}
                <div className="flex-shrink-0 ml-2">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-0.5 md:gap-1 text-yellow-400">
                      <TrendingUp className="w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0" />
                      <span className="text-[10px] md:text-xs font-bold">#{entry.rank}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

