import React from 'react';
import { motion } from 'framer-motion';
import { STEPS } from './landingData';
import { StepCard } from './StepCard';

/**
 * Section "Comment ça marche" avec les 4 étapes améliorée et responsive
 */
export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-12 sm:py-16 md:py-20 lg:py-16 xl:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Fond décoratif animé */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-500/5 to-transparent pointer-events-none" />
      
      {/* Particules animées en arrière-plan */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-pink-400/20 rounded-full blur-sm"
            animate={{
              x: [0, Math.random() * 100 - 50, 0],
              y: [0, Math.random() * 100 - 50, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut",
            }}
            style={{
              left: `${20 + (i * 15)}%`,
              top: `${30 + (i * 10)}%`,
            }}
          />
        ))}
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* En-tête avec animation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-10 xl:mb-12"
        >
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-4xl xl:text-5xl font-bold text-white mb-3 sm:mb-4 lg:mb-3 xl:mb-4 bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
          >
            Comment ça marche ?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl lg:text-base xl:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed"
          >
            Une expérience simple en <span className="text-pink-400 font-semibold">4 étapes</span> pour transformer votre soirée en événement mémorable. Parfait pour particuliers, professionnels et agences événementielles.
          </motion.p>
        </motion.div>

        {/* Grille responsive avec animations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-4 xl:gap-6">
          {STEPS.map((step, index) => (
            <StepCard
              key={step.number}
              number={step.number}
              icon={step.icon}
              title={step.title}
              description={step.description}
              index={index}
            />
          ))}
        </div>

        {/* Flèches de connexion entre les étapes (desktop uniquement) - Améliorées */}
        <div className="hidden lg:flex items-center justify-between px-8 -mt-4 mb-4">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.8 + i * 0.1 }}
              className="flex-1 flex items-center justify-center relative"
            >
              {/* Ligne avec effet de brillance */}
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.4, 0.8, 0.4]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut"
                }}
                className="w-16 h-1 bg-gradient-to-r from-transparent via-pink-500/60 to-purple-500/60 rounded-full relative overflow-hidden"
              >
                {/* Effet de brillance qui traverse */}
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "linear"
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                />
              </motion.div>
              
              {/* Particule animée qui suit le chemin */}
              <motion.div
                animate={{ 
                  x: [0, 64, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut"
                }}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-pink-400 rounded-full shadow-lg shadow-pink-400/70"
              />
              
              {/* Flèche à la fin */}
              <motion.div
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3 + 0.1
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[8px] border-l-pink-400 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

