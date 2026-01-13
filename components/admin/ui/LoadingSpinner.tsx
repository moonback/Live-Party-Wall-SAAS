import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * LoadingSpinner - Indicateur de chargement
 * Optimisé avec prefers-reduced-motion
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = ''
}) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3'
  };

  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-indigo-500 border-t-transparent ${sizes[size]}`}
        style={prefersReducedMotion ? { animation: 'none' } : {}}
        aria-label="Chargement en cours"
        role="status"
      >
        <span className="sr-only">Chargement...</span>
      </div>
    </div>
  );
};

