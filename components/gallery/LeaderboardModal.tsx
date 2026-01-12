import React from 'react';
import { createPortal } from 'react-dom';
import { Photo, ReactionCounts } from '../../types';
import { Trophy, X } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { motion, AnimatePresence } from 'framer-motion';
import Leaderboard from '../Leaderboard';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: Photo[];
  guestAvatars?: Map<string, string>;
  photosReactions?: Map<string, ReactionCounts>;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  photos,
  guestAvatars,
  photosReactions
}) => {
  const isMobile = useIsMobile();

  // Empêcher le scroll du body quand le modal est ouvert
  React.useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
    return undefined;
  }, [isOpen]);

  // Fermer avec Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (typeof window === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[100]"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div 
            className={`fixed inset-0 z-[101] pointer-events-none ${
              isMobile 
                ? 'flex items-end justify-center' 
                : 'flex items-center justify-center p-4 md:p-6'
            }`}
          >
            <motion.div
              initial={isMobile ? { y: '100%' } : { scale: 0.9, opacity: 0, y: 0 }}
              animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1, y: 0 }}
              exit={isMobile ? { y: '100%' } : { scale: 0.9, opacity: 0, y: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`w-full bg-slate-900 border border-white/10 shadow-2xl pointer-events-auto overflow-hidden flex flex-col ${
                isMobile 
                  ? 'max-w-full rounded-t-3xl sm:rounded-t-[2.5rem] max-h-[90vh]' 
                  : 'max-w-2xl rounded-[2.5rem] max-h-[80vh] my-auto'
              }`}
            >
              {/* Header */}
              <div className={`flex items-center justify-between ${isMobile ? 'p-4' : 'p-3 sm:p-4 md:p-8'} border-b border-white/5 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-yellow-500/10 flex-shrink-0`}>
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, -15, 15, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className={`${isMobile ? 'p-2.5' : 'p-2 sm:p-2.5'} rounded-xl sm:rounded-2xl bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-yellow-500/20 border border-yellow-500/30`}
                  >
                    <Trophy className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5 sm:w-6 sm:h-6'} text-yellow-400`} />
                  </motion.div>
                  <div>
                    <h2 className={`${isMobile ? 'text-xl' : 'text-lg sm:text-xl md:text-3xl'} font-black text-white`}>Classement</h2>
                    <p className={`text-slate-400 ${isMobile ? 'text-xs' : 'text-[10px] md:text-xs'} font-bold uppercase tracking-widest ${isMobile ? 'mt-1' : 'mt-0.5 md:mt-1'} ${isMobile ? 'block' : 'hidden md:block'}`}>Top participants</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className={`${isMobile ? 'p-3 min-w-[44px] min-h-[44px] rounded-xl' : 'p-2 sm:p-3 rounded-xl sm:rounded-2xl'} bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-95 touch-manipulation flex items-center justify-center`}
                >
                  <X className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5 sm:w-6 sm:h-6'}`} />
                </button>
              </div>

              {/* Body */}
              <div className={`flex-1 overflow-y-auto ${isMobile ? 'p-4' : 'p-4 sm:p-6 md:p-8'}`}>
                <Leaderboard 
                  photos={photos} 
                  maxEntries={20}
                  guestAvatars={guestAvatars}
                  photosReactions={photosReactions}
                />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

