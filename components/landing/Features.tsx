import React from 'react';
import { ArrowRight, Users, UserCog } from 'lucide-react';
import { GUEST_FEATURES, ORGANIZER_FEATURES } from './landingData';
import { FeatureCard } from './FeatureCard';
import { motion } from 'framer-motion';

/**
 * Section des fonctionnalités principales - Organisée par catégories (Invités / Organisateurs)
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
            Fonctionnalités principales
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
              pour un événement réussi
            </span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-300 max-w-2xl mx-auto"
          >
            Des fonctionnalités pensées pour les invités et les organisateurs. Chaque détail compte pour créer une expérience mémorable.
          </motion.p>
        </div>

        {/* Section Invités */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mb-20"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
              <Users className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white">
              Pour les invités
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">
            {GUEST_FEATURES.map((feature, index) => (
              <FeatureCard
                key={index}
                index={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                className={`${feature.highlight ? "lg:col-span-2 bg-gradient-to-br from-pink-900/20 to-purple-900/20 border-pink-500/30" : "bg-white/5 border-white/10"} hover:bg-white/10 transition-colors`}
              />
            ))}
          </div>
        </motion.div>

        {/* Section Organisateurs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <UserCog className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white">
              Pour les organisateurs
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 auto-rows-fr">
            {ORGANIZER_FEATURES.map((feature, index) => (
              <FeatureCard
                key={index}
                index={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                className={`${feature.highlight ? "lg:col-span-2 bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30" : "bg-white/5 border-white/10"} hover:bg-white/10 transition-colors`}
              />
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <a
            href="#main-content"
            onClick={(e) => {
              e.preventDefault();
              const element = document.getElementById('main-content');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl backdrop-blur-sm border border-white/10 hover:border-white/30 transition-all"
          >
            Voir un exemple
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};
