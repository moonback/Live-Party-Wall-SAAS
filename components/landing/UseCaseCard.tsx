import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Carte pour afficher un cas d'usage - Design amélioré
 */
interface UseCaseCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  image?: string; // URL de l'image optionnelle
}

export const UseCaseCard: React.FC<UseCaseCardProps> = ({
  icon: Icon,
  title,
  description,
  image,
}) => {
  // Images par défaut selon le type de cas d'usage
  const defaultImages: Record<string, string> = {
    'Mariages Inoubliables': 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800',
    'Corporate & Team Building': 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=800',
    'Soirées Privées & Clubs': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
  };

  const imageUrl = image || defaultImages[title] || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      className="relative backdrop-blur-xl bg-gradient-to-b from-white/5 to-white/0 border border-white/10 hover:border-pink-500/30 rounded-2xl overflow-hidden transition-all duration-300 group"
    >
      {/* Image de fond */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        <div className="absolute top-4 right-4">
          <div className="w-12 h-12 rounded-full bg-gray-900/80 border border-white/20 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 group-hover:border-pink-500/40 transition-all duration-300 shadow-lg">
            <Icon className="w-6 h-6 text-pink-400 group-hover:text-pink-300" />
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="relative z-10 p-6">
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-pink-100 transition-colors">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">{description}</p>
      </div>

      {/* Background glow on hover */}
      <div className="absolute inset-0 bg-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </motion.div>
  );
};
