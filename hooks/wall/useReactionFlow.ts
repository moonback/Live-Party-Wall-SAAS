import { useState, useEffect, useCallback } from 'react';
import { subscribeToReactionsUpdates, subscribeToLikesUpdates } from '../../services/photoService';
import { REACTIONS } from '../../constants';

export interface FlyingReaction {
  id: string;
  emoji: string;
  x: number; // position horizontale aléatoire (0-100%)
  timestamp: number;
}

export const useReactionFlow = () => {
  const [flyingReactions, setFlyingReactions] = useState<FlyingReaction[]>([]);

  const addReaction = useCallback((emoji: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const x = Math.random() * 80 + 10; // Entre 10% et 90% de la largeur
    
    setFlyingReactions(prev => [...prev, { id, emoji, x, timestamp: Date.now() }]);

    // Nettoyage automatique après l'animation (ex: 4 secondes)
    setTimeout(() => {
      setFlyingReactions(prev => prev.filter(r => r.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    // Écouter les likes (cœur) avec le nouveau callback d'événement immédiat
    const likesSub = subscribeToLikesUpdates(
        () => {}, // On ignore la mise à jour du count ici (géré par useWallData)
        (photoId, isLike) => {
            if (isLike) {
                // Ajouter plusieurs cœurs pour un effet "burst" immédiat
                addReaction('❤️');
                setTimeout(() => addReaction('❤️'), 150);
                setTimeout(() => addReaction('💖'), 300);
            }
        }
    );

    // Écouter les autres réactions avec le callback d'événement immédiat
    const reactionsSub = subscribeToReactionsUpdates(
        () => {}, // On ignore la mise à jour du count ici
        (photoId, type) => {
            const reactionConfig = REACTIONS[type as keyof typeof REACTIONS];
            if (reactionConfig?.emoji) {
                addReaction(reactionConfig.emoji);
                // Petit écho
                setTimeout(() => addReaction(reactionConfig.emoji), 200);
            }
        }
    );

    return () => {
      likesSub.unsubscribe();
      reactionsSub.unsubscribe();
    };
  }, [addReaction]);

  return { flyingReactions };
};
