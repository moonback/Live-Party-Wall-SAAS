import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { motion, AnimatePresence } from 'framer-motion';

interface EditCaptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCaption: string;
  onSave: (caption: string) => Promise<void>;
  photoAuthor: string;
}

export const EditCaptionModal: React.FC<EditCaptionModalProps> = ({
  isOpen,
  onClose,
  currentCaption,
  onSave,
  photoAuthor
}) => {
  const isMobile = useIsMobile();
  const [caption, setCaption] = useState(currentCaption);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCaption(currentCaption);
    }
  }, [isOpen, currentCaption]);

  // Empêcher le scroll du body quand le modal est ouvert
  useEffect(() => {
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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      await onSave(caption);
      onClose();
    } catch (error) {
      console.error('Error saving caption:', error);
    } finally {
      setIsSaving(false);
    }
  };

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
              onClick={(e) => e.stopPropagation()}
              className={`w-full bg-slate-900 border border-white/10 shadow-2xl pointer-events-auto overflow-hidden flex flex-col ${
                isMobile 
                  ? 'max-w-full rounded-t-3xl sm:rounded-t-[2.5rem] max-h-[90vh]' 
                  : 'max-w-lg rounded-[2.5rem] max-h-[80vh] my-auto'
              }`}
            >
              {/* Header */}
              <div className={`flex items-center justify-between ${isMobile ? 'p-4' : 'p-3 sm:p-4 md:p-6'} border-b border-white/5 bg-gradient-to-r from-pink-500/5 to-purple-500/5 flex-shrink-0`}>
                <div>
                  <h2 className={`${isMobile ? 'text-xl' : 'text-lg sm:text-xl md:text-2xl'} font-black text-white`}>Modifier la légende</h2>
                  <p className={`text-slate-400 ${isMobile ? 'text-xs' : 'text-[10px] md:text-xs'} font-bold uppercase tracking-widest ${isMobile ? 'mt-1' : 'mt-0.5 md:mt-1'}`}>
                    Photo de {photoAuthor}
                  </p>
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
                <div className="space-y-4">
                  <div>
                    <label className={`block ${isMobile ? 'text-sm' : 'text-xs sm:text-sm'} font-bold text-slate-300 mb-2`}>
                      Légende
                    </label>
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Ajoutez une légende à votre photo..."
                      className={`w-full ${isMobile ? 'p-3 min-h-[120px] text-base' : 'p-3 sm:p-4 min-h-[140px] text-sm'} bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500/30 transition-all resize-none`}
                      autoFocus
                      maxLength={500}
                    />
                    <p className={`text-slate-500 ${isMobile ? 'text-xs mt-2' : 'text-[10px] sm:text-xs mt-1.5'} text-right`}>
                      {caption.length}/500
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className={`${isMobile ? 'p-4' : 'p-4 sm:p-6 md:p-8'} bg-slate-950/50 border-t border-white/5 flex items-center justify-end gap-3`}>
                <button
                  onClick={onClose}
                  disabled={isSaving}
                  className={`${isMobile ? 'px-4 py-2.5 min-h-[44px] text-sm' : 'px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm'} font-bold text-slate-400 hover:text-white transition-colors disabled:opacity-50 touch-manipulation`}
                >
                  Annuler
                </button>
                <motion.button
                  whileHover={{ scale: isSaving ? 1 : 1.05, y: isSaving ? 0 : -2 }}
                  whileTap={{ scale: isSaving ? 1 : 0.95 }}
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`${isMobile ? 'px-6 py-3.5 min-h-[48px] rounded-2xl text-sm' : 'px-6 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-3xl text-xs sm:text-sm'} bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-black uppercase tracking-widest transition-all shadow-xl touch-manipulation relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sauvegarde...</span>
                    </div>
                  ) : (
                    'Enregistrer'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

