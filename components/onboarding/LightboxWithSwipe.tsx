import React from 'react';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';

interface LightboxWithSwipeProps {
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Wrapper pour ajouter le support du swipe vers le bas pour fermer
 */
export const LightboxWithSwipe: React.FC<LightboxWithSwipeProps> = ({
  onClose,
  children,
  className = '',
  style,
  onClick,
}) => {
  useSwipeGesture({
    onSwipeDown: onClose,
    threshold: 80,
    enabled: true,
  });

  return (
    <div className={className} style={style} onClick={onClick}>
      {children}
    </div>
  );
};

