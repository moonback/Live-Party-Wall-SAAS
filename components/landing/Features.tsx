import React from 'react';
import { FEATURES } from './landingData';
import { FeatureCard } from './FeatureCard';
import { motion } from 'framer-motion';

/**
 * Section des fonctionnalités principales - Design Bento Grid
 */
export const Features: React.FC = () => {
  return (
    <section id="features" className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-pink-400 uppercase bg-pink-500/10 rounded-full border border-pink-500/20"
          >
            Fonctionnalités
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"
          >
            Tout ce dont vous avez besoin<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
              pour une soirée légendaire
            </span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-300 max-w-2xl mx-auto"
          >
            Une suite complète d'outils pour transformer n'importe quel rassemblement en une expérience interactive et virale.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature, index) => (
            <FeatureCard
              key={index}
              index={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              className={feature.highlight ? "md:col-span-2 bg-gradient-to-br from-white/10 to-white/5 border-pink-500/20" : ""}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
