import React, { useState } from 'react';
import { Sparkles, Video, ChevronDown, ChevronRight, Crown, Info } from 'lucide-react';
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
    <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
      <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-400" />
        Options principales
      </h3>

      <label className="flex items-start gap-2 sm:gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={includeTitle}
          onChange={(e) => onIncludeTitleChange(e.target.checked)}
          className="h-4 w-4 accent-indigo-500 mt-0.5 flex-shrink-0 transition-all"
          disabled={disabled}
        />
        <div className="min-w-0 flex-1">
          <div className="text-xs sm:text-sm font-medium text-slate-100 group-hover:text-indigo-300 transition-colors">
            Titre en bas
          </div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
            Affiche le titre de l'événement en bas de la vidéo pour l'identifier.
          </div>
        </div>
      </label>

      <label className="flex items-start gap-2 sm:gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={includeFrame}
          onChange={(e) => onIncludeFrameChange(e.target.checked)}
          className="h-4 w-4 accent-indigo-500 mt-0.5 flex-shrink-0 transition-all"
          disabled={disabled}
        />
        <div className="min-w-0 flex-1">
          <div className="text-xs sm:text-sm font-medium text-slate-100 group-hover:text-indigo-300 transition-colors">
            Cadre décoratif
          </div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
            Incruste le cadre décoratif actif sur chaque photo (si configuré dans les paramètres).
          </div>
        </div>
      </label>

      <label className="flex items-start gap-2 sm:gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={enableKenBurns}
          onChange={(e) => onEnableKenBurnsChange(e.target.checked)}
          className="h-4 w-4 accent-indigo-500 mt-0.5 flex-shrink-0 transition-all"
          disabled={disabled}
        />
        <div className="min-w-0 flex-1">
          <div className="text-xs sm:text-sm font-medium text-slate-100 group-hover:text-indigo-300 transition-colors">
            Effet Ken Burns
          </div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
            Ajoute un zoom et un mouvement progressif sur chaque photo pour un rendu cinématique.
          </div>
        </div>
      </label>

      {/* Durée par photo */}
      <div className="pt-2 border-t border-slate-800">
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <label className="block text-xs sm:text-sm font-medium text-slate-300">
            Durée par photo
          </label>
          <div className="group relative">
            <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 cursor-help" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-10">
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-[10px] sm:text-xs text-slate-300 shadow-xl w-40 sm:w-48">
                Temps d'affichage de chaque photo dans la vidéo. Plus long = plus de temps pour apprécier chaque moment.
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2 sm:gap-4">
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
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-[80px] sm:min-w-[100px]">
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
                className="w-16 sm:w-20 bg-slate-900/50 border border-slate-800 rounded-lg px-1.5 sm:px-2 py-1.5 text-white text-xs sm:text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all"
                disabled={disabled}
              />
              <span className="text-[10px] sm:text-xs text-slate-400">ms</span>
            </div>
          </div>
        </div>
      </div>

      <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enableSmartDuration}
          onChange={(e) => onEnableSmartDurationChange(e.target.checked)}
          className="h-4 w-4 accent-indigo-500 mt-0.5 flex-shrink-0"
          disabled={disabled}
        />
        <div className="min-w-0">
          <div className="text-xs sm:text-sm font-medium text-slate-100">Durée intelligente</div>
          <div className="text-[10px] sm:text-xs text-slate-400">Affiche plus longtemps les photos populaires (+500ms/like).</div>
        </div>
      </label>

      <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enableIntroOutro}
          onChange={(e) => onEnableIntroOutroChange(e.target.checked)}
          className="h-4 w-4 accent-indigo-500 mt-0.5 flex-shrink-0"
          disabled={disabled}
        />
        <div className="min-w-0">
          <div className="text-xs sm:text-sm font-medium text-slate-100">Intro & Outro Cinéma</div>
          <div className="text-[10px] sm:text-xs text-slate-400">Ajoute des séquences de titre animées au début et à la fin.</div>
        </div>
      </label>

      <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enableComicsStyle}
          onChange={(e) => onEnableComicsStyleChange(e.target.checked)}
          className="h-4 w-4 accent-indigo-500 mt-0.5 flex-shrink-0"
          disabled={disabled}
        />
        <div className="min-w-0">
          <div className="text-xs sm:text-sm font-medium text-slate-100">Légendes IA</div>
          <div className="text-[10px] sm:text-xs text-slate-400">Affiche les légendes dans des bulles générées par l'IA.</div>
        </div>
      </label>

      {/* Section Amélioration IA - Premium */}
      {isPremium ? (
        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
            <h4 className="text-xs sm:text-sm font-semibold text-slate-100">Amélioration IA 🤖</h4>
          </div>

          <label className="flex items-start gap-2 sm:gap-3 cursor-pointer mb-2 sm:mb-3">
            <input
              type="checkbox"
              checked={enableAIEnhancement}
              onChange={(e) => onEnableAIEnhancementChange(e.target.checked)}
              className="h-4 w-4 accent-purple-500 mt-0.5 flex-shrink-0"
              disabled={disabled || isAnalyzingPhotos}
            />
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-medium text-slate-100">Activer l'amélioration IA</div>
              <div className="text-[10px] sm:text-xs text-slate-400">Utilise l'IA pour rendre l'aftermovie plus interactif et optimisé.</div>
            </div>
          </label>

          {enableAIEnhancement && (
            <div className="pl-4 sm:pl-6 space-y-2 sm:space-y-3 border-l-2 border-purple-500/30">
              <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableSmartSelection}
                  onChange={(e) => onEnableSmartSelectionChange(e.target.checked)}
                  className="h-4 w-4 accent-purple-500 mt-0.5 flex-shrink-0"
                  disabled={disabled || isAnalyzingPhotos}
                />
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-medium text-slate-100">Sélection intelligente</div>
                  <div className="text-[10px] sm:text-xs text-slate-400">Sélectionne automatiquement les meilleures photos (qualité, moments clés, diversité).</div>
                </div>
              </label>

              <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableSmartTransitions}
                  onChange={(e) => onEnableSmartTransitionsChange(e.target.checked)}
                  className="h-4 w-4 accent-purple-500 mt-0.5 flex-shrink-0"
                  disabled={disabled || isAnalyzingPhotos}
                />
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-medium text-slate-100">Transitions intelligentes</div>
                  <div className="text-[10px] sm:text-xs text-slate-400">Choisit la meilleure transition selon le contenu de chaque photo.</div>
                </div>
              </label>

              <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableSmartDuration}
                  onChange={(e) => onEnableSmartDurationChange(e.target.checked)}
                  className="h-4 w-4 accent-purple-500 mt-0.5 flex-shrink-0"
                  disabled={disabled || isAnalyzingPhotos}
                />
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-medium text-slate-100">Durées intelligentes</div>
                  <div className="text-[10px] sm:text-xs text-slate-400">Ajuste la durée selon l'importance des moments (plus long pour moments clés).</div>
                </div>
              </label>
            </div>
          )}
        </div>
      ) : (
        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
            <h4 className="text-xs sm:text-sm font-semibold text-slate-500">Amélioration IA 🤖</h4>
            <div className="ml-auto flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
              <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-300" />
              <span className="text-[10px] sm:text-xs font-bold text-amber-300">PRO</span>
            </div>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-slate-900/50 border border-amber-500/30 opacity-75">
            <div className="flex items-start gap-2">
              <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-xs sm:text-sm font-medium text-amber-300 mb-1">Fonctionnalité Pro</div>
                <div className="text-[10px] sm:text-xs text-slate-400">Passez à Pro pour activer l'amélioration IA et rendre vos aftermovies plus interactifs et optimisés.</div>
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
            <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
            <span className="text-xs sm:text-sm font-medium text-slate-100">Transitions</span>
          </div>
          {showTransitionsOptions ? (
            <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
          )}
        </button>
        
        {showTransitionsOptions && (
          <div className="mt-2 sm:mt-3 space-y-2 sm:space-y-3 pl-4 sm:pl-6">
            <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={randomTransitions}
                onChange={(e) => onRandomTransitionsChange(e.target.checked)}
                className="h-4 w-4 accent-indigo-500 mt-0.5 flex-shrink-0"
                disabled={disabled}
              />
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-medium text-slate-100">Transitions aléatoires</div>
                <div className="text-[10px] sm:text-xs text-slate-400">Utilise une transition différente et aléatoire entre chaque photo.</div>
              </div>
            </label>
            
            {!randomTransitions && (
              <>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">Type de transition</label>
                <select
                  value={transitionType}
                  onChange={(e) => onTransitionTypeChange(e.target.value as TransitionType)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-100 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all"
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
        <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">Musique (optionnel)</label>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => onAudioFileChange(e.target.files?.[0] || null)}
          className="w-full text-[10px] sm:text-xs text-slate-300 file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-lg file:border-0 file:text-[10px] sm:file:text-xs file:font-medium file:bg-slate-800 file:text-white hover:file:bg-slate-700"
          disabled={disabled}
        />
        {audioFile && (
          <div className="mt-2 sm:mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <label className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-300">
              <input
                type="checkbox"
                checked={audioLoop}
                onChange={(e) => onAudioLoopChange(e.target.checked)}
                className="h-3.5 w-3.5 sm:h-4 sm:w-4 accent-indigo-500"
                disabled={disabled}
              />
              Boucler
            </label>
            <div>
              <label className="block text-[10px] sm:text-xs text-slate-400 mb-1">Volume</label>
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

