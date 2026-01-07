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
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      whileHover={{ y: -8 }}
      className="relative flex flex-col items-center text-center p-6 md:p-8 rounded-2xl bg-gradient-to-b from-gray-900/80 to-black/80 border border-white/10 hover:border-pink-500/40 transition-all duration-300 group shadow-lg backdrop-blur-sm z-10"
    >
      {/* Number Badge */}
      <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg border-4 border-black group-hover:scale-110 transition-transform duration-300">
        {number}
      </div>

      {/* Icon Container with animated ring */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-pink-500/20 rounded-full blur-xl group-hover:bg-pink-500/40 transition-all duration-300" />
        <div className="w-20 h-20 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center relative z-10 group-hover:border-pink-500/50 transition-colors duration-300">
          <Icon className="w-10 h-10 text-white group-hover:text-pink-400 transition-colors duration-300" strokeWidth={1.5} />
        </div>
      </div>

      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-pink-300 transition-colors">
        {title}
      </h3>
      
      <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
        {description}
      </p>

      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent group-hover:w-full transition-all duration-500 opacity-50" />
    </motion.div>
  );
};
