import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhotoBattle, Photo } from '../../types';
import { subscribeToBattleUpdates } from '../../services/battleService';
import { Trophy, Clock, Users, Zap } from 'lucide-react';
import { FireworksEffect } from '../arEffects/FireworksEffect';
import { WinnerOverlay } from '../wall/Overlays/WinnerOverlay';
import { TieOverlay } from '../wall/Overlays/TieOverlay';

interface BattleOverlayProps {
  battle: PhotoBattle | null;
  onBattleFinished?: (battleId: string, winnerId: string | null, winnerPhoto?: Photo) => void;
}

type BattleDisplayState = 'launch' | 'discrete' | 'hidden';

/**
 * Composant overlay pour afficher les battles en cours dans la projection
 * Gère trois états : déclenchement (100% visible), discret (réduit), gagnant (affichage complet)
 */
export const BattleOverlay: React.FC<BattleOverlayProps> = ({
  battle,
  onBattleFinished,
}) => {
  const [localBattle, setLocalBattle] = useState<PhotoBattle | null>(battle);
  const [displayState, setDisplayState] = useState<BattleDisplayState>('hidden');
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [battleStartTime, setBattleStartTime] = useState<number | null>(null);
  const [winnerPhoto, setWinnerPhoto] = useState<Photo | null>(null);
  const [tieData, setTieData] = useState<{ photo1: Photo; photo2: Photo } | null>(null);

  // Mettre à jour la battle locale quand elle change
  useEffect(() => {
    if (battle) {
      setLocalBattle(battle);
      setBattleStartTime(Date.now());
      
      // Si la battle vient de commencer, afficher en mode "launch"
      if (battle.status === 'active') {
        setDisplayState('launch');
        
        // Après 5 secondes, passer en mode discret
        const timer = setTimeout(() => {
          setDisplayState('discrete');
        }, 5000);
        
        return () => clearTimeout(timer);
      } else if (battle.status === 'finished') {
        // Battle terminée, déterminer le gagnant ou l'égalité
        if (battle.winnerId) {
          const winner = battle.winnerId === battle.photo1.id ? battle.photo1 : battle.photo2;
          setWinnerPhoto(winner);
          setTimeout(() => setWinnerPhoto(null), 5000);
        } else {
          setTieData({
            photo1: battle.photo1,
            photo2: battle.photo2
          });
          setTimeout(() => setTieData(null), 5000);
        }
      }
    } else {
      setDisplayState('hidden');
      setLocalBattle(null);
    }
  }, [battle]);

  // Calculer le temps restant
  useEffect(() => {
    if (!localBattle?.expiresAt || localBattle.status !== 'active') {
      setTimeRemaining(null);
      return;
    }

    const updateTimeRemaining = () => {
      const now = Date.now();
      const remaining = Math.max(0, localBattle.expiresAt! - now);
      setTimeRemaining(remaining);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [localBattle?.expiresAt, localBattle?.status]);

  // S'abonner aux mises à jour de la battle en temps réel
  useEffect(() => {
    if (!localBattle) return;

    const subscription = subscribeToBattleUpdates(localBattle.id, (updatedBattle) => {
      setLocalBattle(updatedBattle);

      // Si la battle vient de se terminer
      if (
        updatedBattle.status === 'finished' &&
        localBattle.status === 'active'
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
        
        // Afficher le modal de résultat
        if (winnerPhoto) {
          setWinnerPhoto(winnerPhoto);
          setTimeout(() => setWinnerPhoto(null), 5000);
        } else {
          setTieData({
            photo1: updatedBattle.photo1,
            photo2: updatedBattle.photo2
          });
          setTimeout(() => setTieData(null), 5000);
        }
        
        // Appeler le callback
        if (onBattleFinished) {
          onBattleFinished(updatedBattle.id, updatedBattle.winnerId, winnerPhoto);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [localBattle?.id, localBattle?.status, onBattleFinished]);

  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const totalVotes = localBattle ? localBattle.votes1Count + localBattle.votes2Count : 0;
  const photo1Percentage = totalVotes > 0 && localBattle ? (localBattle.votes1Count / totalVotes) * 100 : 50;
  const photo2Percentage = totalVotes > 0 && localBattle ? (localBattle.votes2Count / totalVotes) * 100 : 50;

  const isPhoto1Winner = localBattle?.status === 'finished' && localBattle.winnerId === localBattle.photo1.id;
  const isPhoto2Winner = localBattle?.status === 'finished' && localBattle.winnerId === localBattle.photo2.id;
  const isDraw = localBattle?.status === 'finished' && !localBattle.winnerId;

  // État "Déclenchement" - Affichage complet
  if (localBattle && displayState === 'launch') {
    return (
      <>
        <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="absolute top-8 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-4 md:px-6"
      >
        <div className="bg-gradient-to-br from-slate-900/95 via-purple-900/40 to-slate-800/95 backdrop-blur-xl rounded-3xl p-4 md:p-6 border-2 border-pink-500/50 shadow-2xl">
          {/* Effet de glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 rounded-3xl opacity-30 blur-2xl animate-pulse"></div>
          
          {/* Header */}
          <div className="relative flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 rounded-full p-2 shadow-xl animate-pulse">
                <Zap className="w-5 h-5 md:w-6 md:h-6 text-yellow-900" />
              </div>
              <span className="text-white font-bold text-lg md:text-xl bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Photo Battle
              </span>
            </div>
            {timeRemaining !== null && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/30 via-orange-500/30 to-yellow-500/30 px-4 py-2 rounded-full border border-yellow-400/60 shadow-lg backdrop-blur-sm">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-yellow-300" />
                <span className="text-yellow-200 font-bold text-sm md:text-base drop-shadow-md">
                  {formatTimeRemaining(timeRemaining)}
                </span>
              </div>
            )}
          </div>

          {/* Battle Grid */}
          <div className="relative grid grid-cols-2 gap-4 md:gap-6">
            {/* Photo 1 */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className={`relative rounded-2xl overflow-hidden shadow-xl ${
                isPhoto1Winner ? 'ring-4 ring-yellow-400' : ''
              }`}
            >
              <img
                src={localBattle.photo1.url}
                alt={localBattle.photo1.caption}
                className="w-full h-48 md:h-64 object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/85 to-transparent p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <span className="text-white text-base md:text-lg font-bold drop-shadow-lg">
                    {Math.round(photo1Percentage)}%
                  </span>
                  <span className="text-white/80 text-sm md:text-base font-semibold">
                    {localBattle.votes1Count} vote{localBattle.votes1Count > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Photo 2 */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className={`relative rounded-2xl overflow-hidden shadow-xl ${
                isPhoto2Winner ? 'ring-4 ring-yellow-400' : ''
              }`}
            >
              <img
                src={localBattle.photo2.url}
                alt={localBattle.photo2.caption}
                className="w-full h-48 md:h-64 object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/85 to-transparent p-3 md:p-4">
                <div className="flex items-center justify-between">
                  <span className="text-white text-base md:text-lg font-bold drop-shadow-lg">
                    {Math.round(photo2Percentage)}%
                  </span>
                  <span className="text-white/80 text-sm md:text-base font-semibold">
                    {localBattle.votes2Count} vote{localBattle.votes2Count > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="relative flex items-center justify-center gap-2 mt-4 pt-4 border-t border-pink-500/30">
            <Users className="w-4 h-4 md:w-5 md:h-5 text-pink-400" />
            <span className="text-slate-200 text-sm md:text-base font-semibold">
              {totalVotes} vote{totalVotes > 1 ? 's' : ''} au total
            </span>
          </div>
        </div>
      </motion.div>
        {/* Modals de résultats de battle */}
        <WinnerOverlay photo={winnerPhoto} />
        <TieOverlay tieData={tieData} />
      </>
    );
  }

  // État "Discret" - Affichage réduit
  if (localBattle && displayState === 'discrete') {
    return (
      <>
        <motion.div
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: 0.35, scale: 0.8 }}
        transition={{ duration: 0.5 }}
        className="absolute top-4 right-4 z-30 w-64 md:w-80"
      >
        <div className="bg-gradient-to-br from-slate-900/80 via-purple-900/30 to-slate-800/80 backdrop-blur-lg rounded-2xl p-3 border border-pink-500/30 shadow-xl">
          {/* Header compact */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-white text-xs md:text-sm font-bold">Battle</span>
            </div>
            {timeRemaining !== null && (
              <span className="text-yellow-300 text-xs font-semibold">
                {formatTimeRemaining(timeRemaining)}
              </span>
            )}
          </div>

          {/* Miniatures des photos */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={localBattle.photo1.url}
                alt={localBattle.photo1.caption}
                className="w-full h-20 object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1">
                <span className="text-white text-xs font-bold">{Math.round(photo1Percentage)}%</span>
              </div>
            </div>
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={localBattle.photo2.url}
                alt={localBattle.photo2.caption}
                className="w-full h-20 object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1">
                <span className="text-white text-xs font-bold">{Math.round(photo2Percentage)}%</span>
              </div>
            </div>
          </div>

          {/* Score total */}
          <div className="flex items-center justify-center gap-1 pt-2 border-t border-pink-500/20">
            <Users className="w-3 h-3 text-pink-400" />
            <span className="text-slate-300 text-xs">{totalVotes} votes</span>
          </div>
        </div>
      </motion.div>
        {/* Modals de résultats de battle */}
        <WinnerOverlay photo={winnerPhoto} />
        <TieOverlay tieData={tieData} />
      </>
    );
  }

  // Retour par défaut : seulement les modals (si aucune battle active)
  return (
    <>
      {/* Modals de résultats de battle */}
      <WinnerOverlay photo={winnerPhoto} />
      <TieOverlay tieData={tieData} />
    </>
  );
};

