import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Video, Zap, Star, Award, Sparkles, ChevronDown, ChevronRight, ChevronUp, Move, ArrowUp, ArrowDown, RotateCcw, Share2, Upload, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { usePhotos } from '../../context/PhotosContext';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { useEvent } from '../../context/EventContext';
import { generateTimelapseAftermovie } from '../../services/aftermovieService';
import { uploadAftermovieToStorage } from '../../services/aftermovieShareService';
import { 
  AFTERMOVIE_PRESETS, 
  AFTERMOVIE_DEFAULT_TARGET_SECONDS, 
  AFTERMOVIE_MIN_MS_PER_PHOTO, 
  AFTERMOVIE_MAX_MS_PER_PHOTO,
  AFTERMOVIE_DEFAULT_TRANSITION_DURATION,
  AFTERMOVIE_MIN_TRANSITION_DURATION,
  AFTERMOVIE_MAX_TRANSITION_DURATION
} from '../../constants';
import { Photo, TransitionType, AftermovieProgress } from '../../types';

interface AftermovieTabProps {
  // Props si nécessaire
}

const toDatetimeLocal = (timestamp: number): string => {
  const d = new Date(timestamp);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export const AftermovieTab: React.FC<AftermovieTabProps> = () => {
  const { photos: allPhotos, loading: photosLoading } = usePhotos();
  const { settings: config } = useSettings();
  const { addToast } = useToast();
  const { currentEvent } = useEvent();
  
  const [aftermovieStart, setAftermovieStart] = useState<string>('');
  const [aftermovieEnd, setAftermovieEnd] = useState<string>('');
  const [aftermoviePreset, setAftermoviePreset] = useState<keyof typeof AFTERMOVIE_PRESETS>('1080p');
  const [aftermovieFps, setAftermovieFps] = useState<number>(AFTERMOVIE_PRESETS['1080p'].fps);
  const [aftermovieBitrateMbps, setAftermovieBitrateMbps] = useState<number>(Math.round(AFTERMOVIE_PRESETS['1080p'].videoBitsPerSecond / 1_000_000));
  const [aftermovieMsPerPhoto, setAftermovieMsPerPhoto] = useState<number>(3500);
  const [aftermovieIncludeTitle, setAftermovieIncludeTitle] = useState<boolean>(true);
  const [aftermovieIncludeFrame, setAftermovieIncludeFrame] = useState<boolean>(true);
  const [aftermovieEnableKenBurns, setAftermovieEnableKenBurns] = useState<boolean>(true);
  const [aftermovieEnableSmartDuration, setAftermovieEnableSmartDuration] = useState<boolean>(true);
  const [aftermovieEnableIntroOutro, setAftermovieEnableIntroOutro] = useState<boolean>(true);
  const [aftermovieEnableComicsStyle, setAftermovieEnableComicsStyle] = useState<boolean>(false);
  const [aftermovieAudioFile, setAftermovieAudioFile] = useState<File | null>(null);
  const [aftermovieAudioLoop, setAftermovieAudioLoop] = useState<boolean>(true);
  const [aftermovieAudioVolume, setAftermovieAudioVolume] = useState<number>(0.8);
  const [aftermovieProgress, setAftermovieProgress] = useState<AftermovieProgress | null>(null);
  const [isGeneratingAftermovie, setIsGeneratingAftermovie] = useState(false);
  const aftermovieAbortRef = useRef<AbortController | null>(null);
  const photoClickTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const [aftermovieSelectedPhotoIds, setAftermovieSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [aftermoviePhotoOrder, setAftermoviePhotoOrder] = useState<string[]>([]);
  const [aftermovieTransitionType, setAftermovieTransitionType] = useState<TransitionType>('fade');
  const [aftermovieTransitionDuration, setAftermovieTransitionDuration] = useState<number>(AFTERMOVIE_DEFAULT_TRANSITION_DURATION);
  const [aftermovieRandomTransitions, setAftermovieRandomTransitions] = useState<boolean>(true);
  const [aftermoviePresetMode, setAftermoviePresetMode] = useState<'rapide' | 'standard' | 'qualite' | 'story'>('standard');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);
  const [showTransitionsOptions, setShowTransitionsOptions] = useState<boolean>(false);
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showPhotoOrder, setShowPhotoOrder] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [lastGeneratedBlob, setLastGeneratedBlob] = useState<Blob | null>(null);

  // Initialiser la plage Aftermovie
  useEffect(() => {
    if (allPhotos.length === 0) return;
    const sorted = [...allPhotos].sort((a, b) => a.timestamp - b.timestamp);
    const first = sorted[0].timestamp;
    const last = sorted[sorted.length - 1].timestamp;
    if (!aftermovieStart) setAftermovieStart(toDatetimeLocal(first));
    if (!aftermovieEnd) setAftermovieEnd(toDatetimeLocal(last));
  }, [allPhotos, aftermovieStart, aftermovieEnd]);

  const aftermovieRangePhotos = useMemo(() => {
    const startMs = aftermovieStart ? new Date(aftermovieStart).getTime() : NaN;
    const endMs = aftermovieEnd ? new Date(aftermovieEnd).getTime() : NaN;
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs > endMs) return [];
    return allPhotos
      .filter((p) => p.timestamp >= startMs && p.timestamp <= endMs)
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [allPhotos, aftermovieStart, aftermovieEnd]);

  useEffect(() => {
    setAftermovieSelectedPhotoIds(new Set(aftermovieRangePhotos.map((p) => p.id)));
    // Réinitialiser l'ordre quand la plage change
    setAftermoviePhotoOrder([]);
  }, [aftermovieRangePhotos]);

  const aftermovieSelectedPhotos = useMemo(() => {
    if (aftermovieSelectedPhotoIds.size === 0) return [];
    const selected = aftermovieRangePhotos.filter((p) => aftermovieSelectedPhotoIds.has(p.id));
    if (aftermoviePhotoOrder.length > 0 && aftermoviePhotoOrder.length === selected.length) {
      const orderMap = new Map(aftermoviePhotoOrder.map((id, idx) => [id, idx]));
      const allInOrder = selected.every(p => orderMap.has(p.id));
      if (allInOrder) {
        return [...selected].sort((a, b) => {
          const idxA = orderMap.get(a.id) ?? Infinity;
          const idxB = orderMap.get(b.id) ?? Infinity;
          return (idxA as number) - (idxB as number);
        });
      }
    }
    return selected;
  }, [aftermovieRangePhotos, aftermovieSelectedPhotoIds, aftermoviePhotoOrder]);

  // Synchroniser l'ordre avec les photos sélectionnées
  useEffect(() => {
    if (aftermovieSelectedPhotos.length > 0 && aftermoviePhotoOrder.length === 0) {
      // Initialiser l'ordre avec l'ordre chronologique si pas encore défini
      setAftermoviePhotoOrder(aftermovieSelectedPhotos.map((p: Photo) => p.id));
    }
  }, [aftermovieSelectedPhotos, aftermoviePhotoOrder.length]);

  // Fonctions de drag & drop
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newOrder = [...aftermoviePhotoOrder];
    const draggedId = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedId);

    setAftermoviePhotoOrder(newOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Déplacer une photo vers le haut
  const movePhotoUp = (index: number) => {
    if (index === 0 || aftermoviePhotoOrder.length === 0) return;
    const newOrder = [...aftermoviePhotoOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setAftermoviePhotoOrder(newOrder);
  };

  // Déplacer une photo vers le bas
  const movePhotoDown = (index: number) => {
    if (index >= aftermoviePhotoOrder.length - 1 || aftermoviePhotoOrder.length === 0) return;
    const newOrder = [...aftermoviePhotoOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setAftermoviePhotoOrder(newOrder);
  };

  // Réinitialiser l'ordre chronologique
  const resetToChronologicalOrder = () => {
    const chronologicalOrder = [...aftermovieSelectedPhotos]
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(p => p.id);
    setAftermoviePhotoOrder(chronologicalOrder);
    addToast('Ordre réinitialisé à l\'ordre chronologique', 'success');
  };

  // Uploader et partager l'aftermovie
  const handleUploadAndShare = async () => {
    if (!lastGeneratedBlob) {
      addToast('Aucun aftermovie généré. Générez d\'abord une vidéo.', 'error');
      return;
    }

    if (!currentEvent) {
      addToast('Aucun événement sélectionné', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const title = config.event_title || 'Aftermovie';
      const filename = `${title}-${Date.now()}.webm`;
      
      // Calculer la durée approximative (nombre de photos * durée par photo)
      const durationSeconds = aftermovieSelectedPhotos.length * (aftermovieMsPerPhoto / 1000);
      
      const result = await uploadAftermovieToStorage(
        currentEvent.id,
        lastGeneratedBlob,
        filename,
        title,
        durationSeconds,
        'Admin' // TODO: Récupérer le nom de l'admin connecté
      );

      setShareUrl(result.shareUrl);
      addToast('Aftermovie uploadé et visible dans la galerie !', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      addToast(`Erreur upload: ${msg}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Copier le lien de partage
  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      addToast('Lien copié dans le presse-papiers !', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      addToast('Erreur lors de la copie du lien', 'error');
    }
  };


  // Preset -> fps/bitrate
  useEffect(() => {
    const preset = AFTERMOVIE_PRESETS[aftermoviePreset];
    setAftermovieFps(preset.fps);
    setAftermovieBitrateMbps(Math.round(preset.videoBitsPerSecond / 1_000_000));
  }, [aftermoviePreset]);

  // Appliquer les presets simplifiés
  useEffect(() => {
    if (isGeneratingAftermovie) return;
    switch (aftermoviePresetMode) {
      case 'rapide':
        setAftermoviePreset('720p');
        setAftermovieFps(24);
        setAftermovieBitrateMbps(4);
        setAftermovieMsPerPhoto(2000);
        setAftermovieEnableKenBurns(false);
        setAftermovieEnableSmartDuration(false);
        setAftermovieEnableIntroOutro(false);
        setAftermovieRandomTransitions(true);
        setAftermovieTransitionDuration(300);
        break;
      case 'standard':
        setAftermoviePreset('1080p');
        setAftermovieFps(30);
        setAftermovieBitrateMbps(12);
        setAftermovieMsPerPhoto(3500);
        setAftermovieEnableKenBurns(true);
        setAftermovieEnableSmartDuration(true);
        setAftermovieEnableIntroOutro(true);
        setAftermovieRandomTransitions(true);
        setAftermovieTransitionDuration(500);
        break;
      case 'qualite':
        setAftermoviePreset('1080p');
        setAftermovieFps(30);
        setAftermovieBitrateMbps(20);
        setAftermovieMsPerPhoto(4000);
        setAftermovieEnableKenBurns(true);
        setAftermovieEnableSmartDuration(true);
        setAftermovieEnableIntroOutro(true);
        setAftermovieRandomTransitions(true);
        setAftermovieTransitionDuration(600);
        break;
      case 'story':
        setAftermoviePreset('story');
        setAftermovieFps(30);
        setAftermovieBitrateMbps(10);
        setAftermovieMsPerPhoto(3000);
        setAftermovieEnableKenBurns(true);
        setAftermovieEnableSmartDuration(true);
        setAftermovieEnableIntroOutro(true);
        setAftermovieRandomTransitions(true);
        setAftermovieTransitionDuration(400);
        break;
    }
  }, [aftermoviePresetMode, isGeneratingAftermovie]);

  const handleGenerate = async () => {
    if (isGeneratingAftermovie) return;

    const startMs = aftermovieStart ? new Date(aftermovieStart).getTime() : NaN;
    const endMs = aftermovieEnd ? new Date(aftermovieEnd).getTime() : NaN;
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs > endMs) {
      addToast('Plage start/end invalide', 'error');
      return;
    }

    if (aftermovieRangePhotos.length === 0) {
      addToast('Aucune photo dans la plage sélectionnée', 'info');
      return;
    }

    if (aftermovieSelectedPhotos.length === 0) {
      addToast('Aucune photo sélectionnée (coche au moins 1 photo)', 'info');
      return;
    }

    const preset = AFTERMOVIE_PRESETS[aftermoviePreset];
    const abort = new AbortController();
    aftermovieAbortRef.current = abort;

    setIsGeneratingAftermovie(true);
    setAftermovieProgress({ stage: 'idle', processed: 0, total: aftermovieSelectedPhotos.length, message: 'Démarrage…' });
    addToast('Génération de la vidéo en cours… (ne pas fermer l\'onglet)', 'info');

    try {
      const result = await generateTimelapseAftermovie(
        aftermovieSelectedPhotos,
        {
          width: preset.width,
          height: preset.height,
          fps: aftermovieFps,
          msPerPhoto: Math.min(AFTERMOVIE_MAX_MS_PER_PHOTO, Math.max(AFTERMOVIE_MIN_MS_PER_PHOTO, aftermovieMsPerPhoto)),
          videoBitsPerSecond: Math.max(1, Math.round(aftermovieBitrateMbps * 1_000_000)),
          includeTitle: aftermovieIncludeTitle,
          titleText: config.event_title || 'Aftermovie',
          includeDecorativeFrame: aftermovieIncludeFrame && !!(config.decorative_frame_enabled && config.decorative_frame_url),
          decorativeFrameUrl: config.decorative_frame_url,
          backgroundColor: '#000000',
          enableKenBurns: aftermovieEnableKenBurns,
          enableSmartDuration: aftermovieEnableSmartDuration,
          enableIntroOutro: aftermovieEnableIntroOutro,
          enableComicsStyle: aftermovieEnableComicsStyle,
          transitionType: aftermovieRandomTransitions ? undefined : aftermovieTransitionType,
          transitionDuration: (aftermovieTransitionType !== 'none' || aftermovieRandomTransitions) ? Math.min(AFTERMOVIE_MAX_TRANSITION_DURATION, Math.max(AFTERMOVIE_MIN_TRANSITION_DURATION, aftermovieTransitionDuration)) : undefined,
          randomTransitions: aftermovieRandomTransitions
        },
        aftermovieAudioFile
          ? {
              file: aftermovieAudioFile,
              loop: aftermovieAudioLoop,
              volume: aftermovieAudioVolume
            }
          : undefined,
        (p) => setAftermovieProgress(p),
        abort.signal
      );

      // Sauvegarder le blob pour le partage
      setLastGeneratedBlob(result.blob);

      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addToast('Aftermovie prêt — téléchargement lancé', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('AbortError') || msg.toLowerCase().includes('annul')) {
        addToast('Génération annulée', 'info');
      } else {
        addToast(`Erreur aftermovie: ${msg}`, 'error');
      }
    } finally {
      setIsGeneratingAftermovie(false);
      aftermovieAbortRef.current = null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-slate-800">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-100 mb-2 flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
              <Video className="w-5 h-5 text-indigo-400" />
            </div>
            Génération Aftermovie (Timelapse)
          </h2>
          <p className="text-sm text-slate-400">
            Génère une vidéo WebM depuis les photos de la plage sélectionnée (100% navigateur).
          </p>
        </div>

        {/* Presets simplifiés */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-3">Mode de génération</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setAftermoviePresetMode('rapide')}
              className={`p-4 rounded-lg border-2 transition-all ${
                aftermoviePresetMode === 'rapide'
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-800 bg-slate-900/50 hover:border-indigo-500/30'
              }`}
              disabled={isGeneratingAftermovie}
            >
              <Zap className={`w-6 h-6 mb-2 mx-auto ${aftermoviePresetMode === 'rapide' ? 'text-indigo-400' : 'text-slate-400'}`} />
              <div className="text-sm font-semibold text-slate-100">Rapide</div>
              <div className="text-xs text-slate-400 mt-1">720p • 24 FPS • 4 Mbps</div>
            </button>
            <button
              type="button"
              onClick={() => setAftermoviePresetMode('standard')}
              className={`p-4 rounded-lg border-2 transition-all ${
                aftermoviePresetMode === 'standard'
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-800 bg-slate-900/50 hover:border-indigo-500/30'
              }`}
              disabled={isGeneratingAftermovie}
            >
              <Star className={`w-6 h-6 mb-2 mx-auto ${aftermoviePresetMode === 'standard' ? 'text-indigo-400' : 'text-slate-400'}`} />
              <div className="text-sm font-semibold text-slate-100">Standard</div>
              <div className="text-xs text-slate-400 mt-1">1080p • 30 FPS • 12 Mbps</div>
            </button>
            <button
              type="button"
              onClick={() => setAftermoviePresetMode('qualite')}
              className={`p-4 rounded-lg border-2 transition-all ${
                aftermoviePresetMode === 'qualite'
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-800 bg-slate-900/50 hover:border-indigo-500/30'
              }`}
              disabled={isGeneratingAftermovie}
            >
              <Award className={`w-6 h-6 mb-2 mx-auto ${aftermoviePresetMode === 'qualite' ? 'text-indigo-400' : 'text-slate-400'}`} />
              <div className="text-sm font-semibold text-slate-100">Qualité</div>
              <div className="text-xs text-slate-400 mt-1">1080p • 30 FPS • 20 Mbps</div>
            </button>
            <button
              type="button"
              onClick={() => setAftermoviePresetMode('story')}
              className={`p-4 rounded-lg border-2 transition-all ${
                aftermoviePresetMode === 'story'
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-800 bg-slate-900/50 hover:border-indigo-500/30'
              }`}
              disabled={isGeneratingAftermovie}
            >
              <Video className={`w-6 h-6 mb-2 mx-auto ${aftermoviePresetMode === 'story' ? 'text-indigo-400' : 'text-slate-400'}`} />
              <div className="text-sm font-semibold text-slate-100">Story</div>
              <div className="text-xs text-slate-400 mt-1">9:16 • 30 FPS • 10 Mbps</div>
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Début</label>
                <input
                  type="datetime-local"
                  value={aftermovieStart}
                  onChange={(e) => setAftermovieStart(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all"
                  disabled={isGeneratingAftermovie}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Fin</label>
                <input
                  type="datetime-local"
                  value={aftermovieEnd}
                  onChange={(e) => setAftermovieEnd(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all"
                  disabled={isGeneratingAftermovie}
                />
              </div>
            </div>

            {/* Sélection manuelle des photos */}
            <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <div className="text-sm font-semibold text-slate-100">Photos dans la plage</div>
                  <div className="text-xs text-slate-400">
                    Sélectionnées: <span className="font-semibold text-slate-100">{aftermovieSelectedPhotoIds.size}</span> / {aftermovieRangePhotos.length}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAftermovieSelectedPhotoIds(new Set(aftermovieRangePhotos.map((p) => p.id)))}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium transition-colors"
                    disabled={isGeneratingAftermovie || aftermovieRangePhotos.length === 0}
                  >
                    Tout
                  </button>
                  <button
                    type="button"
                    onClick={() => setAftermovieSelectedPhotoIds(new Set())}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium transition-colors"
                    disabled={isGeneratingAftermovie || aftermovieRangePhotos.length === 0}
                  >
                    Aucun
                  </button>
                </div>
              </div>

              {aftermovieRangePhotos.length === 0 ? (
                <div className="text-sm text-slate-500">Aucune photo dans la plage (ou plage invalide).</div>
              ) : (
                <div className="max-h-64 overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {aftermovieRangePhotos.map((p) => {
                      const selected = aftermovieSelectedPhotoIds.has(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onDoubleClick={(e) => {
                            e.preventDefault();
                            setAftermovieSelectedPhotoIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(p.id)) next.delete(p.id);
                              else next.add(p.id);
                              return next;
                            });
                          }}
                          className={`relative w-full rounded-lg overflow-hidden border transition-all aspect-square ${
                            selected
                              ? 'border-indigo-500/60'
                              : 'border-slate-800 hover:border-slate-700'
                          }`}
                          disabled={isGeneratingAftermovie}
                        >
                          <img
                            src={p.url}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {selected && (
                            <div className="absolute top-1 left-1">
                              <div className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-black bg-indigo-500 text-white border border-indigo-400">
                                ✓
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Réorganisation des photos sélectionnées améliorée */}
            {aftermovieSelectedPhotos.length > 0 && (
              <div className="bg-gradient-to-br from-slate-950/80 to-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl p-5 shadow-xl">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg border border-indigo-500/30">
                      <Move className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        Ordre des photos
                        <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs rounded-full">
                          {aftermovieSelectedPhotos.length}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Réorganisez l'ordre d'apparition dans l'aftermovie
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPhotoOrder(!showPhotoOrder)}
                      className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5"
                      disabled={isGeneratingAftermovie}
                    >
                      {showPhotoOrder ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          Masquer
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          Afficher
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={resetToChronologicalOrder}
                      className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5"
                      disabled={isGeneratingAftermovie || aftermovieSelectedPhotos.length === 0}
                      title="Réinitialiser à l'ordre chronologique"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Réinitialiser
                    </button>
                  </div>
                </div>

                {showPhotoOrder && (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                    {aftermovieSelectedPhotos.map((photo, index) => {
                      const isDragging = draggedIndex === index;
                      const isDragOver = dragOverIndex === index;
                      return (
                        <motion.div
                          key={photo.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e: React.DragEvent) => handleDragOver(e, index)}
                          onDrop={(e: React.DragEvent) => handleDrop(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-move ${
                            isDragging
                              ? 'opacity-50 border-indigo-500 bg-indigo-500/20 scale-95'
                              : isDragOver
                              ? 'border-indigo-500 bg-indigo-500/30 scale-105 shadow-lg'
                              : 'border-slate-800 bg-slate-900/50 hover:border-indigo-500/50 hover:bg-slate-900/70 hover:shadow-md'
                          }`}
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border-2 border-indigo-500/40 flex items-center justify-center text-sm font-black text-indigo-200 shadow-lg">
                            {index + 1}
                          </div>
                          <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-700 shadow-lg">
                            <img
                              src={photo.url}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-100 truncate mb-1">
                              {photo.caption || 'Sans légende'}
                            </div>
                            <div className="text-xs text-slate-400 truncate flex items-center gap-2">
                              <span>{photo.author}</span>
                              <span>•</span>
                              <span>{new Date(photo.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => movePhotoUp(index)}
                              className="p-2 rounded-lg bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                              disabled={isGeneratingAftermovie || index === 0}
                              title="Déplacer vers le haut"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => movePhotoDown(index)}
                              className="p-2 rounded-lg bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                              disabled={isGeneratingAftermovie || index === aftermovieSelectedPhotos.length - 1}
                              title="Déplacer vers le bas"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <div className="w-8 h-8 flex items-center justify-center text-slate-500 cursor-move hover:text-indigo-400 transition-colors">
                              <Move className="w-5 h-5" />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {!showPhotoOrder && aftermovieSelectedPhotos.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {aftermovieSelectedPhotos.slice(0, 12).map((photo, index) => (
                        <motion.div
                          key={photo.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="relative group"
                        >
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-slate-700 group-hover:border-indigo-500/50 transition-all shadow-lg group-hover:shadow-indigo-500/20">
                            <img
                              src={photo.url}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute top-1 left-1 w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg border border-white/20">
                              {index + 1}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      {aftermovieSelectedPhotos.length > 12 && (
                        <div className="w-14 h-14 rounded-xl border-2 border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-xs font-bold text-slate-300 shadow-lg">
                          +{aftermovieSelectedPhotos.length - 12}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Move className="w-3 h-3" />
                      Cliquez sur "Afficher" pour réorganiser l'ordre
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Options principales */}
            <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Options principales
              </h3>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aftermovieIncludeTitle}
                  onChange={(e) => setAftermovieIncludeTitle(e.target.checked)}
                  className="h-4 w-4 accent-indigo-500 mt-0.5 flex-shrink-0"
                  disabled={isGeneratingAftermovie}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-100">Titre en bas</div>
                  <div className="text-xs text-slate-400">Affiche le titre de l'événement sur la vidéo.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aftermovieIncludeFrame}
                  onChange={(e) => setAftermovieIncludeFrame(e.target.checked)}
                  className="h-4 w-4 accent-indigo-500 mt-0.5 flex-shrink-0"
                  disabled={isGeneratingAftermovie}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-100">Cadre décoratif</div>
                  <div className="text-xs text-slate-400">Incruste le cadre actif (si configuré).</div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aftermovieEnableKenBurns}
                  onChange={(e) => setAftermovieEnableKenBurns(e.target.checked)}
                  className="h-4 w-4 accent-indigo-500 mt-0.5 flex-shrink-0"
                  disabled={isGeneratingAftermovie}
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
                      value={aftermovieMsPerPhoto}
                      onChange={(e) => setAftermovieMsPerPhoto(Number(e.target.value))}
                      className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      disabled={isGeneratingAftermovie}
                    />
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <input
                        type="number"
                        min={AFTERMOVIE_MIN_MS_PER_PHOTO}
                        max={AFTERMOVIE_MAX_MS_PER_PHOTO}
                        step={100}
                        value={aftermovieMsPerPhoto}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const clamped = Math.min(AFTERMOVIE_MAX_MS_PER_PHOTO, Math.max(AFTERMOVIE_MIN_MS_PER_PHOTO, val));
                          setAftermovieMsPerPhoto(clamped);
                        }}
                        className="w-20 bg-slate-900/50 border border-slate-800 rounded-lg px-2 py-1.5 text-white text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all"
                        disabled={isGeneratingAftermovie}
                      />
                      <span className="text-xs text-slate-400">ms</span>
                    </div>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aftermovieEnableSmartDuration}
                  onChange={(e) => setAftermovieEnableSmartDuration(e.target.checked)}
                  className="h-4 w-4 accent-indigo-500 mt-0.5 flex-shrink-0"
                  disabled={isGeneratingAftermovie}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-100">Durée intelligente</div>
                  <div className="text-xs text-slate-400">Affiche plus longtemps les photos populaires (+500ms/like).</div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aftermovieEnableIntroOutro}
                  onChange={(e) => setAftermovieEnableIntroOutro(e.target.checked)}
                  className="h-4 w-4 accent-indigo-500 mt-0.5 flex-shrink-0"
                  disabled={isGeneratingAftermovie}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-100">Intro & Outro Cinéma</div>
                  <div className="text-xs text-slate-400">Ajoute des séquences de titre animées au début et à la fin.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aftermovieEnableComicsStyle}
                  onChange={(e) => setAftermovieEnableComicsStyle(e.target.checked)}
                  className="h-4 w-4 accent-indigo-500 mt-0.5 flex-shrink-0"
                  disabled={isGeneratingAftermovie}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-100">Légendes BD (Comics)</div>
                  <div className="text-xs text-slate-400">Affiche les légendes dans des bulles style bande dessinée.</div>
                </div>
              </label>

              {/* Section Transitions */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTransitionsOptions(!showTransitionsOptions)}
                  className="w-full flex items-center justify-between p-2 hover:bg-slate-900/50 rounded-lg transition-all"
                  disabled={isGeneratingAftermovie}
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
                        checked={aftermovieRandomTransitions}
                        onChange={(e) => setAftermovieRandomTransitions(e.target.checked)}
                        className="h-4 w-4 accent-indigo-500 mt-0.5 flex-shrink-0"
                        disabled={isGeneratingAftermovie}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-100">Transitions aléatoires</div>
                        <div className="text-xs text-slate-400">Utilise une transition différente et aléatoire entre chaque photo.</div>
                      </div>
                    </label>
                    
                    {!aftermovieRandomTransitions && (
                      <>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Type de transition</label>
                        <select
                          value={aftermovieTransitionType}
                          onChange={(e) => setAftermovieTransitionType(e.target.value as TransitionType)}
                          className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all"
                          disabled={isGeneratingAftermovie}
                        >
                          <option value="none">Aucune</option>
                          <option value="fade">Fondu (Fade)</option>
                          <option value="slide-left">Glissement gauche</option>
                          <option value="slide-right">Glissement droite</option>
                          <option value="slide-up">Glissement haut</option>
                          <option value="slide-down">Glissement bas</option>
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
                  onChange={(e) => setAftermovieAudioFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-800 file:text-white hover:file:bg-slate-700"
                  disabled={isGeneratingAftermovie}
                />
                {aftermovieAudioFile && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={aftermovieAudioLoop}
                        onChange={(e) => setAftermovieAudioLoop(e.target.checked)}
                        className="h-4 w-4 accent-indigo-500"
                        disabled={isGeneratingAftermovie}
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
                        value={aftermovieAudioVolume}
                        onChange={(e) => setAftermovieAudioVolume(Number(e.target.value))}
                        className="w-full"
                        disabled={isGeneratingAftermovie}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Progression */}
            <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-100 mb-2">Progression</h3>
              {aftermovieProgress ? (
                <div className="space-y-2">
                  <div className="text-sm text-slate-300">
                    {aftermovieProgress.message || aftermovieProgress.stage}
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500"
                      style={{
                        width: `${aftermovieProgress.total > 0 ? (aftermovieProgress.processed / aftermovieProgress.total) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {aftermovieProgress.processed} / {aftermovieProgress.total}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500">En attente…</div>
              )}
            </div>

            {/* Boutons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                disabled={isGeneratingAftermovie || photosLoading}
              >
                {isGeneratingAftermovie ? 'Génération…' : 'Générer & Télécharger'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (aftermovieAbortRef.current) {
                    aftermovieAbortRef.current.abort();
                  }
                }}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isGeneratingAftermovie}
              >
                Annuler
              </button>
            </div>

            {/* Bouton Upload & Partage */}
            {lastGeneratedBlob && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleUploadAndShare}
                  className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  disabled={isUploading || !currentEvent}
                >
                  {isUploading ? (
                    <>
                      <Upload className="w-4 h-4 animate-pulse" />
                      Upload en cours…
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      Uploader & Partager
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Section Partage améliorée */}
            {shareUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 bg-gradient-to-br from-slate-950/80 to-slate-900/80 backdrop-blur-sm border border-indigo-500/30 rounded-xl p-6 shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg border border-indigo-500/30">
                    <Share2 className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Lien de partage</h3>
                    <p className="text-xs text-slate-400">Partagez l'aftermovie avec vos invités</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* QR Code avec design amélioré */}
                  <div className="flex justify-center">
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="relative bg-gradient-to-br from-white to-gray-50 p-5 rounded-2xl shadow-2xl border-2 border-indigo-200/50"
                    >
                      {/* Glow effect */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 blur-xl"></div>
                      
                      <QRCodeCanvas
                        value={shareUrl}
                        size={220}
                        level="H"
                        bgColor="#ffffff"
                        fgColor="#000000"
                        includeMargin={true}
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <motion.div
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="bg-white/95 backdrop-blur-sm rounded-full p-2.5 shadow-xl border-2 border-indigo-200/50"
                        >
                          <Video className="w-7 h-7 text-indigo-600" />
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Lien de partage amélioré */}
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Lien de téléchargement
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="flex-1 bg-slate-900/70 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-100 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-mono text-xs"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={handleCopyLink}
                        className={`px-5 py-3 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                          copied
                            ? 'bg-green-600 hover:bg-green-700 text-white border border-green-500/50'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500/50'
                        }`}
                        title="Copier le lien"
                      >
                        {copied ? (
                          <>
                            <Check className="w-5 h-5" />
                            <span>Copié !</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-5 h-5" />
                            <span>Copier</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>

                  {/* Instructions améliorées */}
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                        <Video className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-indigo-300 mb-1">
                          Comment partager ?
                        </p>
                        <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                          <li>Scannez le QR code avec votre téléphone</li>
                          <li>Ou copiez le lien et partagez-le</li>
                          <li>L'aftermovie sera visible dans la galerie</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="text-xs text-slate-500">
              Note: export en <span className="font-mono text-slate-300">.webm</span> (MediaRecorder). La qualité dépend du navigateur et de la machine.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

