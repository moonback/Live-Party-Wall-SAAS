import React, { useState } from 'react';
import { Sparkles, Video, ChevronDown, ChevronRight, Crown } from 'lucide-react';
import { TransitionType } from '../../../types';
import {
  AFTERMOVIE_MIN_MS_PER_PHOTO,
  AFTERMOVIE_MAX_MS_PER_PHOTO
} from '../../../constants';

interface AftermovieOptionsProps {
  includeTitle: boolean;
  includeFrame: boolean;
  enableKenBurns: boolean;
  msPerPhoto: number;
  enableSmartDuration: boolean;
  enableIntroOutro: boolean;
  enableComicsStyle: boolean;
  enableAIEnhancement: boolean;
  enableSmartSelection: boolean;
  enableSmartTransitions: boolean;
  isAnalyzingPhotos: boolean;
  transitionType: TransitionType;
  randomTransitions: boolean;
  audioFile: File | null;
  audioLoop: boolean;
  audioVolume: number;
  isFeatureEnabled: (feature: string, licenseKey?: string) => boolean;
  licenseKey?: string;
  disabled?: boolean;
  onIncludeTitleChange: (value: boolean) => void;
  onIncludeFrameChange: (value: boolean) => void;
  onEnableKenBurnsChange: (value: boolean) => void;
  onMsPerPhotoChange: (value: number) => void;
  onEnableSmartDurationChange: (value: boolean) => void;
  onEnableIntroOutroChange: (value: boolean) => void;
  onEnableComicsStyleChange: (value: boolean) => void;
  onEnableAIEnhancementChange: (value: boolean) => void;
  onEnableSmartSelectionChange: (value: boolean) => void;
  onEnableSmartTransitionsChange: (value: boolean) => void;
  onTransitionTypeChange: (value: TransitionType) => void;
  onRandomTransitionsChange: (value: boolean) => void;
  onAudioFileChange: (file: File | null) => void;
  onAudioLoopChange: (value: boolean) => void;
  onAudioVolumeChange: (value: number) => void;
}

export const AftermovieOptions: React.FC<AftermovieOptionsProps> = ({
  includeTitle,
  includeFrame,
  enableKenBurns,
  msPerPhoto,
  enableSmartDuration,
  enableIntroOutro,
  enableComicsStyle,
  enableAIEnhancement,
  enableSmartSelection,
  enableSmartTransitions,
  isAnalyzingPhotos,
  transitionType,
  randomTransitions,
  audioFile,
  audioLoop,
  audioVolume,
  isFeatureEnabled,
  licenseKey,
  disabled = false,
  onIncludeTitleChange,
  onIncludeFrameChange,
  onEnableKenBurnsChange,
  onMsPerPhotoChange,
  onEnableSmartDurationChange,
  onEnableIntroOutroChange,
  onEnableComicsStyleChange,
  onEnableAIEnhancementChange,
  onEnableSmartSelectionChange,
  onEnableSmartTransitionsChange,
  onTransitionTypeChange,
  onRandomTransitionsChange,
  onAudioFileChange,
  onAudioLoopChange,
  onAudioVolumeChange
}) => {
  const [showTransitionsOptions, setShowTransitionsOptions] = useState<boolean>(false);
  const isPremium = isFeatureEnabled('aftermovies_enabled', licenseKey);

  return (
    <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4 space-y-4">
      <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-400" />
        Options principales
      </h3>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={includeTitle}
          onChange={(e) => onIncludeTitleChange(e.target.checked)}
          className="h-4 w-4 accent-indigo-500 mt-0.5 flex-shrink-0"
          disabled={disabled}
        />
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-100">Titre en bas</div>
          <div className="text-xs text-slate-400">Affiche le titre de l'événement sur la vidéo.</div>
        </div>
      </label>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={includeFrame}
          onChange={(e) => onIncludeFrameChange(e.target.checked)}
          className="h-4 w-4 accent-indigo-500 mt-0.5 flex-shrink-0"
          disabled={disabled}
        />
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-100">Cadre décoratif</div>
          <div className="text-xs text-slate-400">Incruste le cadre actif (si configuré).</div>
        </div>
      </label>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enableKenBurns}
          onChange={(e) => onEnableKenBurnsChange(e.target.checked)}
          className="h-4 w-4 accent-indigo-500 mt-0.5 flex-shrink-0"
          disabled={disabled}
        />
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-100">Effet Ken Burns</div>
          <div className="text-xs text-slate-400">Ajoute un zoom/pan progressif sur chaque photo.</div>
        </div>
      </label>

      {/* Durée par photo */}
      <div className="pt-2 border-t border-slate-800">
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Durée par photo
        </label>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={AFTERMOVIE_MIN_MS_PER_PHOTO}
              max={AFTERMOVIE_MAX_MS_PER_PHOTO}
              step={100}
              value={msPerPhoto}
              onChange={(e) => onMsPerPhotoChange(Number(e.target.value))}
              className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              disabled={disabled}
            />
            <div className="flex items-center gap-2 min-w-[100px]">
              <input
                type="number"
                min={AFTERMOVIE_MIN_MS_PER_PHOTO}
                max={AFTERMOVIE_MAX_MS_PER_PHOTO}
                step={100}
                value={msPerPhoto}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const clamped = Math.min(AFTERMOVIE_MAX_MS_PER_PHOTO, Math.max(AFTERMOVIE_MIN_MS_PER_PHOTO, val));
                  onMsPerPhotoChange(clamped);
                }}
                className="w-20 bg-slate-900/50 border border-slate-800 rounded-lg px-2 py-1.5 text-white text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all"
                disabled={disabled}
              />
              <span className="text-xs text-slate-400">ms</span>
            </div>
          </div>
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enableSmartDuration}
          onChange={(e) => onEnableSmartDurationChange(e.target.checked)}
          className="h-4 w-4 accent-indigo-500 mt-0.5 flex-shrink-0"
          disabled={disabled}
        />
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-100">Durée intelligente</div>
          <div className="text-xs text-slate-400">Affiche plus longtemps les photos populaires (+500ms/like).</div>
        </div>
      </label>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enableIntroOutro}
          onChange={(e) => onEnableIntroOutroChange(e.target.checked)}
          className="h-4 w-4 accent-indigo-500 mt-0.5 flex-shrink-0"
          disabled={disabled}
        />
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-100">Intro & Outro Cinéma</div>
          <div className="text-xs text-slate-400">Ajoute des séquences de titre animées au début et à la fin.</div>
        </div>
      </label>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enableComicsStyle}
          onChange={(e) => onEnableComicsStyleChange(e.target.checked)}
          className="h-4 w-4 accent-indigo-500 mt-0.5 flex-shrink-0"
          disabled={disabled}
        />
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-100">Légendes BD (Comics)</div>
          <div className="text-xs text-slate-400">Affiche les légendes dans des bulles style bande dessinée.</div>
        </div>
      </label>

      {/* Section Amélioration IA - Premium */}
      {isPremium ? (
        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-semibold text-slate-100">Amélioration IA 🤖</h4>
          </div>

          <label className="flex items-start gap-3 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={enableAIEnhancement}
              onChange={(e) => onEnableAIEnhancementChange(e.target.checked)}
              className="h-4 w-4 accent-purple-500 mt-0.5 flex-shrink-0"
              disabled={disabled || isAnalyzingPhotos}
            />
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-100">Activer l'amélioration IA</div>
              <div className="text-xs text-slate-400">Utilise l'IA pour rendre l'aftermovie plus interactif et optimisé.</div>
            </div>
          </label>

          {enableAIEnhancement && (
            <div className="pl-6 space-y-3 border-l-2 border-purple-500/30">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableSmartSelection}
                  onChange={(e) => onEnableSmartSelectionChange(e.target.checked)}
                  className="h-4 w-4 accent-purple-500 mt-0.5 flex-shrink-0"
                  disabled={disabled || isAnalyzingPhotos}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-100">Sélection intelligente</div>
                  <div className="text-xs text-slate-400">Sélectionne automatiquement les meilleures photos (qualité, moments clés, diversité).</div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableSmartTransitions}
                  onChange={(e) => onEnableSmartTransitionsChange(e.target.checked)}
                  className="h-4 w-4 accent-purple-500 mt-0.5 flex-shrink-0"
                  disabled={disabled || isAnalyzingPhotos}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-100">Transitions intelligentes</div>
                  <div className="text-xs text-slate-400">Choisit la meilleure transition selon le contenu de chaque photo.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableSmartDuration}
                  onChange={(e) => onEnableSmartDurationChange(e.target.checked)}
                  className="h-4 w-4 accent-purple-500 mt-0.5 flex-shrink-0"
                  disabled={disabled || isAnalyzingPhotos}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-100">Durées intelligentes</div>
                  <div className="text-xs text-slate-400">Ajuste la durée selon l'importance des moments (plus long pour moments clés).</div>
                </div>
              </label>
            </div>
          )}
        </div>
      ) : (
        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-slate-500" />
            <h4 className="text-sm font-semibold text-slate-500">Amélioration IA 🤖</h4>
            <div className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
              <Crown className="w-3 h-3 text-amber-300" />
              <span className="text-xs font-bold text-amber-300">PRO</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/50 border border-amber-500/30 opacity-75">
            <div className="flex items-start gap-2">
              <Crown className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-amber-300 mb-1">Fonctionnalité Pro</div>
                <div className="text-xs text-slate-400">Passez à Pro pour activer l'amélioration IA et rendre vos aftermovies plus interactifs et optimisés.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Transitions */}
      <div className="pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={() => setShowTransitionsOptions(!showTransitionsOptions)}
          className="w-full flex items-center justify-between p-2 hover:bg-slate-900/50 rounded-lg transition-all"
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium text-slate-100">Transitions</span>
          </div>
          {showTransitionsOptions ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </button>
        
        {showTransitionsOptions && (
          <div className="mt-3 space-y-3 pl-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={randomTransitions}
                onChange={(e) => onRandomTransitionsChange(e.target.checked)}
                className="h-4 w-4 accent-indigo-500 mt-0.5 flex-shrink-0"
                disabled={disabled}
              />
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-100">Transitions aléatoires</div>
                <div className="text-xs text-slate-400">Utilise une transition différente et aléatoire entre chaque photo.</div>
              </div>
            </label>
            
            {!randomTransitions && (
              <>
                <label className="block text-sm font-medium text-slate-300 mb-2">Type de transition</label>
                <select
                  value={transitionType}
                  onChange={(e) => onTransitionTypeChange(e.target.value as TransitionType)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all"
                  disabled={disabled}
                >
                  <option value="none">Aucune</option>
                  <option value="fade">Fondu (Fade)</option>
                  <option value="cross-fade">Fondu croisé</option>
                  <option value="slide-left">Glissement gauche</option>
                  <option value="slide-right">Glissement droite</option>
                  <option value="slide-up">Glissement haut</option>
                  <option value="slide-down">Glissement bas</option>
                  <option value="zoom-in">Zoom avant</option>
                  <option value="zoom-out">Zoom arrière</option>
                  <option value="wipe-left">Balayage gauche</option>
                  <option value="wipe-right">Balayage droite</option>
                  <option value="rotate">Rotation 3D ✨</option>
                  <option value="blur">Flou progressif ✨</option>
                  <option value="pixelate">Pixelisé ✨</option>
                </select>
              </>
            )}
          </div>
        )}
      </div>

      {/* Musique */}
      <div className="pt-2 border-t border-slate-800">
        <label className="block text-sm font-medium text-slate-300 mb-2">Musique (optionnel)</label>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => onAudioFileChange(e.target.files?.[0] || null)}
          className="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-800 file:text-white hover:file:bg-slate-700"
          disabled={disabled}
        />
        {audioFile && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={audioLoop}
                onChange={(e) => onAudioLoopChange(e.target.checked)}
                className="h-4 w-4 accent-indigo-500"
                disabled={disabled}
              />
              Boucler
            </label>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Volume</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={audioVolume}
                onChange={(e) => onAudioVolumeChange(Number(e.target.value))}
                className="w-full"
                disabled={disabled}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

