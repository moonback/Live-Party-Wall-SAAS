import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined';
  onClick?: () => void;
}

/**
 * Card - Container réutilisable avec variants
 * Utilise le système d'espacements standardisé (p-4 mobile, p-6 desktop)
 */
export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  variant = 'default',
  onClick
}) => {
  const variants = {
    default: 'bg-slate-900/50 backdrop-blur-sm border border-slate-800',
    elevated: 'bg-slate-900/70 backdrop-blur-sm border border-slate-700 shadow-xl',
    outlined: 'bg-transparent border-2 border-slate-800'
  };
  
  const baseClasses = 'rounded-xl p-4 md:p-6 transition-all';
  const interactiveClasses = onClick ? 'cursor-pointer hover:border-slate-700' : '';
  
  return (
    <div 
      className={`${baseClasses} ${variants[variant]} ${interactiveClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

