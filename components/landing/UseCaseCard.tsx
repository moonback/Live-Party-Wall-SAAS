import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface UseCaseCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Carte pour afficher un cas d'usage - Design amélioré
 */
export const UseCaseCard: React.FC<UseCaseCardProps> = ({
  icon: Icon,
  title,
  description,
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      className="relative backdrop-blur-xl bg-gradient-to-b from-white/5 to-white/0 border border-white/10 hover:border-pink-500/30 rounded-2xl p-6 transition-all duration-300 group overflow-hidden"
    >
      {/* Background glow on hover */}
      <div className="absolute inset-0 bg-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:border-pink-500/40 transition-all duration-300 shadow-lg">
          <Icon className="w-6 h-6 text-pink-400 group-hover:text-pink-300" />
        </div>
        
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-pink-100 transition-colors">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">{description}</p>
      </div>
    </motion.div>
  );
};
