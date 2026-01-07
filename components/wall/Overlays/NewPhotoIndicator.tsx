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
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            <span className="font-bold text-sm">Nouvelle photo ! 🎉</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

