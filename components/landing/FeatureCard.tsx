import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  index: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, className = "", index }) => {
  // Images pour certaines fonctionnalités clés
  const featureImages: Record<string, string> = {
    'Zéro Matériel Requis': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=800',
    'Modération Intelligente': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800',
    'Live Feed Instantané': 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800',
    'Gamification': 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800',
    'Inclusion Totale': 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=800',
    'Design Premium': 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=800',
    'Souvenir Vidéo': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800',
    'Galerie HD': 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&q=80&w=800',
  };

  const imageUrl = featureImages[title];
  const hasImage = !!imageUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className={`group relative rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-pink-500/30 transition-all duration-300 backdrop-blur-sm overflow-hidden ${hasImage ? 'p-0' : 'p-6'} ${className}`}
    >
      {/* Image de fond pour les features importantes */}
      {hasImage && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
        </div>
      )}

      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-pink-500/5 group-hover:via-purple-500/5 group-hover:to-transparent transition-all duration-500" />
      
      <div className={`relative z-10 ${hasImage ? 'p-6' : ''}`}>
        <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-pink-500/50 transition-all duration-300 shadow-lg">
          <Icon className="w-6 h-6 text-pink-400 group-hover:text-pink-300 transition-colors" />
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-pink-200 transition-all">
          {title}
        </h3>
        
        <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
          {description}
        </p>
      </div>

      {/* Decorative corner */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
};
