import React from 'react';
import { Swords, Zap, Trophy } from 'lucide-react';
import { PhotoBattle } from '../../types';

interface PhotoBattlesResultsProps {
  finishedBattles: PhotoBattle[];
  onBattleClick: (battle: PhotoBattle) => void;
  formatTime: (timestamp: number) => string;
  variant?: 'display' | 'normal';
}

export const PhotoBattlesResults: React.FC<PhotoBattlesResultsProps> = ({
  finishedBattles,
  onBattleClick,
  formatTime,
  variant = 'normal',
}) => {
  if (finishedBattles.length === 0) return null;

  if (variant === 'display') {
    return (
      <div className="flex-1 min-h-0 rounded-xl border border-white/5 bg-gray-900/50 backdrop-blur-sm overflow-hidden flex flex-col">
        <div className="shrink-0 px-4 py-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-pink-400" />
            <div>
              <div className="text-base font-bold text-white">Résultats des Photo Battles</div>
              <div className="text-[10px] text-white/40">
                {finishedBattles.length} battle{finishedBattles.length > 1 ? 's' : ''} terminée{finishedBattles.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0 px-3 py-3 overflow-x-auto">
          <div className="flex gap-3 h-full">
            {finishedBattles.slice(0, 5).map((battle) => {
              const totalVotes = battle.votes1Count + battle.votes2Count;
              const photo1Percentage = totalVotes > 0 ? Math.round((battle.votes1Count / totalVotes) * 100) : 0;
              const photo2Percentage = totalVotes > 0 ? Math.round((battle.votes2Count / totalVotes) * 100) : 0;
              const isPhoto1Winner = battle.winnerId === battle.photo1.id;
              const isPhoto2Winner = battle.winnerId === battle.photo2.id;
              const isTie = !battle.winnerId;

              return (
                <div
                  key={battle.id}
                  onClick={() => onBattleClick(battle)}
                  className={`shrink-0 w-48 bg-gradient-to-br ${
                    isTie
                      ? 'from-gray-800/40 to-gray-800/20 border-gray-700/30'
                      : 'from-yellow-500/10 to-orange-500/5 border-yellow-500/20'
                  } backdrop-blur-sm rounded-lg p-3 border cursor-pointer hover:scale-105 transition-transform`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Zap className="w-3 h-3 text-pink-400" />
                    {isTie ? (
                      <span className="text-[9px] bg-gray-700/50 px-1.5 py-0.5 rounded-full text-white/70">
                        Égalité
                      </span>
                    ) : (
                      <Trophy className="w-3 h-3 text-yellow-400" />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    <div className={`aspect-square rounded overflow-hidden border ${
                      isPhoto1Winner ? 'border-yellow-400' : 'border-white/10'
                    }`}>
                      <img src={battle.photo1.url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className={`aspect-square rounded overflow-hidden border ${
                      isPhoto2Winner ? 'border-yellow-400' : 'border-white/10'
                    }`}>
                      <img src={battle.photo2.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-white/60">
                    <span>{photo1Percentage}% vs {photo2Percentage}%</span>
                    <span>{totalVotes} votes</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg p-5 border border-white/5 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Swords className="w-5 h-5 text-pink-400" />
        <h2 className="text-lg font-bold text-white">Résultats des Photo Battles</h2>
        <span className="text-xs text-white/50 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
          {finishedBattles.length} battle{finishedBattles.length > 1 ? 's' : ''}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {finishedBattles.map((battle) => {
          const totalVotes = battle.votes1Count + battle.votes2Count;
          const photo1Percentage = totalVotes > 0 ? Math.round((battle.votes1Count / totalVotes) * 100) : 0;
          const photo2Percentage = totalVotes > 0 ? Math.round((battle.votes2Count / totalVotes) * 100) : 0;
          const isPhoto1Winner = battle.winnerId === battle.photo1.id;
          const isPhoto2Winner = battle.winnerId === battle.photo2.id;
          const isTie = !battle.winnerId;

          return (
            <div
              key={battle.id}
              onClick={() => onBattleClick(battle)}
              className={`bg-gradient-to-br ${
                isTie
                  ? 'from-gray-800/40 to-gray-800/20 border-gray-700/30'
                  : isPhoto1Winner
                  ? 'from-yellow-500/10 to-orange-500/5 border-yellow-500/20'
                  : 'from-yellow-500/10 to-orange-500/5 border-yellow-500/20'
              } backdrop-blur-sm rounded-lg p-4 border transition-all duration-300 hover:scale-[1.02] cursor-pointer`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-pink-400" />
                  <span className="text-xs text-white/60 font-medium">
                    {battle.finishedAt ? formatTime(battle.finishedAt) : 'Terminée'}
                  </span>
                </div>
                {isTie ? (
                  <span className="text-xs bg-gray-700/50 px-2 py-0.5 rounded-full text-white/70 border border-gray-600/30">
                    Égalité
                  </span>
                ) : (
                  <Trophy className="w-4 h-4 text-yellow-400" />
                )}
              </div>

              {/* Photos Grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {/* Photo 1 */}
                <div className="relative">
                  <div className={`aspect-square rounded-lg overflow-hidden border-2 ${
                    isPhoto1Winner
                      ? 'border-yellow-400 shadow-lg shadow-yellow-400/30'
                      : 'border-white/10'
                  }`}>
                    <img
                      src={battle.photo1.url}
                      alt={battle.photo1.caption}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {isPhoto1Winner && (
                    <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1 shadow-lg">
                      <Trophy className="w-3 h-3 text-yellow-900" />
                    </div>
                  )}
                  <div className="mt-1.5 text-center">
                    <div className="text-xs font-bold text-white">
                      {photo1Percentage}%
                    </div>
                    <div className="text-[10px] text-white/50">
                      {battle.votes1Count} vote{battle.votes1Count > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Photo 2 */}
                <div className="relative">
                  <div className={`aspect-square rounded-lg overflow-hidden border-2 ${
                    isPhoto2Winner
                      ? 'border-yellow-400 shadow-lg shadow-yellow-400/30'
                      : 'border-white/10'
                  }`}>
                    <img
                      src={battle.photo2.url}
                      alt={battle.photo2.caption}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {isPhoto2Winner && (
                    <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1 shadow-lg">
                      <Trophy className="w-3 h-3 text-yellow-900" />
                    </div>
                  )}
                  <div className="mt-1.5 text-center">
                    <div className="text-xs font-bold text-white">
                      {photo2Percentage}%
                    </div>
                    <div className="text-[10px] text-white/50">
                      {battle.votes2Count} vote{battle.votes2Count > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-1.5 text-[10px] text-white/50">
                  <span>{totalVotes} vote{totalVotes > 1 ? 's' : ''} total</span>
                </div>
                {!isTie && (
                  <div className="text-[10px] text-yellow-400 font-semibold">
                    {isPhoto1Winner ? battle.photo1.author : battle.photo2.author} gagne
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

