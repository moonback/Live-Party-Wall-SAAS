import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, Type, Tag, Sparkles, Frame, Upload, X, Save, RefreshCw, 
  Image as ImageIcon, Gauge, Move, Shield, Video, Grid3x3, BarChart2, 
  User, Trophy, Info, CheckCircle2, Power, Play
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { usePhotos } from '../../context/PhotosContext';
import { useToast } from '../../context/ToastContext';
import { useEvent } from '../../context/EventContext';
import { uploadDecorativeFramePng } from '../../services/frameService';
import { getLocalFrames, getLocalFrameUrl, getLocalFrameThumbnailUrl, frameCategories, LocalFrame } from '../../services/localFramesService';
import { generateEventContextSuggestion } from '../../services/eventContextService';
import { EventSettings } from '../../services/settingsService';
import { uploadBackgroundImage, uploadLogoImage } from '../../services/backgroundService';
import { Monitor, Smartphone } from 'lucide-react';

interface ConfigurationTabProps {
  // Props si nécessaire
}

export const ConfigurationTab: React.FC<ConfigurationTabProps> = () => {
  const { settings: config, updateSettings } = useSettings();
  const { photos: allPhotos } = usePhotos();
  const { addToast } = useToast();
  const { currentEvent } = useEvent();
  
  const [localConfig, setLocalConfig] = useState<EventSettings>(config);
  const [savingConfig, setSavingConfig] = useState(false);
  const [uploadingFrame, setUploadingFrame] = useState(false);
  const [localFrames, setLocalFrames] = useState<LocalFrame[]>([]);
  const [showFrameGallery, setShowFrameGallery] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isGeneratingContextSuggestion, setIsGeneratingContextSuggestion] = useState(false);
  const [contextSuggestion, setContextSuggestion] = useState<string | null>(null);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Synchroniser localConfig avec config du Context
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

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target;
    const name = target.name as keyof EventSettings;
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
      const existingContext = localConfig.event_context || null;
      const suggestion = await generateEventContextSuggestion(allPhotos, existingContext);
      setContextSuggestion(suggestion);
      
      if (existingContext) {
        addToast("Contexte amélioré avec succès ! Version plus humoristique et festive générée.", 'success');
      } else {
        addToast("Suggestion générée avec succès ! Vous pouvez l'accepter ou la modifier.", 'success');
      }
    } catch (error) {
      console.error('Error generating context suggestion:', error);
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

  const handleBackgroundUpload = async (file: File, type: 'desktop' | 'mobile') => {
    if (!currentEvent) {
      addToast('Aucun événement sélectionné', 'error');
      return;
    }

    const setUploading = type === 'desktop' ? setUploadingDesktop : setUploadingMobile;
    setUploading(true);

    try {
      const { publicUrl } = await uploadBackgroundImage(currentEvent.id, file, type);
      const fieldName = type === 'desktop' ? 'background_desktop_url' : 'background_mobile_url';
      setLocalConfig(prev => ({
        ...prev,
        [fieldName]: publicUrl
      }));
      addToast(`Image de fond ${type === 'desktop' ? 'desktop' : 'mobile'} uploadée. N'oubliez pas de sauvegarder.`, 'success');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('row-level security') || errorMsg.includes('policy')) {
        addToast('❌ Policies Supabase manquantes. Vérifiez la configuration du bucket party-backgrounds', 'error');
      } else {
        addToast(`Erreur: ${errorMsg}`, 'error');
      }
    } finally {
      setUploading(false);
      // Réinitialiser l'input pour permettre de re-sélectionner le même fichier
      if (type === 'desktop' && desktopInputRef.current) {
        desktopInputRef.current.value = '';
      }
      if (type === 'mobile' && mobileInputRef.current) {
        mobileInputRef.current.value = '';
      }
    }
  };

  const handleDesktopBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleBackgroundUpload(file, 'desktop');
    }
  };

  const handleMobileBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleBackgroundUpload(file, 'mobile');
    }
  };

  const clearBackground = (type: 'desktop' | 'mobile') => {
    const fieldName = type === 'desktop' ? 'background_desktop_url' : 'background_mobile_url';
    setLocalConfig(prev => ({
      ...prev,
      [fieldName]: null
    }));
    addToast(`Image de fond ${type === 'desktop' ? 'desktop' : 'mobile'} supprimée. N'oubliez pas de sauvegarder.`, 'info');
  };

  const handleLogoUpload = async (file: File) => {
    if (!currentEvent) {
      addToast('Aucun événement sélectionné', 'error');
      return;
    }

    setUploadingLogo(true);

    try {
      const { publicUrl } = await uploadLogoImage(currentEvent.id, file);
      setLocalConfig(prev => ({
        ...prev,
        logo_url: publicUrl
      }));
      addToast('Logo uploadé. N\'oubliez pas de sauvegarder.', 'success');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('row-level security') || errorMsg.includes('policy')) {
        addToast('❌ Policies Supabase manquantes. Vérifiez la configuration du bucket party-backgrounds', 'error');
      } else {
        addToast(`Erreur: ${errorMsg}`, 'error');
      }
    } finally {
      setUploadingLogo(false);
      // Réinitialiser l'input pour permettre de re-sélectionner le même fichier
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleLogoUpload(file);
    }
  };

  const clearLogo = () => {
    setLocalConfig(prev => ({
      ...prev,
      logo_url: null
    }));
    addToast('Logo supprimé. N\'oubliez pas de sauvegarder.', 'info');
  };

  const filteredFrames = selectedCategory === 'all' 
    ? localFrames 
    : localFrames.filter(f => f.category === selectedCategory);

  const handleDisableAllFeatures = () => {
    setLocalConfig(prev => ({
      ...prev,
      caption_generation_enabled: false,
      tags_generation_enabled: false,
      video_capture_enabled: false,
      collage_mode_enabled: false,
      stats_enabled: false,
      find_me_enabled: false,
      ar_scene_enabled: false,
      battle_mode_enabled: false,
      auto_carousel_enabled: false,
      // content_moderation_enabled reste toujours à true
    }));
    addToast("Toutes les fonctionnalités ont été désactivées. N'oubliez pas de sauvegarder.", 'info');
  };

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      const configToSave = {
        ...localConfig,
        content_moderation_enabled: true
      };
      await updateSettings(configToSave);
      setLocalConfig(prev => ({ ...prev, content_moderation_enabled: true }));
      addToast("Configuration sauvegardée en base de données !", 'success');
    } catch (error) {
      addToast("Erreur lors de la sauvegarde", 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-slate-800">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                <Settings className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-100 mb-1">
                  Paramètres du Mur
                </h2>
                <p className="text-sm text-slate-400">
                  Personnalisez l'apparence et le comportement de votre Party Wall
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-teal-500/10 border border-teal-500/20 rounded-lg text-teal-400 text-xs font-medium">
              <span className="w-2 h-2 bg-teal-400 rounded-full"></span>
              <span>Synchronisation Cloud</span>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Section Apparence - Colonne principale */}
          <div className="lg:col-span-7 space-y-6">
            {/* Section Apparence */}
            <section className="bg-slate-950/50 border border-slate-800 rounded-xl p-6">
              <header className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                  <ImageIcon className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">Apparence</h3>
                  <p className="text-sm text-slate-400">Personnalisez l'identité visuelle de votre événement</p>
                </div>
              </header>

              <div className="space-y-5">
                {/* Titre */}
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                  <label className="block text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
                    <Type className="w-4 h-4 text-indigo-400" />
                    Titre de l'événement
                  </label>
                  <input
                    type="text"
                    name="event_title"
                    value={localConfig.event_title}
                    onChange={handleConfigChange}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                    placeholder="Party Wall"
                  />
                  <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                    <Info className="w-3 h-3 text-slate-500" />
                    Affiché sur l'accueil et dans les exports
                  </p>
                </div>

                {/* Sous-titre */}
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                  <label className="block text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-indigo-400" />
                    Sous-titre / Badge
                  </label>
                  <input
                    type="text"
                    name="event_subtitle"
                    value={localConfig.event_subtitle}
                    onChange={handleConfigChange}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                    placeholder="Live"
                  />
                  <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                    <Info className="w-3 h-3 text-slate-500" />
                    Badge secondaire affiché sous le titre
                  </p>
                </div>

                {/* Contexte */}
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                  <label className="block text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Contexte de la soirée
                  </label>
                  <div className="flex flex-col gap-3">
                    <textarea
                      name="event_context"
                      value={localConfig.event_context || ''}
                      onChange={handleConfigChange}
                      rows={3}
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all resize-none"
                      placeholder="Ex: Anniversaire 30 ans de Marie, Mariage de Sophie et Thomas, Soirée entreprise..."
                    />
                    <div className="flex flex-wrap gap-2 items-center">
                      <button
                        type="button"
                        onClick={handleGenerateContextSuggestion}
                        disabled={isGeneratingContextSuggestion || allPhotos.length === 0}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:cursor-not-allowed rounded-lg transition-colors text-xs text-white font-medium"
                      >
                        {isGeneratingContextSuggestion ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Analyse en cours...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" />
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
                            className="inline-flex items-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors text-xs text-white font-medium"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Accepter</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setContextSuggestion(null)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors text-xs text-slate-300"
                          >
                            <X className="w-3 h-3" />
                            <span>Ignorer</span>
                          </button>
                        </>
                      )}
                    </div>
                    {contextSuggestion && (
                      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-indigo-300 mb-1">Suggestion IA :</p>
                            <p className="text-sm text-slate-100">{contextSuggestion}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                    <Info className="w-3 h-3 text-slate-500" />
                    Sert à générer des légendes personnalisées et festives adaptées à votre événement.
                  </p>
                </div>

                {/* Cadre décoratif PNG */}
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                  <label className="block text-sm font-medium text-slate-200 mb-4 flex items-center gap-2">
                    <Frame className="w-4 h-4 text-indigo-400" />
                    Cadre décoratif PNG
                  </label>
                  <div className="flex gap-2 flex-wrap mb-3">
                    <label className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 px-3 py-2 rounded-lg cursor-pointer transition hover:border-indigo-500/50">
                      <input
                        type="checkbox"
                        name="decorative_frame_enabled"
                        checked={!!localConfig.decorative_frame_enabled}
                        onChange={handleConfigChange}
                        className="h-4 w-4 accent-indigo-500"
                      />
                      <span className="text-sm text-slate-200">
                        {localConfig.decorative_frame_enabled ? (
                          <span className="inline-flex items-center gap-1">
                            Actif
                            <span className="ml-2 px-1.5 py-0.5 bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs rounded-full">
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
                      className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-xs font-medium transition-colors"
                    >
                      <Frame className="w-4 h-4" />
                      <span>Galerie</span>
                    </button>
                    <label className="inline-flex items-center gap-2 px-3 py-2 border border-slate-700 bg-slate-800/50 rounded-lg cursor-pointer hover:border-indigo-500/50 transition text-xs">
                      <input
                        type="file"
                        accept="image/png"
                        onChange={handleFrameFileChange}
                        className="hidden"
                        disabled={uploadingFrame}
                      />
                      <Upload className="w-4 h-4 text-indigo-400" />
                      <span className="text-indigo-300">{uploadingFrame ? 'Upload...' : 'Uploader PNG'}</span>
                    </label>
                    {localConfig.decorative_frame_url && (
                      <button
                        type="button"
                        onClick={clearFrame}
                        className="px-3 py-2 bg-slate-800 border border-red-500/30 rounded-lg hover:border-red-500/50 hover:text-red-400 text-xs text-slate-200 transition-colors"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>

                  {localConfig.decorative_frame_url ? (
                    <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4">
                      <div className="text-xs text-slate-400 mb-2 font-medium flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Aperçu
                      </div>
                      <div className="w-full aspect-video bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
                        <img
                          src={localConfig.decorative_frame_url}
                          alt="Cadre décoratif"
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </div>
                      <div className="text-xs text-slate-500 mt-2 font-mono bg-slate-900/70 p-2 rounded border border-slate-800 overflow-x-auto break-all">
                        {localConfig.decorative_frame_url}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 bg-slate-950/50 rounded-lg p-3 border border-slate-800 flex items-start gap-2">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-500" />
                      <span className="break-words">Aucun cadre sélectionné. Choisissez-en un dans la galerie ou uploadez un PNG.</span>
                    </div>
                  )}
                </div>

                {/* Images de fond */}
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                  <label className="block text-sm font-medium text-slate-200 mb-4 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-400" />
                    Images de fond
                  </label>
                  <div className="space-y-4">
                    {/* Desktop Background */}
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-slate-300 mb-2 flex items-center gap-2">
                        <Monitor className="w-3 h-3 text-indigo-400" />
                        Fond Desktop
                      </label>
                      {localConfig.background_desktop_url ? (
                        <div className="relative">
                          <div className="bg-slate-950/50 border border-slate-800 rounded-lg overflow-hidden">
                            <img
                              src={localConfig.background_desktop_url}
                              alt="Fond desktop"
                              className="w-full h-32 object-cover"
                            />
                          </div>
                          <div className="flex gap-2 mt-2">
                            <label className="inline-flex items-center gap-2 px-3 py-2 border border-slate-700 bg-slate-800/50 rounded-lg cursor-pointer hover:border-indigo-500/50 transition text-xs">
                              <input
                                ref={desktopInputRef}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={handleDesktopBackgroundChange}
                                className="hidden"
                                disabled={uploadingDesktop}
                              />
                              <Upload className="w-4 h-4 text-indigo-400" />
                              <span className="text-indigo-300">{uploadingDesktop ? 'Remplacement...' : 'Remplacer'}</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => clearBackground('desktop')}
                              className="px-3 py-2 bg-slate-800 border border-red-500/30 rounded-lg hover:border-red-500/50 hover:text-red-400 text-xs text-slate-200 transition-colors"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex items-center gap-2 px-3 py-2 border border-slate-700 bg-slate-800/50 rounded-lg cursor-pointer hover:border-indigo-500/50 transition text-xs">
                          <input
                            ref={desktopInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleDesktopBackgroundChange}
                            className="hidden"
                            disabled={uploadingDesktop}
                          />
                          <Upload className="w-4 h-4 text-indigo-400" />
                          <span className="text-indigo-300">{uploadingDesktop ? 'Upload...' : 'Uploader une image'}</span>
                        </label>
                      )}
                    </div>

                    {/* Mobile Background */}
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-slate-300 mb-2 flex items-center gap-2">
                        <Smartphone className="w-3 h-3 text-indigo-400" />
                        Fond Mobile
                      </label>
                      {localConfig.background_mobile_url ? (
                        <div className="relative">
                          <div className="bg-slate-950/50 border border-slate-800 rounded-lg overflow-hidden">
                            <img
                              src={localConfig.background_mobile_url}
                              alt="Fond mobile"
                              className="w-full h-32 object-cover"
                            />
                          </div>
                          <div className="flex gap-2 mt-2">
                            <label className="inline-flex items-center gap-2 px-3 py-2 border border-slate-700 bg-slate-800/50 rounded-lg cursor-pointer hover:border-indigo-500/50 transition text-xs">
                              <input
                                ref={mobileInputRef}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={handleMobileBackgroundChange}
                                className="hidden"
                                disabled={uploadingMobile}
                              />
                              <Upload className="w-4 h-4 text-indigo-400" />
                              <span className="text-indigo-300">{uploadingMobile ? 'Remplacement...' : 'Remplacer'}</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => clearBackground('mobile')}
                              className="px-3 py-2 bg-slate-800 border border-red-500/30 rounded-lg hover:border-red-500/50 hover:text-red-400 text-xs text-slate-200 transition-colors"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex items-center gap-2 px-3 py-2 border border-slate-700 bg-slate-800/50 rounded-lg cursor-pointer hover:border-indigo-500/50 transition text-xs">
                          <input
                            ref={mobileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleMobileBackgroundChange}
                            className="hidden"
                            disabled={uploadingMobile}
                          />
                          <Upload className="w-4 h-4 text-indigo-400" />
                          <span className="text-indigo-300">{uploadingMobile ? 'Upload...' : 'Uploader une image'}</span>
                        </label>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
                    <Info className="w-3 h-3 text-slate-500" />
                    Images de fond personnalisées pour la page d'accueil (desktop et mobile)
                  </p>
                </div>

                {/* Logo */}
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                  <label className="block text-sm font-medium text-slate-200 mb-4 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-400" />
                    Logo de l'événement
                  </label>
                  {localConfig.logo_url ? (
                    <div className="relative">
                      <div className="bg-slate-950/50 border border-slate-800 rounded-lg overflow-hidden flex items-center justify-center p-4">
                        <img
                          src={localConfig.logo_url}
                          alt="Logo de l'événement"
                          className="max-w-full max-h-32 object-contain"
                        />
                      </div>
                      <div className="flex gap-2 mt-2">
                        <label className="inline-flex items-center gap-2 px-3 py-2 border border-slate-700 bg-slate-800/50 rounded-lg cursor-pointer hover:border-indigo-500/50 transition text-xs">
                          <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                            onChange={handleLogoChange}
                            className="hidden"
                            disabled={uploadingLogo}
                          />
                          <Upload className="w-4 h-4 text-indigo-400" />
                          <span className="text-indigo-300">{uploadingLogo ? 'Remplacement...' : 'Remplacer'}</span>
                        </label>
                        <button
                          type="button"
                          onClick={clearLogo}
                          className="px-3 py-2 bg-slate-800 border border-red-500/30 rounded-lg hover:border-red-500/50 hover:text-red-400 text-xs text-slate-200 transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 px-3 py-2 border border-slate-700 bg-slate-800/50 rounded-lg cursor-pointer hover:border-indigo-500/50 transition text-xs">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                        onChange={handleLogoChange}
                        className="hidden"
                        disabled={uploadingLogo}
                      />
                      <Upload className="w-4 h-4 text-indigo-400" />
                      <span className="text-indigo-300">{uploadingLogo ? 'Upload...' : 'Uploader un logo'}</span>
                    </label>
                  )}
                  <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
                    <Info className="w-3 h-3 text-slate-500" />
                    Logo de l'événement (JPEG, PNG, WebP ou SVG - max 5MB)
                  </p>
                </div>
              </div>
            </section>

            {/* Section Comportement */}
            <section className="bg-slate-950/50 border border-slate-800 rounded-xl p-6">
              <header className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-teal-500/10 rounded-lg border border-teal-500/20">
                  <Gauge className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">Comportement</h3>
                  <p className="text-sm text-slate-400">Paramétrez les animations et transitions</p>
                </div>
              </header>
              <div className="space-y-5">
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                  <label className="block text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
                    <Move className="w-4 h-4 text-teal-400" />
                    Vitesse de défilement (Grille)
                  </label>
                  <select
                    name="scroll_speed"
                    value={localConfig.scroll_speed}
                    onChange={handleConfigChange}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all"
                  >
                    <option value="slow">🐢 Lente</option>
                    <option value="normal">⚡ Normale</option>
                    <option value="fast">🚀 Rapide</option>
                  </select>
                  <p className="text-xs text-slate-400 mt-1.5">Vitesse d'animation dans la vue grille</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                  <label className="block text-sm font-medium text-slate-200 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    Transition Diaporama
                  </label>
                  <select
                    name="slide_transition"
                    value={localConfig.slide_transition}
                    onChange={handleConfigChange}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all"
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
          <aside className="lg:col-span-5 space-y-6">
            <section className="bg-slate-950/50 border border-slate-800 rounded-xl p-6 sticky top-4">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-100">
                    Modules supplémentaires
                  </h3>
                  <p className="text-sm text-slate-400">
                    Modération, légendes & améliorations automatiques 
                  </p>
                </div>
              </header>
              <div className="mb-4 pb-4 border-b border-slate-800">
                <button
                  type="button"
                  onClick={handleDisableAllFeatures}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-red-500/50 rounded-lg transition-colors text-sm font-medium text-slate-200 hover:text-red-400"
                >
                  <Power className="w-4 h-4" />
                  <span>Désactiver toutes les fonctionnalités</span>
                </button>
              </div>
              <div className="space-y-3">
                {/* Génération de légende */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-indigo-500/30 transition-colors">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="caption_generation_enabled"
                      checked={localConfig.caption_generation_enabled ?? true}
                      onChange={handleConfigChange}
                      className="h-4 w-4 accent-indigo-500 mt-1 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-100 flex items-center gap-2 mb-0.5">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        Génération de légende
                        {localConfig.caption_generation_enabled ? (
                          <span className="px-2 py-0.5 ml-2 bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs rounded-full">Actif</span>
                        ) : (
                          <span className="px-2 py-0.5 ml-2 bg-slate-700 text-slate-400 text-xs rounded-full">Inactif</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Génère automatiquement une légende contextuelle pour chaque photo avec IA Gemini.</p>
                    </div>
                  </label>
                </div>
                {/* Génération de tags */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-indigo-500/30 transition-colors">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="tags_generation_enabled"
                      checked={localConfig.tags_generation_enabled ?? true}
                      onChange={handleConfigChange}
                      className="h-4 w-4 accent-indigo-500 mt-1 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-100 flex items-center gap-2 mb-0.5">
                        <Tag className="w-4 h-4 text-indigo-400" />
                        Génération de tags IA
                        {localConfig.tags_generation_enabled ? (
                          <span className="px-2 py-0.5 ml-2 bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs rounded-full">Actif</span>
                        ) : (
                          <span className="px-2 py-0.5 ml-2 bg-slate-700 text-slate-400 text-xs rounded-full">Inactif</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Génère automatiquement des tags descriptifs pour chaque photo avec IA Gemini.</p>
                    </div>
                  </label>
                </div>
                {/* Modération */}
                <div className="bg-slate-900/50 border border-teal-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      name="content_moderation_enabled"
                      checked={true}
                      disabled={true}
                      className="h-4 w-4 accent-indigo-500 mt-1 cursor-not-allowed opacity-60"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-100 flex items-center gap-2 mb-0.5">
                        <Shield className="w-4 h-4 text-teal-400" />
                        Modération du contenu
                        <span className="px-2 py-0.5 ml-2 bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs rounded-full">Toujours actif</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Garantit la sécurité en bloquant tout contenu inapproprié avant publication.</p>
                    </div>
                  </div>
                </div>
                {/* Video capture */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-indigo-500/30 transition-colors">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="video_capture_enabled"
                      checked={localConfig.video_capture_enabled ?? true}
                      onChange={handleConfigChange}
                      className="h-4 w-4 accent-indigo-500 mt-1 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-100 flex items-center gap-2 mb-0.5">
                        <Video className="w-4 h-4 text-indigo-400" />
                        Capture vidéo
                        {localConfig.video_capture_enabled ? (
                          <span className="px-2 py-0.5 ml-2 bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs rounded-full">Actif</span>
                        ) : (
                          <span className="px-2 py-0.5 ml-2 bg-slate-700 text-slate-400 text-xs rounded-full">Inactif</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Permet l'enregistrement de courtes vidéos jusqu'à 30 secondes.</p>
                    </div>
                  </label>
                </div>
                {/* Collage mode */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-indigo-500/30 transition-colors">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="collage_mode_enabled"
                      checked={localConfig.collage_mode_enabled ?? true}
                      onChange={handleConfigChange}
                      className="h-4 w-4 accent-indigo-500 mt-1 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-100 flex items-center gap-2 mb-0.5">
                        <Grid3x3 className="w-4 h-4 text-indigo-400" />
                        Mode Collage
                        {localConfig.collage_mode_enabled ? (
                          <span className="px-2 py-0.5 ml-2 bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs rounded-full">Actif</span>
                        ) : (
                          <span className="px-2 py-0.5 ml-2 bg-slate-700 text-slate-400 text-xs rounded-full">Inactif</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Permet de créer des collages avec 2 à 4 photos en un clic.</p>
                    </div>
                  </label>
                </div>
                {/* Stats */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-indigo-500/30 transition-colors">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="stats_enabled"
                      checked={localConfig.stats_enabled ?? true}
                      onChange={handleConfigChange}
                      className="h-4 w-4 accent-indigo-500 mt-1 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-100 flex items-center gap-2 mb-0.5">
                        <BarChart2 className="w-4 h-4 text-indigo-400" />
                        Statistiques
                        {localConfig.stats_enabled ? (
                          <span className="px-2 py-0.5 ml-2 bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs rounded-full">Actif</span>
                        ) : (
                          <span className="px-2 py-0.5 ml-2 bg-slate-700 text-slate-400 text-xs rounded-full">Inactif</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Rend visible la page de stats, classement et podium sur la Home.</p>
                    </div>
                  </label>
                </div>
                {/* Retrouve-moi */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-indigo-500/30 transition-colors">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="find_me_enabled"
                      checked={localConfig.find_me_enabled ?? true}
                      onChange={handleConfigChange}
                      className="h-4 w-4 accent-indigo-500 mt-1 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-100 flex items-center gap-2 mb-0.5">
                        <User className="w-4 h-4 text-indigo-400" />
                        Retrouve-moi (Reconnaissance Faciale)
                        {localConfig.find_me_enabled ? (
                          <span className="px-2 py-0.5 ml-2 bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs rounded-full">Actif</span>
                        ) : (
                          <span className="px-2 py-0.5 ml-2 bg-slate-700 text-slate-400 text-xs rounded-full">Inactif</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Aide à retrouver ses photos via un selfie (face-api.js).</p>
                    </div>
                  </label>
                </div>
                {/* Scène AR */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-indigo-500/30 transition-colors">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="ar_scene_enabled"
                      checked={localConfig.ar_scene_enabled ?? true}
                      onChange={handleConfigChange}
                      className="h-4 w-4 accent-indigo-500 mt-1 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-100 flex items-center gap-2 mb-0.5">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        Effets Scène Augmentée (AR)
                        {localConfig.ar_scene_enabled ? (
                          <span className="px-2 py-0.5 ml-2 bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs rounded-full">Actif</span>
                        ) : (
                          <span className="px-2 py-0.5 ml-2 bg-slate-700 text-slate-400 text-xs rounded-full">Inactif</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Effets visuels déclenchés par likes ou à l'heure pile.</p>
                    </div>
                  </label>
                </div>
                {/* Battle mode */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-indigo-500/30 transition-colors">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="battle_mode_enabled"
                      checked={localConfig.battle_mode_enabled ?? true}
                      onChange={handleConfigChange}
                      className="h-4 w-4 accent-indigo-500 mt-1 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-100 flex items-center gap-2 mb-0.5">
                        <Trophy className="w-4 h-4 text-indigo-400" />
                        Mode Battle
                        {localConfig.battle_mode_enabled ? (
                          <span className="px-2 py-0.5 ml-2 bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs rounded-full">Actif</span>
                        ) : (
                          <span className="px-2 py-0.5 ml-2 bg-slate-700 text-slate-400 text-xs rounded-full">Inactif</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Crée des battles entre deux photos ; les invités votent en live.</p>
                    </div>
                  </label>
                </div>
                {/* Aftermovies */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-indigo-500/30 transition-colors">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="aftermovies_enabled"
                      checked={localConfig.aftermovies_enabled ?? true}
                      onChange={handleConfigChange}
                      className="h-4 w-4 accent-indigo-500 mt-1 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-100 flex items-center gap-2 mb-0.5">
                        <Video className="w-4 h-4 text-indigo-400" />
                        Aftermovies dans la galerie
                        {localConfig.aftermovies_enabled ? (
                          <span className="px-2 py-0.5 ml-2 bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs rounded-full">Actif</span>
                        ) : (
                          <span className="px-2 py-0.5 ml-2 bg-slate-700 text-slate-400 text-xs rounded-full">Inactif</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Affiche les aftermovies générés dans la galerie pour que les clients puissent les télécharger.</p>
                    </div>
                  </label>
                </div>
                {/* Carrousel automatique */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 hover:border-indigo-500/30 transition-colors">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="auto_carousel_enabled"
                      checked={localConfig.auto_carousel_enabled ?? true}
                      onChange={handleConfigChange}
                      className="h-4 w-4 accent-indigo-500 mt-1 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-100 flex items-center gap-2 mb-0.5">
                        <Play className="w-4 h-4 text-indigo-400" />
                        Carrousel automatique
                        {localConfig.auto_carousel_enabled ? (
                          <span className="px-2 py-0.5 ml-2 bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs rounded-full">Actif</span>
                        ) : (
                          <span className="px-2 py-0.5 ml-2 bg-slate-700 text-slate-400 text-xs rounded-full">Inactif</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Affiche automatiquement les photos en carrousel après une période d'inactivité.</p>
                    </div>
                  </label>
                  {/* Configuration du délai - visible uniquement si activé */}
                  {localConfig.auto_carousel_enabled && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <label className="block text-xs font-medium text-slate-300 mb-2">
                        Délai d'activation: {localConfig.auto_carousel_delay ?? 20} secondes
                      </label>
                      <input
                        type="range"
                        name="auto_carousel_delay"
                        min="5"
                        max="240"
                        step="5"
                        value={localConfig.auto_carousel_delay ?? 20}
                        onChange={handleConfigChange}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>5s</span>
                        <span>120s</span>
                        <span>240s</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </aside>
        </div>
        
        {/* Footer avec bouton de sauvegarde */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-400 flex items-center gap-2 bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-800">
              <Info className="w-4 h-4 text-slate-500" />
              <span>Les modifications sont sauvegardées en temps réel dans Supabase</span>
            </div>
            <button 
              onClick={saveConfig}
              disabled={savingConfig}
              className={`flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors ${savingConfig ? 'opacity-50' : ''}`}
            >
              {savingConfig ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sauvegarde...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Sauvegarder les paramètres</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Galerie de Cadres Locaux */}
      {showFrameGallery && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div>
                <h3 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                  <Frame className="w-5 h-5 text-indigo-400" />
                  Choisir un Cadre Décoratif
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {localFrames.length} cadre{localFrames.length > 1 ? 's' : ''} disponible{localFrames.length > 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setShowFrameGallery(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filtres par catégorie */}
            <div className="p-3 border-b border-slate-800 bg-slate-900/30">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
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
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        selectedCategory === key
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {emoji} {label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grille de cadres */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredFrames.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                  <Frame className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-base font-medium">Aucun cadre disponible</p>
                  <p className="text-xs mt-2 text-slate-600 text-center">
                    Ajoutez des fichiers PNG dans <code className="bg-slate-800 px-2 py-0.5 rounded text-slate-400">public/cadres/</code>
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredFrames.map(frame => (
                    <button
                      key={frame.id}
                      onClick={() => selectLocalFrame(frame)}
                      className="group relative bg-slate-800/50 border border-slate-800 rounded-lg overflow-hidden hover:border-indigo-500/50 transition-all hover:scale-105"
                    >
                      <div className="aspect-video bg-slate-950 flex items-center justify-center relative overflow-hidden">
                        <img
                          src={getLocalFrameThumbnailUrl(frame)}
                          alt={frame.name}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/10 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-medium">
                            Sélectionner
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium text-slate-100 truncate">{frame.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {frameCategories[frame.category]?.emoji} {frameCategories[frame.category]?.label || frame.category}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/30 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                💡 Astuce: Placez vos PNG dans <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">public/cadres/</code>
              </p>
              <button
                onClick={() => setShowFrameGallery(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

