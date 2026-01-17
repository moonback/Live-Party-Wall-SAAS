import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Video } from 'lucide-react';
import { usePhotosQuery } from '../../hooks/queries/usePhotosQuery';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { useEvent } from '../../context/EventContext';
import { useLicenseFeatures } from '../../hooks/useLicenseFeatures';
import { generateTimelapseAftermovie } from '../../services/aftermovieService';
import { uploadAftermovieToStorage, getAftermovies, deleteAftermovie } from '../../services/aftermovieShareService';
import { smartSelectPhotos } from '../../services/aftermovieAIService';
import { 
  AFTERMOVIE_PRESETS, 
  AFTERMOVIE_MIN_MS_PER_PHOTO, 
  AFTERMOVIE_MAX_MS_PER_PHOTO,
  AFTERMOVIE_DEFAULT_TRANSITION_DURATION,
  AFTERMOVIE_MIN_TRANSITION_DURATION,
  AFTERMOVIE_MAX_TRANSITION_DURATION,
  AFTERMOVIE_MAX_PHOTOS_RECOMMENDED,
  AFTERMOVIE_MAX_PHOTOS_HARD_LIMIT,
  AFTERMOVIE_WARNING_PHOTOS_THRESHOLD
} from '../../constants';
import { Photo, TransitionType, AftermovieProgress, Aftermovie } from '../../types';
import { ExistingAftermoviesList } from './aftermovie/ExistingAftermoviesList';
import { PresetSelector } from './aftermovie/PresetSelector';
import { DateRangeSelector } from './aftermovie/DateRangeSelector';
import { PerformanceIndicator } from './aftermovie/PerformanceIndicator';
import { PhotoSelectionGrid } from './aftermovie/PhotoSelectionGrid';
import { PhotoOrderManager } from './aftermovie/PhotoOrderManager';
import { AftermovieOptions } from './aftermovie/AftermovieOptions';
import { ProgressDisplay } from './aftermovie/ProgressDisplay';
import { ActionButtons } from './aftermovie/ActionButtons';
import { ShareSection } from './aftermovie/ShareSection';
import { FullscreenPhotoSelection } from './aftermovie/FullscreenPhotoSelection';
import { CreationGuide } from './aftermovie/CreationGuide';

interface AftermovieTabProps {
  // Props si nécessaire
}

const toDatetimeLocal = (timestamp: number): string => {
  const d = new Date(timestamp);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export const AftermovieTab: React.FC<AftermovieTabProps> = () => {
  const { settings: config } = useSettings();
  const { addToast } = useToast();
  const { currentEvent } = useEvent();
  const { data: allPhotos = [], isLoading: photosLoading } = usePhotosQuery(currentEvent?.id);
  const { isFeatureEnabled, licenseKey } = useLicenseFeatures();
  
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
  const [aftermovieEnableAIEnhancement, setAftermovieEnableAIEnhancement] = useState<boolean>(false);
  const [aftermovieEnableSmartSelection, setAftermovieEnableSmartSelection] = useState<boolean>(false);
  const [aftermovieEnableSmartTransitions, setAftermovieEnableSmartTransitions] = useState<boolean>(false);
  const [isAnalyzingPhotos, setIsAnalyzingPhotos] = useState<boolean>(false);
  const [aftermovieAudioFile, setAftermovieAudioFile] = useState<File | null>(null);
  const [aftermovieAudioLoop, setAftermovieAudioLoop] = useState<boolean>(true);
  const [aftermovieAudioVolume, setAftermovieAudioVolume] = useState<number>(0.8);
  const [aftermovieProgress, setAftermovieProgress] = useState<AftermovieProgress | null>(null);
  const [isGeneratingAftermovie, setIsGeneratingAftermovie] = useState(false);
  const aftermovieAbortRef = useRef<AbortController | null>(null);
  const [aftermovieSelectedPhotoIds, setAftermovieSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [aftermoviePhotoOrder, setAftermoviePhotoOrder] = useState<string[]>([]);
  const [aftermovieTransitionType, setAftermovieTransitionType] = useState<TransitionType>('fade');
  const [aftermovieTransitionDuration, setAftermovieTransitionDuration] = useState<number>(AFTERMOVIE_DEFAULT_TRANSITION_DURATION);
  const [aftermovieRandomTransitions, setAftermovieRandomTransitions] = useState<boolean>(true);
  const [aftermoviePresetMode, setAftermoviePresetMode] = useState<'rapide' | 'standard' | 'qualite' | 'story'>('standard');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [lastGeneratedBlob, setLastGeneratedBlob] = useState<Blob | null>(null);
  const [isFullscreenSelection, setIsFullscreenSelection] = useState<boolean>(false);
  const [existingAftermovies, setExistingAftermovies] = useState<Aftermovie[]>([]);
  const [loadingAftermovies, setLoadingAftermovies] = useState<boolean>(false);
  const [deletingAftermovieIds, setDeletingAftermovieIds] = useState<Set<string>>(new Set());
  const [showGuide, setShowGuide] = useState<boolean>(true);

  // Charger les aftermovies existants
  const loadExistingAftermovies = async () => {
    if (!currentEvent) return;
    setLoadingAftermovies(true);
    try {
      const aftermovies = await getAftermovies(currentEvent.id);
      setExistingAftermovies(aftermovies);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      addToast(`Erreur lors du chargement des aftermovies: ${msg}`, 'error');
    } finally {
      setLoadingAftermovies(false);
    }
  };

  // Charger les aftermovies au montage et quand l'événement change
  useEffect(() => {
    loadExistingAftermovies();
  }, [currentEvent?.id]);

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
      setAftermoviePhotoOrder(aftermovieSelectedPhotos.map((p: Photo) => p.id));
    }
  }, [aftermovieSelectedPhotos, aftermoviePhotoOrder.length]);

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
      const durationSeconds = aftermovieSelectedPhotos.length * (aftermovieMsPerPhoto / 1000);
      
      const result = await uploadAftermovieToStorage(
        currentEvent.id,
        lastGeneratedBlob,
        filename,
        title,
        durationSeconds,
        'Admin'
      );

      setShareUrl(result.shareUrl);
      addToast('Aftermovie uploadé et visible dans la galerie !', 'success');
      await loadExistingAftermovies();
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
      addToast('Lien copié dans le presse-papiers !', 'success');
    } catch (err) {
      addToast('Erreur lors de la copie du lien', 'error');
    }
  };

  // Supprimer un aftermovie
  const handleDeleteAftermovie = async (aftermovie: Aftermovie) => {
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer l'aftermovie "${aftermovie.title || aftermovie.filename}" ?\n\n` +
      `Cette action est irréversible.`
    );

    if (!confirmed) return;

    setDeletingAftermovieIds((prev) => new Set(prev).add(aftermovie.id));

    try {
      await deleteAftermovie(aftermovie.id);
      addToast('Aftermovie supprimé avec succès', 'success');
      await loadExistingAftermovies();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      addToast(`Erreur lors de la suppression: ${msg}`, 'error');
    } finally {
      setDeletingAftermovieIds((prev) => {
        const next = new Set(prev);
        next.delete(aftermovie.id);
        return next;
      });
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

    const photoCount = aftermovieSelectedPhotos.length;
    
    if (photoCount > AFTERMOVIE_MAX_PHOTOS_HARD_LIMIT) {
      addToast(
        `⚠️ Trop de photos sélectionnées (${photoCount}). La limite est de ${AFTERMOVIE_MAX_PHOTOS_HARD_LIMIT} photos pour éviter les problèmes de performance. Veuillez réduire la sélection.`,
        'error'
      );
      return;
    }

    if (photoCount > AFTERMOVIE_MAX_PHOTOS_RECOMMENDED) {
      const confirmed = window.confirm(
        `⚠️ Attention : Vous avez sélectionné ${photoCount} photos (recommandé : ${AFTERMOVIE_MAX_PHOTOS_RECOMMENDED} max).\n\n` +
        `La génération peut prendre beaucoup de temps et utiliser beaucoup de mémoire.\n\n` +
        `Voulez-vous continuer quand même ?`
      );
      if (!confirmed) {
        return;
      }
    } else if (photoCount > AFTERMOVIE_WARNING_PHOTOS_THRESHOLD) {
      addToast(
        `ℹ️ ${photoCount} photos sélectionnées. La génération peut prendre plusieurs minutes.`,
        'info'
      );
    }

    const preset = AFTERMOVIE_PRESETS[aftermoviePreset];
    const abort = new AbortController();
    aftermovieAbortRef.current = abort;

    setIsGeneratingAftermovie(true);
    setAftermovieProgress({ stage: 'idle', processed: 0, total: aftermovieSelectedPhotos.length, message: 'Démarrage…' });
    addToast('Génération de la vidéo en cours… (ne pas fermer l\'onglet)', 'info');

    try {
      let photosToUse = aftermovieSelectedPhotos;
      if (aftermovieEnableAIEnhancement && aftermovieEnableSmartSelection) {
        setIsAnalyzingPhotos(true);
        setAftermovieProgress({ stage: 'analyzing', processed: 0, total: aftermovieSelectedPhotos.length, message: 'Analyse IA des photos en cours…' });
        addToast('Analyse IA des photos en cours…', 'info');
        
        try {
          const smartResult = await smartSelectPhotos(
            aftermovieSelectedPhotos,
            {
              minScore: 30,
              preferKeyMoments: true,
              maxPhotos: AFTERMOVIE_MAX_PHOTOS_RECOMMENDED,
              diversityWeight: 0.3,
              qualityWeight: 0.7
            },
            config.event_title || undefined,
            (current, total) => {
              setAftermovieProgress({ 
                stage: 'analyzing', 
                processed: current, 
                total, 
                message: `Analyse IA : ${current}/${total} photos analysées…` 
              });
            }
          );
          
          photosToUse = smartResult.selectedPhotos;
          addToast(
            `IA : ${smartResult.selectedPhotos.length} photos sélectionnées (${smartResult.excludedPhotos.length} exclues, ${smartResult.keyMoments.length} moments clés)`,
            'success'
          );
        } catch (aiError) {
          const msg = aiError instanceof Error ? aiError.message : String(aiError);
          addToast(`Erreur analyse IA, utilisation de la sélection manuelle: ${msg}`, 'error');
        } finally {
          setIsAnalyzingPhotos(false);
        }
      }

      const result = await generateTimelapseAftermovie(
        photosToUse,
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
          enableSmartDuration: aftermovieEnableSmartDuration || (aftermovieEnableAIEnhancement && aftermovieEnableSmartDuration),
          enableIntroOutro: aftermovieEnableIntroOutro,
          enableComicsStyle: aftermovieEnableComicsStyle,
          enableAIEnhancement: aftermovieEnableAIEnhancement,
          enableSmartSelection: aftermovieEnableSmartSelection,
          enableSmartTransitions: aftermovieEnableSmartTransitions,
          transitionType: (aftermovieEnableAIEnhancement && aftermovieEnableSmartTransitions) ? undefined : (aftermovieRandomTransitions ? undefined : aftermovieTransitionType),
          transitionDuration: (aftermovieTransitionType !== 'none' || aftermovieRandomTransitions || (aftermovieEnableAIEnhancement && aftermovieEnableSmartTransitions)) ? Math.min(AFTERMOVIE_MAX_TRANSITION_DURATION, Math.max(AFTERMOVIE_MIN_TRANSITION_DURATION, aftermovieTransitionDuration)) : undefined,
          randomTransitions: aftermovieRandomTransitions || (aftermovieEnableAIEnhancement && aftermovieEnableSmartTransitions)
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
    <div className="max-w-12xl mx-auto">
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

        {/* Section Aftermovies existants */}
        <ExistingAftermoviesList
          aftermovies={existingAftermovies}
          loading={loadingAftermovies}
          deletingIds={deletingAftermovieIds}
          onRefresh={loadExistingAftermovies}
          onDelete={handleDeleteAftermovie}
        />

        {/* Guide de création */}
        {showGuide && (
          <CreationGuide
            steps={[
              {
                id: '1',
                title: 'Choisir un mode de génération',
                description: 'Sélectionnez un preset (Rapide, Standard, Qualité, Story) selon vos besoins',
                completed: !!aftermoviePresetMode
              },
              {
                id: '2',
                title: 'Définir la plage de dates',
                description: 'Sélectionnez le début et la fin de la période pour vos photos',
                completed: !!aftermovieStart && !!aftermovieEnd
              },
              {
                id: '3',
                title: 'Sélectionner les photos',
                description: `Sélectionnez les photos à inclure (${aftermovieSelectedPhotos.length} sélectionnée${aftermovieSelectedPhotos.length > 1 ? 's' : ''})`,
                completed: aftermovieSelectedPhotos.length > 0
              },
              {
                id: '4',
                title: 'Configurer les options',
                description: 'Ajustez les options d\'affichage, transitions et musique selon vos préférences',
                completed: true // Toujours complété car les options ont des valeurs par défaut
              },
              {
                id: '5',
                title: 'Générer l\'aftermovie',
                description: 'Cliquez sur "Générer & Télécharger" pour créer votre vidéo',
                completed: !!lastGeneratedBlob
              }
            ]}
            currentStep={
              !aftermoviePresetMode ? 0 :
              (!aftermovieStart || !aftermovieEnd) ? 1 :
              aftermovieSelectedPhotos.length === 0 ? 2 :
              !lastGeneratedBlob ? 4 : 3
            }
            onClose={() => setShowGuide(false)}
          />
        )}

        {/* Presets simplifiés */}
        <PresetSelector
          presetMode={aftermoviePresetMode}
          onPresetModeChange={setAftermoviePresetMode}
          isFeatureEnabled={isFeatureEnabled}
              licenseKey={licenseKey || undefined}
          disabled={isGeneratingAftermovie}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <DateRangeSelector
              start={aftermovieStart}
              end={aftermovieEnd}
              onStartChange={setAftermovieStart}
              onEndChange={setAftermovieEnd}
              disabled={isGeneratingAftermovie}
            />

            {/* Indicateur de performance */}
            <PerformanceIndicator photoCount={aftermovieSelectedPhotos.length} />

            {/* Sélection manuelle des photos */}
            <PhotoSelectionGrid
              photos={aftermovieRangePhotos}
              selectedIds={aftermovieSelectedPhotoIds}
              searchQuery=""
              onToggleSelection={(photoId) => {
                setAftermovieSelectedPhotoIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(photoId)) next.delete(photoId);
                  else next.add(photoId);
                  return next;
                });
              }}
              onOpenFullscreen={() => setIsFullscreenSelection(true)}
              onSelectAll={() => setAftermovieSelectedPhotoIds(new Set(aftermovieRangePhotos.map((p) => p.id)))}
              onDeselectAll={() => setAftermovieSelectedPhotoIds(new Set())}
              disabled={isGeneratingAftermovie}
            />

            {/* Réorganisation des photos sélectionnées */}
            {aftermovieSelectedPhotos.length > 0 && (
              <PhotoOrderManager
                photos={aftermovieSelectedPhotos}
                photoOrder={aftermoviePhotoOrder}
                onOrderChange={setAftermoviePhotoOrder}
                onResetToChronological={resetToChronologicalOrder}
                disabled={isGeneratingAftermovie}
              />
            )}
          </div>

          <div className="space-y-4">
            {/* Options principales */}
            <AftermovieOptions
              includeTitle={aftermovieIncludeTitle}
              includeFrame={aftermovieIncludeFrame}
              enableKenBurns={aftermovieEnableKenBurns}
              msPerPhoto={aftermovieMsPerPhoto}
              enableSmartDuration={aftermovieEnableSmartDuration}
              enableIntroOutro={aftermovieEnableIntroOutro}
              enableComicsStyle={aftermovieEnableComicsStyle}
              enableAIEnhancement={aftermovieEnableAIEnhancement}
              enableSmartSelection={aftermovieEnableSmartSelection}
              enableSmartTransitions={aftermovieEnableSmartTransitions}
              isAnalyzingPhotos={isAnalyzingPhotos}
              transitionType={aftermovieTransitionType}
              randomTransitions={aftermovieRandomTransitions}
              audioFile={aftermovieAudioFile}
              audioLoop={aftermovieAudioLoop}
              audioVolume={aftermovieAudioVolume}
              isFeatureEnabled={isFeatureEnabled}
              licenseKey={licenseKey || undefined}
              disabled={isGeneratingAftermovie}
              onIncludeTitleChange={setAftermovieIncludeTitle}
              onIncludeFrameChange={setAftermovieIncludeFrame}
              onEnableKenBurnsChange={setAftermovieEnableKenBurns}
              onMsPerPhotoChange={setAftermovieMsPerPhoto}
              onEnableSmartDurationChange={setAftermovieEnableSmartDuration}
              onEnableIntroOutroChange={setAftermovieEnableIntroOutro}
              onEnableComicsStyleChange={setAftermovieEnableComicsStyle}
              onEnableAIEnhancementChange={setAftermovieEnableAIEnhancement}
              onEnableSmartSelectionChange={setAftermovieEnableSmartSelection}
              onEnableSmartTransitionsChange={setAftermovieEnableSmartTransitions}
              onTransitionTypeChange={setAftermovieTransitionType}
              onRandomTransitionsChange={setAftermovieRandomTransitions}
              onAudioFileChange={setAftermovieAudioFile}
              onAudioLoopChange={setAftermovieAudioLoop}
              onAudioVolumeChange={setAftermovieAudioVolume}
            />

            {/* Progression */}
            <ProgressDisplay progress={aftermovieProgress} />

            {/* Boutons */}
            <ActionButtons
              isGenerating={isGeneratingAftermovie}
              photosLoading={photosLoading}
              hasGeneratedBlob={!!lastGeneratedBlob}
              isUploading={isUploading}
              hasCurrentEvent={!!currentEvent}
              onGenerate={handleGenerate}
              onCancel={() => {
                if (aftermovieAbortRef.current) {
                  aftermovieAbortRef.current.abort();
                }
              }}
              onUploadAndShare={handleUploadAndShare}
            />

            {/* Section Partage */}
            {shareUrl && (
              <ShareSection
                shareUrl={shareUrl}
                onCopyLink={handleCopyLink}
              />
            )}

            <div className="text-xs text-slate-500">
              Note: export en <span className="font-mono text-slate-300">.webm</span> (MediaRecorder). La qualité dépend du navigateur et de la machine.
            </div>
          </div>
        </div>
      </div>

      {/* Modal plein écran pour sélection de photos */}
      <FullscreenPhotoSelection
        isOpen={isFullscreenSelection}
        photos={aftermovieRangePhotos}
        selectedIds={aftermovieSelectedPhotoIds}
        onClose={() => setIsFullscreenSelection(false)}
        onToggleSelection={(photoId) => {
          setAftermovieSelectedPhotoIds((prev) => {
            const next = new Set(prev);
            if (next.has(photoId)) next.delete(photoId);
            else next.add(photoId);
            return next;
          });
        }}
        onSelectAll={() => setAftermovieSelectedPhotoIds(new Set(aftermovieRangePhotos.map((p) => p.id)))}
        onDeselectAll={() => setAftermovieSelectedPhotoIds(new Set())}
        disabled={isGeneratingAftermovie}
      />
    </div>
  );
};
