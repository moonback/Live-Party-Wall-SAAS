import React, { useState, useRef } from 'react';
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
 * Composant réutilisable pour les boutons d'action avec glassmorphism et animations avancées
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
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleIdRef = useRef(0);

  const defaultStyle: React.CSSProperties = {
    boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px ${glowColor}, inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
    ...style,
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = rippleIdRef.current++;
      
      setRipples(prev => [...prev, { id, x, y }]);
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== id));
      }, 600);
    }
    onClick();
  };

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseLeave = () => setIsPressed(false);

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      className={`relative p-2.5 sm:p-3 rounded-xl sm:rounded-2xl backdrop-blur-xl bg-gradient-to-br ${gradient} hover:from-white/15 hover:via-white/10 hover:to-white/15 active:from-white/20 active:via-white/15 active:to-white/20 border border-white/20 hover:border-white/40 active:border-white/50 text-white/80 hover:text-white transition-all duration-300 group shadow-xl hover:shadow-2xl overflow-hidden ${className} ${
        isPressed ? 'scale-90' : 'scale-100 hover:scale-105'
      }`}
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
      
      {/* Shimmer effect - amélioré */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      
      {/* Pulsing glow effect */}
      <div className="absolute inset-0 bg-pink-500/20 rounded-xl sm:rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
      
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/40 pointer-events-none"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            width: '0px',
            height: '0px',
            transform: 'translate(-50%, -50%)',
            animation: 'ripple 600ms ease-out',
          }}
        />
      ))}
      
      {/* Icon avec animation améliorée */}
      <Icon className="relative w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-125 group-hover:rotate-6 group-active:scale-90 group-active:rotate-0 transition-all duration-300 drop-shadow-lg z-10" />
      
      {/* Particules flottantes autour du bouton au hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/60"
            style={{
              left: `${20 + i * 30}%`,
              top: `${30 + i * 20}%`,
              animation: `float-particle 3s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>
      
      {/* Styles d'animation */}
      <style>{`
        @keyframes ripple {
          to {
            width: 100px;
            height: 100px;
            opacity: 0;
          }
        }
        @keyframes float-particle {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translate(${Math.random() * 20 - 10}px, ${Math.random() * 20 - 10}px) scale(1.5);
            opacity: 1;
          }
        }
      `}</style>
    </button>
  );
};

