import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlyingReaction } from '../../../hooks/wall/useReactionFlow';

interface FlyingReactionsProps {
  reactions: FlyingReaction[];
}

export const FlyingReactions = React.memo(({ reactions }: FlyingReactionsProps) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[80] overflow-hidden">
      <AnimatePresence>
        {reactions.map((reaction) => {
          // Rotation aléatoire pour chaque emoji
          const randomRotation = (Math.random() - 0.5) * 360;
          // Variation de trajectoire horizontale pour plus de fluidité
          const horizontalDrift = (Math.random() - 0.5) * 10;
          
          return (
            <motion.div
              key={reaction.id}
              initial={{ 
                y: `${reaction.startY}vh`, 
                x: `${reaction.x}vw`, 
                opacity: 0, 
                scale: 0.3, 
                rotate: randomRotation 
              }}
              animate={{ 
                y: '-30vh', 
                x: `${reaction.x + horizontalDrift}vw`,
                opacity: [0, 1, 1, 0.8, 0], 
                scale: [0.3, 1.2, 1.1, 1, 0.4],
                rotate: [randomRotation, randomRotation + (Math.random() - 0.5) * 180, randomRotation + (Math.random() - 0.5) * 360]
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ 
                duration: reaction.duration,
                delay: reaction.delay,
                ease: [0.25, 0.1, 0.25, 1], // Courbe d'animation plus fluide
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

