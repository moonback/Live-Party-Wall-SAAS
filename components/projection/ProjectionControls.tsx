import React from 'react';
import { Play, Pause, Maximize2, Shuffle, Settings, Sparkles } from 'lucide-react';
import type { ARSceneManagerRef } from '../arEffects/ARSceneManager';

interface ProjectionControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  isRandom: boolean;
  onToggleRandom: () => void;
  speedMultiplier: number;
  onSpeedChange: () => void;
  onFullscreen: () => void;
  showSettings: boolean;
  onToggleSettings: () => void;
  showQrCodes: boolean;
  onToggleQrCodes: () => void;
  arEnabled: boolean;
  onTriggerAR: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

/**
 * Barre de contrôles pour la projection
 */
export const ProjectionControls: React.FC<ProjectionControlsProps> = ({
  isPlaying,
  onTogglePlay,
  isRandom,
  onToggleRandom,
  speedMultiplier,
  onSpeedChange,
  onFullscreen,
  showSettings,
  onToggleSettings,
  showQrCodes,
  onToggleQrCodes,
  arEnabled,
  onTriggerAR,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <div
      className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-xl border border-white/10 px-3 py-2 rounded-2xl shadow-2xl transition-all duration-300 opacity-100 translate-y-0"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Play/Pause */}
      <button
        onClick={onTogglePlay}
        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        aria-label={isPlaying ? 'Pause' : 'Play'}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
      </button>

      {/* Bouton Effets AR */}
      {arEnabled && (
        <button
          onClick={onTriggerAR}
          className="p-2 rounded-lg bg-white/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 transition-colors"
          title="Déclencher un effet AR"
          aria-label="Déclencher un effet AR"
        >
          <Sparkles className="w-4 h-4" />
        </button>
      )}

      {/* Aléatoire */}
      <button
        onClick={onToggleRandom}
        className={`p-2 rounded-lg transition-colors ${
          isRandom ? 'bg-pink-500/30 text-pink-300' : 'bg-white/10 hover:bg-white/20 text-white'
        }`}
        aria-label="Mode aléatoire"
        title="Mode aléatoire"
      >
        <Shuffle className="w-4 h-4" />
      </button>

      {/* Vitesse */}
      <button
        onClick={onSpeedChange}
        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white text-xs font-bold"
        title={`Vitesse: ${speedMultiplier}x`}
      >
        {speedMultiplier}x
      </button>

      {/* Plein écran */}
      <button
        onClick={onFullscreen}
        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        aria-label="Plein écran"
        title="Plein écran"
      >
        <Maximize2 className="w-4 h-4 text-white" />
      </button>

      {/* Paramètres */}
      <button
        onClick={onToggleSettings}
        className={`p-2 rounded-lg transition-colors ${
          showSettings ? 'bg-purple-500/30 text-purple-300' : 'bg-white/10 hover:bg-white/20 text-white'
        }`}
        aria-label="Paramètres"
        title="Paramètres"
      >
        <Settings className="w-4 h-4" />
      </button>

      {/* Toggle QR codes */}
      <button
        onClick={onToggleQrCodes}
        className={`p-2 rounded-lg transition-colors ${
          showQrCodes ? 'bg-cyan-500/30 text-cyan-300' : 'bg-white/10 hover:bg-white/20 text-white'
        }`}
        aria-label={showQrCodes ? 'Masquer les QR Codes' : 'Afficher les QR Codes'}
        title={showQrCodes ? 'Masquer les QR Codes' : 'Afficher les QR Codes'}
      >
        <span className="text-xs font-black">QR</span>
      </button>
    </div>
  );
};

