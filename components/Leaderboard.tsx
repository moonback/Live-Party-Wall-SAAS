import React, { useMemo } from 'react';
import { Photo, LeaderboardEntry, Badge } from '../types';
import { generateLeaderboard, BADGES } from '../services/gamificationService';
import { Trophy, Camera, Star, TrendingUp } from 'lucide-react';
import { getUserAvatar } from '../utils/userAvatar';

interface LeaderboardProps {
  photos: Photo[];
  maxEntries?: number;
  guestAvatars?: Map<string, string>;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ photos, maxEntries = 10, guestAvatars }) => {
  const leaderboard = useMemo(() => {
    return generateLeaderboard(photos).slice(0, maxEntries);
  }, [photos, maxEntries]);

  if (leaderboard.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30 text-gray-500" />
        <p className="text-lg font-medium text-white">Aucun classement disponible</p>
        <p className="text-sm mt-2 text-gray-500">Les premiers participants apparaîtront ici</p>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/50 bg-gray-800';
    if (rank === 2) return 'from-gray-400/20 to-gray-500/20 border-gray-400/50 bg-gray-800';
    if (rank === 3) return 'from-amber-600/20 to-amber-700/20 border-amber-600/50 bg-gray-800';
    return 'bg-gray-800 border-gray-700';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <h3 className="text-xl font-bold text-white">Classement en Direct</h3>
      </div>

      {leaderboard.map((entry) => (
        <div
          key={entry.author}
          className={`relative bg-gradient-to-r ${getRankColor(entry.rank)} backdrop-blur-sm rounded-xl p-4 border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
        >
          <div className="flex items-center justify-between">
            {/* Rank & Author */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                {/* Avatar ou Initiale */}
                {(guestAvatars?.get(entry.author) || getUserAvatar(entry.author)) ? (
                  <img
                    src={guestAvatars?.get(entry.author) || getUserAvatar(entry.author)!}
                    alt={entry.author}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-700 shadow-lg"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center text-lg font-bold text-white border-2 border-gray-700 shadow-lg">
                    {entry.author.substring(0, 1).toUpperCase()}
                  </div>
                )}
                {/* Badge de rang */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center text-xs font-bold border-2 border-gray-700">
                  {getRankIcon(entry.rank)}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-white truncate">{entry.author}</p>
                  {entry.badges.map((badge) => (
                    <span
                      key={badge.type}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r ${badge.color} text-xs font-bold text-white shadow-lg border border-white/20`}
                      title={badge.description}
                    >
                      <span>{badge.emoji}</span>
                      <span className="hidden sm:inline">{badge.label}</span>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Camera className="w-3 h-3" />
                    <span>{entry.photoCount} photo{entry.photoCount > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span>{entry.totalLikes} like{entry.totalLikes > 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Score Indicator */}
            <div className="flex-shrink-0 ml-4">
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 text-yellow-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-bold">{entry.rank}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Leaderboard;

