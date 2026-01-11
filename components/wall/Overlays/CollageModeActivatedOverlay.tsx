import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid3x3, Layers, Sparkles } from 'lucide-react';

interface CollageModeActivatedOverlayProps {
  show: boolean;
}

export const CollageModeActivatedOverlay = React.memo(({ show }: CollageModeActivatedOverlayProps) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
        >
          {/* Overlay avec effet de glow animé */}
          <motion.div 
            animate={{ 
              background: [
                'radial-gradient(circle, rgba(34,197,94,0.3) 0%, rgba(59,130,246,0.2) 50%, rgba(139,92,246,0.2) 100%)',
                'radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(139,92,246,0.2) 50%, rgba(34,197,94,0.2) 100%)',
                'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(34,197,94,0.2) 50%, rgba(59,130,246,0.2) 100%)',
                'radial-gradient(circle, rgba(34,197,94,0.3) 0%, rgba(59,130,246,0.2) 50%, rgba(139,92,246,0.2) 100%)',
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 backdrop-blur-sm"
          />
          
          {/* Particules flottantes */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: '50%', 
                y: '50%', 
                scale: 0,
                opacity: 0 
              }}
              animate={{ 
                x: `${50 + (Math.random() - 0.5) * 100}%`,
                y: `${50 + (Math.random() - 0.5) * 100}%`,
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                rotate: [0, 360]
              }}
              transition={{ 
                duration: 2 + Math.random() * 2,
                delay: Math.random() * 0.5,
                repeat: Infinity,
                repeatDelay: 1
              }}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: ['#22c55e', '#3b82f6', '#8b5cf6'][Math.floor(Math.random() * 3)]
              }}
            />
          ))}
          
          {/* Conteneur principal */}
          <motion.div 
            initial={{ scale: 0.5, y: 50, rotate: -10 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            exit={{ scale: 1.2, opacity: 0, rotate: 10 }}
            transition={{ 
              type: "spring", 
              bounce: 0.6,
              duration: 0.8
            }}
            className="relative z-10"
          >
            {/* Glow effect autour du badge */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity
              }}
              className="absolute inset-0 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-full blur-3xl"
            />
            
            {/* Badge principal */}
            <div className="relative bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 px-8 md:px-12 lg:px-16 py-6 md:py-8 lg:py-10 rounded-full shadow-2xl border-4 md:border-[6px] border-white/80 flex flex-col items-center gap-4 md:gap-6">
              {/* Icônes animées */}
              <div className="flex items-center gap-4 md:gap-6">
                <motion.div
                  animate={{ 
                    rotate: [0, 15, -15, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  <Grid3x3 className="w-8 h-8 md:w-12 md:h-12 lg:w-16 lg:h-16 text-white drop-shadow-lg" />
                </motion.div>
                
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.15, 1]
                  }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity
                  }}
                >
                  <Layers className="w-10 h-10 md:w-16 md:h-16 lg:w-20 lg:h-20 text-white drop-shadow-lg" />
                </motion.div>
                
                <motion.div
                  animate={{ 
                    rotate: [0, -15, 15, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  <Sparkles className="w-8 h-8 md:w-12 md:h-12 lg:w-16 lg:h-16 text-white drop-shadow-lg" />
                </motion.div>
              </div>
              
              {/* Texte */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <h2 className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] uppercase tracking-wider mb-2">
                  Mode Collage Activé !
                </h2>
                <p className="text-sm md:text-base lg:text-lg xl:text-xl text-white/90 font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                  Créez des collages avec plusieurs photos
                </p>
              </motion.div>
              
              {/* Effet de brillance animé */}
              <motion.div
                animate={{ 
                  x: ['-100%', '200%']
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
                className="absolute inset-0 rounded-full overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-1/3 h-full transform skew-x-12" />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

