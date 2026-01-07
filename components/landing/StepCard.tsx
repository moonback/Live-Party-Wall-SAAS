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
      whileHover={{ scale: 1.05, y: -8 }}
      className="backdrop-blur-xl bg-white/5 border border-pink-500/20 rounded-2xl p-6 sm:p-8 lg:p-5 xl:p-6 hover:bg-white/10 hover:border-pink-500/40 transition-all duration-300 group text-center h-full flex flex-col relative overflow-hidden"
    >
      {/* Effet de glow au survol */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-purple-500/0 rounded-2xl pointer-events-none"
        whileHover={{
          background: 'linear-gradient(to bottom right, rgba(236, 72, 153, 0.1), rgba(139, 92, 246, 0.1))',
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Particules animées autour de la carte */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-pink-400/30 rounded-full"
          animate={{
            x: [0, Math.random() * 20 - 10, 0],
            y: [0, Math.random() * 20 - 10, 0],
            opacity: [0, 0.6, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.8 + index * 0.2,
            ease: "easeInOut",
          }}
          style={{
            left: `${30 + i * 20}%`,
            top: `${20 + i * 15}%`,
          }}
        />
      ))}
      {/* Numéro de l'étape avec animation améliorée */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        whileInView={{ scale: 1, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 + 0.2, type: 'spring', stiffness: 200 }}
        whileHover={{ scale: 1.2, rotate: 360 }}
        className="relative inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-12 lg:h-12 xl:w-14 xl:h-14 bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-full mb-3 sm:mb-4 lg:mb-3 xl:mb-4 text-pink-400 font-bold text-lg sm:text-xl lg:text-lg xl:text-xl shadow-lg shadow-pink-500/20 group-hover:shadow-pink-500/60 transition-all z-10"
      >
        {/* Pulse effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-pink-400/30"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: index * 0.3,
            ease: "easeInOut",
          }}
        />
        <span className="relative z-10">{number}</span>
      </motion.div>

      {/* Icône avec animation améliorée */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        whileInView={{ scale: 1, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: index * 0.1 + 0.3, type: 'spring', stiffness: 150 }}
        whileHover={{ rotate: 360, scale: 1.15 }}
        className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-16 lg:h-16 xl:w-20 xl:h-20 mb-3 sm:mb-4 lg:mb-3 xl:mb-4 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl group-hover:from-pink-500/40 group-hover:to-purple-500/40 transition-all mx-auto z-10"
      >
        {/* Glow effect au survol */}
        <motion.div
          className="absolute inset-0 rounded-xl bg-pink-400/0 blur-md"
          whileHover={{
            background: 'rgba(236, 72, 153, 0.3)',
            scale: 1.3,
          }}
          transition={{ duration: 0.3 }}
        />
        <Icon className="relative z-10 w-8 h-8 sm:w-10 sm:h-10 lg:w-8 lg:h-8 xl:w-10 xl:h-10 text-pink-400 group-hover:text-pink-300 transition-colors" />
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

      {/* Ligne décorative en bas avec animation améliorée */}
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: '100%' }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: index * 0.1 + 0.6, ease: "easeOut" }}
        className="relative h-1 bg-gradient-to-r from-transparent via-pink-500/50 to-transparent mt-3 sm:mt-4 lg:mt-3 xl:mt-4 rounded-full overflow-hidden"
      >
        {/* Effet de brillance qui traverse */}
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            delay: index * 0.2,
            ease: "linear"
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
        />
      </motion.div>
    </motion.div>
  );
};

