import React from 'react';
import { createPortal } from 'react-dom';
import { Camera, ArrowUp } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { motion, AnimatePresence } from 'framer-motion';

interface GalleryFABProps {
  showScrollTop: boolean;
  onScrollTop: () => void;
  onUploadClick: () => void;
}

export const GalleryFAB: React.FC<GalleryFABProps> = ({
  showScrollTop,
  onScrollTop,
  onUploadClick
}) => {
  const isMobile = useIsMobile();

  return createPortal(
    <div className={`fixed z-[9999] flex flex-col ${isMobile ? 'gap-3 bottom-6 right-4' : 'gap-3 sm:gap-4 bottom-10 right-10'} items-end pointer-events-none`}>
      {/* Scroll Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onScrollTop}
            className={`${isMobile ? 'w-12 h-12 rounded-xl' : 'w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl'} bg-slate-900/80 backdrop-blur-xl flex items-center justify-center text-white shadow-2xl border border-white/10 hover:border-pink-500/50 transition-colors pointer-events-auto touch-manipulation`}
            title="Haut de page"
          >
            <ArrowUp className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5 sm:w-6 sm:h-6'}`} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Upload FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={onUploadClick}
        className={`${isMobile ? 'w-16 h-16 rounded-2xl' : 'w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl sm:rounded-3xl'} bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-[0_20px_50px_rgba(236,72,153,0.3)] hover:shadow-[0_20px_50px_rgba(236,72,153,0.5)] transition-shadow pointer-events-auto group relative overflow-hidden touch-manipulation`}
        aria-label="Envoyer une photo"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <Camera className={`${isMobile ? 'w-8 h-8' : 'w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10'} relative z-10`} />
      </motion.button>
    </div>,
    document.body
  );
};

