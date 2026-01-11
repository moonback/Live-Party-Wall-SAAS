import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Sparkles } from 'lucide-react';

interface UploadConfirmationProps {
  isVisible: boolean;
  onComplete: () => void;
}

export const UploadConfirmation: React.FC<UploadConfirmationProps> = ({ isVisible, onComplete }) => {
  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete();
      }, 2500); // Afficher pendant 2.5 secondes
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
        >
          {/* Overlay avec effet de flou */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Contenu de confirmation */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -30 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
              duration: 0.5
            }}
            className="relative z-10 bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-600 p-8 sm:p-12 rounded-3xl sm:rounded-[2.5rem] shadow-2xl border-4 border-white/30 max-w-md mx-4 text-center"
          >
            {/* Effet de brillance animé */}
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
                scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
              }}
              className="absolute inset-0 rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-r from-transparent via-white/20 to-transparent"
              style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
                backgroundSize: '200% 200%'
              }}
            />
            
            {/* Icône de succès avec animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
                delay: 0.2
              }}
              className="relative z-10 mb-6 flex justify-center"
            >
              <div className="relative">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{
                    duration: 0.6,
                    delay: 0.3,
                    ease: 'easeOut'
                  }}
                >
                  <CheckCircle className="w-20 h-20 sm:w-24 sm:h-24 text-white drop-shadow-2xl" strokeWidth={2.5} />
                </motion.div>
                
                {/* Particules animées autour de l'icône */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0],
                      x: [0, Math.cos((i * Math.PI * 2) / 6) * 60],
                      y: [0, Math.sin((i * Math.PI * 2) / 6) * 60],
                    }}
                    transition={{
                      duration: 1,
                      delay: 0.4 + i * 0.1,
                      ease: 'easeOut'
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  >
                    <Sparkles className="w-6 h-6 text-yellow-300" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            {/* Message de confirmation */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="relative z-10 text-3xl sm:text-4xl font-bold text-white mb-3 drop-shadow-lg"
            >
              Votre photo est en ligne ! 🎉
            </motion.h2>
            
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

