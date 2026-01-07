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
        {reactions.map((reaction) => (
          <motion.div
            key={reaction.id}
            initial={{ y: '100vh', x: `${reaction.x}vw`, opacity: 0, scale: 0.5, rotate: 0 }}
            animate={{ 
              y: '-20vh', 
              opacity: [0, 1, 1, 0], 
              scale: [0.5, 1.5, 1.5, 0.5],
              rotate: [0, -10, 10, -10, 0]
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 4, 
              ease: "easeOut",
              times: [0, 0.2, 0.8, 1] 
            }}
            className="absolute text-6xl md:text-8xl drop-shadow-2xl will-change-transform pointer-events-none"
            style={{ 
              textShadow: '0 0 20px rgba(0,0,0,0.5)',
              zIndex: 9999
            }}
          >
            {reaction.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

