import { useState, useEffect } from 'react';

/**
 * Hook pour détecter si l'écran est en mode mobile
 * @param breakpoint - Largeur en pixels pour le breakpoint (défaut: 768px)
 * @returns true si l'écran est en mode mobile
 */
export const useIsMobile = (breakpoint: number = 768): boolean => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    
    // Vérification initiale
    checkMobile();
    
    // Écouter les changements de taille
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [breakpoint]);
  
  return isMobile;
};

