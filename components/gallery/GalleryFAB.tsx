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

  // Ne pas afficher les boutons flottants sur mobile
  if (isMobile) {
    return null;
  }

  return createPortal(
    <div className="fixed z-[9999] flex flex-col gap-3 sm:gap-4 bottom-10 right-10 items-end pointer-events-none">
      {/* Scroll Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20, rotate: -180 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20, rotate: 180 }}
            whileHover={{ scale: 1.15, y: -4 }}
            whileTap={{ scale: 0.9 }}
            onClick={onScrollTop}
            className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-slate-900/90 backdrop-blur-xl flex items-center justify-center text-white shadow-2xl border border-white/10 hover:border-pink-500/50 transition-all duration-300 pointer-events-auto touch-manipulation relative overflow-hidden group"
            title="Haut de page"
            aria-label="Retour en haut de page"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-purple-500/0 to-indigo-500/0 group-hover:from-pink-500/30 group-hover:via-purple-500/30 group-hover:to-indigo-500/30"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
                repeatDelay: 1
              }}
            />
            <motion.div
              animate={{ 
                y: [0, -4, 0],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="relative z-10"
            >
              <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Upload FAB */}
      <motion.button
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9, rotate: -5 }}
        onClick={onUploadClick}
        className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-[0_20px_50px_rgba(236,72,153,0.3)] hover:shadow-[0_30px_60px_rgba(236,72,153,0.5)] transition-all duration-300 pointer-events-auto group relative overflow-hidden touch-manipulation"
        aria-label="Envoyer une photo"
      >
        {/* Pulse effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
            repeatDelay: 0.5
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, 8, -8, 0],
            boxShadow: [
              '0px 0px 0px 0px rgba(236,72,153,0.0)',
              '0px 0px 30px 0px rgba(236,72,153,0.15)',
              '0px 0px 0px 0px rgba(236,72,153,0.0)'
            ]
          }}
          transition={{
            duration: 2.6,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="relative z-10 flex items-center justify-center"
        >
          <Camera
            className="w-8 h-8 sm:w-9 sm:h-9 md:w-12 md:h-12 drop-shadow-[0_8px_24px_rgba(236,72,153,0.7)] transition-all duration-300"
          />
          {/* Flash sparkle */}
          <motion.div
            className="absolute right-2 top-2 w-2 h-2 rounded-full bg-white/80 opacity-70 pointer-events-none shadow-[0_0_12px_2px_rgba(255,255,255,0.7)]"
            animate={{
              scale: [1, 1.3, 0.7, 1],
              opacity: [0.7, 1, 0.3, 0.7]
            }}
            transition={{
              duration: 1.35,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.6
            }}
          />
        </motion.div>
      </motion.button>
    </div>,
    document.body
  );
};

