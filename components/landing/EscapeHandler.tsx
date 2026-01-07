import React, { useEffect } from 'react';

interface EscapeHandlerProps {
  onEscape: () => void;
}

/**
 * Composant helper pour gérer la touche Échap
 */
export const EscapeHandler: React.FC<EscapeHandlerProps> = ({ onEscape }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onEscape]);
  return null;
};

