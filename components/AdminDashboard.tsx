import React, { useEffect, useMemo, useRef, useState } from 'react';
import { deletePhoto, deleteAllPhotos, getPhotosReactions } from '../services/photoService';
import { exportPhotosToZip, exportPhotosWithMetadataToZip, ExportProgress } from '../services/exportService';
import { Trash2, LogOut, ArrowLeft, RefreshCw, Settings, Image as ImageIcon, Download, BarChart2, Frame, X, Save, Upload, Type, Tag, Gauge, Move, Sparkles, Shield, Info, Video, Grid3x3, ChevronUp, ChevronDown, ChevronRight, Zap, Star, Award, User, Trophy, Clock, CheckCircle2, Users, Heart, Camera, Menu, Calendar } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { usePhotos } from '../context/PhotosContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import AnalyticsView from './AnalyticsView';
import { uploadDecorativeFramePng } from '../services/frameService';
import { getLocalFrames, getLocalFrameUrl, getLocalFrameThumbnailUrl, frameCategories, LocalFrame } from '../services/localFramesService';
import { generateTimelapseAftermovie } from '../services/aftermovieService';
import { AFTERMOVIE_DEFAULT_TARGET_SECONDS, AFTERMOVIE_MAX_MS_PER_PHOTO, AFTERMOVIE_MIN_MS_PER_PHOTO, AFTERMOVIE_PRESETS, AFTERMOVIE_DEFAULT_TRANSITION_DURATION, AFTERMOVIE_MIN_TRANSITION_DURATION, AFTERMOVIE_MAX_TRANSITION_DURATION } from '../constants';
import { AftermovieProgress, Photo, TransitionType, PhotoBattle } from '../types';
import { createBattle, getActiveBattles, finishBattle, subscribeToNewBattles } from '../services/battleService';
import { startAutoBattles, stopAutoBattles, getAutoBattleConfig } from '../services/autoBattleService';
import { getSettings } from '../services/settingsService';
import { generateEventContextSuggestion } from '../services/eventContextService';
import { logger } from '../utils/logger';
import { getAllGuests, deleteGuest, deleteAllGuests } from '../services/guestService';
import { getPhotosByAuthor } from '../services/photoService';
import { Guest } from '../types';
import EventSelector from './EventSelector';
import EventManager from './EventManager';
import { useEvent } from '../context/EventContext';
import { getUserEvents } from '../services/eventService';
import { Event } from '../types';
import AdminProfile from './AdminProfile';

interface AdminDashboardProps {
  onBack: () => void;
}

type AdminTab = 'events' | 'moderation' | 'analytics' | 'configuration' | 'aftermovie' | 'battles' | 'guests';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const { addToast } = useToast();
  const { photos: allPhotos, loading: photosLoading, refresh: refreshPhotos } = usePhotos();
  const { settings: config, updateSettings, loading: settingsLoading } = useSettings();
  const { signOut, user } = useAuth();
  const { currentEvent, loadEventBySlug } = useEvent();
  const [activeTab, setActiveTab] = useState<AdminTab>('events');
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [aftermovieStart, setAftermovieStart] = useState<string>('');
  const [aftermovieEnd, setAftermovieEnd] = useState<string>('');
  const [aftermoviePreset, setAftermoviePreset] = useState<keyof typeof AFTERMOVIE_PRESETS>('1080p');
  const [aftermovieFps, setAftermovieFps] = useState<number>(AFTERMOVIE_PRESETS['1080p'].fps);
  const [aftermovieBitrateMbps, setAftermovieBitrateMbps] = useState<number>(Math.round(AFTERMOVIE_PRESETS['1080p'].videoBitsPerSecond / 1_000_000));
  const [aftermovieTargetSeconds, setAftermovieTargetSeconds] = useState<number>(AFTERMOVIE_DEFAULT_TARGET_SECONDS);
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
  const [aftermoviePhotoOrder, setAftermoviePhotoOrder] = useState<string[]>([]); // Ordre personnalisé des photos
  const [aftermovieTransitionType, setAftermovieTransitionType] = useState<TransitionType>('fade');
  const [aftermovieTransitionDuration, setAftermovieTransitionDuration] = useState<number>(AFTERMOVIE_DEFAULT_TRANSITION_DURATION);
  const [aftermovieRandomTransitions, setAftermovieRandomTransitions] = useState<boolean>(true);
  const [showQualitySettingsModal, setShowQualitySettingsModal] = useState<boolean>(false);
  const [aftermoviePresetMode, setAftermoviePresetMode] = useState<'rapide' | 'standard' | 'qualite'>('standard');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);
  const [showTransitionsOptions, setShowTransitionsOptions] = useState<boolean>(false);
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);
  
  // Photo Battles state
  const [battles, setBattles] = useState<PhotoBattle[]>([]);
  const [selectedPhoto1, setSelectedPhoto1] = useState<Photo | null>(null);
  const [selectedPhoto2, setSelectedPhoto2] = useState<Photo | null>(null);
  const [battleDuration, setBattleDuration] = useState<number>(30); // minutes
  const [isCreatingBattle, setIsCreatingBattle] = useState(false);
  const [showCreateBattleForm, setShowCreateBattleForm] = useState(false);
  
  // Auto Battles state
  const [autoBattleEnabled, setAutoBattleEnabled] = useState<boolean>(false);
  const AUTO_BATTLE_INTERVAL = 30; // Intervalle fixe à 30 minutes (non modifiable)
  
  // Local state for moderation (reversed photos for newest first)
  const [photos, setPhotos] = useState(() => allPhotos.slice().reverse());
  
  // Local config state for temporary edits (synchronized with Context)
  const [localConfig, setLocalConfig] = useState(config);
  
  const [savingConfig, setSavingConfig] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingWithMetadata, setIsExportingWithMetadata] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ processed: number; total: number; message?: string } | null>(null);
  const [uploadingFrame, setUploadingFrame] = useState(false);
  
  // Cadres locaux (depuis public/cadres/)
  const [localFrames, setLocalFrames] = useState<LocalFrame[]>([]);
  const [showFrameGallery, setShowFrameGallery] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // État pour la suggestion IA du contexte
  const [isGeneratingContextSuggestion, setIsGeneratingContextSuggestion] = useState(false);
  const [contextSuggestion, setContextSuggestion] = useState<string | null>(null);
  
  // État pour les invités
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestsLoading, setGuestsLoading] = useState(false);
  const [guestStats, setGuestStats] = useState<Map<string, { photosCount: number; totalLikes: number; totalReactions: number }>>(new Map());
  
  // Synchroniser localConfig avec config du Context
  // Forcer la modération à toujours être activée
  useEffect(() => {
    setLocalConfig({
      ...config,
      content_moderation_enabled: true
    });
  }, [config]);

  // Load Local Frames on mount
  useEffect(() => {
    const loadFrames = async () => {
      const frames = await getLocalFrames();
      setLocalFrames(frames);
    };
    loadFrames();
  }, []);

  // Update photos when allPhotos changes
  useEffect(() => {
    setPhotos(allPhotos.slice().reverse());
  }, [allPhotos]);

  // Forcer l'onglet actif à être "events" si aucun événement n'est sélectionné
  useEffect(() => {
    if (!currentEvent && activeTab !== 'events') {
      setActiveTab('events');
    }
  }, [currentEvent, activeTab]);

  // Synchroniser selectedEvent avec currentEvent seulement lors du chargement initial
  // ou quand l'événement change, mais pas quand l'utilisateur revient explicitement à la liste
  const prevCurrentEventId = useRef<string | null>(null);
  useEffect(() => {
    if (currentEvent && currentEvent.id !== prevCurrentEventId.current) {
      // L'événement a changé, synchroniser
      if (!selectedEvent || selectedEvent.id !== currentEvent.id) {
        setSelectedEvent(currentEvent);
      }
      prevCurrentEventId.current = currentEvent.id;
    } else if (!currentEvent) {
      prevCurrentEventId.current = null;
    }
  }, [currentEvent, selectedEvent]);

  // Gérer la touche Échap pour fermer la modal d'aperçu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewPhoto) {
        setPreviewPhoto(null);
      }
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [previewPhoto, isMobileMenuOpen]);

  // Fermer le menu mobile lors d'un clic en dehors
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-mobile-menu]')) {
        setIsMobileMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Fermer le menu mobile quand on passe en mode desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);

  const toDatetimeLocal = (timestampMs: number) => {
    const date = new Date(timestampMs);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  // Initialiser la plage Aftermovie à partir des médias existants (photos ET vidéos)
  useEffect(() => {
    if (allPhotos.length === 0) return;

    // Trier par date pour trouver start/end global
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

  // Par défaut: tout sélectionner dans la plage (reset quand la plage change)
  useEffect(() => {
    setAftermovieSelectedPhotoIds(new Set(aftermovieRangePhotos.map((p) => p.id)));
  }, [aftermovieRangePhotos]);

  const aftermovieSelectedPhotos = useMemo(() => {
    if (aftermovieSelectedPhotoIds.size === 0) return [];
    const selected = aftermovieRangePhotos.filter((p) => aftermovieSelectedPhotoIds.has(p.id));
    
    // Si un ordre personnalisé existe et contient toutes les photos sélectionnées, l'utiliser
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
  
  // Réinitialiser l'ordre personnalisé quand la sélection change
  useEffect(() => {
    const selected = aftermovieRangePhotos.filter((p) => aftermovieSelectedPhotoIds.has(p.id));
    if (selected.length > 0) {
      const currentOrder = selected.map(p => p.id);
      // Ne réinitialiser que si l'ordre actuel ne correspond pas
      if (aftermoviePhotoOrder.length !== currentOrder.length || 
          !currentOrder.every((id, idx) => aftermoviePhotoOrder[idx] === id)) {
        setAftermoviePhotoOrder(currentOrder);
      }
    } else {
      setAftermoviePhotoOrder([]);
    }
  }, [aftermovieSelectedPhotoIds, aftermovieRangePhotos, aftermoviePhotoOrder.length]);

  // Preset -> fps/bitrate
  useEffect(() => {
    const preset = AFTERMOVIE_PRESETS[aftermoviePreset];
    setAftermovieFps(preset.fps);
    setAftermovieBitrateMbps(Math.round(preset.videoBitsPerSecond / 1_000_000));
  }, [aftermoviePreset]);

  // Appliquer les presets simplifiés (Rapide, Standard, Qualité)
  useEffect(() => {
    // Ne pas appliquer si on est en train de générer
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aftermoviePresetMode]);

  // targetSeconds <-> msPerPhoto
  useEffect(() => {
    if (allPhotos.length === 0) return;

    const startMs = aftermovieStart ? new Date(aftermovieStart).getTime() : NaN;
    const endMs = aftermovieEnd ? new Date(aftermovieEnd).getTime() : NaN;
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return;

    const inRangeCount = allPhotos.filter((p) => p.timestamp >= startMs && p.timestamp <= endMs).length;
    if (inRangeCount <= 0) return;

    const ms = Math.round((aftermovieTargetSeconds * 1000) / inRangeCount);
    const clamped = Math.min(AFTERMOVIE_MAX_MS_PER_PHOTO, Math.max(AFTERMOVIE_MIN_MS_PER_PHOTO, ms));
    setAftermovieMsPerPhoto(clamped);
  }, [aftermovieTargetSeconds, allPhotos, aftermovieStart, aftermovieEnd]);

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target;
    const name = target.name as keyof typeof localConfig;
    const value =
      target instanceof HTMLInputElement && target.type === 'checkbox'
        ? target.checked
        : target.value;

    setLocalConfig(prev => ({ ...prev, [name]: value as any }));
  };

  const handleGenerateContextSuggestion = async () => {
    if (allPhotos.length === 0) {
      addToast("Aucune photo disponible pour générer une suggestion. Ajoutez d'abord des photos à l'événement.", 'info');
      return;
    }

    setIsGeneratingContextSuggestion(true);
    setContextSuggestion(null);

    try {
      // Passer le contexte existant pour l'améliorer, ou null pour en créer un nouveau
      const existingContext = localConfig.event_context || null;
      const suggestion = await generateEventContextSuggestion(allPhotos, existingContext);
      setContextSuggestion(suggestion);
      
      if (existingContext) {
        addToast("Contexte amélioré avec succès ! Version plus humoristique et festive générée.", 'success');
      } else {
        addToast("Suggestion générée avec succès ! Vous pouvez l'accepter ou la modifier.", 'success');
      }
    } catch (error) {
      logger.error('Error generating context suggestion', error, { component: 'AdminDashboard' });
      addToast("Erreur lors de la génération de la suggestion. Veuillez réessayer.", 'error');
    } finally {
      setIsGeneratingContextSuggestion(false);
    }
  };

  const handleAcceptContextSuggestion = () => {
    if (contextSuggestion) {
      setLocalConfig(prev => ({ ...prev, event_context: contextSuggestion }));
      setContextSuggestion(null);
      addToast("Contexte mis à jour avec la suggestion IA.", 'success');
    }
  };

  const handleFrameFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'image/png') {
      addToast("Veuillez choisir un fichier PNG.", 'error');
      return;
    }

    setUploadingFrame(true);
    try {
      if (!currentEvent) {
        addToast("Aucun événement sélectionné", 'error');
        return;
      }
      const { publicUrl } = await uploadDecorativeFramePng(currentEvent.id, file);
      setLocalConfig(prev => ({
        ...prev,
        decorative_frame_url: publicUrl,
        decorative_frame_enabled: true
      }));
      addToast("Cadre PNG uploadé. N'oubliez pas de sauvegarder.", 'success');
    } catch (err) {
      console.error(err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes('row-level security') || errorMsg.includes('policy')) {
        addToast("❌ Policies Supabase manquantes. Exécutez supabase_migration_frames.sql", 'error');
      } else {
        addToast(`Erreur: ${errorMsg}`, 'error');
      }
    } finally {
      setUploadingFrame(false);
      // Permet de re-sélectionner le même fichier
      e.target.value = '';
    }
  };

  const clearFrame = () => {
    setLocalConfig(prev => ({
      ...prev,
      decorative_frame_url: null,
      decorative_frame_enabled: false
    }));
  };

  const selectLocalFrame = (frame: LocalFrame) => {
    const frameUrl = getLocalFrameUrl(frame.filename);
    setLocalConfig(prev => ({
      ...prev,
      decorative_frame_url: frameUrl,
      decorative_frame_enabled: true
    }));
    setShowFrameGallery(false);
    addToast(`Cadre "${frame.name}" sélectionné. N'oubliez pas de sauvegarder.`, 'success');
  };

  const filteredFrames = selectedCategory === 'all' 
    ? localFrames 
    : localFrames.filter(f => f.category === selectedCategory);


  const saveConfig = async () => {
    setSavingConfig(true);
    try {
        // Forcer la modération à toujours être activée
        const configToSave = {
          ...localConfig,
          content_moderation_enabled: true
        };
        await updateSettings(configToSave);
        // Mettre à jour le state local pour refléter la valeur forcée
        setLocalConfig(prev => ({ ...prev, content_moderation_enabled: true }));
        addToast("Configuration sauvegardée en base de données !", 'success');
    } catch (error) {
        addToast("Erreur lors de la sauvegarde", 'error');
    } finally {
        setSavingConfig(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  // Synchroniser les photos avec le context (déjà géré par PhotosContext en temps réel)
  useEffect(() => {
    setPhotos(allPhotos.slice().reverse());
  }, [allPhotos]);

  // Charger les battles actives
  useEffect(() => {
    if (!currentEvent) {
      setBattles([]);
      return;
    }

    const loadBattles = async () => {
      try {
        const activeBattles = await getActiveBattles(currentEvent.id);
        setBattles(activeBattles);
      } catch (error) {
        console.error('Error loading battles:', error);
      }
    };

    loadBattles();

    // S'abonner aux nouvelles battles pour cet événement
    const battlesSub = subscribeToNewBattles(currentEvent.id, async (newBattle) => {
      setBattles(prev => {
        if (prev.some(b => b.id === newBattle.id)) {
          return prev;
        }
        return [newBattle, ...prev];
      });
    });

    return () => {
      battlesSub.unsubscribe();
    };
  }, [currentEvent]);

  // Initialiser l'état des auto battles au chargement depuis la BDD
  useEffect(() => {
    if (!currentEvent) return;

    const loadAutoBattlesState = async () => {
      try {
        const settings = await getSettings(currentEvent.id);
        setAutoBattleEnabled(settings.auto_battles_enabled ?? false);
        
        // Si activé en BDD, démarrer le service
        if (settings.auto_battles_enabled) {
          const config = getAutoBattleConfig();
          if (!config.enabled) {
            // Démarrer si pas déjà actif
            startAutoBattles(AUTO_BATTLE_INTERVAL, battleDuration);
          }
        }
      } catch (error) {
        console.error('Error loading auto battles state:', error);
        // Fallback sur la config locale
        const config = getAutoBattleConfig();
        setAutoBattleEnabled(config.enabled);
      }
    };
    
    loadAutoBattlesState();
  }, [currentEvent]);

  // Gérer le nettoyage des auto battles à la déconnexion
  useEffect(() => {
    return () => {
      // Ne pas arrêter les auto battles à la déconnexion du composant
      // Elles continueront de fonctionner même si l'admin se déconnecte
    };
  }, []);

  // Fonction pour créer une battle
  const handleCreateBattle = async () => {
    if (!currentEvent) {
      addToast('Aucun événement sélectionné', 'error');
      return;
    }

    if (!selectedPhoto1 || !selectedPhoto2) {
      addToast('Veuillez sélectionner deux photos différentes', 'error');
      return;
    }

    if (selectedPhoto1.id === selectedPhoto2.id) {
      addToast('Les deux photos doivent être différentes', 'error');
      return;
    }

    setIsCreatingBattle(true);
    try {
      await createBattle(currentEvent.id, selectedPhoto1.id, selectedPhoto2.id, battleDuration);
      addToast(`Battle créée ! Durée: ${battleDuration} minutes`, 'success');
      setSelectedPhoto1(null);
      setSelectedPhoto2(null);
      // Recharger les battles
      const activeBattles = await getActiveBattles(currentEvent.id);
      setBattles(activeBattles);
    } catch (error) {
      console.error('Error creating battle:', error);
      addToast('Erreur lors de la création de la battle', 'error');
    } finally {
      setIsCreatingBattle(false);
    }
  };

  // Fonction pour terminer une battle manuellement
  const handleFinishBattle = async (battleId: string) => {
    if (!currentEvent) {
      addToast('Aucun événement sélectionné', 'error');
      return;
    }

    try {
      await finishBattle(battleId);
      addToast('Battle terminée', 'success');
      // Recharger les battles
      const activeBattles = await getActiveBattles(currentEvent.id);
      setBattles(activeBattles);
    } catch (error) {
      console.error('Error finishing battle:', error);
      addToast('Erreur lors de la fin de la battle', 'error');
    }
  };

  // Fonction pour activer/désactiver les battles automatiques
  const handleToggleAutoBattles = () => {
    if (autoBattleEnabled) {
      stopAutoBattles();
      setAutoBattleEnabled(false);
      addToast('Battles automatiques désactivées', 'info');
    } else {
      startAutoBattles(AUTO_BATTLE_INTERVAL, battleDuration);
      setAutoBattleEnabled(true);
      addToast(`Battles automatiques activées (toutes les ${AUTO_BATTLE_INTERVAL} minutes)`, 'success');
    }
  };

  const loadPhotos = async () => {
    try {
      await refreshPhotos();
    } catch (error) {
      addToast("Erreur de chargement", 'error');
    }
  };

  const loadGuests = async () => {
    if (!currentEvent) {
      setGuests([]);
      return;
    }

    setGuestsLoading(true);
    try {
      const allGuests = await getAllGuests(currentEvent.id);
      setGuests(allGuests);
      
      // Charger les statistiques pour chaque invité
      const statsMap = new Map<string, { photosCount: number; totalLikes: number; totalReactions: number }>();
      
      for (const guest of allGuests) {
        try {
          const guestPhotos = await getPhotosByAuthor(currentEvent.id, guest.name);
          const photosCount = guestPhotos.length;
          const totalLikes = guestPhotos.reduce((sum, photo) => sum + (photo.likes_count || 0), 0);
          
          // Calculer les réactions totales
          let totalReactions = 0;
          if (guestPhotos.length > 0) {
            const photoIds = guestPhotos.map(p => p.id);
            const reactionsMap = await getPhotosReactions(photoIds);
            reactionsMap.forEach((reactions) => {
              Object.values(reactions).forEach((count) => {
                totalReactions += count || 0;
              });
            });
          }
          
          statsMap.set(guest.id, { photosCount, totalLikes, totalReactions });
        } catch (error) {
          logger.error('Error loading guest stats', error, { guestId: guest.id, guestName: guest.name });
          statsMap.set(guest.id, { photosCount: 0, totalLikes: 0, totalReactions: 0 });
        }
      }
      
      setGuestStats(statsMap);
    } catch (error) {
      logger.error('Error loading guests', error);
      addToast("Erreur lors du chargement des invités", 'error');
    } finally {
      setGuestsLoading(false);
    }
  };

  const handleDeleteGuest = async (guest: Guest) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'invité "${guest.name}" ?\n\nL'utilisateur sera déconnecté et bloqué pendant 20 minutes avant de pouvoir se réinscrire.\n\nCette action est irréversible.`)) return;
    if (!currentEvent) {
      addToast("Aucun événement sélectionné", 'error');
      return;
    }

    try {
      await deleteGuest(currentEvent.id, guest.id, guest.name);
      setGuests(prev => prev.filter(g => g.id !== guest.id));
      setGuestStats(prev => {
        const next = new Map(prev);
        next.delete(guest.id);
        return next;
      });
      addToast(`Invité "${guest.name}" supprimé et bloqué pendant 20 minutes`, 'success');
      
      // Note: La déconnexion côté client se fera automatiquement lors de la prochaine vérification
      // car l'invité n'existera plus dans la base de données
    } catch (error) {
      logger.error('Error deleting guest', error);
      addToast("Erreur lors de la suppression de l'invité", 'error');
    }
  };

  // Charger les invités quand l'onglet est actif
  useEffect(() => {
    if (activeTab === 'guests' && guests.length === 0) {
      loadGuests();
    }
  }, [activeTab]);

  const handleDelete = async (photo: Photo) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette photo ?")) return;
    if (!currentEvent) {
      addToast("Aucun événement sélectionné", 'error');
      return;
    }

    try {
      await deletePhoto(photo.id, photo.url);
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
      addToast("Photo supprimée", 'success');
    } catch (error) {
      addToast("Erreur lors de la suppression", 'error');
    }
  };

  const handleDeleteAll = async () => {
    if (photos.length === 0) return;
    if (!currentEvent) {
      addToast("Aucun événement sélectionné", 'error');
      return;
    }
    
    if (!confirm("ATTENTION : Êtes-vous sûr de vouloir supprimer TOUTES les photos ?\n\n⚠️ Cette action supprimera également TOUS les invités.\n\nCette action est irréversible.")) return;
    if (!confirm("Confirmez-vous vraiment la suppression TOTALE (photos + invités) ?")) return;

    try {
      // Supprimer toutes les photos pour cet événement
      await deleteAllPhotos(currentEvent.id);
      
      // Supprimer tous les invités (sans les bloquer)
      try {
        await deleteAllGuests();
        // Rafraîchir la liste des invités si on est sur l'onglet invités
        if (activeTab === 'guests') {
          await loadGuests();
        }
      } catch (guestsError) {
        logger.error('Error deleting all guests', guestsError);
        // On continue même si la suppression des invités échoue
        addToast("Photos supprimées, mais il y a une erreur lors de la suppression des invités", 'error');
      }
      
      await refreshPhotos();
      addToast("Toutes les photos et tous les invités ont été supprimés", 'success');
    } catch (error) {
      console.error(error);
      addToast("Erreur lors de la suppression totale", 'error');
    }
  };

  const handleExport = async () => {
    if (photos.length === 0) {
        addToast("Aucune photo à exporter", 'info');
        return;
    }

    setIsExporting(true);
    addToast("Préparation de l'archive ZIP...", 'info');
    
    try {
        await exportPhotosToZip(photos, config.event_title);
        addToast("Téléchargement lancé !", 'success');
    } catch (error) {
        console.error(error);
        addToast("Erreur lors de l'export ZIP", 'error');
    } finally {
        setIsExporting(false);
    }
  };

  const handleExportWithMetadata = async () => {
    if (photos.length === 0) {
        addToast("Aucune photo à exporter", 'info');
        return;
    }

    setIsExportingWithMetadata(true);
    setExportProgress({ processed: 0, total: photos.length, message: 'Récupération des réactions...' });
    addToast("Récupération des réactions...", 'info');
    
    try {
        // Récupérer les réactions pour toutes les photos
        const photoIds = photos.map(p => p.id);
        const reactionsMap = await getPhotosReactions(photoIds);
        
        setExportProgress({ processed: 0, total: photos.length, message: 'Génération des images avec métadonnées...' });
        addToast("Génération des images avec métadonnées...", 'info');
        
        // Déterminer la taille des lots selon le nombre de photos
        const batchSize = photos.length > 50 ? 3 : photos.length > 20 ? 5 : 10;
        
        // Exporter avec métadonnées et progression
        await exportPhotosWithMetadataToZip(
          photos, 
          reactionsMap, 
          config.event_title,
          (progress: ExportProgress) => {
            setExportProgress({
              processed: progress.processed,
              total: progress.total,
              message: progress.message
            });
          },
          batchSize
        );
        addToast("Téléchargement lancé !", 'success');
    } catch (error) {
        console.error(error);
        addToast("Erreur lors de l'export PNG avec métadonnées", 'error');
    } finally {
        setIsExportingWithMetadata(false);
        setExportProgress(null);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      onBack();
    } catch (error) {
      addToast("Erreur lors de la déconnexion", 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
         <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-900/30 rounded-full blur-[180px] animate-pulse-slow"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-pink-900/30 rounded-full blur-[180px]" style={{ animationName: 'pulseSlow', animationDuration: '8s', animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite', animationDelay: '2s' }}></div>
      </div>
      {/* Grain Texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

      <div className="relative z-10 p-3 sm:p-4 md:p-6 lg:p-8">
        {/* Header - Design moderne amélioré */}
        <header className="mb-6 sm:mb-8">
          {/* Barre principale du header */}
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-6 shadow-xl">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              {/* Section gauche - Titre et navigation */}
              <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
                <button
                  onClick={onBack}
                  className="group relative p-2.5 sm:p-3 min-h-[44px] min-w-[44px] touch-manipulation rounded-xl border border-white/15 bg-gradient-to-br from-slate-800/80 to-slate-900/80 hover:from-pink-500/20 hover:to-purple-500/20 transition-all duration-300 hover:scale-105 active:scale-95 flex-shrink-0 flex items-center justify-center shadow-lg hover:shadow-pink-500/20"
                  aria-label="Retour à l'événement en cours"
                >
                  <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400 group-hover:-translate-x-1 transition-transform duration-300" />
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/0 to-purple-500/0 group-hover:from-pink-500/10 group-hover:to-purple-500/10 transition-all duration-300 pointer-events-none"></span>
                </button>
                
                <div className="min-w-0 flex-1 lg:flex-none">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1">
                    <div className="p-1.5 sm:p-2 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-lg border border-pink-500/30">
                      <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
                    </div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 truncate">
                      Administration
                    </h1>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs sm:text-sm text-slate-400">Gérez votre mur en direct</p>
                    {currentEvent && (
                      <>
                        <span className="text-slate-600">•</span>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-lg">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium text-pink-300 truncate max-w-[200px]">
                            {currentEvent.name}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Section droite - Actions rapides et profil */}
              <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto flex-wrap">
                {/* Actions rapides - Groupe de boutons */}
                {photos.length > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-xl border border-white/5">
                    <button
                      onClick={handleDeleteAll}
                      className="group relative flex items-center justify-center px-3 py-2.5 min-h-[40px] touch-manipulation bg-gradient-to-r from-red-600/80 to-red-700/80 hover:from-red-600 hover:to-red-700 rounded-lg transition-all duration-300 shadow-md shadow-red-900/30 hover:scale-105 active:scale-95 border border-red-500/30"
                      title="Tout vider - Supprimer toutes les photos"
                      aria-label="Tout vider"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-white" />
                      <span className="hidden sm:inline ml-2 text-xs font-semibold text-white">Vider</span>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900/95 backdrop-blur-xl text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 border border-white/20 shadow-xl">
                        Tout vider
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-900/95"></div>
                      </div>
                    </button>

                    <button
                      onClick={handleExport}
                      disabled={isExporting}
                      className="group relative flex items-center justify-center px-3 py-2.5 min-h-[40px] touch-manipulation bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-300 shadow-md shadow-pink-900/30 hover:scale-105 active:scale-95"
                      title={isExporting ? "Création du ZIP en cours..." : "Tout télécharger - Télécharger toutes les photos en ZIP"}
                      aria-label="Tout télécharger"
                    >
                      {isExporting ? (
                        <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin flex-shrink-0 text-white" />
                      ) : (
                        <Download className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-white" />
                      )}
                      <span className="hidden sm:inline ml-2 text-xs font-semibold text-white">ZIP</span>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900/95 backdrop-blur-xl text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 border border-white/20 shadow-xl">
                        {isExporting ? 'Création ZIP...' : 'Tout télécharger'}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-900/95"></div>
                      </div>
                    </button>

                    <button
                      onClick={handleExportWithMetadata}
                      disabled={isExportingWithMetadata}
                      className="group relative flex items-center justify-center px-3 py-2.5 min-h-[40px] touch-manipulation bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-300 shadow-md shadow-cyan-900/30 hover:scale-105 active:scale-95"
                      title={isExportingWithMetadata ? "Génération PNG en cours..." : "Export PNG - Télécharger toutes les photos en PNG avec métadonnées superposées"}
                      aria-label="Export PNG"
                    >
                      {isExportingWithMetadata ? (
                        <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin flex-shrink-0 text-white" />
                      ) : (
                        <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-white" />
                      )}
                      {isExportingWithMetadata && exportProgress && (
                        <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-cyan-500 text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-slate-900">
                          {exportProgress.processed}
                        </span>
                      )}
                      <span className="hidden sm:inline ml-2 text-xs font-semibold text-white">PNG</span>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900/95 backdrop-blur-xl text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 border border-white/20 shadow-xl">
                        {isExportingWithMetadata ? 'Génération PNG...' : 'Export PNG'}
                        {isExportingWithMetadata && exportProgress && (
                          <span className="ml-1 text-cyan-300">
                            ({exportProgress.processed}/{exportProgress.total})
                          </span>
                        )}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-900/95"></div>
                      </div>
                    </button>
                  </div>
                )}

                {/* Indicateur de progression pour l'export PNG */}
                {isExportingWithMetadata && exportProgress && (
                  <div className="w-full lg:w-auto min-w-[200px] bg-slate-800/80 backdrop-blur-xl rounded-xl p-3 border border-cyan-500/30 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-cyan-300">
                        {exportProgress.message || 'Traitement en cours...'}
                      </span>
                      <span className="text-xs font-bold text-cyan-200">
                        {exportProgress.processed} / {exportProgress.total}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 transition-all duration-300 shadow-lg shadow-cyan-500/50"
                        style={{
                          width: `${exportProgress.total > 0 ? (exportProgress.processed / exportProgress.total) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {/* Profil administrateur */}
                <div className="ml-auto lg:ml-0">
                  <AdminProfile onLogout={handleLogout} />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Tabs Navigation - Responsive avec menu hamburger pour mobile */}
        <div className="mb-6 sm:mb-8">
          {/* Bouton menu hamburger pour mobile - Design amélioré */}
          <button
            data-mobile-menu
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden flex items-center gap-3 px-4 py-3.5 mb-4 w-full bg-slate-900/70 backdrop-blur-xl hover:bg-slate-800/80 rounded-xl transition-all duration-300 border border-white/10 hover:border-pink-500/30 touch-manipulation shadow-lg hover:shadow-pink-500/10 group"
            aria-label="Menu de navigation"
            aria-expanded={isMobileMenuOpen}
          >
            <div className="relative">
              <Menu className={`w-5 h-5 flex-shrink-0 text-pink-400 transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-90' : ''}`} />
              <span className="absolute inset-0 bg-pink-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </div>
            <span className="text-sm font-semibold text-white">
              {activeTab === 'events' && 'Événements'}
              {activeTab === 'moderation' && 'Modération'}
              {activeTab === 'analytics' && 'Analytics'}
              {activeTab === 'configuration' && 'Configuration'}
              {activeTab === 'aftermovie' && 'Aftermovie'}
              {activeTab === 'battles' && 'Battles'}
              {activeTab === 'guests' && 'Inviter'}
            </span>
            <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 font-bold border border-pink-500/30">
              {activeTab === 'events' && events.length}
              {activeTab === 'moderation' && photos.length}
              {activeTab === 'battles' && battles.length}
              {activeTab === 'guests' && guests.length}
            </span>
          </button>

          {/* Menu mobile dropdown - Design amélioré */}
          {isMobileMenuOpen && (
            <div data-mobile-menu className="sm:hidden mb-4 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden animate-fade-in">
              <div className="p-2.5 space-y-1.5">
                <button
                  onClick={async () => {
                    setActiveTab('events');
                    setIsMobileMenuOpen(false);
                    if (user && events.length === 0) {
                      setLoadingEvents(true);
                      try {
                        const userEvents = await getUserEvents(user.id);
                        setEvents(userEvents);
                      } catch (error) {
                        console.error('Error loading events:', error);
                      } finally {
                        setLoadingEvents(false);
                      }
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 border-2 min-h-[48px] touch-manipulation ${
                    activeTab === 'events' 
                      ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-pink-500/50 text-pink-300 shadow-lg shadow-pink-900/20' 
                      : 'bg-slate-800/50 border-transparent text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Calendar className="w-5 h-5 flex-shrink-0" />
                  <span className="text-base font-medium flex-1 text-left">Événements</span>
                  <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                    activeTab === 'events' ? 'bg-pink-500/30 text-pink-200' : 'bg-slate-700 text-slate-300'
                  }`}>{events.length}</span>
                </button>
                {currentEvent && (
                  <>
                    <button
                      onClick={() => {
                        setActiveTab('moderation');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 border-2 min-h-[48px] touch-manipulation ${
                activeTab === 'moderation' 
                  ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-pink-500/50 text-pink-300 shadow-lg shadow-pink-900/20' 
                        : 'bg-slate-800/50 border-transparent text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`}
                    >
                      <ImageIcon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-base font-medium flex-1 text-left">Modération</span>
                      <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                activeTab === 'moderation' ? 'bg-pink-500/30 text-pink-200' : 'bg-slate-700 text-slate-300'
              }`}>{photos.length}</span>
            </button>
            <button
                    onClick={() => {
                      setActiveTab('analytics');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 border-2 min-h-[48px] touch-manipulation ${
                activeTab === 'analytics' 
                  ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-pink-500/50 text-pink-300 shadow-lg shadow-pink-900/20' 
                        : 'bg-slate-800/50 border-transparent text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
                    <BarChart2 className="w-5 h-5 flex-shrink-0" />
                    <span className="text-base font-medium flex-1 text-left">Analytics</span>
            </button>
            <button
                    onClick={() => {
                      setActiveTab('configuration');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 border-2 min-h-[48px] touch-manipulation ${
                activeTab === 'configuration' 
                  ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-pink-500/50 text-pink-300 shadow-lg shadow-pink-900/20' 
                        : 'bg-slate-800/50 border-transparent text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
                    <Settings className="w-5 h-5 flex-shrink-0" />
                    <span className="text-base font-medium flex-1 text-left">Configuration</span>
            </button>
            <button
                    onClick={() => {
                      setActiveTab('aftermovie');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 border-2 min-h-[48px] touch-manipulation ${
                activeTab === 'aftermovie'
                  ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-pink-500/50 text-pink-300 shadow-lg shadow-pink-900/20'
                        : 'bg-slate-800/50 border-transparent text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
                    <Video className="w-5 h-5 flex-shrink-0" />
                    <span className="text-base font-medium flex-1 text-left">Aftermovie</span>
            </button>
            {config.battle_mode_enabled !== false && (
              <button
                      onClick={() => {
                        setActiveTab('battles');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 border-2 min-h-[48px] touch-manipulation ${
                  activeTab === 'battles'
                    ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50 text-yellow-300 shadow-lg shadow-yellow-900/20'
                          : 'bg-slate-800/50 border-transparent text-slate-400 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <Zap className="w-5 h-5 flex-shrink-0" />
                      <span className="text-base font-medium flex-1 text-left">Battles</span>
                      <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                  activeTab === 'battles' ? 'bg-yellow-500/30 text-yellow-200' : 'bg-slate-700 text-slate-300'
                }`}>{battles.length}</span>
              </button>
            )}
            <button
              onClick={() => {
                setActiveTab('guests');
                      setIsMobileMenuOpen(false);
                if (guests.length === 0) {
                  loadGuests();
                }
              }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 border-2 min-h-[48px] touch-manipulation ${
                activeTab === 'guests'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/50 text-cyan-300 shadow-lg shadow-cyan-900/20'
                        : 'bg-slate-800/50 border-transparent text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <Users className="w-5 h-5 flex-shrink-0" />
                    <span className="text-base font-medium flex-1 text-left">Inviter</span>
                    <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                activeTab === 'guests' ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-700 text-slate-300'
              }`}>{guests.length}</span>
            </button>
                  </>
                )}
        </div>
            </div>
          )}

          {/* Navigation horizontale pour tablette et desktop - Design moderne amélioré */}
          <div className="hidden sm:block">
            <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/15 p-2 shadow-2xl overflow-hidden">
              {/* Effet de brillance animé en arrière-plan */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-500/5 to-transparent animate-shimmer pointer-events-none"></div>
              <div className="relative flex gap-1.5 overflow-x-auto scrollbar-hide">
                <button
                  onClick={async () => {
                    setActiveTab('events');
                    if (user && events.length === 0) {
                      setLoadingEvents(true);
                      try {
                        const userEvents = await getUserEvents(user.id);
                        setEvents(userEvents);
                      } catch (error) {
                        console.error('Error loading events:', error);
                      } finally {
                        setLoadingEvents(false);
                      }
                    }
                  }}
                  className={`relative flex items-center gap-2.5 px-5 md:px-6 py-3.5 rounded-xl transition-all duration-300 whitespace-nowrap min-h-[52px] touch-manipulation flex-shrink-0 group ${
                    activeTab === 'events' 
                      ? 'text-white' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {activeTab === 'events' && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/25 via-purple-500/25 to-pink-500/25 rounded-xl border border-pink-500/40 shadow-xl shadow-pink-900/30"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 rounded-xl animate-pulse-slow"></div>
                    </>
                  )}
                  <div className="relative flex items-center gap-2.5">
                    <div className="relative">
                      <Calendar className={`w-5 h-5 md:w-6 md:h-6 flex-shrink-0 transition-all duration-300 ${activeTab === 'events' ? 'scale-110 text-pink-300' : 'group-hover:scale-110'}`} />
                      {activeTab === 'events' && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-400 rounded-full animate-ping"></span>
                      )}
                    </div>
                    <span className="text-sm md:text-base font-semibold">Événements</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold transition-all duration-300 ${
                      activeTab === 'events' 
                        ? 'bg-pink-500/40 text-pink-100 shadow-lg shadow-pink-900/40 border border-pink-400/50' 
                        : 'bg-slate-700/60 text-slate-300 group-hover:bg-slate-700 border border-slate-600/30'
                    }`}>{events.length}</span>
                  </div>
                  {activeTab === 'events' && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent rounded-full shadow-lg shadow-pink-500/50"></div>
                  )}
                </button>
                
                {currentEvent && (
                  <>
                    <button
                      onClick={() => setActiveTab('moderation')}
                      className={`relative flex items-center gap-2.5 px-5 md:px-6 py-3.5 rounded-xl transition-all duration-300 whitespace-nowrap min-h-[52px] touch-manipulation flex-shrink-0 group ${
                        activeTab === 'moderation' 
                          ? 'text-white' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {activeTab === 'moderation' && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/25 via-purple-500/25 to-pink-500/25 rounded-xl border border-pink-500/40 shadow-xl shadow-pink-900/30"></div>
                          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 rounded-xl animate-pulse-slow"></div>
                        </>
                      )}
                      <div className="relative flex items-center gap-2.5">
                        <div className="relative">
                          <ImageIcon className={`w-5 h-5 md:w-6 md:h-6 flex-shrink-0 transition-all duration-300 ${activeTab === 'moderation' ? 'scale-110 text-pink-300' : 'group-hover:scale-110'}`} />
                          {activeTab === 'moderation' && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-400 rounded-full animate-ping"></span>
                          )}
                        </div>
                        <span className="text-sm md:text-base font-semibold">Modération</span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold transition-all duration-300 ${
                          activeTab === 'moderation' 
                            ? 'bg-pink-500/40 text-pink-100 shadow-lg shadow-pink-900/40 border border-pink-400/50' 
                            : 'bg-slate-700/60 text-slate-300 group-hover:bg-slate-700 border border-slate-600/30'
                        }`}>{photos.length}</span>
                      </div>
                      {activeTab === 'moderation' && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent rounded-full shadow-lg shadow-pink-500/50"></div>
                      )}
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('analytics')}
                      className={`relative flex items-center gap-2.5 px-5 md:px-6 py-3.5 rounded-xl transition-all duration-300 whitespace-nowrap min-h-[52px] touch-manipulation flex-shrink-0 group ${
                        activeTab === 'analytics' 
                          ? 'text-white' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {activeTab === 'analytics' && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/25 via-purple-500/25 to-pink-500/25 rounded-xl border border-pink-500/40 shadow-xl shadow-pink-900/30"></div>
                          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 rounded-xl animate-pulse-slow"></div>
                        </>
                      )}
                      <div className="relative flex items-center gap-2.5">
                        <div className="relative">
                          <BarChart2 className={`w-5 h-5 md:w-6 md:h-6 flex-shrink-0 transition-all duration-300 ${activeTab === 'analytics' ? 'scale-110 text-pink-300' : 'group-hover:scale-110'}`} />
                          {activeTab === 'analytics' && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-400 rounded-full animate-ping"></span>
                          )}
                        </div>
                        <span className="text-sm md:text-base font-semibold">Analytics</span>
                      </div>
                      {activeTab === 'analytics' && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent rounded-full shadow-lg shadow-pink-500/50"></div>
                      )}
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('configuration')}
                      className={`relative flex items-center gap-2.5 px-5 md:px-6 py-3.5 rounded-xl transition-all duration-300 whitespace-nowrap min-h-[52px] touch-manipulation flex-shrink-0 group ${
                        activeTab === 'configuration' 
                          ? 'text-white' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {activeTab === 'configuration' && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/25 via-purple-500/25 to-pink-500/25 rounded-xl border border-pink-500/40 shadow-xl shadow-pink-900/30"></div>
                          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 rounded-xl animate-pulse-slow"></div>
                        </>
                      )}
                      <div className="relative flex items-center gap-2.5">
                        <div className="relative">
                          <Settings className={`w-5 h-5 md:w-6 md:h-6 flex-shrink-0 transition-all duration-300 ${activeTab === 'configuration' ? 'scale-110 text-pink-300' : 'group-hover:scale-110'}`} />
                          {activeTab === 'configuration' && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-400 rounded-full animate-ping"></span>
                          )}
                        </div>
                        <span className="text-sm md:text-base font-semibold">Configuration</span>
                      </div>
                      {activeTab === 'configuration' && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent rounded-full shadow-lg shadow-pink-500/50"></div>
                      )}
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('aftermovie')}
                      className={`relative flex items-center gap-2.5 px-5 md:px-6 py-3.5 rounded-xl transition-all duration-300 whitespace-nowrap min-h-[52px] touch-manipulation flex-shrink-0 group ${
                        activeTab === 'aftermovie'
                          ? 'text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {activeTab === 'aftermovie' && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/25 via-purple-500/25 to-pink-500/25 rounded-xl border border-pink-500/40 shadow-xl shadow-pink-900/30"></div>
                          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 rounded-xl animate-pulse-slow"></div>
                        </>
                      )}
                      <div className="relative flex items-center gap-2.5">
                        <div className="relative">
                          <Video className={`w-5 h-5 md:w-6 md:h-6 flex-shrink-0 transition-all duration-300 ${activeTab === 'aftermovie' ? 'scale-110 text-pink-300' : 'group-hover:scale-110'}`} />
                          {activeTab === 'aftermovie' && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-400 rounded-full animate-ping"></span>
                          )}
                        </div>
                        <span className="text-sm md:text-base font-semibold">Aftermovie</span>
                      </div>
                      {activeTab === 'aftermovie' && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent rounded-full shadow-lg shadow-pink-500/50"></div>
                      )}
                    </button>
                    
                    {config.battle_mode_enabled !== false && (
                      <button
                        onClick={() => setActiveTab('battles')}
                        className={`relative flex items-center gap-2.5 px-5 md:px-6 py-3.5 rounded-xl transition-all duration-300 whitespace-nowrap min-h-[52px] touch-manipulation flex-shrink-0 group ${
                          activeTab === 'battles'
                            ? 'text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {activeTab === 'battles' && (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/25 via-orange-500/25 to-yellow-500/25 rounded-xl border border-yellow-500/40 shadow-xl shadow-yellow-900/30"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-yellow-500/10 rounded-xl animate-pulse-slow"></div>
                          </>
                        )}
                        <div className="relative flex items-center gap-2.5">
                          <div className="relative">
                            <Zap className={`w-5 h-5 md:w-6 md:h-6 flex-shrink-0 transition-all duration-300 ${activeTab === 'battles' ? 'scale-110 text-yellow-300' : 'group-hover:scale-110'}`} />
                            {activeTab === 'battles' && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></span>
                            )}
                          </div>
                          <span className="text-sm md:text-base font-semibold">Battles</span>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold transition-all duration-300 ${
                            activeTab === 'battles' 
                              ? 'bg-yellow-500/40 text-yellow-100 shadow-lg shadow-yellow-900/40 border border-yellow-400/50' 
                              : 'bg-slate-700/60 text-slate-300 group-hover:bg-slate-700 border border-slate-600/30'
                          }`}>{battles.length}</span>
                        </div>
                        {activeTab === 'battles' && (
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent rounded-full shadow-lg shadow-yellow-500/50"></div>
                        )}
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        setActiveTab('guests');
                        if (guests.length === 0) {
                          loadGuests();
                        }
                      }}
                      className={`relative flex items-center gap-2.5 px-5 md:px-6 py-3.5 rounded-xl transition-all duration-300 whitespace-nowrap min-h-[52px] touch-manipulation flex-shrink-0 group ${
                        activeTab === 'guests'
                          ? 'text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {activeTab === 'guests' && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/25 via-blue-500/25 to-cyan-500/25 rounded-xl border border-cyan-500/40 shadow-xl shadow-cyan-900/30"></div>
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-cyan-500/10 rounded-xl animate-pulse-slow"></div>
                        </>
                      )}
                      <div className="relative flex items-center gap-2.5">
                        <div className="relative">
                          <Users className={`w-5 h-5 md:w-6 md:h-6 flex-shrink-0 transition-all duration-300 ${activeTab === 'guests' ? 'scale-110 text-cyan-300' : 'group-hover:scale-110'}`} />
                          {activeTab === 'guests' && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></span>
                          )}
                        </div>
                        <span className="text-sm md:text-base font-semibold">Inviter</span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold transition-all duration-300 ${
                          activeTab === 'guests' 
                            ? 'bg-cyan-500/40 text-cyan-100 shadow-lg shadow-cyan-900/40 border border-cyan-400/50' 
                            : 'bg-slate-700/60 text-slate-300 group-hover:bg-slate-700 border border-slate-600/30'
                        }`}>{guests.length}</span>
                      </div>
                      {activeTab === 'guests' && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full shadow-lg shadow-cyan-500/50"></div>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contenu de l'onglet Événements */}
        {activeTab === 'events' && (
          <>
            {selectedEvent ? (
              <EventManager
                event={selectedEvent}
                onBack={() => setSelectedEvent(null)}
                onEventUpdated={(updatedEvent) => {
                  setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
                  setSelectedEvent(updatedEvent);
                  if (currentEvent?.id === updatedEvent.id) {
                    loadEventBySlug(updatedEvent.slug);
                  }
                }}
                onEventDeleted={() => {
                  const deletedEventId = selectedEvent?.id;
                  // Retirer l'événement de la liste
                  setEvents(prev => prev.filter(e => e.id !== deletedEventId));
                  // Revenir à la liste des événements
                  setSelectedEvent(null);
                  // Si l'événement supprimé était l'événement actuel, le décharger
                  if (currentEvent?.id === deletedEventId) {
                    // Ne pas appeler onBack() qui fermerait le dashboard
                    // L'utilisateur reste dans le dashboard et voit la liste des événements
                  }
                }}
              />
            ) : (
              <EventSelector
                onEventSelected={(event) => {
                  setSelectedEvent(event);
                }}
                onBack={onBack}
              />
            )}
          </>
        )}

        {activeTab === 'moderation' && (
          <>
            <div className="flex justify-end mb-4 sm:mb-6">
               <button 
                  onClick={loadPhotos}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 min-h-[44px] touch-manipulation bg-slate-800/80 hover:bg-slate-700/80 rounded-xl transition-all duration-300 text-xs sm:text-sm text-slate-300 border border-white/10 hover:border-white/20"
                  title="Rafraîchir la liste"
                  aria-label="Rafraîchir la liste"
                  >
                  <RefreshCw className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Actualiser</span>
                  <span className="sm:hidden">Rafraîchir</span>
              </button>
            </div>

            {photosLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                {photos.map(photo => (
                  <div key={photo.id} className="relative group bg-slate-900/80 backdrop-blur-xl rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 hover:border-pink-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-pink-900/20 animate-fade-in-up">
                    <div className="aspect-square bg-slate-950 relative overflow-hidden">
                      {photo.type === 'video' ? (
                        <video
                          src={photo.url}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          controls
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <img 
                          src={photo.url} 
                          alt={photo.caption} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                      )}
                      {/* Badge vidéo */}
                      {photo.type === 'video' && (
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                          <span className="text-white text-xs font-bold">🎬</span>
                          {photo.duration && (
                            <span className="text-white text-[10px] font-medium">
                              {Math.floor(photo.duration)}s
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Overlay actions - Visible sur mobile aussi */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                        <button
                          onClick={() => handleDelete(photo)}
                          className="p-3 sm:p-4 bg-red-600 hover:bg-red-700 rounded-full text-white transform hover:scale-110 active:scale-95 transition-all duration-300 shadow-2xl min-h-[44px] min-w-[44px] touch-manipulation flex items-center justify-center"
                          title="Supprimer la photo"
                          aria-label="Supprimer la photo"
                        >
                          <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 sm:p-4">
                      <p className="font-semibold text-xs sm:text-sm truncate text-white mb-1">
                        {photo.author || 'Anonyme'}
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-400 truncate mb-2">
                        {photo.caption || 'Sans description'}
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-500">
                        {new Date(photo.timestamp).toLocaleString('fr-FR', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {photos.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center h-64 text-slate-500">
                    <ImageIcon className="w-16 h-16 mb-4 opacity-30" />
                    <p className="text-lg font-medium">Aucune photo à modérer</p>
                    <p className="text-sm text-slate-600 mt-2">Les nouvelles photos apparaîtront ici</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'analytics' && (
          <div className="max-w-6xl mx-auto">
              {photosLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
                  </div>
              ) : (
                  <AnalyticsView photos={photos} />
              )}
          </div>
        )}

        {activeTab === 'configuration' && (
          <div className="max-w-7xl mx-auto">
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 border border-white/10 shadow-2xl relative overflow-hidden">
              {/* Gradient decoration */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-500/5 to-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
              
              {/* Header amélioré */}
              <div className="relative mb-8 sm:mb-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-2xl border border-pink-500/40 shadow-lg shadow-pink-900/20 flex-shrink-0">
                      <Settings className="w-6 h-6 sm:w-7 sm:h-7 text-pink-300" />
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 mb-1">
                        Paramètres du Mur
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-400">
                        Personnalisez l'apparence et le comportement de votre Party Wall
                      </p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl text-green-400 text-xs sm:text-sm font-medium shadow-lg shadow-green-900/10">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="hidden sm:inline">Synchronisation Cloud</span>
                    <span className="sm:hidden">Cloud</span>
                  </div>
                </div>
              </div>

              <div className="relative grid gap-10 md:gap-12 lg:grid-cols-12">
                {/* Section Apparence - Colonne principale */}
                <div className="lg:col-span-7 space-y-10 md:space-y-12">
                  {/* Section Apparence */}
                  <section className="bg-gradient-to-br from-slate-950/90 via-slate-900/70 to-slate-950/80 backdrop-blur-xl border border-white/15 rounded-3xl p-7 md:p-10 shadow-2xl hover:shadow-pink-500/10 transition-all duration-300">
                    <header className="flex items-center gap-4 mb-8">
                      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-pink-500/40 to-purple-500/40 rounded-2xl border border-pink-600/30 shadow-md shadow-pink-900/20">
                        <ImageIcon className="w-7 h-7 text-pink-300" />
                      </div>
                      <div>
                        <h3 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 mb-0.5 tracking-tight">Apparence</h3>
                        <p className="text-sm md:text-base text-slate-300">Personnalisez l'identité visuelle de votre événement</p>
                      </div>
                    </header>

                    <div className="space-y-7">
                      {/* Titre */}
                      <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-700/30 shadow-inner flex flex-col gap-1">
                        <label className="block text-base font-semibold text-white mb-2 flex items-center gap-2">
                          <Type className="w-5 h-5 text-pink-400" />
                          Titre de l'événement
                        </label>
                        <input
                          type="text"
                          name="event_title"
                          value={localConfig.event_title}
                          onChange={handleConfigChange}
                          className="w-full bg-slate-900/50 border border-pink-400/10 rounded-xl px-4 py-3 text-base text-white font-medium placeholder:text-slate-500 outline-none focus:border-pink-500/30 focus:ring-2 focus:ring-pink-600/15 transition-all"
                          placeholder="Party Wall"
                        />
                        <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                          <Info className="w-4 h-4 text-slate-500" />
                          Affiché sur l’accueil et dans les exports
                        </p>
                      </div>

                      {/* Sous-titre */}
                      <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-700/30 shadow-inner flex flex-col gap-1">
                        <label className="block text-base font-semibold text-white mb-2 flex items-center gap-2">
                          <Tag className="w-5 h-5 text-pink-400" />
                          Sous-titre / Badge
                        </label>
                        <input
                          type="text"
                          name="event_subtitle"
                          value={localConfig.event_subtitle}
                          onChange={handleConfigChange}
                          className="w-full bg-slate-900/50 border border-pink-400/10 rounded-xl px-4 py-3 text-base text-white font-medium placeholder:text-slate-500 outline-none focus:border-pink-500/30 focus:ring-2 focus:ring-pink-600/15 transition-all"
                          placeholder="Live"
                        />
                        <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                          <Info className="w-4 h-4 text-slate-500" />
                          Badge secondaire affiché sous le titre
                        </p>
                      </div>

                      {/* Contexte */}
                      <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-700/30 shadow-inner flex flex-col gap-1">
                        <label className="block text-base font-semibold text-white mb-2 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-pink-400" />
                          Contexte de la soirée
                        </label>
                        <div className="flex flex-col gap-3">
                          <textarea
                            name="event_context"
                            value={localConfig.event_context || ''}
                            onChange={handleConfigChange}
                            rows={3}
                            className="w-full bg-slate-900/50 border border-pink-400/10 rounded-xl px-4 py-3 text-base text-white font-normal placeholder:text-slate-500 focus:border-pink-500/20 focus:ring-2 focus:ring-pink-600/10 outline-none transition-all resize-none"
                            placeholder="Ex: Anniversaire 30 ans de Marie, Mariage de Sophie et Thomas, Soirée entreprise..."
                          />
                          <div className="flex flex-wrap gap-2 items-center">
                            <button
                              type="button"
                              onClick={handleGenerateContextSuggestion}
                              disabled={isGeneratingContextSuggestion || allPhotos.length === 0}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-slate-700/60 disabled:cursor-not-allowed rounded-xl transition-all text-xs md:text-sm text-white font-semibold shadow-md shadow-pink-900/20"
                            >
                              {isGeneratingContextSuggestion ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
                                  <span>Analyse en cours...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4 flex-shrink-0" />
                                  <span>
                                    {localConfig.event_context
                                      ? "Améliorer avec IA"
                                      : "Suggestion IA"}
                                  </span>
                                </>
                              )}
                            </button>
                            {contextSuggestion && (
                              <>
                                <button
                                  type="button"
                                  onClick={handleAcceptContextSuggestion}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all text-xs md:text-sm text-white font-semibold shadow-md shadow-emerald-900/20"
                                >
                                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                  <span>Accepter</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setContextSuggestion(null)}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/60 border border-white/10 hover:border-white/30 rounded-xl transition-all text-xs md:text-sm text-slate-300 hover:text-white"
                                >
                                  <X className="w-4 h-4 flex-shrink-0" />
                                  <span>Ignorer</span>
                                </button>
                              </>
                            )}
                          </div>
                          {contextSuggestion && (
                            <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-xl p-3">
                              <div className="flex items-start gap-2">
                                <Sparkles className="w-4 h-4 text-pink-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-pink-300 mb-1">Suggestion IA :</p>
                                  <p className="text-sm text-white">{contextSuggestion}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                          <Info className="w-4 h-4 text-slate-500" />
                          Sert à générer des légendes personnalisées et festives adaptées à votre événement.
                        </p>
                      </div>

                      {/* Cadre décoratif PNG */}
                      <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-700/30 shadow-inner">
                        <label className="block text-base font-semibold text-white mb-4 flex items-center gap-2">
                          <Frame className="w-5 h-5 text-pink-400" />
                          Cadre décoratif PNG
                        </label>
                        <div className="flex gap-3 flex-wrap mb-3">
                          <label className="flex items-center gap-2 bg-slate-900/60 border border-white/10 px-4 py-3 rounded-xl cursor-pointer transition hover:border-pink-500/40">
                            <input
                              type="checkbox"
                              name="decorative_frame_enabled"
                              checked={!!localConfig.decorative_frame_enabled}
                              onChange={handleConfigChange}
                              className="h-4 w-4 accent-pink-500"
                            />
                            <span className="text-sm text-white">
                              {localConfig.decorative_frame_enabled ? (
                                <span className="inline-flex items-center gap-1">
                                  Actif
                                  <span className="ml-2 px-1.5 py-0.5 bg-green-500/20 border border-green-500/25 text-green-400 text-xs rounded-full font-medium">
                                    On
                                  </span>
                                </span>
                              ) : (
                                <>Désactivé</>
                              )}
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowFrameGallery(true)}
                            className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-700/80 to-purple-700/80 hover:from-pink-800 hover:to-purple-800 rounded-xl text-white text-xs font-semibold shadow transition"
                          >
                            <Frame className="w-4 h-4" />
                            <span>Galerie</span>
                          </button>
                          <label className="inline-flex items-center gap-2 px-4 py-3 border border-pink-400/20 bg-slate-900/60 rounded-xl cursor-pointer hover:border-pink-400/60 transition text-xs">
                            <input
                              type="file"
                              accept="image/png"
                              onChange={handleFrameFileChange}
                              className="hidden"
                              disabled={uploadingFrame}
                            />
                            <Upload className="w-4 h-4 text-pink-400" />
                            <span className="text-pink-200">{uploadingFrame ? 'Upload...' : 'Uploader PNG'}</span>
                          </label>
                          {localConfig.decorative_frame_url && (
                            <button
                              type="button"
                              onClick={clearFrame}
                              className="px-4 py-3 bg-slate-900 border border-red-500/30 rounded-xl hover:border-red-500/60 hover:text-red-400 text-xs text-slate-200"
                            >
                              Supprimer
                            </button>
                          )}
                        </div>

                        {localConfig.decorative_frame_url ? (
                          <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                            <div className="text-xs text-slate-400 mb-2 font-medium flex items-center gap-2">
                              <ImageIcon className="w-4 h-4" />
                              Aperçu
                            </div>
                            <div className="w-full aspect-video bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-white/5 shadow-inner">
                              <img
                                src={localConfig.decorative_frame_url}
                                alt="Cadre décoratif"
                                className="w-full h-full object-contain"
                                loading="lazy"
                              />
                            </div>
                            <div className="text-[10px] md:text-xs text-slate-500 mt-2 font-mono bg-slate-900/70 p-2 rounded border border-white/5 overflow-x-auto break-all">{localConfig.decorative_frame_url}</div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 bg-slate-950/60 rounded-lg p-3 border border-white/10 flex items-start gap-2">
                            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-500" />
                            <span className="break-words">Aucun cadre sélectionné. Choisissez-en un dans la galerie ou uploadez un PNG.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Section Comportement */}
                  <section className="bg-gradient-to-br from-slate-950/90 via-slate-900/70 to-slate-950/80 backdrop-blur-xl border border-white/15 rounded-3xl p-7 md:p-10 shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300">
                    <header className="flex items-center gap-4 mb-8">
                      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-cyan-500/50 via-sky-500/30 to-indigo-500/40 rounded-2xl border border-cyan-500/30 shadow-md shadow-cyan-900/20">
                        <Gauge className="w-7 h-7 text-cyan-200" />
                      </div>
                      <div>
                        <h3 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300 mb-0.5 tracking-tight">Comportement</h3>
                        <p className="text-sm md:text-base text-slate-300">Paramétrez les animations et transitions</p>
                      </div>
                    </header>
                    <div className="space-y-7">
                      <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-700/30 shadow-inner flex flex-col gap-1">
                        <label className="block text-base font-semibold text-white mb-2 flex items-center gap-2">
                          <Move className="w-5 h-5 text-cyan-400" />
                          Vitesse de défilement (Grille)
                        </label>
                        <select
                          name="scroll_speed"
                          value={localConfig.scroll_speed}
                          onChange={handleConfigChange}
                          className="w-full bg-slate-900/50 border border-cyan-400/10 rounded-xl px-4 py-3 text-base text-white font-medium outline-none focus:border-cyan-500/30 focus:ring-2 focus:ring-cyan-600/15 transition-all"
                        >
                          <option value="slow">🐢 Lente</option>
                          <option value="normal">⚡ Normale</option>
                          <option value="fast">🚀 Rapide</option>
                        </select>
                        <p className="text-xs text-slate-400 mt-1.5">Vitesse d'animation dans la vue grille</p>
                      </div>
                      <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-700/30 shadow-inner flex flex-col gap-1">
                        <label className="block text-base font-semibold text-white mb-2 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-cyan-400" />
                          Transition Diaporama
                        </label>
                        <select
                          name="slide_transition"
                          value={localConfig.slide_transition}
                          onChange={handleConfigChange}
                          className="w-full bg-slate-900/50 border border-cyan-400/10 rounded-xl px-4 py-3 text-base text-white font-medium outline-none focus:border-cyan-500/30 focus:ring-2 focus:ring-cyan-600/15 transition-all"
                        >
                          <option value="fade">✨ Fondu (Fade)</option>
                          <option value="slide">➡️ Glissement (Slide)</option>
                          <option value="zoom">🔍 Zoom</option>
                        </select>
                        <p className="text-xs text-slate-400 mt-1.5">Effet de transition des photos en projection</p>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Section IA - Sidebar */}
                <aside className="lg:col-span-5 space-y-10 md:space-y-12">
                  <section className="bg-gradient-to-br from-purple-950/60 via-pink-950/45 to-indigo-950/80 backdrop-blur-xl border border-purple-500/25 rounded-3xl p-7 md:p-10 shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 sticky top-4">
                    <header className="flex items-center gap-4 mb-7">
                      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500/40 via-indigo-500/20 to-pink-500/40 rounded-2xl border border-purple-400/30 shadow-lg shadow-purple-900/10 ring-2 ring-purple-400/10 animate-pulse-slow">
                        <Sparkles className="w-7 h-7 text-purple-200 drop-shadow-glow" />
                      </div>
                      <div>
                        <h3 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-200 tracking-tight mb-1 flex items-center gap-2">
                          Intelligence Artificielle
                        </h3>
                        <p className="text-sm md:text-base text-slate-300">
                          Modération, légendes &amp; améliorations auto pour une expérience fluide et sécurisée.
                        </p>
                      </div>
                    </header>
                    <div className="space-y-4">
                      {/* Génération de légende */}
                      <div className="bg-slate-950/60 border border-purple-400/15 rounded-2xl p-5 hover:border-pink-400/20 transition group">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            name="caption_generation_enabled"
                            checked={localConfig.caption_generation_enabled ?? true}
                            onChange={handleConfigChange}
                            className="h-4 w-4 accent-pink-500 mt-1 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white flex items-center gap-2 mb-0.5">
                              <Sparkles className="w-4 h-4 text-purple-400" />
                              Génération de légende
                              {localConfig.caption_generation_enabled ? (
                                <span className="px-2 py-0.5 ml-2 bg-green-500/20 border border-green-500/30 text-green-400 text-xs rounded-full">Actif</span>
                              ) : (
                                <span className="px-2 py-0.5 ml-2 bg-slate-700/40 border border-slate-600/40 text-slate-400 text-xs rounded-full">Inactif</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 mt-1">Génère automatiquement une légende contextuelle pour chaque photo avec IA Gemini.</p>
                          </div>
                        </label>
                      </div>
                      {/* Modération */}
                      <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border border-green-500/20 rounded-2xl p-5">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            name="content_moderation_enabled"
                            checked={true}
                            disabled={true}
                            className="h-4 w-4 accent-pink-500 mt-1 cursor-not-allowed opacity-60"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white flex items-center gap-2 mb-0.5">
                              <Shield className="w-4 h-4 text-green-400" />
                              Modération du contenu
                              <span className="px-2 py-0.5 ml-2 bg-green-500/20 border border-green-500/30 text-green-400 text-xs rounded-full">Toujours actif</span>
                            </div>
                            <p className="text-xs text-slate-300 mt-1">Garantie la sécurité en bloquant tout contenu inapproprié avant publication.</p>
                          </div>
                        </div>
                      </div>
                      {/* Video capture */}
                      <div className="bg-slate-950/60 border border-purple-400/15 rounded-2xl p-5 hover:border-pink-400/20 transition">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            name="video_capture_enabled"
                            checked={localConfig.video_capture_enabled ?? true}
                            onChange={handleConfigChange}
                            className="h-4 w-4 accent-pink-500 mt-1 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white flex items-center gap-2 mb-0.5">
                              <Video className="w-4 h-4 text-purple-400" />
                              Capture vidéo
                              {localConfig.video_capture_enabled ? (
                                <span className="px-2 py-0.5 ml-2 bg-green-500/20 border border-green-500/30 text-green-400 text-xs rounded-full">Actif</span>
                              ) : (
                                <span className="px-2 py-0.5 ml-2 bg-slate-700/40 border border-slate-600/40 text-slate-400 text-xs rounded-full">Inactif</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 mt-1">Permet l’enregistrement de courtes vidéos jusqu’à 30 secondes.</p>
                            {!localConfig.video_capture_enabled && (
                              <p className="mt-2 text-xs text-slate-400/80 bg-slate-800/60 border border-slate-700/50 rounded-lg p-2 flex items-start gap-2">
                                <Info className="w-3 h-3 mt-0.5 text-slate-500" />
                                L'option vidéo sera masquée côté utilisateur.
                              </p>
                            )}
                          </div>
                        </label>
                      </div>
                      {/* Collage mode */}
                      <div className="bg-slate-950/60 border border-purple-400/15 rounded-2xl p-5 hover:border-pink-400/20 transition">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            name="collage_mode_enabled"
                            checked={localConfig.collage_mode_enabled ?? true}
                            onChange={handleConfigChange}
                            className="h-4 w-4 accent-pink-500 mt-1 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white flex items-center gap-2 mb-0.5">
                              <Grid3x3 className="w-4 h-4 text-purple-400" />
                              Mode Collage
                              {localConfig.collage_mode_enabled ? (
                                <span className="px-2 py-0.5 ml-2 bg-green-500/20 border border-green-500/30 text-green-400 text-xs rounded-full">Actif</span>
                              ) : (
                                <span className="px-2 py-0.5 ml-2 bg-slate-700/40 border border-slate-600/40 text-slate-400 text-xs rounded-full">Inactif</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 mt-1">Permet de créer des collages avec 2 à 4 photos en un clic.</p>
                            {!localConfig.collage_mode_enabled && (
                              <p className="mt-2 text-xs text-slate-400/80 bg-slate-800/60 border border-slate-700/50 rounded-lg p-2 flex items-start gap-2">
                                <Info className="w-3 h-3 mt-0.5 text-slate-500" />
                                Le bouton Collage sera masqué. Les collages existants restent visibles.
                              </p>
                            )}
                          </div>
                        </label>
                      </div>
                      {/* Stats */}
                      <div className="bg-slate-950/60 border border-purple-400/15 rounded-2xl p-5 hover:border-pink-400/20 transition">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            name="stats_enabled"
                            checked={localConfig.stats_enabled ?? true}
                            onChange={handleConfigChange}
                            className="h-4 w-4 accent-pink-500 mt-1 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white flex items-center gap-2 mb-0.5">
                              <BarChart2 className="w-4 h-4 text-purple-400" />
                              Statistiques
                              {localConfig.stats_enabled ? (
                                <span className="px-2 py-0.5 ml-2 bg-green-500/20 border border-green-500/30 text-green-400 text-xs rounded-full">Actif</span>
                              ) : (
                                <span className="px-2 py-0.5 ml-2 bg-slate-700/40 border border-slate-600/40 text-slate-400 text-xs rounded-full">Inactif</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 mt-1">Rend visible la page de stats, classement et podium sur la Home.</p>
                            {!localConfig.stats_enabled && (
                              <p className="mt-2 text-xs text-slate-400/80 bg-slate-800/60 border border-slate-700/50 rounded-lg p-2 flex items-start gap-2">
                                <Info className="w-3 h-3 mt-0.5 text-slate-500" />
                                Le lien Statistiques sera masqué sur l'accueil.
                              </p>
                            )}
                          </div>
                        </label>
                      </div>
                      {/* Retrouve-moi */}
                      <div className="bg-slate-950/60 border border-purple-400/15 rounded-2xl p-5 hover:border-pink-400/20 transition">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            name="find_me_enabled"
                            checked={localConfig.find_me_enabled ?? true}
                            onChange={handleConfigChange}
                            className="h-4 w-4 accent-pink-500 mt-1 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white flex items-center gap-2 mb-0.5">
                              <User className="w-4 h-4 text-purple-400" />
                              Retrouve-moi (Reconnaissance Faciale)
                              {localConfig.find_me_enabled ? (
                                <span className="px-2 py-0.5 ml-2 bg-green-500/20 border border-green-500/30 text-green-400 text-xs rounded-full">Actif</span>
                              ) : (
                                <span className="px-2 py-0.5 ml-2 bg-slate-700/40 border border-slate-600/40 text-slate-400 text-xs rounded-full">Inactif</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 mt-1">Aide à retrouver ses photos via un selfie (face-api.js).</p>
                            {!localConfig.find_me_enabled && (
                              <p className="mt-2 text-xs text-slate-400/80 bg-slate-800/60 border border-slate-700/50 rounded-lg p-2 flex items-start gap-2">
                                <Info className="w-3 h-3 mt-0.5 text-slate-500" />
                                Le bouton "Retrouve-moi" sera masqué.
                              </p>
                            )}
                          </div>
                        </label>
                      </div>
                      {/* Scène AR */}
                      <div className="bg-slate-950/60 border border-purple-400/15 rounded-2xl p-5 hover:border-pink-400/20 transition">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            name="ar_scene_enabled"
                            checked={localConfig.ar_scene_enabled ?? true}
                            onChange={handleConfigChange}
                            className="h-4 w-4 accent-pink-500 mt-1 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white flex items-center gap-2 mb-0.5">
                              <Sparkles className="w-4 h-4 text-purple-400" />
                              Effets Scène Augmentée (AR)
                              {localConfig.ar_scene_enabled ? (
                                <span className="px-2 py-0.5 ml-2 bg-green-500/20 border border-green-500/30 text-green-400 text-xs rounded-full">Actif</span>
                              ) : (
                                <span className="px-2 py-0.5 ml-2 bg-slate-700/40 border border-slate-600/40 text-slate-400 text-xs rounded-full">Inactif</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 mt-1">Effets visuels (feux d’artifice, bulles...) déclenchés par likes ou à l’heure pile.</p>
                            {!localConfig.ar_scene_enabled && (
                              <p className="mt-2 text-xs text-slate-400/80 bg-slate-800/60 border border-slate-700/50 rounded-lg p-2 flex items-start gap-2">
                                <Info className="w-3 h-3 mt-0.5 text-slate-500" />
                                Les effets et le bouton manuel seront masqués.
                              </p>
                            )}
                          </div>
                        </label>
                      </div>
                      {/* Battle mode */}
                      <div className="bg-slate-950/60 border border-purple-400/15 rounded-2xl p-5 hover:border-pink-400/20 transition">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            name="battle_mode_enabled"
                            checked={localConfig.battle_mode_enabled ?? true}
                            onChange={handleConfigChange}
                            className="h-4 w-4 accent-pink-500 mt-1 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-white flex items-center gap-2 mb-0.5">
                              <Trophy className="w-4 h-4 text-purple-400" />
                              Mode Battle
                              {localConfig.battle_mode_enabled ? (
                                <span className="px-2 py-0.5 ml-2 bg-green-500/20 border border-green-500/30 text-green-400 text-xs rounded-full">Actif</span>
                              ) : (
                                <span className="px-2 py-0.5 ml-2 bg-slate-700/40 border border-slate-600/40 text-slate-400 text-xs rounded-full">Inactif</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 mt-1">Crée des battles entre deux photos ; les invités votent en live.</p>
                            {!localConfig.battle_mode_enabled && (
                              <p className="mt-2 text-xs text-slate-400/80 bg-slate-800/60 border border-slate-700/50 rounded-lg p-2 flex items-start gap-2">
                                <Info className="w-3 h-3 mt-0.5 text-slate-500" />
                                Battles masquées dans la galerie/admin ; les anciennes restent.
                              </p>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>
                  </section>
                </aside>
              </div>
              
              {/* Footer avec bouton de sauvegarde amélioré */}
              <div className="relative mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-white/10">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="text-xs sm:text-sm text-slate-300 flex items-center gap-2.5 flex-wrap bg-slate-900/40 rounded-xl px-4 py-2.5 border border-white/5">
                          <Info className="w-4 h-4 flex-shrink-0 text-slate-400" />
                          <span className="break-words">Les modifications sont sauvegardées en temps réel dans Supabase</span>
                      </div>
                      <button 
                          onClick={saveConfig}
                          disabled={savingConfig}
                          className={`flex items-center gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 min-h-[48px] touch-manipulation bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-700 hover:via-purple-700 hover:to-indigo-700 text-white rounded-xl text-sm sm:text-base font-semibold transition-all duration-300 shadow-xl shadow-pink-900/40 hover:scale-105 active:scale-95 w-full sm:w-auto justify-center ${savingConfig ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                          {savingConfig ? (
                            <>
                              <RefreshCw className="w-5 h-5 animate-spin flex-shrink-0" />
                              <span>Sauvegarde...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-5 h-5 flex-shrink-0" />
                              <span className="hidden sm:inline">Sauvegarder les paramètres</span>
                              <span className="sm:hidden">Sauvegarder</span>
                            </>
                          )}
                      </button>
                  </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'aftermovie' && (
          <div className="max-w-7xl mx-auto">
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 md:p-8 border border-white/10 shadow-2xl">
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl border border-pink-500/30">
                    <Video className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400" />
                  </div>
                  <span className="break-words">Génération Aftermovie (Timelapse)</span>
                </h2>
                <p className="text-slate-400 mt-2 text-xs sm:text-sm">
                  Génère une vidéo WebM depuis les <span className="font-semibold text-white">photos</span> de la plage sélectionnée (100% navigateur).
                </p>
              </div>

              {/* Presets simplifiés */}
              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2 sm:mb-3">Mode de génération</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setAftermoviePresetMode('rapide')}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all min-h-[44px] touch-manipulation ${
                      aftermoviePresetMode === 'rapide'
                        ? 'border-pink-500 bg-pink-500/10 shadow-lg shadow-pink-900/20'
                        : 'border-white/10 bg-slate-900/50 hover:border-pink-500/30'
                    }`}
                    disabled={isGeneratingAftermovie}
                  >
                    <Zap className={`w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2 mx-auto ${aftermoviePresetMode === 'rapide' ? 'text-pink-400' : 'text-slate-400'}`} />
                    <div className="text-xs sm:text-sm font-semibold text-white">Rapide</div>
                    <div className="text-[10px] sm:text-xs text-slate-400 mt-1 break-words">720p • 24 FPS • 4 Mbps</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAftermoviePresetMode('standard')}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all min-h-[44px] touch-manipulation ${
                      aftermoviePresetMode === 'standard'
                        ? 'border-pink-500 bg-pink-500/10 shadow-lg shadow-pink-900/20'
                        : 'border-white/10 bg-slate-900/50 hover:border-pink-500/30'
                    }`}
                    disabled={isGeneratingAftermovie}
                  >
                    <Star className={`w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2 mx-auto ${aftermoviePresetMode === 'standard' ? 'text-pink-400' : 'text-slate-400'}`} />
                    <div className="text-xs sm:text-sm font-semibold text-white">Standard</div>
                    <div className="text-[10px] sm:text-xs text-slate-400 mt-1 break-words">1080p • 30 FPS • 12 Mbps</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAftermoviePresetMode('qualite')}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all min-h-[44px] touch-manipulation ${
                      aftermoviePresetMode === 'qualite'
                        ? 'border-pink-500 bg-pink-500/10 shadow-lg shadow-pink-900/20'
                        : 'border-white/10 bg-slate-900/50 hover:border-pink-500/30'
                    }`}
                    disabled={isGeneratingAftermovie}
                  >
                    <Award className={`w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2 mx-auto ${aftermoviePresetMode === 'qualite' ? 'text-pink-400' : 'text-slate-400'}`} />
                    <div className="text-xs sm:text-sm font-semibold text-white">Qualité</div>
                    <div className="text-[10px] sm:text-xs text-slate-400 mt-1 break-words">1080p • 30 FPS • 20 Mbps</div>
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
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                        disabled={isGeneratingAftermovie}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Fin</label>
                      <input
                        type="datetime-local"
                        value={aftermovieEnd}
                        onChange={(e) => setAftermovieEnd(e.target.value)}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                        disabled={isGeneratingAftermovie}
                      />
                    </div>
                  </div>

                  {/* Sélection manuelle des photos dans la plage */}
                  <div className="bg-slate-950/50 border border-white/10 rounded-xl p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-white">Photos dans la plage</div>
                        <div className="text-[10px] sm:text-xs text-slate-400">
                          Sélectionnées: <span className="font-semibold text-white">{aftermovieSelectedPhotoIds.size}</span> / {aftermovieRangePhotos.length}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setAftermovieSelectedPhotoIds(new Set(aftermovieRangePhotos.map((p) => p.id)))}
                          className="px-3 py-2 rounded-lg bg-slate-800/70 hover:bg-slate-700/70 border border-white/10 hover:border-white/20 text-xs font-semibold transition-all"
                          disabled={isGeneratingAftermovie || aftermovieRangePhotos.length === 0}
                        >
                          Tout
                        </button>
                        <button
                          type="button"
                          onClick={() => setAftermovieSelectedPhotoIds(new Set())}
                          className="px-3 py-2 rounded-lg bg-slate-800/70 hover:bg-slate-700/70 border border-white/10 hover:border-white/20 text-xs font-semibold transition-all"
                          disabled={isGeneratingAftermovie || aftermovieRangePhotos.length === 0}
                        >
                          Aucun
                        </button>
                      </div>
                    </div>

                    {aftermovieRangePhotos.length === 0 ? (
                      <div className="text-xs sm:text-sm text-slate-500">Aucune photo dans la plage (ou plage invalide).</div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto pr-1">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                          {aftermovieRangePhotos.map((p) => {
                            const selected = aftermovieSelectedPhotoIds.has(p.id);
                            return (
                              <div
                                key={p.id}
                                className="relative group"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    const existingTimeout = photoClickTimeoutsRef.current.get(p.id);
                                    if (existingTimeout) {
                                      clearTimeout(existingTimeout);
                                      photoClickTimeoutsRef.current.delete(p.id);
                                    } else {
                                      const timeout = setTimeout(() => {
                                        setPreviewPhoto(p);
                                        photoClickTimeoutsRef.current.delete(p.id);
                                      }, 200);
                                      photoClickTimeoutsRef.current.set(p.id, timeout);
                                    }
                                  }}
                                  onDoubleClick={(e) => {
                                    e.preventDefault();
                                    const existingTimeout = photoClickTimeoutsRef.current.get(p.id);
                                    if (existingTimeout) {
                                      clearTimeout(existingTimeout);
                                      photoClickTimeoutsRef.current.delete(p.id);
                                    }
                                    setAftermovieSelectedPhotoIds((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(p.id)) next.delete(p.id);
                                      else next.add(p.id);
                                      return next;
                                    });
                                  }}
                                  className={`relative w-full rounded-xl overflow-hidden border transition-all aspect-square ${
                                    selected
                                      ? 'border-pink-500/60 shadow-lg shadow-pink-900/20'
                                      : 'border-white/10 hover:border-white/25'
                                  }`}
                                  disabled={isGeneratingAftermovie}
                                  title={`${new Date(p.timestamp).toLocaleString('fr-FR')} - Clic pour agrandir, Double-clic pour sélectionner`}
                                >
                                  <img
                                    src={p.url}
                                    alt=""
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    loading="lazy"
                                  />
                                  {p.type === 'video' && (
                                    <div className="absolute top-1 right-1 bg-black/60 rounded px-1 py-0.5 flex items-center gap-0.5">
                                      <Video className="w-2.5 h-2.5 text-white" />
                                      {p.duration && <span className="text-[9px] text-white font-medium">{Math.round(p.duration)}s</span>}
                                    </div>
                                  )}
                                  <div className={`absolute inset-0 ${selected ? 'bg-pink-500/10' : 'bg-black/0 group-hover:bg-black/10'} transition-colors`} />
                                  <div className="absolute top-1 left-1">
                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black border ${
                                      selected
                                        ? 'bg-pink-500 text-white border-pink-400'
                                        : 'bg-black/50 text-white border-white/20'
                                    }`}>
                                      {selected ? '✓' : ''}
                                    </div>
                                  </div>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Réorganisation des photos sélectionnées */}
                  {aftermovieSelectedPhotos.length > 0 && (
                    <div className="bg-slate-950/50 border border-white/10 rounded-xl p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                            <Move className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400 flex-shrink-0" />
                            <span>Ordre des photos</span>
                          </div>
                          <div className="text-[10px] sm:text-xs text-slate-400 mt-1">
                            Réorganisez l'ordre d'apparition dans l'aftermovie
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            // Réinitialiser à l'ordre par timestamp
                            const sorted = [...aftermovieSelectedPhotos].sort((a, b) => a.timestamp - b.timestamp);
                            setAftermoviePhotoOrder(sorted.map(p => p.id));
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700/70 border border-white/10 hover:border-white/20 text-xs font-semibold transition-all flex-shrink-0 self-start sm:self-auto"
                          disabled={isGeneratingAftermovie}
                        >
                          Réinitialiser
                        </button>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                        {aftermovieSelectedPhotos.map((photo, index) => {
                          const photoIndex = aftermoviePhotoOrder.indexOf(photo.id);
                          const displayIndex = photoIndex >= 0 ? photoIndex : index;
                          return (
                            <div
                              key={photo.id}
                              className="flex items-center gap-3 p-2 bg-slate-900/50 rounded-lg border border-white/10 hover:border-pink-500/30 transition-all"
                            >
                              <div className="flex-shrink-0 w-8 h-8 rounded-lg overflow-hidden border border-white/10">
                                <img
                                  src={photo.url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-white truncate">
                                  #{displayIndex + 1} - {photo.caption || 'Sans légende'}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {photo.author} • {new Date(photo.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newOrder = [...aftermoviePhotoOrder];
                                    const currentIdx = newOrder.indexOf(photo.id);
                                    if (currentIdx > 0) {
                                      [newOrder[currentIdx - 1], newOrder[currentIdx]] = [newOrder[currentIdx], newOrder[currentIdx - 1]];
                                      setAftermoviePhotoOrder(newOrder);
                                    }
                                  }}
                                  className="p-1 rounded hover:bg-slate-800/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={isGeneratingAftermovie || displayIndex === 0}
                                  title="Déplacer vers le haut"
                                >
                                  <ChevronUp className="w-4 h-4 text-slate-400" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newOrder = [...aftermoviePhotoOrder];
                                    const currentIdx = newOrder.indexOf(photo.id);
                                    if (currentIdx < newOrder.length - 1) {
                                      [newOrder[currentIdx], newOrder[currentIdx + 1]] = [newOrder[currentIdx + 1], newOrder[currentIdx]];
                                      setAftermoviePhotoOrder(newOrder);
                                    }
                                  }}
                                  className="p-1 rounded hover:bg-slate-800/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={isGeneratingAftermovie || displayIndex === aftermovieSelectedPhotos.length - 1}
                                  title="Déplacer vers le bas"
                                >
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>

                <div className="space-y-4">
                  {/* Options principales */}
                  <div className="bg-slate-950/50 border border-white/10 rounded-xl p-4 sm:p-5 space-y-4">
                    <h3 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400" />
                      Options principales
                    </h3>

                    <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aftermovieIncludeTitle}
                        onChange={(e) => setAftermovieIncludeTitle(e.target.checked)}
                        className="h-4 w-4 accent-pink-500 mt-0.5 flex-shrink-0"
                        disabled={isGeneratingAftermovie}
                      />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-white">Titre en bas</div>
                        <div className="text-[10px] sm:text-xs text-slate-400">Affiche le titre de l'événement sur la vidéo.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aftermovieIncludeFrame}
                        onChange={(e) => setAftermovieIncludeFrame(e.target.checked)}
                        className="h-4 w-4 accent-pink-500 mt-0.5 flex-shrink-0"
                        disabled={isGeneratingAftermovie}
                      />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-white">Cadre décoratif</div>
                        <div className="text-[10px] sm:text-xs text-slate-400">Incruste le cadre actif (si configuré).</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aftermovieEnableKenBurns}
                        onChange={(e) => setAftermovieEnableKenBurns(e.target.checked)}
                        className="h-4 w-4 accent-pink-500 mt-0.5 flex-shrink-0"
                        disabled={isGeneratingAftermovie}
                      />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-white">Effet Ken Burns</div>
                        <div className="text-[10px] sm:text-xs text-slate-400">Ajoute un zoom/pan progressif sur chaque photo.</div>
                      </div>
                    </label>

                    {/* Durée par photo */}
                    <div className="pt-2 border-t border-white/10">
                      <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-3">
                        Durée par photo
                      </label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 sm:gap-4">
                          <input
                            type="range"
                            min={AFTERMOVIE_MIN_MS_PER_PHOTO}
                            max={AFTERMOVIE_MAX_MS_PER_PHOTO}
                            step={100}
                            value={aftermovieMsPerPhoto}
                            onChange={(e) => setAftermovieMsPerPhoto(Number(e.target.value))}
                            className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                            disabled={isGeneratingAftermovie}
                          />
                          <div className="flex items-center gap-1.5 sm:gap-2 min-w-[80px] sm:min-w-[100px]">
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
                              className="w-16 sm:w-20 bg-slate-900/50 border border-white/10 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-white text-xs sm:text-sm focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                              disabled={isGeneratingAftermovie}
                            />
                            <span className="text-[10px] sm:text-xs text-slate-400">ms</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500 flex-wrap gap-1">
                          <span className="whitespace-nowrap">{AFTERMOVIE_MIN_MS_PER_PHOTO}ms ({AFTERMOVIE_MIN_MS_PER_PHOTO / 1000}s)</span>
                          <span className="font-medium text-slate-300 whitespace-nowrap">
                            {Math.round(aftermovieMsPerPhoto / 1000 * 10) / 10}s
                          </span>
                          <span className="whitespace-nowrap">{AFTERMOVIE_MAX_MS_PER_PHOTO}ms ({AFTERMOVIE_MAX_MS_PER_PHOTO / 1000}s)</span>
                        </div>
                      </div>
                    </div>

                    <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aftermovieEnableSmartDuration}
                        onChange={(e) => setAftermovieEnableSmartDuration(e.target.checked)}
                        className="h-4 w-4 accent-pink-500 mt-0.5 flex-shrink-0"
                        disabled={isGeneratingAftermovie}
                      />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-white">Durée intelligente</div>
                        <div className="text-[10px] sm:text-xs text-slate-400">Affiche plus longtemps les photos populaires (+500ms/like).</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aftermovieEnableIntroOutro}
                        onChange={(e) => setAftermovieEnableIntroOutro(e.target.checked)}
                        className="h-4 w-4 accent-pink-500 mt-0.5 flex-shrink-0"
                        disabled={isGeneratingAftermovie}
                      />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-white">Intro & Outro Cinéma</div>
                        <div className="text-[10px] sm:text-xs text-slate-400">Ajoute des séquences de titre animées au début et à la fin.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aftermovieEnableComicsStyle}
                        onChange={(e) => setAftermovieEnableComicsStyle(e.target.checked)}
                        className="h-4 w-4 accent-pink-500 mt-0.5 flex-shrink-0"
                        disabled={isGeneratingAftermovie}
                      />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-white">Légendes BD (Comics)</div>
                        <div className="text-[10px] sm:text-xs text-slate-400">Affiche les légendes dans des bulles style bande dessinée.</div>
                      </div>
                    </label>

                    {/* Section Transitions (collapsible) */}
                    <div className="pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setShowTransitionsOptions(!showTransitionsOptions)}
                        className="w-full flex items-center justify-between p-2 hover:bg-slate-900/50 rounded-lg transition-all"
                        disabled={isGeneratingAftermovie}
                      >
                        <div className="flex items-center gap-2">
                          <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400" />
                          <span className="text-xs sm:text-sm font-medium text-white">Transitions</span>
                        </div>
                        {showTransitionsOptions ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      
                      {showTransitionsOptions && (
                        <div className="mt-3 space-y-3 pl-4 sm:pl-6">
                          <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={aftermovieRandomTransitions}
                              onChange={(e) => setAftermovieRandomTransitions(e.target.checked)}
                              className="h-4 w-4 accent-pink-500 mt-0.5 flex-shrink-0"
                              disabled={isGeneratingAftermovie}
                            />
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-medium text-white">Transitions aléatoires</div>
                              <div className="text-[10px] sm:text-xs text-slate-400">Utilise une transition différente et aléatoire entre chaque photo.</div>
                            </div>
                          </label>
                          
                          {!aftermovieRandomTransitions && (
                            <>
                              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">Type de transition</label>
                              <select
                                value={aftermovieTransitionType}
                                onChange={(e) => setAftermovieTransitionType(e.target.value as TransitionType)}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                                disabled={isGeneratingAftermovie}
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
                              </select>
                            </>
                          )}

                          {(aftermovieTransitionType !== 'none' || aftermovieRandomTransitions) && (
                            <div>
                              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">
                                Durée de transition (ms)
                              </label>
                              <input
                                type="number"
                                min={AFTERMOVIE_MIN_TRANSITION_DURATION}
                                max={AFTERMOVIE_MAX_TRANSITION_DURATION}
                                value={aftermovieTransitionDuration}
                                onChange={(e) => setAftermovieTransitionDuration(Number(e.target.value))}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                                disabled={isGeneratingAftermovie}
                              />
                              <p className="text-[10px] sm:text-xs text-slate-500 mt-1.5">
                                Min {AFTERMOVIE_MIN_TRANSITION_DURATION}ms / Max {AFTERMOVIE_MAX_TRANSITION_DURATION}ms
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-white/10">
                      <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">Musique (optionnel)</label>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => setAftermovieAudioFile(e.target.files?.[0] || null)}
                        className="w-full text-xs sm:text-sm text-slate-300 file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-xl file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700"
                        disabled={isGeneratingAftermovie}
                      />
                      {aftermovieAudioFile && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
                            <input
                              type="checkbox"
                              checked={aftermovieAudioLoop}
                              onChange={(e) => setAftermovieAudioLoop(e.target.checked)}
                              className="h-4 w-4 accent-pink-500"
                              disabled={isGeneratingAftermovie}
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

                  {/* Options avancées (collapsible) */}
                  <div className="bg-slate-950/50 border border-white/10 rounded-xl p-4 sm:p-5">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                      className="w-full flex items-center justify-between p-2 hover:bg-slate-900/50 rounded-lg transition-all"
                      disabled={isGeneratingAftermovie}
                    >
                      <div className="flex items-center gap-2">
                        <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400" />
                        <span className="text-xs sm:text-sm font-medium text-white">Options avancées</span>
                      </div>
                      {showAdvancedOptions ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    
                    {showAdvancedOptions && (
                      <div className="mt-4 space-y-4 pl-4 sm:pl-6">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">Résolution</label>
                          <select
                            value={aftermoviePreset}
                            onChange={(e) => setAftermoviePreset(e.target.value as keyof typeof AFTERMOVIE_PRESETS)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                            disabled={isGeneratingAftermovie}
                          >
                            {Object.entries(AFTERMOVIE_PRESETS).map(([key, preset]) => (
                              <option key={key} value={key}>
                                {preset.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">FPS</label>
                            <input
                              type="number"
                              min={1}
                              max={60}
                              value={aftermovieFps}
                              onChange={(e) => setAftermovieFps(Number(e.target.value))}
                              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                              disabled={isGeneratingAftermovie}
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">Bitrate (Mbps)</label>
                            <input
                              type="number"
                              min={1}
                              max={50}
                              value={aftermovieBitrateMbps}
                              onChange={(e) => setAftermovieBitrateMbps(Number(e.target.value))}
                              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                              disabled={isGeneratingAftermovie}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">Durée cible (s)</label>
                            <input
                              type="number"
                              min={5}
                              max={600}
                              value={aftermovieTargetSeconds}
                              onChange={(e) => setAftermovieTargetSeconds(Number(e.target.value))}
                              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                              disabled={isGeneratingAftermovie}
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">ms / photo</label>
                            <input
                              type="number"
                              min={AFTERMOVIE_MIN_MS_PER_PHOTO}
                              max={AFTERMOVIE_MAX_MS_PER_PHOTO}
                              value={aftermovieMsPerPhoto}
                              onChange={(e) => setAftermovieMsPerPhoto(Number(e.target.value))}
                              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                              disabled={isGeneratingAftermovie}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-950/50 border border-white/10 rounded-xl p-4 sm:p-5">
                    <h3 className="text-sm sm:text-base font-semibold text-white mb-2">Progression</h3>
                    {aftermovieProgress ? (
                      <div className="space-y-2">
                        <div className="text-xs sm:text-sm text-slate-300 break-words">
                          {aftermovieProgress.message || aftermovieProgress.stage}
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                            style={{
                              width: `${aftermovieProgress.total > 0 ? (aftermovieProgress.processed / aftermovieProgress.total) * 100 : 0}%`
                            }}
                          ></div>
                        </div>
                        <div className="text-[10px] sm:text-xs text-slate-500">
                          {aftermovieProgress.processed} / {aftermovieProgress.total}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs sm:text-sm text-slate-500">En attente…</div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={async () => {
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
                        addToast('Génération de la vidéo en cours… (ne pas fermer l’onglet)', 'info');

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
                      }}
                      className="flex-1 px-4 sm:px-5 py-2.5 sm:py-3 min-h-[44px] touch-manipulation rounded-xl text-sm sm:text-base font-semibold bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      disabled={isGeneratingAftermovie || photosLoading || settingsLoading}
                    >
                      {isGeneratingAftermovie ? 'Génération…' : <><span className="hidden sm:inline">Générer & </span>Télécharger</>}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (aftermovieAbortRef.current) {
                          aftermovieAbortRef.current.abort();
                        }
                      }}
                      className="px-4 sm:px-5 py-2.5 sm:py-3 min-h-[44px] touch-manipulation rounded-xl text-sm sm:text-base font-semibold bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!isGeneratingAftermovie}
                    >
                      Annuler
                    </button>
                  </div>

                  <div className="text-[10px] sm:text-xs text-slate-500">
                    Note: export en <span className="font-mono text-slate-300">.webm</span> (MediaRecorder). La qualité dépend du navigateur et de la machine.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Aperçu Photo */}
        {previewPhoto && (
          <div 
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setPreviewPhoto(null)}
          >
            <div 
              className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                    {previewPhoto.caption || 'Sans légende'}
                  </h3>
                  <div className="flex items-center gap-3 mt-2 text-xs sm:text-sm text-slate-400">
                    <span className="truncate">{previewPhoto.author || 'Anonyme'}</span>
                    <span>•</span>
                    <span className="whitespace-nowrap">
                      {new Date(previewPhoto.timestamp).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {previewPhoto.type === 'video' && previewPhoto.duration && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          <Video className="w-3 h-3" />
                          {Math.round(previewPhoto.duration)}s
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setPreviewPhoto(null)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300 text-slate-400 hover:text-white flex-shrink-0 ml-4"
                  title="Fermer (Échap)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 flex items-center justify-center bg-black/40">
                {previewPhoto.type === 'video' ? (
                  <video
                    src={previewPhoto.url}
                    controls
                    autoPlay
                    className="max-w-full max-h-[60vh] sm:max-h-[70vh] rounded-lg shadow-2xl"
                    playsInline
                  />
                ) : (
                  <img
                    src={previewPhoto.url}
                    alt={previewPhoto.caption || 'Photo'}
                    className="max-w-full max-h-[60vh] sm:max-h-[70vh] object-contain rounded-lg shadow-2xl"
                    loading="lazy"
                  />
                )}
              </div>

              {/* Footer avec actions */}
              <div className="p-3 sm:p-4 md:p-6 border-t border-white/10 bg-slate-900/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAftermovieSelectedPhotoIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(previewPhoto.id)) {
                        next.delete(previewPhoto.id);
                      } else {
                        next.add(previewPhoto.id);
                      }
                      return next;
                    });
                  }}
                  className={`px-4 py-2.5 min-h-[44px] touch-manipulation rounded-xl text-sm font-semibold transition-all ${
                    aftermovieSelectedPhotoIds.has(previewPhoto.id)
                      ? 'bg-pink-500/20 border border-pink-500/50 text-pink-300 hover:bg-pink-500/30'
                      : 'bg-slate-800/50 border border-white/10 text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  {aftermovieSelectedPhotoIds.has(previewPhoto.id) ? '✓ Sélectionnée' : 'Sélectionner'}
                </button>
                <button
                  onClick={() => setPreviewPhoto(null)}
                  className="px-4 sm:px-6 py-2.5 min-h-[44px] touch-manipulation bg-slate-800/50 hover:bg-slate-700/50 text-white rounded-xl text-sm font-semibold transition-all duration-300 border border-white/10 hover:border-white/20"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Réglages de Qualité */}
        {showQualitySettingsModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              {/* Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
                <div>
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Gauge className="w-6 h-6 text-pink-400" />
                    Réglages de Qualité
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Configurez la qualité et les paramètres de l'aftermovie
                  </p>
                </div>
                <button
                  onClick={() => setShowQualitySettingsModal(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Qualité</label>
                    <select
                      value={aftermoviePreset}
                      onChange={(e) => setAftermoviePreset(e.target.value as keyof typeof AFTERMOVIE_PRESETS)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                      disabled={isGeneratingAftermovie}
                    >
                      {Object.entries(AFTERMOVIE_PRESETS).map(([key, preset]) => (
                        <option key={key} value={key}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">FPS</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={aftermovieFps}
                      onChange={(e) => setAftermovieFps(Number(e.target.value))}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                      disabled={isGeneratingAftermovie}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Bitrate vidéo (Mbps)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={aftermovieBitrateMbps}
                    onChange={(e) => setAftermovieBitrateMbps(Number(e.target.value))}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                    disabled={isGeneratingAftermovie}
                  />
                  <p className="text-xs text-slate-500 mt-1.5">Plus haut = meilleure qualité, mais plus lourd.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Durée cible (s)</label>
                    <input
                      type="number"
                      min={5}
                      max={600}
                      value={aftermovieTargetSeconds}
                      onChange={(e) => setAftermovieTargetSeconds(Number(e.target.value))}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                      disabled={isGeneratingAftermovie}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">ms / photo</label>
                    <input
                      type="number"
                      min={AFTERMOVIE_MIN_MS_PER_PHOTO}
                      max={AFTERMOVIE_MAX_MS_PER_PHOTO}
                      value={aftermovieMsPerPhoto}
                      onChange={(e) => setAftermovieMsPerPhoto(Number(e.target.value))}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                      disabled={isGeneratingAftermovie}
                    />
                    <p className="text-[10px] text-slate-500 mt-1.5">Min {AFTERMOVIE_MIN_MS_PER_PHOTO} / max {AFTERMOVIE_MAX_MS_PER_PHOTO}</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 bg-slate-900/30 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowQualitySettingsModal(false)}
                  className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-xl text-sm font-semibold transition-all duration-300"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'battles' && config.battle_mode_enabled !== false && (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Section Battles Automatiques */}
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 md:p-8 border border-white/10 shadow-2xl">
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                  </div>
                  Battles Automatiques
                </h2>
                <p className="text-slate-400 text-sm sm:text-base mt-2">
                  Activez les battles automatiques pour créer une battle aléatoire à intervalles réguliers.
                </p>
              </div>

              <div className="space-y-4">
                {/* Toggle Auto Battles */}
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${autoBattleEnabled ? 'bg-green-500/20' : 'bg-slate-700/50'}`}>
                      <Zap className={`w-5 h-5 ${autoBattleEnabled ? 'text-green-400' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Battles Automatiques</h3>
                      <p className="text-sm text-slate-400">
                        {autoBattleEnabled 
                          ? `Actives - Une battle est créée toutes les ${AUTO_BATTLE_INTERVAL} minutes`
                          : 'Inactives - Les battles doivent être créées manuellement'}
                      </p>
                      {autoBattleEnabled && (
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Intervalle fixe : {AUTO_BATTLE_INTERVAL} minutes (non modifiable)
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleToggleAutoBattles}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      autoBattleEnabled
                        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                        : 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30'
                    }`}
                  >
                    {autoBattleEnabled ? 'Désactiver' : 'Activer'}
                  </button>
                </div>
              </div>
            </div>

            {/* Bouton Nouvelle Battle */}
            {!showCreateBattleForm && (
              <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 md:p-8 border border-white/10 shadow-2xl">
                <button
                  onClick={() => setShowCreateBattleForm(true)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 hover:from-yellow-500/30 hover:via-orange-500/30 hover:to-yellow-500/30 border border-yellow-500/30 hover:border-yellow-500/50 text-yellow-400 hover:text-yellow-300 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 group shadow-lg hover:shadow-xl"
                >
                  <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Nouvelle Battle</span>
                </button>
              </div>
            )}

            {/* Section Création de Battle - Affichée seulement si showCreateBattleForm est true */}
            {showCreateBattleForm && (
              <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 md:p-8 border border-white/10 shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-500/30">
                        <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                      </div>
                      Créer une Photo Battle
                    </h2>
                    <p className="text-slate-400 text-sm sm:text-base mt-2">
                      Sélectionnez deux photos pour créer une battle. Les invités voteront pour leur photo préférée.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowCreateBattleForm(false);
                      setSelectedPhoto1(null);
                      setSelectedPhoto2(null);
                    }}
                    className="p-2 hover:bg-slate-800/50 rounded-xl transition-all"
                    title="Fermer"
                  >
                    <X className="w-5 h-5 text-slate-400 hover:text-white" />
                  </button>
                </div>

              {/* Sélection des photos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Photo 1 */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Photo 1 {selectedPhoto1 && <span className="text-green-400">✓</span>}
                  </label>
                  <div className="bg-slate-800/50 rounded-xl p-4 border-2 border-dashed border-white/10 min-h-[200px] flex items-center justify-center">
                    {selectedPhoto1 ? (
                      <div className="relative w-full">
                        <img
                          src={selectedPhoto1.url}
                          alt={selectedPhoto1.caption}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => setSelectedPhoto1(null)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 rounded-full p-1.5 transition-all"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                        <div className="mt-2 text-xs text-slate-400 truncate">
                          {selectedPhoto1.author} - {selectedPhoto1.caption}
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm">Sélectionnez une photo ci-dessous</p>
                    )}
                  </div>
                </div>

                {/* Photo 2 */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Photo 2 {selectedPhoto2 && <span className="text-green-400">✓</span>}
                  </label>
                  <div className="bg-slate-800/50 rounded-xl p-4 border-2 border-dashed border-white/10 min-h-[200px] flex items-center justify-center">
                    {selectedPhoto2 ? (
                      <div className="relative w-full">
                        <img
                          src={selectedPhoto2.url}
                          alt={selectedPhoto2.caption}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => setSelectedPhoto2(null)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 rounded-full p-1.5 transition-all"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                        <div className="mt-2 text-xs text-slate-400 truncate">
                          {selectedPhoto2.author} - {selectedPhoto2.caption}
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm">Sélectionnez une photo ci-dessous</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Durée de la battle */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Durée de la battle (minutes)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={battleDuration}
                    onChange={(e) => setBattleDuration(Number(e.target.value))}
                    className="w-32 bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all"
                  />
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>La battle se terminera automatiquement après {battleDuration} minutes</span>
                  </div>
                </div>
              </div>

              {/* Bouton Créer */}
              <button
                onClick={handleCreateBattle}
                disabled={!selectedPhoto1 || !selectedPhoto2 || isCreatingBattle || selectedPhoto1.id === selectedPhoto2.id}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                {isCreatingBattle ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Création en cours...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>Créer la Battle</span>
                  </>
                )}
              </button>

              {/* Liste des photos pour sélection */}
              <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 md:p-8 border border-white/10 shadow-2xl mt-6">
                <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-pink-400" />
                  Sélectionner des photos ({photos.length} disponibles)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto">
                  {photos.map(photo => {
                    const isSelected1 = selectedPhoto1?.id === photo.id;
                    const isSelected2 = selectedPhoto2?.id === photo.id;
                    const isSelected = isSelected1 || isSelected2;
                    
                    return (
                      <div
                        key={photo.id}
                        onClick={() => {
                          if (!selectedPhoto1) {
                            setSelectedPhoto1(photo);
                          } else if (!selectedPhoto2 && photo.id !== selectedPhoto1.id) {
                            setSelectedPhoto2(photo);
                          } else if (isSelected1) {
                            setSelectedPhoto1(null);
                          } else if (isSelected2) {
                            setSelectedPhoto2(null);
                          }
                        }}
                        className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ${
                          isSelected
                            ? 'ring-4 ring-yellow-400 scale-105'
                            : 'hover:ring-2 hover:ring-yellow-400/50 hover:scale-105'
                        }`}
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-yellow-400/20 flex items-center justify-center">
                            <div className="bg-yellow-400 rounded-full p-2">
                              <CheckCircle2 className="w-6 h-6 text-yellow-900" />
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <p className="text-white text-xs font-bold truncate">{photo.author}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            )}

            {/* Battles Actives */}
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 md:p-8 border border-white/10 shadow-2xl">
              <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Battles Actives 
                <span className="text-yellow-400 px-2 py-0.5 bg-yellow-400/10 rounded-lg text-xs font-semibold ml-2">
                  {battles.length}
                </span>
              </h3>
              {battles.length === 0 ? (
                <div className="flex flex-col items-center py-10">
                  <Trophy className="w-10 h-10 text-slate-500 mb-2" />
                  <p className="text-slate-400 text-lg font-semibold">Aucune battle active</p>
                  <p className="text-slate-500 text-sm mt-1">Créez une battle pour lancer un duel photo !</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  {battles.map(battle => {
                    const totalVotes = battle.votes1Count + battle.votes2Count;
                    const photo1Percentage = totalVotes > 0 ? (battle.votes1Count / totalVotes) * 100 : 50;
                    const photo2Percentage = totalVotes > 0 ? (battle.votes2Count / totalVotes) * 100 : 50;
                    const timeRemaining = battle.expiresAt ? Math.max(0, battle.expiresAt - Date.now()) : null;
                    const isEndingSoon = timeRemaining !== null && timeRemaining < 15000;

                    return (
                      <div
                        key={battle.id}
                        className="relative bg-gradient-to-br from-slate-900/70 via-slate-800/80 to-slate-900/70 rounded-xl p-3 border border-white/10 shadow-lg hover:shadow-yellow-400/10 transition-all duration-300"
                      >
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3">
                          {/* Photo 1 */}
                          <div className={`relative bg-slate-900/50 rounded-lg overflow-hidden ${photo1Percentage > photo2Percentage ? 'ring-2 ring-yellow-400/60' : ''}`}>
                            <div className="aspect-square flex items-center justify-center bg-slate-800/30">
                              <img
                                src={battle.photo1.url}
                                alt={battle.photo1.caption}
                                className="w-full h-full object-contain max-h-full"
                              />
                            </div>
                            <div className="absolute top-1 left-1 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] text-yellow-200 font-bold flex items-center gap-0.5">
                              <User className="w-2.5 h-2.5" /> 
                              <span className="truncate max-w-[60px]">{battle.photo1.author}</span>
                            </div>
                            {/* Votes Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 px-1.5 pt-3 pb-1 bg-gradient-to-t from-yellow-900/40 to-transparent">
                              <div className="flex flex-col items-start gap-0.5">
                                <div className="w-full bg-yellow-400/30 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    style={{ width: `${photo1Percentage}%` }}
                                    className="h-full bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full transition-all duration-500"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5 w-full">
                                  <span className="text-yellow-300 text-[10px] font-bold">{Math.round(photo1Percentage)}%</span>
                                  <span className="text-white text-[9px]">{battle.votes1Count} vote{battle.votes1Count > 1 ? 's' : ''}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Photo 2 */}
                          <div className={`relative bg-slate-900/50 rounded-lg overflow-hidden ${photo2Percentage > photo1Percentage ? 'ring-2 ring-cyan-400/60' : ''}`}>
                            <div className="aspect-square flex items-center justify-center bg-slate-800/30">
                              <img
                                src={battle.photo2.url}
                                alt={battle.photo2.caption}
                                className="w-full h-full object-contain max-h-full"
                              />
                            </div>
                            <div className="absolute top-1 left-1 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] text-cyan-200 font-bold flex items-center gap-0.5">
                              <User className="w-2.5 h-2.5" /> 
                              <span className="truncate max-w-[60px]">{battle.photo2.author}</span>
                            </div>
                            {/* Votes Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 px-1.5 pt-3 pb-1 bg-gradient-to-t from-cyan-900/40 to-transparent">
                              <div className="flex flex-col items-start gap-0.5">
                                <div className="w-full bg-cyan-400/30 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    style={{ width: `${photo2Percentage}%` }}
                                    className="h-full bg-gradient-to-r from-cyan-400 to-cyan-300 rounded-full transition-all duration-500"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5 w-full">
                                  <span className="text-cyan-300 text-[10px] font-bold">{Math.round(photo2Percentage)}%</span>
                                  <span className="text-white text-[9px]">{battle.votes2Count} vote{battle.votes2Count > 1 ? 's' : ''}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span className="font-semibold text-white">{totalVotes}</span>
                              <span>vote{totalVotes > 1 ? 's' : ''}</span>
                            </div>
                            {timeRemaining !== null && (
                              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                isEndingSoon ? 'bg-yellow-500/30 text-yellow-300 animate-pulse' : 'bg-slate-700/40 text-slate-300'
                              }`}>
                                <Clock className="w-3 h-3" />
                                <span>
                                  {Math.floor(timeRemaining / 60000)}:
                                  {(Math.floor((timeRemaining % 60000) / 1000)).toString().padStart(2, '0')}
                                </span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleFinishBattle(battle.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/40 hover:to-pink-500/30 text-red-400 font-semibold rounded-lg text-[10px] transition-all duration-200 shadow shadow-red-900/10"
                          >
                            <Trophy className="w-3 h-3" />
                            <span className="hidden sm:inline">Terminer</span>
                            <span className="sm:hidden">Fin</span>
                          </button>
                        </div>
                        {/* Info overlay if battle is ending soon */}
                        {isEndingSoon && (
                          <div className="absolute top-1.5 right-1.5 bg-yellow-400/90 text-yellow-950 text-[9px] font-bold px-2 py-1 rounded-lg shadow shadow-yellow-800/20 flex items-center gap-1 animate-pulse">
                            <Clock className="w-3 h-3" />
                            <span>Fin proche !</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Galerie de Cadres Locaux */}
        {showFrameGallery && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              {/* Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
                <div>
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Frame className="w-6 h-6 text-pink-400" />
                    Choisir un Cadre Décoratif
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    {localFrames.length} cadre{localFrames.length > 1 ? 's' : ''} disponible{localFrames.length > 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => setShowFrameGallery(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filtres par catégorie */}
              <div className="p-3 sm:p-4 border-b border-white/10 bg-slate-900/30">
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 sm:px-4 py-2 min-h-[44px] touch-manipulation rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${
                      selectedCategory === 'all'
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-900/30'
                        : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white border border-white/5'
                    }`}
                  >
                    Tous ({localFrames.length})
                  </button>
                  {Object.entries(frameCategories).map(([key, { label, emoji }]) => {
                    const count = localFrames.filter(f => f.category === key).length;
                    if (count === 0) return null;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedCategory(key)}
                        className={`px-3 sm:px-4 py-2 min-h-[44px] touch-manipulation rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${
                          selectedCategory === key
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-900/30'
                            : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white border border-white/5'
                        }`}
                      >
                        {emoji} <span className="hidden sm:inline">{label}</span> ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grille de cadres */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 scrollbar-hide">
                {filteredFrames.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-500 px-4">
                    <Frame className="w-12 h-12 sm:w-16 sm:h-16 mb-4 opacity-20" />
                    <p className="text-base sm:text-lg font-medium text-center">Aucun cadre disponible</p>
                    <p className="text-xs sm:text-sm mt-2 text-slate-600 text-center">
                      Ajoutez des fichiers PNG dans <code className="bg-slate-800 px-2 py-0.5 rounded text-slate-400 break-all">public/cadres/</code>
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {filteredFrames.map(frame => (
                      <button
                        key={frame.id}
                        onClick={() => selectLocalFrame(frame)}
                        className="group relative bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden hover:border-pink-500/50 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-500/50 touch-manipulation"
                      >
                        {/* Miniature */}
                        <div className="aspect-video bg-slate-950 flex items-center justify-center relative overflow-hidden">
                          <img
                            src={getLocalFrameThumbnailUrl(frame)}
                            alt={frame.name}
                            className="w-full h-full object-contain"
                            loading="lazy"
                          />
                          {/* Overlay hover */}
                          <div className="absolute inset-0 bg-pink-500/0 group-hover:bg-pink-500/10 transition-colors duration-300 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium shadow-lg">
                              Sélectionner
                            </div>
                          </div>
                        </div>
                        {/* Nom */}
                        <div className="p-2 sm:p-3">
                          <p className="text-xs sm:text-sm font-medium text-white truncate">{frame.name}</p>
                          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">
                            {frameCategories[frame.category]?.emoji} {frameCategories[frame.category]?.label || frame.category}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 sm:p-4 border-t border-white/10 bg-slate-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <p className="text-[10px] sm:text-xs text-slate-500 break-words">
                  💡 Astuce: Placez vos PNG dans <code className="bg-slate-800 px-1.5 sm:px-2 py-0.5 rounded text-slate-400 break-all">public/cadres/</code>
                </p>
                <button
                  onClick={() => setShowFrameGallery(false)}
                  className="px-4 py-2 min-h-[44px] touch-manipulation bg-slate-800/50 hover:bg-slate-700/50 text-white rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 border border-white/10 hover:border-white/20 w-full sm:w-auto"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'guests' && (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header avec statistiques globales */}
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 md:p-8 border border-white/10 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 sm:gap-3 mb-2">
                    <div className="p-1.5 sm:p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-500/30">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                    </div>
                    Invités Connectés
                  </h2>
                  <p className="text-slate-400 text-sm sm:text-base">
                    Gérez tous les invités qui ont créé un profil
                  </p>
                </div>
                <button
                  onClick={loadGuests}
                  disabled={guestsLoading}
                  className="flex items-center gap-2 px-4 py-2 min-h-[44px] touch-manipulation bg-slate-800/80 hover:bg-slate-700/80 rounded-xl transition-all duration-300 text-sm text-slate-300 border border-white/10 hover:border-white/20 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${guestsLoading ? 'animate-spin' : ''}`} />
                  <span>Actualiser</span>
                </button>
              </div>

              {/* Statistiques globales */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/20 rounded-lg">
                      <Users className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{guests.length}</p>
                      <p className="text-xs text-slate-400">Total invités</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500/20 rounded-lg">
                      <Camera className="w-5 h-5 text-pink-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {Array.from(guestStats.values()).reduce((sum, stats) => sum + stats.photosCount, 0)}
                      </p>
                      <p className="text-xs text-slate-400">Photos totales</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Heart className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {Array.from(guestStats.values()).reduce((sum, stats) => sum + stats.totalLikes, 0)}
                      </p>
                      <p className="text-xs text-slate-400">Likes total</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Liste des invités */}
            {guestsLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
              </div>
            ) : guests.length === 0 ? (
              <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-8 sm:p-12 border border-white/10 shadow-2xl text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-bold text-white mb-2">Aucun invité</h3>
                <p className="text-slate-400">Aucun invité n'a encore créé de profil.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {guests.map(guest => {
                  const stats = guestStats.get(guest.id) || { photosCount: 0, totalLikes: 0, totalReactions: 0 };
                  const joinDate = new Date(guest.createdAt);
                  
                  return (
                    <div
                      key={guest.id}
                      className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/10 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-900/20 group"
                    >
                      {/* Header avec avatar et nom */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="relative flex-shrink-0">
                          <img
                            src={guest.avatarUrl}
                            alt={guest.name}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-cyan-500/30 shadow-lg group-hover:border-cyan-500/60 transition-colors"
                          />
                          {stats.photosCount > 0 && (
                            <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full p-1.5 border-2 border-slate-900">
                              <Camera className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg sm:text-xl font-bold text-white truncate mb-1">
                            {guest.name}
                          </h3>
                          <p className="text-xs text-slate-400">
                            Inscrit le {joinDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteGuest(guest)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-all text-slate-400 hover:text-red-400 flex-shrink-0"
                          title="Supprimer l'invité"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Statistiques */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-slate-800/50 rounded-lg p-3 text-center border border-white/5">
                          <p className="text-lg sm:text-xl font-bold text-white">{stats.photosCount}</p>
                          <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Photos</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3 text-center border border-white/5">
                          <p className="text-lg sm:text-xl font-bold text-pink-400">{stats.totalLikes}</p>
                          <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Likes</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3 text-center border border-white/5">
                          <p className="text-lg sm:text-xl font-bold text-purple-400">{stats.totalReactions}</p>
                          <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Réactions</p>
                        </div>
                      </div>

                      {/* Badge si actif */}
                      {stats.photosCount > 0 && (
                        <div className="flex items-center gap-2 text-xs text-cyan-400 bg-cyan-500/10 rounded-lg px-3 py-2 border border-cyan-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Actif sur le mur</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
