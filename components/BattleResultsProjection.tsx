import React, { useEffect, useState, useRef, useCallback } from 'react';
import { PhotoBattle } from '../types';
import { getFinishedBattles, subscribeToNewBattles } from '../services/battleService';
import { Trophy, Users, Clock, ArrowLeft } from 'lucide-react';
import { logger } from '../utils/logger';
import { useSwipe } from '../hooks/useSwipe';

interface BattleResultsProjectionProps {
  onBack?: () => void;
}

/**
 * Composant pour afficher les résultats des battles sur un écran séparé
 * Optimisé pour un grand écran de projection avec design cohérent
 */
const BattleResultsProjection: React.FC<BattleResultsProjectionProps> = ({ onBack }) => {
  const [finishedBattles, setFinishedBattles] = useState<PhotoBattle[]>([]);
  const [currentBattleIndex, setCurrentBattleIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const autoRotateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastManualNavigationRef = useRef<number>(Date.now());
  const mouseStartRef = useRef<{ x: number; time: number } | null>(null);

  // Charger les battles terminées
  useEffect(() => {
    const loadFinishedBattles = async () => {
      try {
        setIsLoading(true);
        const battles = await getFinishedBattles(50); // Récupérer les 50 dernières battles
        setFinishedBattles(battles);
        if (battles.length > 0) {
          setCurrentBattleIndex(0);
        }
      } catch (error) {
        logger.error('Error loading finished battles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFinishedBattles();

    // S'abonner aux nouvelles battles (pour détecter quand elles se terminent)
    const battlesSub = subscribeToNewBattles(async () => {
      // Recharger les battles terminées quand une nouvelle battle est créée
      // (elle pourrait se terminer bientôt)
    });

    return () => {
      battlesSub.unsubscribe();
    };
  }, []);

  // Rafraîchir les battles terminées toutes les 10 secondes
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const battles = await getFinishedBattles(50);
        setFinishedBattles(battles);
        // Si on a dépassé l'index actuel, revenir au début
        if (currentBattleIndex >= battles.length && battles.length > 0) {
          setCurrentBattleIndex(0);
        }
      } catch (error) {
        logger.error('Error refreshing finished battles:', error);
      }
    }, 10000); // Toutes les 10 secondes

    return () => clearInterval(interval);
  }, [currentBattleIndex]);

  // Navigation manuelle entre les battles
  const navigateToBattle = useCallback((direction: 'prev' | 'next') => {
    if (finishedBattles.length === 0) return;
    
    setCurrentBattleIndex((prev) => {
      if (direction === 'next') {
        return (prev + 1) % finishedBattles.length;
      } else {
        return prev === 0 ? finishedBattles.length - 1 : prev - 1;
      }
    });
    
    lastManualNavigationRef.current = Date.now();
    
    // Réinitialiser le timer de rotation automatique
    if (autoRotateIntervalRef.current) {
      clearInterval(autoRotateIntervalRef.current);
    }
  }, [finishedBattles.length]);

  // Hook pour détecter les swipes (touch)
  const swipeHandlers = useSwipe(
    {
      onSwipeLeft: () => navigateToBattle('next'), // Swipe gauche = battle suivante
      onSwipeRight: () => navigateToBattle('prev'), // Swipe droite = battle précédente
    },
    {
      threshold: 50,
      velocity: 0.3,
      preventDefault: false
    }
  );

  // Gestion du drag avec la souris (pour desktop)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    mouseStartRef.current = {
      x: e.clientX,
      time: Date.now()
    };
  }, []);

  const handleMouseMove = useCallback(() => {
    // Ne rien faire pendant le mouvement, juste suivre
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!mouseStartRef.current) return;

    const deltaX = e.clientX - mouseStartRef.current.x;
    const distance = Math.abs(deltaX);
    const time = Date.now() - mouseStartRef.current.time;
    const velocity = distance / time;

    // Seuil pour déclencher la navigation (similaire au swipe)
    if (distance >= 50 && velocity >= 0.3) {
      if (deltaX > 0) {
        navigateToBattle('prev'); // Drag vers la droite = battle précédente
      } else {
        navigateToBattle('next'); // Drag vers la gauche = battle suivante
      }
    }

    mouseStartRef.current = null;
  }, [navigateToBattle]);

  const handleMouseLeave = useCallback(() => {
    mouseStartRef.current = null;
  }, []);

  // Rotation automatique des battles toutes les 8 secondes (seulement si pas de navigation manuelle récente)
  useEffect(() => {
    if (finishedBattles.length === 0) return;

    const startAutoRotate = () => {
      if (autoRotateIntervalRef.current) {
        clearInterval(autoRotateIntervalRef.current);
      }

      autoRotateIntervalRef.current = setInterval(() => {
        // Ne pas faire de rotation automatique si l'utilisateur a navigué manuellement il y a moins de 5 secondes
        const timeSinceLastManual = Date.now() - lastManualNavigationRef.current;
        if (timeSinceLastManual > 5000) {
          setCurrentBattleIndex((prev) => (prev + 1) % finishedBattles.length);
        }
      }, 8000); // Changer de battle toutes les 8 secondes
    };

    startAutoRotate();

    return () => {
      if (autoRotateIntervalRef.current) {
        clearInterval(autoRotateIntervalRef.current);
      }
    };
  }, [finishedBattles.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.15),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.15),transparent_50%)]"></div>
        
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-pink-500/30 border-t-pink-500 border-r-purple-500"></div>
          <p className="text-slate-400 text-sm sm:text-base">Chargement des résultats...</p>
        </div>
      </div>
    );
  }

  if (finishedBattles.length === 0) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.15),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.15),transparent_50%)]"></div>
        
        <div className="relative z-10 text-center px-4">
          <div className="inline-flex items-center justify-center w-24 h-24 sm:w-32 sm:h-32 mb-6 rounded-full bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-cyan-500/20 backdrop-blur-xl border border-pink-500/30">
            <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-pink-400/70" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Aucune battle terminée
          </h2>
          <p className="text-lg sm:text-xl text-slate-400 mb-8">Les résultats des battles apparaîtront ici</p>
          {onBack && (
            <button
              onClick={onBack}
              className="relative px-6 py-3 sm:px-8 sm:py-3.5 backdrop-blur-xl bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 hover:border-white/25 rounded-xl sm:rounded-2xl text-white flex items-center gap-2 mx-auto transition-all duration-300 hover:scale-105 active:scale-95 group shadow-lg hover:shadow-xl min-h-[44px] touch-manipulation"
              style={{
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              }}
            >
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-pink-500/0 via-purple-500/0 to-cyan-500/0 group-hover:from-pink-500/10 group-hover:via-purple-500/10 group-hover:to-cyan-500/10 transition-all duration-300 opacity-0 group-hover:opacity-100 blur-sm" />
              <ArrowLeft className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Retour</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentBattle = finishedBattles[currentBattleIndex];
  if (!currentBattle) return null;

  const totalVotes = currentBattle.votes1Count + currentBattle.votes2Count;
  const photo1Percentage = totalVotes > 0 ? (currentBattle.votes1Count / totalVotes) * 100 : 50;
  const photo2Percentage = totalVotes > 0 ? (currentBattle.votes2Count / totalVotes) * 100 : 50;
  const isPhoto1Winner = currentBattle.winnerId === currentBattle.photo1.id;
  const isPhoto2Winner = currentBattle.winnerId === currentBattle.photo2.id;
  const isDraw = !currentBattle.winnerId; // Égalité si pas de gagnant (même sans votes)

  return (
    <div 
      className="min-h-screen bg-transparent relative overflow-y-auto touch-pan-y select-none"
      {...swipeHandlers.handlers}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 pointer-events-none"></div>
      <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.15),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.15),transparent_50%)] pointer-events-none"></div>
      
      {/* Bouton retour (optionnel, en haut à gauche) */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-4 left-4 sm:top-6 sm:left-6 z-50 px-3 py-2 sm:px-4 sm:py-2.5 backdrop-blur-xl bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 hover:border-white/25 rounded-xl text-white flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 group shadow-lg hover:shadow-xl min-h-[44px] touch-manipulation"
          style={{
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/0 via-purple-500/0 to-cyan-500/0 group-hover:from-pink-500/10 group-hover:via-purple-500/10 group-hover:to-cyan-500/10 transition-all duration-300 opacity-0 group-hover:opacity-100 blur-sm" />
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />
          <span className="hidden sm:inline relative z-10 text-sm">Retour</span>
        </button>
      )}

      {/* Indicateur de progression */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-white text-xs sm:text-sm shadow-lg">
        <span className="text-slate-300">Battle</span>{' '}
        <span className="font-bold text-pink-400">{currentBattleIndex + 1}</span>
        <span className="text-slate-400"> / {finishedBattles.length}</span>
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-start p-4 sm:p-6 md:p-8 pt-8 sm:pt-12 md:pt-16 pb-24 sm:pb-32 md:pb-40">
        <div className="w-full max-w-7xl mx-auto flex flex-col">
          {/* Titre */}
          <div className="text-center mb-6 sm:mb-8 md:mb-10 flex-shrink-0">
            <div className="inline-flex items-center gap-2 sm:gap-3 backdrop-blur-xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 border border-pink-500/30 rounded-2xl sm:rounded-3xl px-4 py-2.5 sm:px-6 sm:py-3 mb-3 sm:mb-4 shadow-lg shadow-pink-900/20">
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-pink-400" />
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-5xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Résultats de la Battle
              </h1>
            </div>
            {currentBattle.finishedAt && (
              <div className="inline-flex items-center gap-2 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-slate-300 text-sm sm:text-base">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Terminée le {new Date(currentBattle.finishedAt).toLocaleString('fr-FR')}</span>
              </div>
            )}
          </div>

          {/* Grille des deux photos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8 flex-1 min-h-0">
            {/* Photo 1 */}
            <div
              className={`relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 group ${
                isPhoto1Winner
                  ? 'ring-4 ring-pink-400 scale-[1.02] sm:scale-105 shadow-pink-400/50'
                  : isDraw
                  ? 'ring-4 ring-slate-400 scale-[1.02] sm:scale-105 shadow-slate-400/50'
                  : 'ring-2 ring-slate-700/50'
              }`}
            >
              {/* Glow effect pour le gagnant */}
              {isPhoto1Winner && (
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/40 via-purple-500/40 to-cyan-500/40 rounded-2xl sm:rounded-3xl blur-xl opacity-75 animate-pulse"></div>
              )}
              {/* Glow effect pour l'égalité */}
              {isDraw && (
                <div className="absolute -inset-1 bg-gradient-to-r from-slate-400/30 via-gray-400/30 to-slate-400/30 rounded-2xl sm:rounded-3xl blur-xl opacity-60 animate-pulse"></div>
              )}
              
              <div className="relative w-full min-h-[200px] sm:min-h-[300px] md:min-h-[400px] flex items-center justify-center bg-slate-900/30 rounded-2xl sm:rounded-3xl overflow-hidden">
                <img
                  src={currentBattle.photo1.url}
                  alt={currentBattle.photo1.caption}
                  className="w-full h-full object-contain max-h-[60vh]"
                  loading="lazy"
                />
                {/* Overlay gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />
                
                {/* Badge gagnant */}
                {isPhoto1Winner && (
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-gradient-to-br from-pink-500 to-purple-500 text-white rounded-full p-2.5 sm:p-3 shadow-lg shadow-pink-900/50 animate-bounce-slow backdrop-blur-sm border-2 border-white/30">
                    <Trophy className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                )}
                {/* Badge égalité */}
                {isDraw && (
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-gradient-to-br from-slate-500 to-gray-500 text-white rounded-full p-2.5 sm:p-3 shadow-lg shadow-slate-900/50 animate-bounce-slow backdrop-blur-sm border-2 border-white/30">
                    <Users className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                )}

                {/* Informations de la photo */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                  <p className="text-white text-lg sm:text-xl md:text-2xl font-bold mb-1 drop-shadow-lg">
                    {currentBattle.photo1.author}
                  </p>
                  {currentBattle.photo1.caption && (
                    <p className="text-slate-200 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2 drop-shadow-md">
                      {currentBattle.photo1.caption}
                    </p>
                  )}
                  
                  {/* Barre de progression */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-xl sm:text-2xl md:text-3xl font-bold drop-shadow-lg">
                        {Math.round(photo1Percentage)}%
                      </span>
                      <span className="text-slate-200 text-sm sm:text-base md:text-lg">
                        {currentBattle.votes1Count} {currentBattle.votes1Count > 1 ? 'votes' : 'vote'}
                      </span>
                    </div>
                    <div className="h-3 sm:h-4 bg-slate-900/70 backdrop-blur-sm rounded-full overflow-hidden border border-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 transition-all duration-1000 shadow-lg"
                        style={{ width: `${photo1Percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo 2 */}
            <div
              className={`relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 group ${
                isPhoto2Winner
                  ? 'ring-4 ring-cyan-400 scale-[1.02] sm:scale-105 shadow-cyan-400/50'
                  : isDraw
                  ? 'ring-4 ring-slate-400 scale-[1.02] sm:scale-105 shadow-slate-400/50'
                  : 'ring-2 ring-slate-700/50'
              }`}
            >
              {/* Glow effect pour le gagnant */}
              {isPhoto2Winner && (
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/40 via-blue-500/40 to-purple-500/40 rounded-2xl sm:rounded-3xl blur-xl opacity-75 animate-pulse"></div>
              )}
              {/* Glow effect pour l'égalité */}
              {isDraw && (
                <div className="absolute -inset-1 bg-gradient-to-r from-slate-400/30 via-gray-400/30 to-slate-400/30 rounded-2xl sm:rounded-3xl blur-xl opacity-60 animate-pulse"></div>
              )}
              
              <div className="relative w-full min-h-[200px] sm:min-h-[300px] md:min-h-[400px] flex items-center justify-center bg-slate-900/30 rounded-2xl sm:rounded-3xl overflow-hidden">
                <img
                  src={currentBattle.photo2.url}
                  alt={currentBattle.photo2.caption}
                  className="w-full h-full object-contain max-h-[60vh]"
                  loading="lazy"
                />
                {/* Overlay gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />
                
                {/* Badge gagnant */}
                {isPhoto2Winner && (
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-gradient-to-br from-cyan-500 to-blue-500 text-white rounded-full p-2.5 sm:p-3 shadow-lg shadow-cyan-900/50 animate-bounce-slow backdrop-blur-sm border-2 border-white/30">
                    <Trophy className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                )}
                {/* Badge égalité */}
                {isDraw && (
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-gradient-to-br from-slate-500 to-gray-500 text-white rounded-full p-2.5 sm:p-3 shadow-lg shadow-slate-900/50 animate-bounce-slow backdrop-blur-sm border-2 border-white/30">
                    <Users className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                )}

                {/* Informations de la photo */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                  <p className="text-white text-lg sm:text-xl md:text-2xl font-bold mb-1 drop-shadow-lg">
                    {currentBattle.photo2.author}
                  </p>
                  {currentBattle.photo2.caption && (
                    <p className="text-slate-200 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2 drop-shadow-md">
                      {currentBattle.photo2.caption}
                    </p>
                  )}
                  
                  {/* Barre de progression */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-xl sm:text-2xl md:text-3xl font-bold drop-shadow-lg">
                        {Math.round(photo2Percentage)}%
                      </span>
                      <span className="text-slate-200 text-sm sm:text-base md:text-lg">
                        {currentBattle.votes2Count} {currentBattle.votes2Count > 1 ? 'votes' : 'vote'}
                      </span>
                    </div>
                    <div className="h-3 sm:h-4 bg-slate-900/70 backdrop-blur-sm rounded-full overflow-hidden border border-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transition-all duration-1000 shadow-lg"
                        style={{ width: `${photo2Percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Résultat final */}
          <div className="text-center flex-shrink-0">
            {isDraw ? (
              <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-3 backdrop-blur-xl bg-gradient-to-r from-slate-500/20 via-gray-500/20 to-slate-500/20 border border-slate-400/30 rounded-2xl sm:rounded-3xl px-6 py-3 sm:px-8 sm:py-4 shadow-lg shadow-slate-900/20">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300" />
                <span className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-300 via-gray-200 to-slate-300 bg-clip-text text-transparent">Égalité !</span>
                <span className="text-slate-200 text-sm sm:text-base">Aucun gagnant</span>
              </div>
            ) : (
              <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-3 backdrop-blur-xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 border border-pink-500/30 rounded-2xl sm:rounded-3xl px-6 py-3 sm:px-8 sm:py-4 shadow-lg shadow-pink-900/20">
                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-pink-400" />
                <span className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  {isPhoto1Winner ? currentBattle.photo1.author : currentBattle.photo2.author} a gagné !
                </span>
              </div>
            )}
            <div className="mt-4 sm:mt-6 inline-flex items-center gap-2 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl px-4 py-2">
              <span className="text-slate-300 text-sm sm:text-base md:text-lg">
                Total: <span className="font-bold text-white">{totalVotes}</span> {totalVotes > 1 ? 'votes' : 'vote'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattleResultsProjection;

