import React, { useState, useRef } from 'react';
import { Bell, LogOut, Grid3x3, Video, Shield, BarChart2, User, Sparkles, Trophy, Type, Frame, X, Tag, Upload, Image as ImageIcon, Monitor, Smartphone, Play, Languages, Images } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { useEvent } from '../../context/EventContext';
import { useLicenseFeatures } from '../../hooks/useLicenseFeatures';
import { logger } from '../../utils/logger';
import { uploadBackgroundImage, uploadLogoImage } from '../../services/backgroundService';

interface SettingsTabProps {
  onBack: () => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ onBack }) => {
  const { signOut } = useAuth();
  const { settings, updateSettings } = useSettings();
  const { addToast } = useToast();
  const { currentEvent } = useEvent();
  const { isFeatureEnabled } = useLicenseFeatures();
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const allFeatureConfigs = [
    { key: 'gallery_enabled', label: 'Galerie interactive', icon: Images, disabled: false, isPremium: false },
    { key: 'collage_mode_enabled', label: 'Mode Collage', icon: Grid3x3, disabled: false, isPremium: false },
    { key: 'video_capture_enabled', label: 'Capture Vidéo', icon: Video, disabled: false, isPremium: true },
    { key: 'content_moderation_enabled', label: 'Modération IA', icon: Shield, disabled: true, isPremium: false },
    { key: 'stats_enabled', label: 'Statistiques', icon: BarChart2, disabled: false, isPremium: false },
    { key: 'find_me_enabled', label: 'Retrouve-moi', icon: User, disabled: false, isPremium: true },
    { key: 'ar_scene_enabled', label: 'Scène AR', icon: Sparkles, disabled: false, isPremium: false },
    { key: 'battle_mode_enabled', label: 'Mode Battle', icon: Trophy, disabled: false, isPremium: false },
    { key: 'aftermovies_enabled', label: 'Aftermovies dans la galerie', icon: Video, disabled: false, isPremium: true },
    { key: 'caption_generation_enabled', label: 'Génération de légendes', icon: Type, disabled: false, isPremium: true },
    { key: 'tags_generation_enabled', label: 'Génération de tags IA', icon: Tag, disabled: false, isPremium: true },
    { key: 'decorative_frame_enabled', label: 'Cadres décoratifs', icon: Frame, disabled: false, isPremium: false },
    { key: 'auto_carousel_enabled', label: 'Carrousel automatique', icon: Play, disabled: false, isPremium: false },
  ];

  // Filtrer les fonctionnalités premium si la licence est PART
  const featureConfigs = allFeatureConfigs.filter(config => {
    if (config.isPremium) {
      return isFeatureEnabled(config.key);
    }
    return true;
  });

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
      await updateSettings({ [fieldName]: publicUrl });
      addToast(`Image de fond ${type === 'desktop' ? 'desktop' : 'mobile'} uploadée avec succès`, 'success');
      logger.info('Background image uploaded', { component: 'SettingsTab', action: 'uploadBackground', type, eventId: currentEvent.id });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Error uploading background image', error, { component: 'SettingsTab', action: 'uploadBackground', type });
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

  const clearBackground = async (type: 'desktop' | 'mobile') => {
    const fieldName = type === 'desktop' ? 'background_desktop_url' : 'background_mobile_url';
    await updateSettings({ [fieldName]: null });
    addToast(`Image de fond ${type === 'desktop' ? 'desktop' : 'mobile'} supprimée`, 'success');
    logger.info('Background image cleared', { component: 'SettingsTab', action: 'clearBackground', type });
  };

  const handleLogoUpload = async (file: File) => {
    if (!currentEvent) {
      addToast('Aucun événement sélectionné', 'error');
      return;
    }

    setUploadingLogo(true);

    try {
      const { publicUrl } = await uploadLogoImage(currentEvent.id, file);
      await updateSettings({ logo_url: publicUrl });
      addToast('Logo uploadé avec succès', 'success');
      logger.info('Logo uploaded', { component: 'SettingsTab', action: 'uploadLogo', eventId: currentEvent.id });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Error uploading logo', error, { component: 'SettingsTab', action: 'uploadLogo' });
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

  const clearLogo = async () => {
    await updateSettings({ logo_url: null });
    addToast('Logo supprimé', 'success');
    logger.info('Logo cleared', { component: 'SettingsTab', action: 'clearLogo' });
  };

  return (
    <div className="space-y-3 md:space-y-4 pb-4">
      {/* Configuration de l'événement */}
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 md:p-4 border border-white/10 shadow-lg">
        <div className="flex items-center gap-2 mb-3 md:mb-4">
          <div className="w-1 h-5 md:h-6 bg-gradient-to-b from-pink-400 to-purple-400 rounded-full" />
          <h2 className="text-base md:text-lg font-semibold text-white">Configuration de l'événement</h2>
        </div>
        <div className="space-y-3 md:space-y-3.5">
          {/* Titre */}
          <div className="group">
            <label className="block text-xs md:text-sm font-medium mb-1.5 text-white/80">
              Titre de l'événement
            </label>
            <div className="relative">
              <input
                type="text"
                value={settings.event_title || ''}
                onChange={(e) => updateSettings({ event_title: e.target.value })}
                className="w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-pink-500/50 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:bg-white/10 transition-all duration-300 text-sm md:text-base"
                placeholder="Ex: Mariage de Sophie & Marc"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
            <p className="text-[10px] md:text-xs text-white/50 mt-1.5">
              Affiché sur la page d'accueil et le mur
            </p>
          </div>

          {/* Sous-titre */}
          <div className="group">
            <label className="block text-xs md:text-sm font-medium mb-1.5 text-white/80">
              Sous-titre
            </label>
            <div className="relative">
              <input
                type="text"
                value={settings.event_subtitle || ''}
                onChange={async (e) => {
                  await updateSettings({ event_subtitle: e.target.value });
                }}
                className="w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-pink-500/50 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:bg-white/10 transition-all duration-300 text-sm md:text-base"
                placeholder="Ex: 15 Juin 2026"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
            <p className="text-[10px] md:text-xs text-white/50 mt-1.5">
              Complément d'information sous le titre
            </p>
          </div>

          {/* Vitesse de défilement */}
          <div className="group">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs md:text-sm font-medium text-white/80">
                Vitesse de défilement
              </label>
              <span className="text-xs md:text-sm font-semibold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
                {settings.scroll_speed === 'slow' ? 'Lente' : settings.scroll_speed === 'fast' ? 'Rapide' : 'Normale'}
              </span>
            </div>
            <select
              value={settings.scroll_speed || 'normal'}
              onChange={async (e) => {
                await updateSettings({ scroll_speed: e.target.value as 'slow' | 'normal' | 'fast' });
              }}
              className="w-full px-3.5 py-2.5 md:px-4 md:py-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-pink-500/50 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:bg-white/10 transition-all duration-300 text-sm md:text-base cursor-pointer"
            >
              <option value="slow" className="bg-gray-900">Lente</option>
              <option value="normal" className="bg-gray-900">Normale</option>
              <option value="fast" className="bg-gray-900">Rapide</option>
            </select>
            <p className="text-[10px] md:text-xs text-white/50 mt-1.5">
              Contrôle la vitesse d'affichage des photos sur le mur
            </p>
          </div>
        </div>
      </div>

      {/* Images de fond */}
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 md:p-4 border border-white/10 shadow-lg">
        <div className="flex items-center gap-2 mb-3 md:mb-4">
          <div className="w-1 h-5 md:h-6 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full" />
          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <ImageIcon className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
          </div>
          <h2 className="text-base md:text-lg font-semibold text-white">Images de fond</h2>
        </div>
        <div className="space-y-3 md:space-y-4">
          {/* Desktop Background */}
          <div className="space-y-2">
            <label className="block text-xs md:text-sm font-medium mb-2 flex items-center gap-2 text-white/80">
              <div className="p-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Monitor className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400" />
              </div>
              Fond Desktop
            </label>
            {settings.background_desktop_url ? (
              <div className="relative group">
                <div className="overflow-hidden rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300">
                  <img
                    src={settings.background_desktop_url}
                    alt="Fond desktop"
                    className="w-full h-32 md:h-40 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <button
                  onClick={() => clearBackground('desktop')}
                  className="absolute top-2 right-2 p-1.5 md:p-2 bg-red-500/90 hover:bg-red-500 rounded-lg text-white transition-all duration-300 hover:scale-110 shadow-lg backdrop-blur-sm border border-red-400/30"
                  title="Supprimer"
                >
                  <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-white/10 hover:border-white/20 rounded-xl p-4 md:p-6 text-center bg-white/5 transition-all duration-300 group">
                <div className="flex flex-col items-center gap-2">
                  <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                    <ImageIcon className="w-6 h-6 md:w-8 md:h-8 text-white/40" />
                  </div>
                  <p className="text-xs md:text-sm text-white/60 mb-2">Aucune image de fond desktop</p>
                  <button
                    onClick={() => desktopInputRef.current?.click()}
                    disabled={uploadingDesktop}
                    className="flex items-center justify-center gap-2 px-3.5 py-2 md:px-4 md:py-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 active:from-blue-500/40 active:to-cyan-500/40 active:scale-95 transition-all duration-300 text-xs md:text-sm text-white touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed border border-blue-500/30 shadow-md hover:shadow-lg"
                  >
                    <Upload className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    {uploadingDesktop ? 'Upload...' : 'Uploader'}
                  </button>
                </div>
              </div>
            )}
            {!settings.background_desktop_url && (
              <input
                ref={desktopInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleDesktopBackgroundChange}
                className="hidden"
              />
            )}
            {settings.background_desktop_url && (
              <button
                onClick={() => desktopInputRef.current?.click()}
                disabled={uploadingDesktop}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2 md:px-4 md:py-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 active:from-blue-500/40 active:to-cyan-500/40 active:scale-95 transition-all duration-300 text-xs md:text-sm text-white touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed border border-blue-500/30 shadow-md hover:shadow-lg"
              >
                <Upload className="w-3.5 h-3.5 md:w-4 md:h-4" />
                {uploadingDesktop ? 'Remplacement...' : 'Remplacer'}
              </button>
            )}
            {settings.background_desktop_url && (
              <input
                ref={desktopInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleDesktopBackgroundChange}
                className="hidden"
              />
            )}
          </div>

          {/* Mobile Background */}
          <div className="space-y-2">
            <label className="block text-xs md:text-sm font-medium mb-2 flex items-center gap-2 text-white/80">
              <div className="p-1 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <Smartphone className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-400" />
              </div>
              Fond Mobile
            </label>
            {settings.background_mobile_url ? (
              <div className="relative group">
                <div className="overflow-hidden rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300">
                  <img
                    src={settings.background_mobile_url}
                    alt="Fond mobile"
                    className="w-full h-32 md:h-40 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <button
                  onClick={() => clearBackground('mobile')}
                  className="absolute top-2 right-2 p-1.5 md:p-2 bg-red-500/90 hover:bg-red-500 rounded-lg text-white transition-all duration-300 hover:scale-110 shadow-lg backdrop-blur-sm border border-red-400/30"
                  title="Supprimer"
                >
                  <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-white/10 hover:border-white/20 rounded-xl p-4 md:p-6 text-center bg-white/5 transition-all duration-300 group">
                <div className="flex flex-col items-center gap-2">
                  <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                    <ImageIcon className="w-6 h-6 md:w-8 md:h-8 text-white/40" />
                  </div>
                  <p className="text-xs md:text-sm text-white/60 mb-2">Aucune image de fond mobile</p>
                  <button
                    onClick={() => mobileInputRef.current?.click()}
                    disabled={uploadingMobile}
                    className="flex items-center justify-center gap-2 px-3.5 py-2 md:px-4 md:py-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 active:from-purple-500/40 active:to-pink-500/40 active:scale-95 transition-all duration-300 text-xs md:text-sm text-white touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed border border-purple-500/30 shadow-md hover:shadow-lg"
                  >
                    <Upload className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    {uploadingMobile ? 'Upload...' : 'Uploader'}
                  </button>
                </div>
              </div>
            )}
            {!settings.background_mobile_url && (
              <input
                ref={mobileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleMobileBackgroundChange}
                className="hidden"
              />
            )}
            {settings.background_mobile_url && (
              <button
                onClick={() => mobileInputRef.current?.click()}
                disabled={uploadingMobile}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2 md:px-4 md:py-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 active:from-purple-500/40 active:to-pink-500/40 active:scale-95 transition-all duration-300 text-xs md:text-sm text-white touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed border border-purple-500/30 shadow-md hover:shadow-lg"
              >
                <Upload className="w-3.5 h-3.5 md:w-4 md:h-4" />
                {uploadingMobile ? 'Remplacement...' : 'Remplacer'}
              </button>
            )}
            {settings.background_mobile_url && (
              <input
                ref={mobileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleMobileBackgroundChange}
                className="hidden"
              />
            )}
          </div>
        </div>
      </div>

      {/* Logo */}
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 md:p-4 border border-white/10 shadow-lg">
        <div className="flex items-center gap-2 mb-3 md:mb-4">
          <div className="w-1 h-5 md:h-6 bg-gradient-to-b from-indigo-400 to-purple-400 rounded-full" />
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <ImageIcon className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" />
          </div>
          <h2 className="text-base md:text-lg font-semibold text-white">Logo de l'événement</h2>
        </div>
        <div className="space-y-3 md:space-y-4">
          {settings.logo_url ? (
            <div className="relative group">
              <div className="bg-white/5 rounded-xl p-4 md:p-6 flex items-center justify-center border border-white/10 hover:border-white/20 transition-all duration-300">
                <img
                  src={settings.logo_url}
                  alt="Logo de l'événement"
                  className="max-w-full max-h-32 md:max-h-40 object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <button
                onClick={clearLogo}
                className="absolute top-2 right-2 p-1.5 md:p-2 bg-red-500/90 hover:bg-red-500 rounded-lg text-white transition-all duration-300 hover:scale-110 shadow-lg backdrop-blur-sm border border-red-400/30"
                title="Supprimer"
              >
                <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-white/10 hover:border-white/20 rounded-xl p-4 md:p-6 text-center bg-white/5 transition-all duration-300 group">
              <div className="flex flex-col items-center gap-2">
                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                  <ImageIcon className="w-6 h-6 md:w-8 md:h-8 text-white/40" />
                </div>
                <p className="text-xs md:text-sm text-white/60 mb-2">Aucun logo</p>
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="flex items-center justify-center gap-2 px-3.5 py-2 md:px-4 md:py-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 active:from-indigo-500/40 active:to-purple-500/40 active:scale-95 transition-all duration-300 text-xs md:text-sm text-white touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-500/30 shadow-md hover:shadow-lg"
                >
                  <Upload className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  {uploadingLogo ? 'Upload...' : 'Uploader un logo'}
                </button>
              </div>
            </div>
          )}
          {!settings.logo_url && (
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
              onChange={handleLogoChange}
              className="hidden"
            />
          )}
          {settings.logo_url && (
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2 md:px-4 md:py-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 active:from-indigo-500/40 active:to-purple-500/40 active:scale-95 transition-all duration-300 text-xs md:text-sm text-white touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-500/30 shadow-md hover:shadow-lg"
            >
              <Upload className="w-3.5 h-3.5 md:w-4 md:h-4" />
              {uploadingLogo ? 'Remplacement...' : 'Remplacer'}
            </button>
          )}
          {settings.logo_url && (
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
              onChange={handleLogoChange}
              className="hidden"
            />
          )}
          <p className="text-[10px] md:text-xs text-white/50 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10">
            Le logo remplacera le titre sur la page d'accueil (JPEG, PNG, WebP ou SVG - max 5MB)
          </p>
          
          {/* Option Filigrane */}
          {settings.logo_url && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" />
                  <span className="text-sm md:text-base font-medium text-white">Afficher le logo en filigrane sur les photos</span>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.logo_watermark_enabled ?? false}
                    onChange={(e) => updateSettings({ logo_watermark_enabled: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 md:w-12 md:h-7 rounded-full transition-colors duration-200 ${
                    settings.logo_watermark_enabled 
                      ? 'bg-indigo-500' 
                      : 'bg-white/20'
                  }`}>
                    <div className={`w-5 h-5 md:w-6 md:h-6 bg-white rounded-full shadow-md transform transition-transform duration-200 mt-0.5 ${
                      settings.logo_watermark_enabled 
                        ? 'translate-x-5 md:translate-x-6' 
                        : 'translate-x-0.5'
                    }`} />
                  </div>
                </div>
              </label>
              <p className="text-xs text-white/60 mt-2">
                Le logo apparaîtra en bas à gauche des photos dans la galerie et sur le mur
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Alerte texte */}
      <div className="bg-white/10 rounded-xl p-4 md:p-6 backdrop-blur-sm border-2 border-yellow-500/30 shadow-sm">
        <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 flex items-center gap-2 text-white">
          <div className="p-1.5 rounded-lg bg-yellow-500/20">
            <Bell className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
          </div>
          Alerte pour les invités
        </h2>
        <div className="space-y-3">
          {/* Messages rapides */}
          <div>
            <label className="block text-sm font-medium mb-2 text-white/80">
              Messages rapides
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
              {[
                { text: '⚠️ Pause de 15 minutes - Retour dans quelques instants !', emoji: '⏸️' },
                { text: '🎉 Cérémonie en cours - Merci de votre patience', emoji: '🎊' },
                { text: '🍽️ Pause repas - Retour dans 30 minutes', emoji: '🍴' },
                { text: '📸 Session photo Terminée - Restez connectés !', emoji: '📷' },
                { text: '🎤 Discours en cours - Merci de baisser le volume', emoji: '🔇' },
              ].map((quickMessage, index) => (
                <button
                  key={index}
                  onClick={async () => {
                    await updateSettings({ alert_text: quickMessage.text });
                    logger.info('Quick alert message set', { component: 'SettingsTab', action: 'setQuickAlert', message: quickMessage.text });
                    addToast('Message d\'alerte défini', 'success');
                  }}
                  className="flex items-center gap-2 p-2.5 md:p-3 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 active:bg-yellow-500/30 border border-yellow-500/20 hover:border-yellow-500/40 transition-all text-left touch-manipulation group"
                >
                  <span className="text-lg md:text-xl flex-shrink-0">{quickMessage.emoji}</span>
                  <span className="text-xs md:text-sm text-white/90 group-hover:text-white truncate flex-1">
                    {quickMessage.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Message d'alerte personnalisé (affiché en grand sur le mur)
            </label>
            <textarea
              value={settings.alert_text || ''}
              onChange={async (e) => {
                const value = e.target.value.trim() || null;
                await updateSettings({ alert_text: value });
                logger.info('Alert text updated', { component: 'SettingsTab', action: 'updateAlert', alert_text: value, has_alert: !!value });
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500/50 min-h-[100px] resize-y transition-all"
              placeholder="Ex: ⚠️ Pause de 15 minutes - Retour dans quelques instants !"
              maxLength={200}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-white/60">
                Ce message sera affiché en grand au-dessus des photos sur le mur
              </p>
              <p className="text-xs text-white/60">
                {(settings.alert_text || '').length}/200
              </p>
            </div>
          </div>
          {settings.alert_text && settings.alert_text.trim() && (
            <button
              onClick={async () => {
                await updateSettings({ alert_text: null });
                logger.info('Alert text deleted', { component: 'SettingsTab', action: 'deleteAlert' });
                addToast('Alerte supprimée', 'success');
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 active:scale-95 transition-all text-sm text-red-400 touch-manipulation border border-red-500/30 shadow-sm"
            >
              <X className="w-4 h-4" />
              Supprimer l'alerte
            </button>
          )}
        </div>
      </div>

      {/* Fonctionnalités */}
      <div className="bg-white/10 rounded-xl p-4 md:p-6 backdrop-blur-sm border border-white/10 shadow-sm">
        <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-white">Fonctionnalités</h2>
        <div className="space-y-3">
          {featureConfigs.map(({ key, label, icon: Icon, disabled }) => {
            const isModeration = key === 'content_moderation_enabled';
            const checked = isModeration ? true : (settings[key as keyof typeof settings] as boolean || false);
            
            return (
              <label
                key={key}
                className={`flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 transition-all touch-manipulation ${
                  disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-white/10 hover:border-white/20 active:bg-white/15 active:scale-[0.98] cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                  {isModeration && (
                    <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/30 text-green-400 text-xs rounded-full">Toujours actif</span>
                  )}
                  {!isModeration && checked && (
                    <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/30 text-green-400 text-xs rounded-full">Actif</span>
                  )}
                  {!isModeration && !checked && (
                    <span className="px-2 py-0.5 bg-white/10 border border-white/20 text-white/60 text-xs rounded-full">Inactif</span>
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={async (e) => {
                    if (!disabled) {
                      await updateSettings({ [key]: e.target.checked });
                    }
                  }}
                  className="w-5 h-5 rounded accent-pink-500"
                />
              </label>
            );
          })}
        </div>
      </div>

      {/* Configuration IA - Langue des légendes */}
      {settings.caption_generation_enabled && (
        <div className="bg-white/10 rounded-xl p-4 md:p-6 backdrop-blur-sm border border-purple-500/20">
          <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 flex items-center gap-2 text-white">
            <div className="p-1.5 rounded-lg bg-purple-500/20">
              <Languages className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
            </div>
            Langue des légendes IA
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white/80">
                Langue pour les légendes générées automatiquement
              </label>
              <select
                value={settings.caption_language || 'fr'}
                onChange={async (e) => {
                  await updateSettings({ caption_language: e.target.value });
                  logger.info('Caption language updated', { 
                    component: 'SettingsTab', 
                    action: 'updateCaptionLanguage', 
                    language: e.target.value 
                  });
                  addToast('Langue des légendes mise à jour', 'success');
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 transition-all"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
                <option value="it">Italiano</option>
                <option value="pt">Português</option>
                <option value="nl">Nederlands</option>
                <option value="pl">Polski</option>
                <option value="ru">Русский</option>
                <option value="ja">日本語</option>
                <option value="zh">中文</option>
                <option value="ko">한국어</option>
                <option value="ar">العربية</option>
              </select>
              <p className="text-xs text-white/60 mt-2">
                Les légendes générées par l'IA seront traduites dans cette langue. 
                Les nouvelles photos utiliseront cette langue, les anciennes restent inchangées.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Configuration du carrousel automatique */}
      {settings.auto_carousel_enabled && (
        <div className="bg-white/10 rounded-xl p-4 md:p-6 backdrop-blur-sm border border-pink-500/20">
          <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 flex items-center gap-2 text-white">
            <Play className="w-5 h-5 md:w-6 md:h-6" />
            Configuration du carrousel automatique
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Délai d'activation (secondes): {settings.auto_carousel_delay || 20}
              </label>
              <input
                type="range"
                min="5"
                max="240"
                step="5"
                value={settings.auto_carousel_delay || 20}
                onChange={async (e) => {
                  const value = parseInt(e.target.value, 10);
                  await updateSettings({ auto_carousel_delay: value });
                }}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
              <div className="flex justify-between text-xs text-white/60 mt-1">
                <span>5s</span>
                <span>120s</span>
                <span>240s</span>
              </div>
              <p className="text-xs text-white/60 mt-2">
                Le carrousel s'activera automatiquement après {settings.auto_carousel_delay || 20} secondes d'inactivité
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Déconnexion */}
      <button
        onClick={async () => {
          await signOut();
          onBack();
        }}
        className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 active:scale-95 transition-all touch-manipulation border border-red-500/30 shadow-sm"
      >
        <LogOut className="w-5 h-5" />
        <span>Déconnexion</span>
      </button>
    </div>
  );
};

export default SettingsTab;

