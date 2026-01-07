import React from 'react';
import { ViewMode } from '../../types';
import { Lock, Tv, Play, HelpCircle, BarChart3, Smartphone, User, Trophy } from 'lucide-react';
import { ActionButton } from './ActionButton';

interface TopRightButtonsProps {
  onSelectMode: (mode: ViewMode) => void;
  isAdminAuthenticated: boolean;
  hasUserProfile: boolean;
  statsEnabled: boolean;
  battleModeEnabled: boolean;
}

/**
 * Boutons d'action en haut à droite (desktop uniquement)
 */
export const TopRightButtons: React.FC<TopRightButtonsProps> = ({
  onSelectMode,
  isAdminAuthenticated,
  hasUserProfile,
  statsEnabled,
  battleModeEnabled,
}) => {
  return (
    <div className="hidden sm:flex fixed top-1/2 right-2 sm:right-4 -translate-y-1/2 z-50 flex-col items-center gap-3 sm:gap-4 py-4 px-2 rounded-full backdrop-blur-sm bg-black/10 border border-white/5 transition-all duration-300 hover:bg-black/20">
      {/* Guest Profile Button */}
      {hasUserProfile && (
        <ActionButton
          onClick={() => onSelectMode('guest-profile')}
          icon={User}
          title="Mon profil"
          ariaLabel="Mon profil"
          glowColor="rgba(236, 72, 153, 0.15)"
        />
      )}

      {/* Help Button */}
      <ActionButton
        onClick={() => onSelectMode('help')}
        icon={HelpCircle}
        title="Aide"
        ariaLabel="Aide"
        gradient="from-indigo-500/0 via-blue-500/0 to-cyan-500/0"
        glowColor="rgba(99, 102, 241, 0.15)"
      />

      {/* Projection Wall Button */}
      {isAdminAuthenticated && (
        <ActionButton
          onClick={() => onSelectMode('projection')}
          icon={Play}
          title="Projection Murale"
          ariaLabel="Projection Murale"
          glowColor="rgba(236, 72, 153, 0.15)"
        />
      )}

      {/* Grand Écran Button */}
      {isAdminAuthenticated && (
        <ActionButton
          onClick={() => onSelectMode('wall')}
          icon={Tv}
          title="Grand Écran"
          ariaLabel="Grand Écran"
          gradient="from-indigo-500/0 via-blue-500/0 to-cyan-500/0"
          glowColor="rgba(99, 102, 241, 0.15)"
        />
      )}

      {/* Stats Button */}
      {statsEnabled && (
        <ActionButton
          onClick={() => onSelectMode('stats-display')}
          icon={BarChart3}
          title="Statistiques"
          ariaLabel="Statistiques"
          gradient="from-cyan-500/0 via-blue-500/0 to-indigo-500/0"
          glowColor="rgba(34, 211, 238, 0.15)"
        />
      )}

      {/* Mobile Control Button - Design spécial */}
      {isAdminAuthenticated && (
        <button
          onClick={() => onSelectMode('mobile-control')}
          className="relative min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-3 sm:p-3 rounded-xl sm:rounded-2xl backdrop-blur-xl bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:via-blue-500/30 hover:to-purple-500/30 active:from-cyan-500/40 active:via-blue-500/40 active:to-purple-500/40 border-2 border-cyan-400/30 hover:border-cyan-400/50 text-white active:scale-95 transition-all duration-300 group shadow-lg hover:shadow-2xl overflow-hidden flex items-center justify-center"
          style={{
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(34, 211, 238, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          }}
          title="Contrôle Mobile"
          aria-label="Contrôle Mobile"
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 30px rgba(34, 211, 238, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 0 3px rgba(34, 211, 238, 0.5)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(34, 211, 238, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500 animate-gradient-shift" />
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-400/30 rounded-full blur-md group-hover:bg-cyan-400/50 transition-all duration-300 animate-pulse" />
            <Smartphone className="relative w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 group-hover:rotate-6 group-active:scale-95 group-active:rotate-0 transition-all duration-300 drop-shadow-lg" />
          </div>
        </button>
      )}

      {/* Battle Results Button - Design spécial */}
      {battleModeEnabled && (
        <button
          onClick={() => onSelectMode('battle-results')}
          className="relative min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-3 sm:p-3 rounded-xl sm:rounded-2xl backdrop-blur-xl bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-yellow-500/20 hover:from-yellow-500/30 hover:via-orange-500/30 hover:to-yellow-500/30 active:from-yellow-500/40 active:via-orange-500/40 active:to-yellow-500/40 border-2 border-yellow-500/30 hover:border-yellow-500/50 active:border-yellow-500/60 text-yellow-400 hover:text-yellow-300 active:scale-95 transition-all duration-300 group shadow-xl hover:shadow-2xl overflow-hidden flex items-center justify-center"
          style={{
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(234, 179, 8, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          }}
          title="Résultats des Battles"
          aria-label="Résultats des Battles"
          onFocus={(e: React.FocusEvent<HTMLButtonElement>) => {
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 30px rgba(234, 179, 8, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 0 3px rgba(234, 179, 8, 0.5)';
          }}
          onBlur={(e: React.FocusEvent<HTMLButtonElement>) => {
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(234, 179, 8, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-orange-500/0 to-yellow-500/0 group-hover:from-yellow-500/25 group-hover:via-orange-500/25 group-hover:to-yellow-500/25 transition-all duration-500 opacity-0 group-hover:opacity-100 blur-sm rounded-xl sm:rounded-2xl" />
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="absolute inset-0 bg-yellow-500/25 rounded-xl sm:rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Trophy className="relative w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 group-hover:rotate-3 group-active:scale-95 group-active:rotate-0 transition-all duration-300 drop-shadow-lg" />
        </button>
      )}

      {/* Admin Button */}
      <ActionButton
        onClick={() => onSelectMode('admin')}
        icon={Lock}
        title="Administration"
        ariaLabel="Administration"
        gradient="from-purple-500/0 via-violet-500/0 to-fuchsia-500/0"
        glowColor="rgba(139, 92, 246, 0.15)"
      />
    </div>
  );
};

