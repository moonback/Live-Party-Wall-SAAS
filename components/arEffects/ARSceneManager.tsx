import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { FireworksEffect } from './FireworksEffect';
import { BubblesEffect } from './BubblesEffect';
import { LightHalosEffect } from './LightHalosEffect';
import { subscribeToLikesUpdates } from '../../services/photoService';

export type AREffectType = 'fireworks' | 'bubbles' | 'halos' | null;

interface ARSceneManagerProps {
  /** Activer/désactiver le mode AR */
  enabled?: boolean;
  /** Seuil de likes pour déclencher un effet */
  likesThreshold?: number;
  /** Heure d'ouverture de l'événement (format HH:mm) */
  openingTime?: string;
  /** Heure de fermeture de l'événement (format HH:mm) */
  closingTime?: string;
  /** Durée de la fenêtre d'ouverture/fermeture en minutes */
  timeWindow?: number;
}

export interface ARSceneManagerRef {
  /** Déclencher un effet manuellement */
  triggerEffect: (type: AREffectType, intensity?: number) => void;
  /** Déclencher un effet aléatoire */
  triggerRandomEffect: () => void;
}

interface ActiveEffect {
  type: AREffectType;
  id: string;
  intensity: number;
}

/**
 * Gestionnaire de la Scène Augmentée
 * Déclenche automatiquement des effets visuels selon :
 * - Nombre de likes
 * - Heures clés (ouverture/fermeture)
 * 
 * Peut également être déclenché manuellement via la ref
 */
export const ARSceneManager = forwardRef<ARSceneManagerRef, ARSceneManagerProps>(({
  enabled = true,
  likesThreshold = 5,
  openingTime,
  closingTime,
  timeWindow = 15
}, ref) => {
  const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);
  const lastLikesCountRef = useRef<Map<string, number>>(new Map());
  const effectIdCounterRef = useRef(0);

  // Fonction pour déclencher un effet
  const triggerEffect = useCallback((type: AREffectType, intensity: number = 1) => {
    if (!type || !enabled) return;

    const id = `effect-${effectIdCounterRef.current++}`;
    setActiveEffects((prev) => [...prev, { type, id, intensity }]);

    // Retirer l'effet après sa durée
    setTimeout(() => {
      setActiveEffects((prev) => prev.filter((e) => e.id !== id));
    }, type === 'fireworks' ? 4000 : type === 'bubbles' ? 5000 : 4000);
  }, [enabled]);

  // Fonction pour déclencher un effet aléatoire
  const triggerRandomEffect = useCallback(() => {
    const effects: AREffectType[] = ['fireworks', 'bubbles', 'halos'];
    const randomEffect = effects[Math.floor(Math.random() * effects.length)];
    triggerEffect(randomEffect, Math.random() * 0.5 + 0.5); // Intensité entre 0.5 et 1
  }, [triggerEffect]);

  // Exposer les fonctions via ref
  useImperativeHandle(ref, () => ({
    triggerEffect,
    triggerRandomEffect
  }), [triggerEffect, triggerRandomEffect]);

  // Détection des likes
  useEffect(() => {
    if (!enabled) return;

    const subscription = subscribeToLikesUpdates((photoId, newLikesCount) => {
      const lastCount = lastLikesCountRef.current.get(photoId) || 0;
      const likesIncrease = newLikesCount - lastCount;

      if (likesIncrease > 0) {
        lastLikesCountRef.current.set(photoId, newLikesCount);

        // Si le nombre de likes dépasse le seuil, déclencher un effet
        if (newLikesCount >= likesThreshold) {
          // Effet basé sur le nombre de likes
          if (newLikesCount >= likesThreshold * 3) {
            triggerEffect('fireworks', 1);
          } else if (newLikesCount >= likesThreshold * 2) {
            triggerEffect('halos', 0.8);
          } else {
            triggerEffect('bubbles', 0.6);
          }
        }

        // Si augmentation rapide de likes, déclencher bulles
        if (likesIncrease >= 3) {
          triggerEffect('bubbles', 0.5);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [enabled, likesThreshold, triggerEffect]);

  // Détection des heures clés
  useEffect(() => {
    if (!enabled || (!openingTime && !closingTime)) return;

    const checkTimeWindow = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      if (openingTime) {
        const [openingHour, openingMinute] = openingTime.split(':').map(Number);
        const openingDate = new Date(now);
        openingDate.setHours(openingHour, openingMinute, 0, 0);
        
        const diffMinutes = (now.getTime() - openingDate.getTime()) / (1000 * 60);
        if (diffMinutes >= 0 && diffMinutes <= timeWindow) {
          // Fenêtre d'ouverture
          triggerEffect('fireworks', 1);
          triggerEffect('halos', 0.8);
        }
      }

      if (closingTime) {
        const [closingHour, closingMinute] = closingTime.split(':').map(Number);
        const closingDate = new Date(now);
        closingDate.setHours(closingHour, closingMinute, 0, 0);
        
        const diffMinutes = (now.getTime() - closingDate.getTime()) / (1000 * 60);
        if (diffMinutes >= 0 && diffMinutes <= timeWindow) {
          // Fenêtre de fermeture
          triggerEffect('halos', 1);
          triggerEffect('bubbles', 0.7);
        }
      }
    };

    // Vérifier immédiatement
    checkTimeWindow();

    // Vérifier toutes les minutes
    const interval = setInterval(checkTimeWindow, 60000);

    return () => clearInterval(interval);
  }, [enabled, openingTime, closingTime, timeWindow, triggerEffect]);

  return (
    <>
      {activeEffects.map((effect) => {
        switch (effect.type) {
          case 'fireworks':
            return <FireworksEffect key={effect.id} intensity={effect.intensity} />;
          case 'bubbles':
            return <BubblesEffect key={effect.id} intensity={effect.intensity} />;
          case 'halos':
            return <LightHalosEffect key={effect.id} intensity={effect.intensity} />;
          default:
            return null;
        }
      })}
    </>
  );
});

ARSceneManager.displayName = 'ARSceneManager';

