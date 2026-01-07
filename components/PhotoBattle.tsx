import React, { useState, useEffect, useCallback } from 'react';
import { PhotoBattle as PhotoBattleType, Photo } from '../types';
import { voteForBattle, subscribeToBattleUpdates } from '../services/battleService';
import { useToast } from '../context/ToastContext';
import { Trophy, Users, Clock, Zap, CheckCircle2, XCircle } from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';

interface PhotoBattleProps {
  battle: PhotoBattleType;
  userId: string;
  onBattleFinished?: (battleId: string, winnerId: string | null, winnerPhoto?: Photo) => void;
  compact?: boolean; // Mode compact pour le mur
  onPhotoClick?: (photo: Photo) => void; // Callback pour ouvrir une photo dans le lightbox
}

export const PhotoBattle: React.FC<PhotoBattleProps> = ({
  battle,
  userId,
  onBattleFinished,
  compact = false,
  onPhotoClick,
}) => {
  const { addToast } = useToast();
  const isMobile = useIsMobile();
  const [localBattle, setLocalBattle] = useState<PhotoBattleType>({
    ...battle,
    votes1Count: battle.votes1Count ?? 0,
    votes2Count: battle.votes2Count ?? 0,
  });
  const [isVoting, setIsVoting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [autoCompact, setAutoCompact] = useState(false); // Mode compact automatique après 1 minute

  // Calculer le temps restant et vérifier l'expiration
  useEffect(() => {
    if (!localBattle.expiresAt) return;

    const updateTimeRemaining = async () => {
      const now = Date.now();
      const remaining = Math.max(0, localBattle.expiresAt! - now);
      setTimeRemaining(remaining);

      // Si la battle est expirée et toujours active, la terminer
      if (remaining === 0 && localBattle.status === 'active') {
        try {
          const { finishBattle } = await import('../services/battleService');
          await finishBattle(localBattle.id);
          // La mise à jour sera reçue via Realtime
        } catch (error) {
          console.error('Error finishing expired battle:', error);
        }
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [localBattle.expiresAt, localBattle.status, localBattle.id]);

  // Activer le mode compact automatiquement pour toutes les battles dans la galerie
  // (sauf si compact=true qui est pour le mur)
  useEffect(() => {
    if (compact) return; // Ne pas activer le mode compact si on est déjà en mode compact (mur)
    
    // Activer le mode compact immédiatement pour toutes les battles dans la galerie
    // Cela permet d'avoir un design uniforme et optimisé
    setAutoCompact(true);
  }, [compact]);

  // S'abonner aux mises à jour en temps réel
  useEffect(() => {
    const subscription = subscribeToBattleUpdates(localBattle.id, (updatedBattle) => {
      setLocalBattle(updatedBattle);

      // Si la battle vient de se terminer
      if (
        updatedBattle.status === 'finished' &&
        localBattle.status === 'active' &&
        onBattleFinished
      ) {
        // Déterminer la photo gagnante
        let winnerPhoto: Photo | undefined;
        if (updatedBattle.winnerId) {
          if (updatedBattle.winnerId === updatedBattle.photo1.id) {
            winnerPhoto = updatedBattle.photo1;
          } else if (updatedBattle.winnerId === updatedBattle.photo2.id) {
            winnerPhoto = updatedBattle.photo2;
          }
        }
        onBattleFinished(updatedBattle.id, updatedBattle.winnerId, winnerPhoto);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [localBattle.id, localBattle.status, onBattleFinished]);

  const handleVote = useCallback(
    async (photoId: string) => {
      if (isVoting || localBattle.status !== 'active') return;

      // Vérifier si l'utilisateur a déjà voté pour cette photo
      if (localBattle.userVote === photoId) {
        addToast('Vous avez déjà voté pour cette photo !', 'info');
        return;
      }

      setIsVoting(true);

      try {
        const result = await voteForBattle(localBattle.id, photoId, userId);

        // Mise à jour optimiste
        setLocalBattle((prev) => ({
          ...prev,
          votes1Count: result.votes1Count,
          votes2Count: result.votes2Count,
          userVote: photoId,
        }));

        addToast('Vote enregistré ! 🎉', 'success');
      } catch (error) {
        console.error('Error voting:', error);
        addToast('Erreur lors du vote', 'error');
      } finally {
        setIsVoting(false);
      }
    },
    [localBattle, userId, isVoting, addToast]
  );

  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const totalVotes = localBattle.votes1Count + localBattle.votes2Count;
  const photo1Percentage = totalVotes > 0 ? (localBattle.votes1Count / totalVotes) * 100 : 50;
  const photo2Percentage = totalVotes > 0 ? (localBattle.votes2Count / totalVotes) * 100 : 50;

  const isPhoto1Winner = localBattle.status === 'finished' && localBattle.winnerId === localBattle.photo1.id;
  const isPhoto2Winner = localBattle.status === 'finished' && localBattle.winnerId === localBattle.photo2.id;
  const isDraw = localBattle.status === 'finished' && !localBattle.winnerId;

  const hasUserVoted = !!localBattle.userVote;
  const userVotedForPhoto1 = localBattle.userVote === localBattle.photo1.id;
  const userVotedForPhoto2 = localBattle.userVote === localBattle.photo2.id;

  // Mode compact pour la galerie - s'affiche comme une photo dans la grille avec un design amélioré
  if (autoCompact && !compact) {
    return (
      <div className="bg-gradient-to-br from-slate-900/95 via-purple-900/20 to-slate-800/95 backdrop-blur-xl rounded-2xl overflow-hidden border-2 border-pink-500/40 shadow-2xl transition-all duration-500 group hover:shadow-pink-500/30 hover:border-pink-500/60 hover:scale-[1.02] relative">
        {/* Effet de glow animé */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 rounded-2xl opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-500"></div>
        
        {/* Header compact amélioré */}
        <div className="relative flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900/95 via-purple-900/30 to-slate-800/95 border-b border-pink-500/30">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 rounded-full p-1.5 shadow-lg animate-pulse">
              <Zap className="w-4 h-4 text-yellow-900" />
            </div>
            <span className="text-white font-bold text-sm bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              Photo Battle
            </span>
          </div>
          {timeRemaining !== null && localBattle.status === 'active' && (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 px-3 py-1.5 rounded-full border border-yellow-400/50 shadow-lg">
              <Clock className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-yellow-300 font-bold text-xs">
                {formatTimeRemaining(timeRemaining)}
              </span>
            </div>
          )}
        </div>

        {/* Battle Grid compact amélioré */}
        <div className="relative grid grid-cols-2 gap-3 p-4">
          {/* Photo 1 */}
          <div
            className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 shadow-lg ${
              isPhoto1Winner
                ? 'ring-3 ring-yellow-400 scale-105 shadow-yellow-400/50'
                : userVotedForPhoto1
                ? 'ring-2 ring-pink-400 shadow-pink-400/30'
                : localBattle.status === 'active' && !hasUserVoted
                ? 'hover:ring-2 hover:ring-pink-400/60 hover:scale-[1.03] hover:shadow-xl'
                : 'hover:ring-2 hover:ring-pink-400/50 hover:scale-[1.02]'
            }`}
            onClick={(e) => {
              // Si la battle est active et l'utilisateur n'a pas voté, voter
              if (localBattle.status === 'active' && !hasUserVoted) {
                e.stopPropagation();
                handleVote(localBattle.photo1.id);
              } else if (onPhotoClick) {
                // Sinon, ouvrir la photo dans le lightbox
                e.stopPropagation();
                onPhotoClick(localBattle.photo1);
              }
            }}
          >
            <img
              src={localBattle.photo1.url}
              alt={localBattle.photo1.caption}
              className="w-full h-40 object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm font-bold drop-shadow-lg">
                  {Math.round(photo1Percentage)}%
                </span>
                {userVotedForPhoto1 && (
                  <CheckCircle2 className="w-4 h-4 text-pink-400 drop-shadow-lg" />
                )}
              </div>
            </div>
            {isPhoto1Winner && (
              <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full p-1.5 shadow-xl animate-bounce">
                <Trophy className="w-4 h-4 text-yellow-900" />
              </div>
            )}
          </div>

          {/* Photo 2 */}
          <div
            className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 shadow-lg ${
              isPhoto2Winner
                ? 'ring-3 ring-yellow-400 scale-105 shadow-yellow-400/50'
                : userVotedForPhoto2
                ? 'ring-2 ring-pink-400 shadow-pink-400/30'
                : localBattle.status === 'active' && !hasUserVoted
                ? 'hover:ring-2 hover:ring-pink-400/60 hover:scale-[1.03] hover:shadow-xl'
                : 'hover:ring-2 hover:ring-pink-400/50 hover:scale-[1.02]'
            }`}
            onClick={(e) => {
              // Si la battle est active et l'utilisateur n'a pas voté, voter
              if (localBattle.status === 'active' && !hasUserVoted) {
                e.stopPropagation();
                handleVote(localBattle.photo2.id);
              } else if (onPhotoClick) {
                // Sinon, ouvrir la photo dans le lightbox
                e.stopPropagation();
                onPhotoClick(localBattle.photo2);
              }
            }}
          >
            <img
              src={localBattle.photo2.url}
              alt={localBattle.photo2.caption}
              className="w-full h-40 object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm font-bold drop-shadow-lg">
                  {Math.round(photo2Percentage)}%
                </span>
                {userVotedForPhoto2 && (
                  <CheckCircle2 className="w-4 h-4 text-pink-400 drop-shadow-lg" />
                )}
              </div>
            </div>
            {isPhoto2Winner && (
              <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full p-1.5 shadow-xl animate-bounce">
                <Trophy className="w-4 h-4 text-yellow-900" />
              </div>
            )}
          </div>
        </div>

        {/* Footer compact amélioré */}
        <div className="relative flex items-center justify-center gap-2.5 px-4 py-3 bg-gradient-to-r from-slate-900/95 via-purple-900/20 to-slate-800/95 border-t border-pink-500/30">
          <Users className="w-4 h-4 text-pink-400" />
          <span className="text-slate-200 text-xs font-semibold">
            {totalVotes} vote{totalVotes > 1 ? 's' : ''}
          </span>
          {hasUserVoted && (
            <span className="text-pink-400 text-sm font-bold">✓ Voté</span>
          )}
        </div>
      </div>
    );
  }

  if (compact) {
    // Mode compact pour le mur - Design premium amélioré
    return (
      <div className="bg-gradient-to-br from-slate-900/98 via-purple-900/30 to-slate-800/98 backdrop-blur-2xl rounded-3xl p-4 md:p-5 border-2 border-pink-500/50 shadow-[0_20px_60px_rgba(236,72,153,0.4)] transition-all duration-500 group hover:shadow-[0_30px_80px_rgba(236,72,153,0.6)] hover:border-pink-500/70 hover:scale-[1.02] relative overflow-hidden">
        {/* Effet de glow animé amélioré */}
        <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 rounded-3xl opacity-25 blur-2xl group-hover:opacity-35 transition-opacity duration-500 animate-pulse-slow"></div>
        
        {/* Header compact premium */}
        <div className="relative flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 rounded-full p-2 shadow-xl animate-pulse">
              <Zap className="w-5 h-5 text-yellow-900" />
            </div>
            <span className="text-white font-bold text-sm md:text-base bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
              Photo Battle
            </span>
          </div>
          {timeRemaining !== null && localBattle.status === 'active' && (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-500/30 via-orange-500/30 to-yellow-500/30 px-3 py-1.5 rounded-full border border-yellow-400/60 shadow-lg backdrop-blur-sm">
              <Clock className="w-3.5 h-3.5 text-yellow-300" />
              <span className="text-yellow-200 font-bold text-xs md:text-sm drop-shadow-md">
                {formatTimeRemaining(timeRemaining)}
              </span>
            </div>
          )}
        </div>

        {/* Battle Grid premium */}
        <div className="relative grid grid-cols-2 gap-3 md:gap-4">
          {/* Photo 1 */}
          <div
            className={`relative rounded-2xl overflow-hidden transition-all duration-300 shadow-xl ${
              isPhoto1Winner
                ? 'ring-4 ring-yellow-400 scale-105 shadow-yellow-400/60'
                : userVotedForPhoto1
                ? 'ring-3 ring-pink-400 shadow-pink-400/40'
                : ''
            }`}
          >
            <img
              src={localBattle.photo1.url}
              alt={localBattle.photo1.caption}
              className="w-full h-36 md:h-40 object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/85 to-transparent p-2.5 md:p-3">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm md:text-base font-bold drop-shadow-lg">
                  {Math.round(photo1Percentage)}%
                </span>
                {userVotedForPhoto1 && (
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-pink-400 drop-shadow-lg" />
                )}
              </div>
            </div>
            {isPhoto1Winner && (
              <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full p-1.5 md:p-2 shadow-2xl animate-bounce">
                <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-900" />
              </div>
            )}
          </div>

          {/* Photo 2 */}
          <div
            className={`relative rounded-2xl overflow-hidden transition-all duration-300 shadow-xl ${
              isPhoto2Winner
                ? 'ring-4 ring-yellow-400 scale-105 shadow-yellow-400/60'
                : userVotedForPhoto2
                ? 'ring-3 ring-pink-400 shadow-pink-400/40'
                : ''
            }`}
          >
            <img
              src={localBattle.photo2.url}
              alt={localBattle.photo2.caption}
              className="w-full h-36 md:h-40 object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/85 to-transparent p-2.5 md:p-3">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm md:text-base font-bold drop-shadow-lg">
                  {Math.round(photo2Percentage)}%
                </span>
                {userVotedForPhoto2 && (
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-pink-400 drop-shadow-lg" />
                )}
              </div>
            </div>
            {isPhoto2Winner && (
              <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full p-1.5 md:p-2 shadow-2xl animate-bounce">
                <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-900" />
              </div>
            )}
          </div>
        </div>

        {/* Footer premium */}
        <div className="relative mt-4 flex items-center justify-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-slate-900/60 via-purple-900/20 to-slate-800/60 rounded-xl border border-pink-500/30 backdrop-blur-sm">
          <Users className="w-4 h-4 text-pink-400" />
          <span className="text-slate-200 text-xs md:text-sm font-semibold">
            {totalVotes} vote{totalVotes > 1 ? 's' : ''}
          </span>
        </div>
      </div>
    );
  }

  // Mode complet pour la galerie
  return (
    <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-2xl p-4 md:p-6 border-2 border-pink-500/30 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full p-2">
            <Zap className="w-5 h-5 text-yellow-900" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Photo Battle</h3>
            <p className="text-slate-400 text-xs">
              {localBattle.status === 'active' ? 'Quelle photo gagne ?' : 'Battle terminée'}
            </p>
          </div>
        </div>
        {timeRemaining !== null && localBattle.status === 'active' && (
          <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1.5 rounded-full border border-yellow-400/30">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-bold text-sm">
              {formatTimeRemaining(timeRemaining)}
            </span>
          </div>
        )}
      </div>

      {/* Battle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Photo 1 */}
        <div
          className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
            isPhoto1Winner
              ? 'ring-4 ring-yellow-400 scale-105 shadow-2xl shadow-yellow-400/50'
              : userVotedForPhoto1
              ? 'ring-2 ring-pink-400'
              : localBattle.status === 'active' && !hasUserVoted
              ? 'cursor-pointer hover:ring-2 hover:ring-pink-400/50 hover:scale-[1.02]'
              : ''
          }`}
          onClick={() => localBattle.status === 'active' && !hasUserVoted && handleVote(localBattle.photo1.id)}
        >
          <img
            src={localBattle.photo1.url}
            alt={localBattle.photo1.caption}
            className={`w-full ${
              isMobile ? 'h-48' : 'h-64'
            } object-cover`}
          />
          
          {/* Overlay avec pourcentage */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-white font-bold text-sm">{localBattle.photo1.author}</p>
                <p className="text-slate-300 text-xs truncate">{localBattle.photo1.caption}</p>
              </div>
              {userVotedForPhoto1 && (
                <CheckCircle2 className="w-6 h-6 text-pink-400 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-pink-500 to-purple-500 h-full transition-all duration-500"
                  style={{ width: `${photo1Percentage}%` }}
                />
              </div>
              <span className="text-white font-bold text-sm min-w-[3rem] text-right">
                {Math.round(photo1Percentage)}%
              </span>
            </div>
          </div>

          {/* Badge Winner */}
          {isPhoto1Winner && (
            <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full p-2 shadow-xl animate-bounce">
              <Trophy className="w-6 h-6 text-yellow-900" />
            </div>
          )}

          {/* Badge Voted */}
          {userVotedForPhoto1 && localBattle.status === 'active' && (
            <div className="absolute top-4 left-4 bg-pink-500 rounded-full px-3 py-1 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span className="text-white text-xs font-bold">Votre vote</span>
            </div>
          )}
        </div>

        {/* VS Separator */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
          <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-full p-3 shadow-2xl border-4 border-slate-900">
            <span className="text-white font-black text-xl">VS</span>
          </div>
        </div>

        {/* Photo 2 */}
        <div
          className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
            isPhoto2Winner
              ? 'ring-4 ring-yellow-400 scale-105 shadow-2xl shadow-yellow-400/50'
              : userVotedForPhoto2
              ? 'ring-2 ring-pink-400'
              : localBattle.status === 'active' && !hasUserVoted
              ? 'cursor-pointer hover:ring-2 hover:ring-pink-400/50 hover:scale-[1.02]'
              : ''
          }`}
          onClick={() => localBattle.status === 'active' && !hasUserVoted && handleVote(localBattle.photo2.id)}
        >
          <img
            src={localBattle.photo2.url}
            alt={localBattle.photo2.caption}
            className={`w-full ${
              isMobile ? 'h-48' : 'h-64'
            } object-cover`}
          />
          
          {/* Overlay avec pourcentage */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-white font-bold text-sm">{localBattle.photo2.author}</p>
                <p className="text-slate-300 text-xs truncate">{localBattle.photo2.caption}</p>
              </div>
              {userVotedForPhoto2 && (
                <CheckCircle2 className="w-6 h-6 text-pink-400 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-500"
                  style={{ width: `${photo2Percentage}%` }}
                />
              </div>
              <span className="text-white font-bold text-sm min-w-[3rem] text-right">
                {Math.round(photo2Percentage)}%
              </span>
            </div>
          </div>

          {/* Badge Winner */}
          {isPhoto2Winner && (
            <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full p-2 shadow-xl animate-bounce">
              <Trophy className="w-6 h-6 text-yellow-900" />
            </div>
          )}

          {/* Badge Voted */}
          {userVotedForPhoto2 && localBattle.status === 'active' && (
            <div className="absolute top-4 left-4 bg-pink-500 rounded-full px-3 py-1 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span className="text-white text-xs font-bold">Votre vote</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300 text-sm font-semibold">
              {totalVotes} vote{totalVotes > 1 ? 's' : ''}
            </span>
          </div>
          {localBattle.status === 'finished' && isDraw && (
            <div className="flex items-center gap-2 text-yellow-400">
              <XCircle className="w-4 h-4" />
              <span className="text-sm font-semibold">Égalité !</span>
            </div>
          )}
        </div>
        {localBattle.status === 'active' && !hasUserVoted && (
          <p className="text-slate-400 text-xs">Cliquez sur une photo pour voter</p>
        )}
        {hasUserVoted && (
          <p className="text-pink-400 text-xs font-semibold">✓ Vote enregistré</p>
        )}
      </div>
    </div>
  );
};

