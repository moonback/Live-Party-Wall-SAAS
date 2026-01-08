import React from 'react';
import { motion } from 'framer-motion';
import { STEPS } from './landingData';
import { StepCard } from './StepCard';

/**
 * Section "Comment ça marche" optimisée
 */
export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-black/40">
      {/* Fond décoratif */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* En-tête */}
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"
          >
            La magie opère en <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">4 étapes</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-300 max-w-2xl mx-auto"
          >
            Une expérience fluide pour l'organisateur comme pour les invités. <br/>
            Simplicité radicale, impact maximal.
          </motion.p>
        </div>

        {/* Grille responsive */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          
          {/* Ligne de connexion (Desktop uniquement) */}
          <div className="hidden lg:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-pink-500/30 to-transparent z-0" />

          {STEPS.map((step, index) => (
            <StepCard
              key={step.number}
              index={index}
              number={step.number}
              icon={step.icon}
              title={step.title}
              description={step.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
