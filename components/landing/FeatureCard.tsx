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
      className={`group relative rounded-3xl bg-black/40 border border-white/5 hover:bg-black/60 hover:border-pink-500/30 transition-all duration-300 backdrop-blur-xl overflow-hidden ${hasImage ? 'p-0 flex flex-col h-full' : 'p-8 flex flex-col h-full'} ${className}`}
    >
      {/* Image de fond pour les features importantes */}
      {hasImage && (
        <div className="relative h-48 sm:h-56 overflow-hidden shrink-0">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          
          <div className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg">
             <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      )}

      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 via-purple-500/0 to-blue-500/0 group-hover:from-pink-500/10 group-hover:via-purple-500/5 group-hover:to-transparent transition-all duration-500 pointer-events-none" />
      
      <div className={`relative z-10 flex flex-col h-full ${hasImage ? 'p-6 sm:p-8 pt-2' : ''}`}>
        {!hasImage && (
            <div className="w-14 h-14 mb-6 rounded-2xl bg-gradient-to-br from-gray-800/50 to-black/50 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-pink-500/30 group-hover:shadow-[0_0_20px_rgba(236,72,153,0.2)] transition-all duration-300 shadow-lg">
            <Icon className="w-7 h-7 text-gray-300 group-hover:text-pink-400 transition-colors" />
            </div>
        )}
        
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-pink-200 transition-all">
          {title}
        </h3>
        
        <p className="text-base text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors flex-grow">
          {description}
        </p>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </motion.div>
  );
};
