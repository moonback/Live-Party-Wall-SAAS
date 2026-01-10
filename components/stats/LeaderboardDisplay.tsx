import React from 'react';
import { TrendingUp, Camera, Star, Heart, Zap } from 'lucide-react';
import { LeaderboardEntry, Photo, ReactionCounts } from '../../types';
import { getUserAvatar } from '../../utils/userAvatar';
import { REACTIONS } from '../../constants';

interface LeaderboardDisplayProps {
  runners: LeaderboardEntry[];
  leaderboardPage: number;
  pageCount: number;
  pageStart: number;
  pageItems: LeaderboardEntry[];
  photos: Photo[];
  photosReactions: Map<string, ReactionCounts>;
  uploadUrl: string;
  guestAvatars?: Map<string, string>; // Mapping nom -> avatar_url depuis la BDD
}

export const LeaderboardDisplay: React.FC<LeaderboardDisplayProps> = ({
  runners,
  leaderboardPage,
  pageCount,
  pageStart,
  pageItems,
  photos,
  photosReactions,
  uploadUrl,
  guestAvatars,
}) => {
  return (
    <div className="col-span-4 min-h-0 rounded-xl border border-white/5 bg-gray-900/50 backdrop-blur-sm overflow-hidden flex flex-col">
      <div className="shrink-0 px-4 py-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <div>
            <div className="text-base font-bold text-white">Classement</div>
            <div className="text-[10px] text-white/40">
              Page {pageCount === 0 ? 1 : leaderboardPage + 1} / {pageCount}
            </div>
          </div>
        </div>
        <div className="text-[10px] text-white/40">
          {runners.length > 0 ? `Rangs ${pageStart + 4}–${pageStart + 3 + pageItems.length}` : '—'}
        </div>
      </div>

      <div className="flex-1 min-h-0 px-3 py-3 grid grid-rows-8 gap-2">
        {pageItems.length > 0 ? (
          pageItems.map((entry) => (
            <div
              key={entry.author}
              className="rounded-lg border border-white/5 bg-gray-800/30 px-3 py-2 flex items-center gap-3"
            >
              <div className="w-8 text-center font-bold text-white/60 text-sm">
                #{entry.rank}
              </div>
              <div className="relative">
                {(guestAvatars?.get(entry.author) || getUserAvatar(entry.author)) ? (
                  <img
                    src={guestAvatars?.get(entry.author) || getUserAvatar(entry.author)!}
                    className="w-9 h-9 rounded-full object-cover border border-white/5"
                    alt={entry.author}
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center text-sm font-bold text-white border border-white/5">
                    {entry.author.substring(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white truncate text-sm">{entry.author}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-white/50 flex-wrap">
                  <span className="inline-flex items-center gap-0.5">
                    <Camera className="w-2.5 h-2.5" /> {entry.photoCount}
                  </span>
                  <span className="inline-flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 text-yellow-400 fill-current" /> {entry.totalLikes}
                  </span>
                  {entry.totalReactions > 0 && (
                    <span className="inline-flex items-center gap-0.5">
                      <Heart className="w-2.5 h-2.5 text-pink-400 fill-current" /> {entry.totalReactions}
                    </span>
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
                        if (p.reactions) {
                          Object.entries(p.reactions).forEach(([type, count]) => {
                            authorReactionsMap[type as keyof ReactionCounts] = (authorReactionsMap[type as keyof ReactionCounts] || 0) + (count || 0);
                          });
                        }
                      });
                    return Object.entries(authorReactionsMap).map(([type, count]) => {
                      if (count === 0) return null;
                      const reaction = REACTIONS[type as keyof typeof REACTIONS];
                      if (!reaction) return null;
                      return (
                        <span key={type} className="inline-flex items-center gap-0.5">
                          <span>{reaction.emoji}</span> {count}
                        </span>
                      );
                    });
                  })()}
                </div>
              </div>
              <div className="text-right">
                {entry.score > 0 ? (
                  <>
                    <div className="text-sm font-bold text-white flex items-center justify-end gap-1">
                      <Zap className="w-3 h-3 text-blue-400" />
                      {Math.round(entry.score)}
                    </div>
                    <div className="text-[9px] uppercase tracking-wide text-white/30">pts</div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-bold text-white">
                      {entry.photoCount * 10 + entry.totalLikes * 5}
                    </div>
                    <div className="text-[9px] uppercase tracking-wide text-white/30">pts</div>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="row-span-8 flex items-center justify-center text-white/40 text-sm font-medium">
            En attente de plus de joueurs…
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 px-4 py-2.5 border-t border-white/5 bg-white/5 flex items-center justify-between">
        <div className="text-[10px] text-white/40 truncate">
          Participe: {uploadUrl}
        </div>
        {pageCount > 1 && (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: Math.min(pageCount, 6) }).map((_, i) => (
              <div
                key={i}
                className={`h-1 w-5 rounded-full ${
                  (leaderboardPage % Math.min(pageCount, 6)) === i ? 'bg-white/50' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

