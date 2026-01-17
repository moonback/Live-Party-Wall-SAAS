import React from 'react';
import { Zap, Star, Award, Video, Crown } from 'lucide-react';

type PresetMode = 'rapide' | 'standard' | 'qualite' | 'story';

interface PresetSelectorProps {
  presetMode: PresetMode;
  onPresetModeChange: (mode: PresetMode) => void;
  isFeatureEnabled: (feature: string, licenseKey?: string) => boolean;
  licenseKey?: string;
  disabled?: boolean;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  presetMode,
  onPresetModeChange,
  isFeatureEnabled,
  licenseKey,
  disabled = false
}) => {
  const isPremium = isFeatureEnabled('aftermovies_enabled', licenseKey);

  return (
    <div className="mb-4 sm:mb-6">
      <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2 sm:mb-3">Mode de génération</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => onPresetModeChange('rapide')}
          className={`p-3 sm:p-4 rounded-lg border-2 transition-all group ${
            presetMode === 'rapide'
              ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20'
              : 'border-slate-800 bg-slate-900/50 hover:border-indigo-500/30 hover:bg-slate-900/70'
          }`}
          disabled={disabled}
          title="Génération rapide avec qualité réduite"
        >
          <Zap className={`w-5 h-5 sm:w-6 sm:h-6 mb-1.5 sm:mb-2 mx-auto transition-colors ${presetMode === 'rapide' ? 'text-indigo-400' : 'text-slate-400 group-hover:text-indigo-400'}`} />
          <div className={`text-xs sm:text-sm font-semibold mb-1 transition-colors ${presetMode === 'rapide' ? 'text-indigo-300' : 'text-slate-100 group-hover:text-indigo-300'}`}>
            Rapide
          </div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-1">720p • 24 FPS • 4 Mbps</div>
          <div className="text-[9px] sm:text-[10px] text-slate-500 mt-1 sm:mt-1.5">Idéal pour tests</div>
        </button>
        <button
          type="button"
          onClick={() => onPresetModeChange('standard')}
          className={`p-3 sm:p-4 rounded-lg border-2 transition-all group ${
            presetMode === 'standard'
              ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20'
              : 'border-slate-800 bg-slate-900/50 hover:border-indigo-500/30 hover:bg-slate-900/70'
          }`}
          disabled={disabled}
          title="Équilibre parfait entre qualité et vitesse"
        >
          <Star className={`w-5 h-5 sm:w-6 sm:h-6 mb-1.5 sm:mb-2 mx-auto transition-colors ${presetMode === 'standard' ? 'text-indigo-400' : 'text-slate-400 group-hover:text-indigo-400'}`} />
          <div className={`text-xs sm:text-sm font-semibold mb-1 transition-colors ${presetMode === 'standard' ? 'text-indigo-300' : 'text-slate-100 group-hover:text-indigo-300'}`}>
            Standard
          </div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-1">1080p • 30 FPS • 12 Mbps</div>
          <div className="text-[9px] sm:text-[10px] text-slate-500 mt-1 sm:mt-1.5">Recommandé</div>
        </button>
        {/* Mode Qualité - Premium */}
        {isPremium ? (
          <button
            type="button"
            onClick={() => onPresetModeChange('qualite')}
            className={`p-3 sm:p-4 rounded-lg border-2 transition-all group ${
              presetMode === 'qualite'
                ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20'
                : 'border-slate-800 bg-slate-900/50 hover:border-indigo-500/30 hover:bg-slate-900/70'
            }`}
            disabled={disabled}
            title="Qualité maximale pour diffusion professionnelle"
          >
            <Award className={`w-5 h-5 sm:w-6 sm:h-6 mb-1.5 sm:mb-2 mx-auto transition-colors ${presetMode === 'qualite' ? 'text-indigo-400' : 'text-slate-400 group-hover:text-indigo-400'}`} />
            <div className={`text-xs sm:text-sm font-semibold mb-1 transition-colors ${presetMode === 'qualite' ? 'text-indigo-300' : 'text-slate-100 group-hover:text-indigo-300'}`}>
              Qualité
            </div>
            <div className="text-[10px] sm:text-xs text-slate-400 mt-1">1080p • 30 FPS • 20 Mbps</div>
            <div className="text-[9px] sm:text-[10px] text-slate-500 mt-1 sm:mt-1.5">Meilleure qualité</div>
          </button>
        ) : (
          <div className="relative p-3 sm:p-4 rounded-lg border-2 border-amber-500/30 bg-slate-900/30 opacity-50 cursor-not-allowed">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 sm:gap-2">
              <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              <span className="text-[10px] sm:text-xs font-semibold text-amber-300">Passer à Pro</span>
            </div>
            <Award className="w-5 h-5 sm:w-6 sm:h-6 mb-1.5 sm:mb-2 mx-auto text-slate-500" />
            <div className="text-xs sm:text-sm font-semibold text-slate-500">Qualité</div>
            <div className="text-[10px] sm:text-xs text-slate-600 mt-1">1080p • 30 FPS • 20 Mbps</div>
          </div>
        )}
        {/* Mode Story - Premium */}
        {isPremium ? (
          <button
            type="button"
            onClick={() => onPresetModeChange('story')}
            className={`p-3 sm:p-4 rounded-lg border-2 transition-all group ${
              presetMode === 'story'
                ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20'
                : 'border-slate-800 bg-slate-900/50 hover:border-indigo-500/30 hover:bg-slate-900/70'
            }`}
            disabled={disabled}
            title="Format vertical pour réseaux sociaux (Instagram, TikTok)"
          >
            <Video className={`w-5 h-5 sm:w-6 sm:h-6 mb-1.5 sm:mb-2 mx-auto transition-colors ${presetMode === 'story' ? 'text-indigo-400' : 'text-slate-400 group-hover:text-indigo-400'}`} />
            <div className={`text-xs sm:text-sm font-semibold mb-1 transition-colors ${presetMode === 'story' ? 'text-indigo-300' : 'text-slate-100 group-hover:text-indigo-300'}`}>
              Story
            </div>
            <div className="text-[10px] sm:text-xs text-slate-400 mt-1">9:16 • 30 FPS • 10 Mbps</div>
            <div className="text-[9px] sm:text-[10px] text-slate-500 mt-1 sm:mt-1.5">Réseaux sociaux</div>
          </button>
        ) : (
          <div className="relative p-3 sm:p-4 rounded-lg border-2 border-amber-500/30 bg-slate-900/30 opacity-50 cursor-not-allowed">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 sm:gap-2">
              <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              <span className="text-[10px] sm:text-xs font-semibold text-amber-300">Passer à Pro</span>
            </div>
            <Video className="w-5 h-5 sm:w-6 sm:h-6 mb-1.5 sm:mb-2 mx-auto text-slate-500" />
            <div className="text-xs sm:text-sm font-semibold text-slate-500">Story</div>
            <div className="text-[10px] sm:text-xs text-slate-600 mt-1">9:16 • 30 FPS • 10 Mbps</div>
          </div>
        )}
      </div>
    </div>
  );
};

