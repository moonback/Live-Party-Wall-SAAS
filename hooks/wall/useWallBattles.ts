import { useState, useEffect, useCallback } from 'react';
import { PhotoBattle, Photo } from '../../types';
import { getActiveBattles, subscribeToNewBattles } from '../../services/battleService';
import { combineCleanups } from '../../utils/subscriptionHelper';

export const useWallBattles = (battleModeEnabled: boolean, eventId?: string) => {
  const [battles, setBattles] = useState<PhotoBattle[]>([]);
  const [finishedBattles, setFinishedBattles] = useState<Map<string, number>>(new Map());
  const [winnerPhotoDisplay, setWinnerPhotoDisplay] = useState<Photo | null>(null);
  const [tieBattleDisplay, setTieBattleDisplay] = useState<{ photo1: Photo; photo2: Photo } | null>(null);

  // Charger et s'abonner aux battles
  useEffect(() => {
    if (!battleModeEnabled || !eventId) {
      setBattles([]);
      return;
    }

    const loadBattles = async () => {
      try {
        const activeBattles = await getActiveBattles(eventId);
        setBattles(activeBattles);
      } catch (error) {
        console.error('Error loading battles:', error);
      }
    };

    loadBattles();

    // Vérifier périodiquement les battles expirées (toutes les 30 secondes)
    const checkExpiredInterval = setInterval(() => {
      loadBattles();
    }, 30000);

    // Abonnement aux nouvelles battles
    const battlesSub = subscribeToNewBattles(eventId, (newBattle) => {
      setBattles(prev => {
        if (prev.some(b => b.id === newBattle.id)) {
          return prev;
        }
        return [newBattle, ...prev];
      });
    });

    return combineCleanups([
      () => {
        if (battlesSub && typeof battlesSub.unsubscribe === 'function') {
          battlesSub.unsubscribe();
        }
      },
      () => clearInterval(checkExpiredInterval),
    ]);
  }, [battleModeEnabled, eventId]);

  // Nettoyer les battles terminées après 20 secondes
  useEffect(() => {
    if (finishedBattles.size === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setFinishedBattles(prev => {
        const next = new Map(prev);
        let hasChanges = false;

        prev.forEach((timestamp, battleId) => {
          if (now - timestamp >= 20000) { // 20 secondes
            next.delete(battleId);
            hasChanges = true;
            // Retirer la battle de la liste
            setBattles(prevBattles => prevBattles.filter(b => b.id !== battleId));
          }
        });

        return hasChanges ? next : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [finishedBattles]);

  const handleBattleFinished = useCallback((battleId: string, winnerId: string | null, winnerPhoto?: Photo) => {
    setFinishedBattles(prev => {
      const next = new Map(prev);
      next.set(battleId, Date.now());
      return next;
    });
    
    const battle = battles.find(b => b.id === battleId);
    
    // Égalité
    if (!winnerId && !winnerPhoto && battle) {
      setTieBattleDisplay({
        photo1: battle.photo1,
        photo2: battle.photo2
      });
      setTimeout(() => setTieBattleDisplay(null), 5000);
    } 
    // Victoire
    else if (winnerPhoto) {
      setWinnerPhotoDisplay(winnerPhoto);
      setTimeout(() => setWinnerPhotoDisplay(null), 5000);
    }
  }, [battles]);

  return {
    battles,
    winnerPhotoDisplay,
    tieBattleDisplay,
    handleBattleFinished
  };
};

