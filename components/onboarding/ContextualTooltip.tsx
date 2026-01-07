import React, { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContextualTooltipProps {
  id: string; // Identifiant unique pour ce tooltip (utilisé pour localStorage)
  message: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  targetElement?: HTMLElement | null; // Élément cible pour positionner le tooltip
  onClose?: () => void;
  show?: boolean;
  autoClose?: boolean; // Fermer automatiquement après X secondes
  autoCloseDelay?: number; // Délai en ms avant fermeture auto
}

/**
 * Tooltip contextuel pour guider les utilisateurs
 * S'affiche au premier usage d'une fonctionnalité
 */
export const ContextualTooltip: React.FC<ContextualTooltipProps> = ({
  id,
  message,
  position = 'bottom',
  targetElement,
  onClose,
  show: controlledShow,
  autoClose = false,
  autoCloseDelay = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  // Vérifier si le tooltip a déjà été vu
  useEffect(() => {
    const hasSeen = localStorage.getItem(`tooltip_${id}_seen`) === 'true';
    if (controlledShow !== undefined) {
      setIsVisible(controlledShow && !hasSeen);
    } else {
      setIsVisible(!hasSeen);
    }
  }, [id, controlledShow]);

  // Calculer la position du tooltip par rapport à l'élément cible
  useEffect(() => {
    if (!targetElement || !isVisible) return;

    const updatePosition = () => {
      const rect = targetElement.getBoundingClientRect();
      const spacing = 12;

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = rect.top - spacing;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + spacing;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - spacing;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + spacing;
          break;
      }

      setTooltipPosition({ top, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [targetElement, isVisible, position]);

  // Fermeture automatique
  useEffect(() => {
    if (!isVisible || !autoClose) return;

    const timer = setTimeout(() => {
      handleClose();
    }, autoCloseDelay);

    return () => clearTimeout(timer);
  }, [isVisible, autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem(`tooltip_${id}_seen`, 'true');
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: position === 'bottom' ? -10 : position === 'top' ? 10 : 0 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed z-[9999] pointer-events-none"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          transform: `translate(${position === 'left' || position === 'right' ? '0' : '-50%'}, ${position === 'top' || position === 'bottom' ? '0' : '-50%'})`,
        }}
      >
        <div className="relative bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 rounded-xl p-4 shadow-2xl border-2 border-white/20 backdrop-blur-xl max-w-[280px] pointer-events-auto">
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-xl opacity-30 blur-xl" />
          
          {/* Content */}
          <div className="relative flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-semibold leading-relaxed">
                {message}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors touch-manipulation"
              aria-label="Fermer"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>

          {/* Arrow pointer */}
          <div
            className={`absolute w-0 h-0 border-8 border-transparent ${
              position === 'top'
                ? 'top-full left-1/2 -translate-x-1/2 border-t-pink-500'
                : position === 'bottom'
                ? 'bottom-full left-1/2 -translate-x-1/2 border-b-pink-500'
                : position === 'left'
                ? 'left-full top-1/2 -translate-y-1/2 border-l-pink-500'
                : 'right-full top-1/2 -translate-y-1/2 border-r-pink-500'
            }`}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

