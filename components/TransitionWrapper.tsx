import React, { useState, useEffect, ReactNode } from 'react';

export type TransitionType = 
  | 'fade' 
  | 'slide-left' 
  | 'slide-right' 
  | 'slide-bottom' 
  | 'scale' 
  | 'rotate' 
  | 'flip' 
  | 'zoom-bounce';

interface TransitionWrapperProps {
  children: ReactNode;
  type?: TransitionType;
  duration?: number;
  delay?: number;
  show?: boolean;
  className?: string;
}

const TransitionWrapper: React.FC<TransitionWrapperProps> = ({
  children,
  type = 'fade',
  duration = 600,
  delay = 0,
  show = true,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setIsExiting(false);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setIsExiting(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, delay, duration]);

  const getAnimationClass = () => {
    if (!isVisible && !isExiting) return '';
    if (isExiting) {
      switch (type) {
        case 'fade': return 'animate-fade-out';
        case 'slide-left': return 'animate-slide-out-left';
        case 'slide-right': return 'animate-slide-out-right';
        case 'scale': return 'animate-scale-out';
        default: return 'animate-fade-out';
      }
    }
    
    switch (type) {
      case 'fade': return 'animate-fade-in';
      case 'slide-left': return 'animate-slide-in-left';
      case 'slide-right': return 'animate-slide-in-right';
      case 'slide-bottom': return 'animate-slide-in-bottom';
      case 'scale': return 'animate-scale-in';
      case 'rotate': return 'animate-rotate-in';
      case 'flip': return 'animate-flip-in';
      case 'zoom-bounce': return 'animate-zoom-in-bounce';
      default: return 'animate-fade-in';
    }
  };

  if (!isVisible && !show) return null;

  return (
    <div 
      className={`${getAnimationClass()} ${className}`}
      style={{ 
        animationDuration: `${duration}ms`,
        animationDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
};

export default TransitionWrapper;

