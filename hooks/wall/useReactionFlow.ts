import { useState, useEffect, useCallback, useRef } from 'react';
import { subscribeToReactionsUpdates, subscribeToLikesUpdates } from '../../services/photoService';
import { REACTIONS } from '../../constants';

export interface FlyingReaction {
  id: string;
  emoji: string;
  x: number; // position horizontale aléatoire (0-100%)
  timestamp: number;
  delay: number; // délai avant le début de l'animation (0-1s)
  duration: number; // durée de l'animation (3-5s)
  startY: number; // position verticale de départ (toujours 100vh = bas de l'écran)
}

export const useReactionFlow = () => {
  const [flyingReactions, setFlyingReactions] = useState<FlyingReaction[]>([]);
  // Système de zones pour éviter les superpositions (diviser l'écran en 20 zones)
  const occupiedZonesRef = useRef<Set<number>>(new Set());

  const getAvailableZone = useCallback((): number => {
    const totalZones = 20;
    const zones = Array.from({ length: totalZones }, (_, i) => i);
    const available = zones.filter(zone => !occupiedZonesRef.current.has(zone));
    
    if (available.length === 0) {
      // Si toutes les zones sont occupées, libérer toutes les zones
      occupiedZonesRef.current.clear();
      return Math.floor(Math.random() * totalZones);
    }
    
    const selectedZone = available[Math.floor(Math.random() * available.length)];
    occupiedZonesRef.current.add(selectedZone);
    
    // Libérer la zone après 2 secondes
    setTimeout(() => {
      occupiedZonesRef.current.delete(selectedZone);
    }, 2000);
    
    return selectedZone;
  }, []);

  const addReaction = useCallback((emoji: string, customDelay?: number) => {
    const id = Math.random().toString(36).substr(2, 9);
    
    // Utiliser le système de zones pour éviter les superpositions
    const zone = getAvailableZone();
    const zoneWidth = 96 / 20; // Largeur de chaque zone (96% de l'écran divisé en 20)
    const x = zone * zoneWidth + (Math.random() * zoneWidth * 0.8) + 2; // Position dans la zone avec marge
    
    // Délai aléatoire entre 0 et 0.8s pour échelonner les départs
    const delay = customDelay !== undefined ? customDelay : Math.random() * 0.8;
    // Durée variable entre 3.5s et 5s pour plus de fluidité
    const duration = 3.5 + Math.random() * 1.5;
    
    setFlyingReactions(prev => [...prev, { 
      id, 
      emoji, 
      x, 
      timestamp: Date.now(),
      delay,
      duration,
      startY: 100 // Toujours partir du bas (100vh)
    }]);

    // Nettoyage automatique après l'animation (durée + délai + marge)
    setTimeout(() => {
      setFlyingReactions(prev => prev.filter(r => r.id !== id));
    }, (delay + duration + 0.5) * 1000);
  }, [getAvailableZone]);

  useEffect(() => {
    // Écouter les likes (cœur) avec le nouveau callback d'événement immédiat
    const likesSub = subscribeToLikesUpdates(
        () => {}, // On ignore la mise à jour du count ici (géré par useWallData)
        (photoId, isLike) => {
            if (isLike) {
                // Ajouter plusieurs cœurs dispersés avec délais échelonnés (multiplié par 5)
                const heartEmojis = ['❤️', '💖', '💕', '💗', '💓'];
                const getRandomHeart = () => heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
                
                // Chaque emoji part à un temps différent (délai aléatoire généré automatiquement)
                addReaction(getRandomHeart());
                setTimeout(() => addReaction(getRandomHeart()), 50);
                setTimeout(() => addReaction(getRandomHeart()), 100);
                setTimeout(() => addReaction(getRandomHeart()), 150);
                setTimeout(() => addReaction(getRandomHeart()), 200);
                setTimeout(() => addReaction(getRandomHeart()), 250);
                setTimeout(() => addReaction(getRandomHeart()), 300);
                setTimeout(() => addReaction(getRandomHeart()), 350);
                setTimeout(() => addReaction(getRandomHeart()), 400);
                setTimeout(() => addReaction(getRandomHeart()), 450);
                setTimeout(() => addReaction(getRandomHeart()), 500);
                setTimeout(() => addReaction(getRandomHeart()), 550);
                setTimeout(() => addReaction(getRandomHeart()), 600);
                setTimeout(() => addReaction(getRandomHeart()), 650);
                setTimeout(() => addReaction(getRandomHeart()), 700);
            }
        }
    );

    // Écouter les autres réactions avec le callback d'événement immédiat
    const reactionsSub = subscribeToReactionsUpdates(
        () => {}, // On ignore la mise à jour du count ici
        (photoId, type) => {
            const reactionConfig = REACTIONS[type as keyof typeof REACTIONS];
            if (reactionConfig?.emoji) {
                // Ajouter plusieurs emojis dispersés avec délais échelonnés (multiplié par 5)
                // Chaque emoji part à un temps différent (délai aléatoire généré automatiquement)
                addReaction(reactionConfig.emoji);
                setTimeout(() => addReaction(reactionConfig.emoji), 60);
                setTimeout(() => addReaction(reactionConfig.emoji), 120);
                setTimeout(() => addReaction(reactionConfig.emoji), 180);
                setTimeout(() => addReaction(reactionConfig.emoji), 240);
                setTimeout(() => addReaction(reactionConfig.emoji), 300);
                setTimeout(() => addReaction(reactionConfig.emoji), 360);
                setTimeout(() => addReaction(reactionConfig.emoji), 420);
                setTimeout(() => addReaction(reactionConfig.emoji), 480);
                setTimeout(() => addReaction(reactionConfig.emoji), 540);
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
