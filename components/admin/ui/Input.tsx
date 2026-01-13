import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}

/**
 * Input - Champ de formulaire stylisé
 * Utilise les couleurs et espacements du design system
 */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;
  const baseInputClasses = 'w-full bg-slate-900/50 border rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all';
  const errorClasses = hasError 
    ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/20' 
    : 'border-slate-800 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20';
  const iconPadding = Icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : '';

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-xs font-medium text-slate-200 mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          className={`${baseInputClasses} ${errorClasses} ${iconPadding} ${className}`}
          {...props}
        />
        {Icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
          {helperText}
        </p>
      )}
    </div>
  );
};

