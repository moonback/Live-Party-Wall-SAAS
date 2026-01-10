import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NewPhotoIndicatorProps {
  show: boolean;
}

export const NewPhotoIndicator = React.memo(({ show }: NewPhotoIndicatorProps) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-24 md:top-32 lg:top-40 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 md:px-8 lg:px-10 xl:px-12 py-3 md:py-4 lg:py-5 rounded-full shadow-2xl flex items-center gap-3 md:gap-4 lg:gap-5 border-2 md:border-[3px] border-white/30">
            <span className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 bg-white rounded-full animate-pulse"></span>
            <span className="font-bold text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl">Nouvelle photo ! 🎉</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

