import React from 'react';
import { Swords, Trophy, Users, Clock, X } from 'lucide-react';
import { PhotoBattle } from '../../types';

interface BattleDetailsModalProps {
  battle: PhotoBattle;
  formatTime: (timestamp: number) => string;
  onClose: () => void;
}

export const BattleDetailsModal: React.FC<BattleDetailsModalProps> = ({
  battle,
  formatTime,
  onClose,
}) => {
  const totalVotes = battle.votes1Count + battle.votes2Count;
  const photo1Percentage = totalVotes > 0 ? Math.round((battle.votes1Count / totalVotes) * 100) : 0;
  const photo2Percentage = totalVotes > 0 ? Math.round((battle.votes2Count / totalVotes) * 100) : 0;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-xl border border-white/10 max-w-5xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-pink-400" />
            <h3 className="text-lg font-bold text-white">Détails de la Battle</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className={`relative rounded-lg overflow-hidden border-2 ${
              battle.winnerId === battle.photo1.id
                ? 'border-yellow-400 shadow-lg shadow-yellow-400/30'
                : 'border-white/10'
            }`}>
              <img src={battle.photo1.url} alt={battle.photo1.caption || ''} className="w-full aspect-square object-cover" />
              {battle.winnerId === battle.photo1.id && (
                <div className="absolute top-2 right-2 bg-yellow-400 rounded-full p-1.5 shadow-lg">
                  <Trophy className="w-4 h-4 text-yellow-900" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <div className="text-white font-bold text-sm">{battle.photo1.author}</div>
                {battle.photo1.caption && (
                  <div className="text-white/70 text-xs mt-0.5">{battle.photo1.caption}</div>
                )}
              </div>
            </div>
            <div className={`relative rounded-lg overflow-hidden border-2 ${
              battle.winnerId === battle.photo2.id
                ? 'border-yellow-400 shadow-lg shadow-yellow-400/30'
                : 'border-white/10'
            }`}>
              <img src={battle.photo2.url} alt={battle.photo2.caption || ''} className="w-full aspect-square object-cover" />
              {battle.winnerId === battle.photo2.id && (
                <div className="absolute top-2 right-2 bg-yellow-400 rounded-full p-1.5 shadow-lg">
                  <Trophy className="w-4 h-4 text-yellow-900" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <div className="text-white font-bold text-sm">{battle.photo2.author}</div>
                {battle.photo2.caption && (
                  <div className="text-white/70 text-xs mt-0.5">{battle.photo2.caption}</div>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/40 border border-white/5">
              <div className="text-center flex-1">
                <div className="text-2xl font-bold text-white">{battle.votes1Count}</div>
                <div className="text-xs text-white/50 mt-1">Votes Photo 1</div>
                <div className="text-sm text-white/70 mt-1">
                  {photo1Percentage}%
                </div>
              </div>
              <div className="text-center flex-1">
                <div className="text-2xl font-bold text-white">{battle.votes2Count}</div>
                <div className="text-xs text-white/50 mt-1">Votes Photo 2</div>
                <div className="text-sm text-white/70 mt-1">
                  {photo2Percentage}%
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/40 border border-white/5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-white/50" />
                <span className="text-sm text-white/70">
                  {totalVotes} vote{totalVotes > 1 ? 's' : ''} total
                </span>
              </div>
              {battle.finishedAt && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-white/50" />
                  <span className="text-sm text-white/70">{formatTime(battle.finishedAt)}</span>
                </div>
              )}
            </div>
            {battle.winnerId ? (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-400/20 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-semibold">
                  Gagnant: {battle.winnerId === battle.photo1.id ? battle.photo1.author : battle.photo2.author}
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-gray-700/40 border border-gray-600/30 flex items-center gap-2">
                <span className="text-white/70 font-medium">Égalité - Pas de gagnant</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

