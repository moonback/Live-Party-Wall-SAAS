import React from 'react';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

/**
 * Badge - Badge de statut avec couleurs cohérentes
 * Utilise la palette de couleurs standardisée du design system
 */
export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'primary',
  className = '' 
}) => {
  const variants: Record<BadgeVariant, string> = {
    primary: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300',
    secondary: 'bg-purple-500/20 border-purple-500/30 text-purple-300',
    success: 'bg-teal-500/20 border-teal-500/30 text-teal-300',
    warning: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300',
    error: 'bg-red-500/20 border-red-500/30 text-red-300',
    neutral: 'bg-slate-700/50 border-slate-600/50 text-slate-300'
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

