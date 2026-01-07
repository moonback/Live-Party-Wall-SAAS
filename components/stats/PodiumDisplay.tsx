import React from 'react';
import { Trophy, Camera, Star } from 'lucide-react';
import { LeaderboardEntry } from '../../types';
import { getUserAvatar } from '../../utils/userAvatar';

interface PodiumDisplayProps {
  top3: LeaderboardEntry[];
  guestAvatars?: Map<string, string>; // Mapping nom -> avatar_url depuis la BDD
}

export const PodiumDisplay: React.FC<PodiumDisplayProps> = ({ top3, guestAvatars }) => {
  return (
    <div className="shrink-0 min-h-[160px] rounded-lg border border-white/5 bg-gray-900/50 backdrop-blur-sm p-3 relative overflow-visible">
      <div className="absolute top-2 left-2.5 flex items-center gap-1.5 z-20">
        <Trophy className="w-3.5 h-3.5 text-yellow-400 animate-bounce-slow" />
        <h2 className="text-sm font-bold text-white">Podium</h2>
      </div>

      <div className="min-h-[140px] flex items-end justify-center gap-2.5 pb-2 pt-8">
        {/* #2 */}
        {top3[1] && (
          <div className="w-[28%] flex flex-col items-center animate-slide-in-left" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            <div className="relative mb-1.5">
              <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-gray-300/60 to-gray-500/60 animate-zoom-in-bounce" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
                {(guestAvatars?.get(top3[1].author) || getUserAvatar(top3[1].author)) ? (
                  <img
                    src={guestAvatars?.get(top3[1].author) || getUserAvatar(top3[1].author)!}
                    className="w-full h-full rounded-full object-cover border border-gray-900"
                    alt={top3[1].author}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-600 flex items-center justify-center text-base font-bold text-white border border-gray-900">
                    {top3[1].author.substring(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1 py-0.5 rounded-full text-[10px] font-bold bg-gray-300 text-gray-900 animate-bounce-in" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
                #2
              </div>
            </div>
            <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
              <div className="text-xs font-bold text-white truncate max-w-[100px]">
                {top3[1].author}
              </div>
              <div className="mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gray-800/40 border border-white/5 text-white/90 text-[9px]">
                <span className="inline-flex items-center gap-0.5 font-semibold">
                  <Camera className="w-2 h-2" /> {top3[1].photoCount}
                </span>
                <span className="inline-flex items-center gap-0.5 font-semibold">
                  <Star className="w-2 h-2 text-yellow-400 fill-current" /> {top3[1].totalLikes}
                </span>
              </div>
            </div>
            <div className="mt-1.5 h-8 w-full rounded-t-lg bg-gradient-to-t from-gray-500/20 to-transparent border-t border-gray-400/10 animate-slide-in-from-bottom" style={{ animationDelay: '0.3s', animationFillMode: 'both' }} />
          </div>
        )}

        {/* #1 */}
        {top3[0] && (
          <div className="w-[32%] flex flex-col items-center -mt-1 z-10 animate-zoom-in-bounce" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            <div className="relative mb-1.5">
              <div className="absolute -inset-1.5 bg-yellow-500/15 blur-md rounded-full animate-pulse-glow" />
              <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-yellow-300 via-yellow-500 to-orange-500 relative animate-pulse-slow animate-podium-glow">
                <Trophy className="absolute -top-3 left-1/2 -translate-x-1/2 w-3.5 h-3.5 text-yellow-400 animate-bounce-slow animate-trophy-spin" style={{ animationDelay: '0.5s' }} />
                {(guestAvatars?.get(top3[0].author) || getUserAvatar(top3[0].author)) ? (
                  <img
                    src={guestAvatars?.get(top3[0].author) || getUserAvatar(top3[0].author)!}
                    className="w-full h-full rounded-full object-cover border border-gray-900"
                    alt={top3[0].author}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-yellow-500 flex items-center justify-center text-xl font-bold text-white border border-gray-900">
                    {top3[0].author.substring(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-yellow-400 text-yellow-950 animate-bounce-in animate-pulse-glow" style={{ animationDelay: '0.7s', animationFillMode: 'both' }}>
                #1
              </div>
            </div>
            <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
              <div className="text-sm font-bold text-white truncate max-w-[120px]">
                {top3[0].author}
              </div>
              <div className="mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-500/10 border border-yellow-400/20 text-yellow-50 text-[9px]">
                <span className="inline-flex items-center gap-0.5 font-semibold">
                  <Camera className="w-2 h-2" /> {top3[0].photoCount}
                </span>
                <span className="inline-flex items-center gap-0.5 font-semibold">
                  <Star className="w-2 h-2 text-yellow-400 fill-current" /> {top3[0].totalLikes}
                </span>
              </div>
            </div>
            <div className="mt-1.5 h-12 w-full rounded-t-lg bg-gradient-to-t from-yellow-500/20 to-transparent border-t border-yellow-400/15 animate-slide-in-from-bottom" style={{ animationDelay: '0.2s', animationFillMode: 'both' }} />
          </div>
        )}

        {/* #3 */}
        {top3[2] && (
          <div className="w-[28%] flex flex-col items-center animate-slide-in-right" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
            <div className="relative mb-1.5">
              <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-amber-500/50 to-amber-700/50 animate-zoom-in-bounce" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
                {(guestAvatars?.get(top3[2].author) || getUserAvatar(top3[2].author)) ? (
                  <img
                    src={guestAvatars?.get(top3[2].author) || getUserAvatar(top3[2].author)!}
                    className="w-full h-full rounded-full object-cover border border-gray-900"
                    alt={top3[2].author}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-amber-600 flex items-center justify-center text-base font-bold text-white border border-gray-900">
                    {top3[2].author.substring(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-amber-50 animate-bounce-in" style={{ animationDelay: '0.7s', animationFillMode: 'both' }}>
                #3
              </div>
            </div>
            <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
              <div className="text-xs font-bold text-white truncate max-w-[100px]">
                {top3[2].author}
              </div>
              <div className="mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gray-800/40 border border-white/5 text-white/90 text-[9px]">
                <span className="inline-flex items-center gap-0.5 font-semibold">
                  <Camera className="w-2 h-2" /> {top3[2].photoCount}
                </span>
                <span className="inline-flex items-center gap-0.5 font-semibold">
                  <Star className="w-2 h-2 text-yellow-400 fill-current" /> {top3[2].totalLikes}
                </span>
              </div>
            </div>
            <div className="mt-1.5 h-6 w-full rounded-t-lg bg-gradient-to-t from-amber-600/20 to-transparent border-t border-amber-500/10 animate-slide-in-from-bottom" style={{ animationDelay: '0.4s', animationFillMode: 'both' }} />
          </div>
        )}
      </div>
    </div>
  );
};

