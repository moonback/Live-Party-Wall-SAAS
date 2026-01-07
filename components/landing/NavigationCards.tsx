import React, { useState } from 'react';
import { ViewMode } from '../../types';
import { LucideIcon, ArrowRight, Zap } from 'lucide-react';

interface NavigationOption {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  glowColor: string;
  delay: string;
  isPrimary: boolean;
}

interface NavigationCardsProps {
  options: NavigationOption[];
  mounted: boolean;
  onSelectMode: (mode: ViewMode) => void;
}

/**
 * Cartes de navigation compactes et animées pour les différents modes.
 * UX améliorée : effet tactile/mobile, animation d'apparition fluide, accessibilité accrue.
 */
export const NavigationCards: React.FC<NavigationCardsProps> = ({
  options,
  mounted,
  onSelectMode,
}) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<string | null>(null);

  // Gère à la fois le hover (desktop), le focus (clavier) et le "press" (mobile)
  const handleMouseEnter = (id: string) => setHoveredCard(id);
  const handleMouseLeave = () => setHoveredCard(null);
  const handleTouchStart = (id: string) => setActiveCard(id);
  const handleTouchEnd = () => setActiveCard(null);
  const handleFocus = (id: string) => setHoveredCard(id);
  const handleBlur = () => setHoveredCard(null);

  return (
    <div className="w-full flex flex-col lg:flex-row items-center gap-2 lg:gap-3 lg:justify-center">
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = hoveredCard === option.id || activeCard === option.id;

        return (
          <button
            key={option.id}
            onClick={() => onSelectMode(option.id as ViewMode)}
            onMouseEnter={() => handleMouseEnter(option.id)}
            onMouseLeave={handleMouseLeave}
            onTouchStart={() => handleTouchStart(option.id)}
            onTouchEnd={handleTouchEnd}
            onFocus={() => handleFocus(option.id)}
            onBlur={handleBlur}
            className={`group relative w-full lg:w-auto lg:flex-1 lg:max-w-xs h-16 sm:h-20 lg:h-24 rounded-xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition-all duration-500 px-3 select-none ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
            }`}
            style={{
              animationDelay: option.delay,
              transform: isActive
                ? 'translateY(-4px) scale(1.02)'
                : 'translateY(0) scale(1)',
              transition: 'all 0.28s cubic-bezier(.45,.05,.55,.95)'
            }}
            aria-label={option.title}
            tabIndex={0}
            type="button"
          >
            {/* Animated Gradient Background */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${option.gradient} transition-opacity duration-700 pointer-events-none ${
                isActive ? 'opacity-40 blur-[2px]' : 'opacity-0'
              }`}
            />

            {/* Main Card Area */}
            <div
              className="relative h-full bg-white/10 border border-white/10 rounded-xl flex items-center px-2 sm:px-3 gap-3 sm:gap-4 shadow-xl transition-shadow duration-500"
              style={{
                boxShadow: isActive
                  ? `0 4px 32px 0 ${option.glowColor}, 0 2px 12px rgba(0,0,0,0.14)`
                  : '0 2px 8px rgba(0,0,0,0.10)',
              }}
            >
              {/* Icon */}
              <div className="flex-shrink-0 relative">
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center bg-gradient-to-br ${option.gradient} shadow-md transition-all duration-300 group-hover:scale-110 group-active:scale-105 ${
                    isActive ? 'scale-110 ring-2 ring-white/30' : ''
                  }`}
                  style={{
                    boxShadow: isActive
                      ? `0 2px 12px ${option.glowColor}` : undefined,
                  }}
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow" />
                </div>
                {option.isPrimary && (
                  <div className="absolute -top-1.5 -right-1.5 z-20">
                    <span className="inline-flex items-center bg-yellow-600/90 px-1.5 py-0.5 rounded shadow text-yellow-100 text-[10px] font-black animate-pulse">
                      <Zap className="w-3 h-3 mr-0.5 text-yellow-300 drop-shadow" />
                      HOT
                    </span>
                  </div>
                )}
              </div>

              {/* Title & Description */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2 min-w-0">
                  <h3
                    className={`text-base sm:text-lg font-bold truncate transition-all duration-300
                      ${
                        isActive
                          ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-violet-300 to-sky-300 drop-shadow-sm'
                          : 'text-white'
                      }`}
                    style={isActive ? {
                      backgroundSize: '200% 100%',
                      animation: 'gradient-shift 6s linear infinite'
                    } : {}}
                  >
                    {option.title}
                  </h3>
                  {option.isPrimary && (
                    <span role="img" aria-label="Recommandé" className="ml-1 text-xs text-yellow-200 font-black px-1 py-0.5 rounded bg-yellow-800/40 shadow-sm">★</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300
                      ${isActive
                        ? `bg-gradient-to-r ${option.gradient} scale-150 shadow-lg`
                        : 'bg-slate-400'
                      }
                    `}
                  />
                  <span className={`text-xs sm:text-sm truncate transition-colors duration-300 ${
                    isActive ? 'text-white/90 font-medium' : 'text-slate-300'
                  }`}>
                    {option.description}
                  </span>
                </div>
              </div>

              {/* Arrow Indicator */}
              <div className="flex-shrink-0 ml-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center bg-white/10 transition-all duration-300
                    ${isActive ? 'bg-gradient-to-br from-white/60 to-white/20 scale-110 ring-2 ring-white/40 shadow-lg' : ''}
                  `}
                  style={{
                    boxShadow: isActive ? `0 0 10px ${option.glowColor}` : undefined,
                  }}
                >
                  <ArrowRight
                    className={`w-4 h-4 text-white transition-transform duration-300 ${
                      isActive ? 'translate-x-1 scale-125 drop-shadow-sm' : ''
                    }`}
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          </button>
        );
      })}
      {/* Animation CSS keyframes */}
      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
};
