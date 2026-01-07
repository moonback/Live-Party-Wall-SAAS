import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ActionButtonProps {
  onClick: () => void;
  icon: LucideIcon;
  title: string;
  ariaLabel: string;
  gradient?: string;
  glowColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Composant réutilisable pour les boutons d'action avec glassmorphism
 */
export const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  icon: Icon,
  title,
  ariaLabel,
  gradient = 'from-white/8 via-white/5 to-white/8',
  glowColor = 'rgba(99, 102, 241, 0.15)',
  className = '',
  style,
}) => {
  const defaultStyle: React.CSSProperties = {
    boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px ${glowColor}, inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
    ...style,
  };

  return (
    <button
      onClick={onClick}
      className={`relative p-2.5 sm:p-3 rounded-xl sm:rounded-2xl backdrop-blur-xl bg-gradient-to-br ${gradient} hover:from-white/15 hover:via-white/10 hover:to-white/15 active:from-white/20 active:via-white/15 active:to-white/20 border border-white/20 hover:border-white/40 active:border-white/50 text-white/80 hover:text-white active:scale-95 transition-all duration-300 group shadow-xl hover:shadow-2xl overflow-hidden ${className}`}
      style={defaultStyle}
      title={title}
      aria-label={ariaLabel}
      onFocus={(e: React.FocusEvent<HTMLButtonElement>) => {
        e.currentTarget.style.boxShadow = `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 30px ${glowColor.replace('0.15', '0.3')}, inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 0 3px ${glowColor.replace('0.15', '0.5')}`;
      }}
      onBlur={(e: React.FocusEvent<HTMLButtonElement>) => {
        e.currentTarget.style.boxShadow = defaultStyle.boxShadow as string;
      }}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-purple-500/0 to-cyan-500/0 group-hover:from-pink-500/20 group-hover:via-purple-500/20 group-hover:to-cyan-500/20 transition-all duration-500 opacity-0 group-hover:opacity-100 blur-sm" />
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      {/* Icon glow */}
      <div className="absolute inset-0 bg-pink-500/20 rounded-xl sm:rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <Icon className="relative w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 group-hover:rotate-3 group-active:scale-95 group-active:rotate-0 transition-all duration-300 drop-shadow-lg" />
    </button>
  );
};

