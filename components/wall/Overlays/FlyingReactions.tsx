import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlyingReaction } from '../../../hooks/wall/useReactionFlow';

interface FlyingReactionsProps {
  reactions: FlyingReaction[];
}

// ⚡ OPTIMISATION : Mémoriser les valeurs aléatoires pour chaque réaction
interface ReactionAnimationData {
  randomRotation: number;
  horizontalDrift: number;
  finalRotation: number;
}

export const FlyingReactions = React.memo(({ reactions }: FlyingReactionsProps) => {
  // ⚡ OPTIMISATION : Pré-calculer les valeurs aléatoires une seule fois par réaction
  const reactionsData = useMemo(() => {
    const dataMap = new Map<string, ReactionAnimationData>();
    reactions.forEach((reaction) => {
      const randomRotation = (Math.random() - 0.5) * 360;
      const horizontalDrift = (Math.random() - 0.5) * 10;
      const finalRotation = randomRotation + (Math.random() - 0.5) * 360;
      
      dataMap.set(reaction.id, {
        randomRotation,
        horizontalDrift,
        finalRotation
      });
    });
    return dataMap;
  }, [reactions]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <AnimatePresence>
        {reactions.map((reaction) => {
          const animData = reactionsData.get(reaction.id);
          if (!animData) return null;
          
          return (
            <motion.div
              key={reaction.id}
              initial={{ 
                y: `${reaction.startY}vh`, 
                x: `${reaction.x}vw`, 
                opacity: 0, 
                scale: 0.3, 
                rotate: animData.randomRotation 
              }}
              animate={{ 
                y: '-30vh', 
                x: `${reaction.x + animData.horizontalDrift}vw`,
                opacity: [0, 1, 1, 0.8, 0], 
                scale: [0.3, 1.2, 1.1, 1, 0.4],
                rotate: [animData.randomRotation, animData.randomRotation + (animData.finalRotation - animData.randomRotation) * 0.5, animData.finalRotation]
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ 
                duration: reaction.duration,
                delay: reaction.delay,
                ease: [0.25, 0.1, 0.25, 1],
                times: [0, 0.15, 0.5, 0.85, 1]
              }}
              className="absolute text-6xl md:text-8xl drop-shadow-2xl will-change-transform pointer-events-none"
              style={{ 
                textShadow: '0 0 20px rgba(0,0,0,0.5)',
                zIndex: 9999,
                left: 0,
                bottom: 0
              }}
            >
              {reaction.emoji}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
});

