import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface AdvantageCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Carte pour afficher un avantage - Design amélioré
 */
export const AdvantageCard: React.FC<AdvantageCardProps> = ({
  icon: Icon,
  title,
  description,
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.02 }}
      className="backdrop-blur-xl bg-white/5 border border-white/10 hover:border-pink-500/30 rounded-2xl p-8 transition-colors duration-300 group"
    >
      <div className="flex items-start gap-5">
        <div className="p-3 rounded-lg bg-pink-500/10 group-hover:bg-pink-500/20 transition-colors">
          <Icon className="w-6 h-6 text-pink-400 group-hover:text-pink-300 transition-colors" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-pink-100 transition-colors">{title}</h3>
          <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">{description}</p>
        </div>
      </div>
    </motion.div>
  );
};
