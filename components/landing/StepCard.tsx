import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StepCardProps {
  number: number;
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
}

export const StepCard: React.FC<StepCardProps> = ({ number, icon: Icon, title, description, index }) => {
  // Images pour chaque étape
  const stepImages = [
    'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800', // QR Code
    'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&q=80&w=800', // Camera
    'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&q=80&w=800', // Sparkles/IA
    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800', // Monitor
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      whileHover={{ y: -8 }}
      className="relative flex flex-col items-center text-center rounded-2xl bg-black/40 border border-white/10 hover:border-pink-500/40 transition-all duration-300 group shadow-lg backdrop-blur-xl z-10 overflow-visible"
    >
      {/* Connector (Mobile only) */}
      {index < 3 && (
        <div className="lg:hidden absolute bottom-[-40px] left-1/2 -translate-x-1/2 w-0.5 h-10 bg-gradient-to-b from-pink-500/30 to-transparent z-0" />
      )}

      {/* Image de fond avec mask */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <img
          src={stepImages[number - 1] || stepImages[0]}
          alt={title}
          className="w-full h-full object-cover opacity-20 transform scale-105 group-hover:scale-100 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />
      </div>

      {/* Number Badge */}
      <div className="absolute -top-5 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:-right-4 w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-[0_0_15px_rgba(236,72,153,0.4)] border-4 border-black group-hover:scale-110 transition-transform duration-300 z-20">
        {number}
      </div>

      {/* Contenu */}
      <div className="relative z-10 p-6 sm:p-8 w-full">
        {/* Icon Container with animated ring */}
        <div className="relative mb-6 mx-auto w-20">
          <div className="absolute inset-0 bg-pink-500/20 rounded-full blur-xl group-hover:bg-pink-500/40 transition-all duration-300 scale-75 group-hover:scale-110" />
          <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative z-10 group-hover:border-pink-500/50 transition-colors duration-300 shadow-2xl backdrop-blur-sm group-hover:-rotate-3 transform">
            <Icon className="w-9 h-9 text-white group-hover:text-pink-400 transition-colors duration-300" strokeWidth={1.5} />
          </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-pink-200 transition-all">
          {title}
        </h3>
        
        <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
          {description}
        </p>
      </div>

      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-pink-500/50 to-transparent group-hover:w-full group-hover:via-pink-500 group-hover:h-[2px] transition-all duration-500 opacity-50 z-20" />
    </motion.div>
  );
};
