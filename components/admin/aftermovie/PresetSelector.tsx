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
    <div className="mb-6">
      <label className="block text-sm font-medium text-slate-300 mb-3">Mode de génération</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => onPresetModeChange('rapide')}
          className={`p-4 rounded-lg border-2 transition-all ${
            presetMode === 'rapide'
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-slate-800 bg-slate-900/50 hover:border-indigo-500/30'
          }`}
          disabled={disabled}
        >
          <Zap className={`w-6 h-6 mb-2 mx-auto ${presetMode === 'rapide' ? 'text-indigo-400' : 'text-slate-400'}`} />
          <div className="text-sm font-semibold text-slate-100">Rapide</div>
          <div className="text-xs text-slate-400 mt-1">720p • 24 FPS • 4 Mbps</div>
        </button>
        <button
          type="button"
          onClick={() => onPresetModeChange('standard')}
          className={`p-4 rounded-lg border-2 transition-all ${
            presetMode === 'standard'
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-slate-800 bg-slate-900/50 hover:border-indigo-500/30'
          }`}
          disabled={disabled}
        >
          <Star className={`w-6 h-6 mb-2 mx-auto ${presetMode === 'standard' ? 'text-indigo-400' : 'text-slate-400'}`} />
          <div className="text-sm font-semibold text-slate-100">Standard</div>
          <div className="text-xs text-slate-400 mt-1">1080p • 30 FPS • 12 Mbps</div>
        </button>
        {/* Mode Qualité - Premium */}
        {isPremium ? (
          <button
            type="button"
            onClick={() => onPresetModeChange('qualite')}
            className={`p-4 rounded-lg border-2 transition-all ${
              presetMode === 'qualite'
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-slate-800 bg-slate-900/50 hover:border-indigo-500/30'
            }`}
            disabled={disabled}
          >
            <Award className={`w-6 h-6 mb-2 mx-auto ${presetMode === 'qualite' ? 'text-indigo-400' : 'text-slate-400'}`} />
            <div className="text-sm font-semibold text-slate-100">Qualité</div>
            <div className="text-xs text-slate-400 mt-1">1080p • 30 FPS • 20 Mbps</div>
          </button>
        ) : (
          <div className="relative p-4 rounded-lg border-2 border-amber-500/30 bg-slate-900/30 opacity-50 cursor-not-allowed">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-300">Passer à Pro</span>
            </div>
            <Award className="w-6 h-6 mb-2 mx-auto text-slate-500" />
            <div className="text-sm font-semibold text-slate-500">Qualité</div>
            <div className="text-xs text-slate-600 mt-1">1080p • 30 FPS • 20 Mbps</div>
          </div>
        )}
        {/* Mode Story - Premium */}
        {isPremium ? (
          <button
            type="button"
            onClick={() => onPresetModeChange('story')}
            className={`p-4 rounded-lg border-2 transition-all ${
              presetMode === 'story'
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-slate-800 bg-slate-900/50 hover:border-indigo-500/30'
            }`}
            disabled={disabled}
          >
            <Video className={`w-6 h-6 mb-2 mx-auto ${presetMode === 'story' ? 'text-indigo-400' : 'text-slate-400'}`} />
            <div className="text-sm font-semibold text-slate-100">Story</div>
            <div className="text-xs text-slate-400 mt-1">9:16 • 30 FPS • 10 Mbps</div>
          </button>
        ) : (
          <div className="relative p-4 rounded-lg border-2 border-amber-500/30 bg-slate-900/30 opacity-50 cursor-not-allowed">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-300">Passer à Pro</span>
            </div>
            <Video className="w-6 h-6 mb-2 mx-auto text-slate-500" />
            <div className="text-sm font-semibold text-slate-500">Story</div>
            <div className="text-xs text-slate-600 mt-1">9:16 • 30 FPS • 10 Mbps</div>
          </div>
        )}
      </div>
    </div>
  );
};

