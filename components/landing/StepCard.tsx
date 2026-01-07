import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StepCardProps {
  number: number;
  icon: LucideIcon;
  title: string;
  description: string;
  index?: number;
}

/**
 * Carte pour afficher une étape du processus avec animations
 */
export const StepCard: React.FC<StepCardProps> = ({
  number,
  icon: Icon,
  title,
  description,
  index = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.03, y: -5 }}
      className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-2xl p-6 sm:p-8 lg:p-5 xl:p-6 hover:bg-white/10 hover:border-pink-500/40 transition-all duration-300 group text-center h-full flex flex-col"
    >
      {/* Numéro de l'étape avec animation */}
      <motion.div
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: index * 0.1 + 0.2, type: 'spring' }}
        className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-12 lg:h-12 xl:w-14 xl:h-14 bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-full mb-3 sm:mb-4 lg:mb-3 xl:mb-4 text-pink-400 font-bold text-lg sm:text-xl lg:text-lg xl:text-xl shadow-lg shadow-pink-500/20 group-hover:shadow-pink-500/40 transition-all"
      >
        {number}
      </motion.div>

      {/* Icône avec animation */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        whileInView={{ scale: 1, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 + 0.3, type: 'spring' }}
        whileHover={{ rotate: 360, scale: 1.1 }}
        className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-16 lg:h-16 xl:w-20 xl:h-20 mb-3 sm:mb-4 lg:mb-3 xl:mb-4 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl group-hover:from-pink-500/30 group-hover:to-purple-500/30 transition-all mx-auto"
      >
        <Icon className="w-8 h-8 sm:w-10 sm:h-10 lg:w-8 lg:h-8 xl:w-10 xl:h-10 text-pink-400" />
      </motion.div>

      {/* Titre */}
      <motion.h3
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: index * 0.1 + 0.4 }}
        className="text-xl sm:text-2xl lg:text-xl xl:text-2xl font-bold text-white mb-2 sm:mb-3 lg:mb-2 xl:mb-3 group-hover:text-pink-300 transition-colors"
      >
        {title}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: index * 0.1 + 0.5 }}
        className="text-sm sm:text-base lg:text-sm xl:text-base text-gray-300 leading-relaxed flex-grow"
      >
        {description}
      </motion.p>

      {/* Ligne décorative en bas */}
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: '100%' }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: index * 0.1 + 0.6 }}
        className="h-1 bg-gradient-to-r from-transparent via-pink-500/50 to-transparent mt-3 sm:mt-4 lg:mt-3 xl:mt-4 rounded-full"
      />
    </motion.div>
  );
};

