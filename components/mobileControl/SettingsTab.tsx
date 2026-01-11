import React, { useState, useRef } from 'react';
import { Bell, LogOut, Grid3x3, Video, Shield, BarChart2, User, Sparkles, Trophy, Type, Frame, X, Tag, Upload, Image as ImageIcon, Monitor, Smartphone, Play } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { useEvent } from '../../context/EventContext';
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
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const featureConfigs = [
    { key: 'collage_mode_enabled', label: 'Mode Collage', icon: Grid3x3, disabled: false },
    { key: 'video_capture_enabled', label: 'Capture Vidéo', icon: Video, disabled: false },
    { key: 'content_moderation_enabled', label: 'Modération IA', icon: Shield, disabled: true },
    { key: 'stats_enabled', label: 'Statistiques', icon: BarChart2, disabled: false },
    { key: 'find_me_enabled', label: 'Retrouve-moi', icon: User, disabled: false },
    { key: 'ar_scene_enabled', label: 'Scène AR', icon: Sparkles, disabled: false },
    { key: 'battle_mode_enabled', label: 'Mode Battle', icon: Trophy, disabled: false },
    { key: 'aftermovies_enabled', label: 'Aftermovies dans la galerie', icon: Video, disabled: false },
    { key: 'caption_generation_enabled', label: 'Génération de légendes', icon: Type, disabled: false },
    { key: 'tags_generation_enabled', label: 'Génération de tags IA', icon: Tag, disabled: false },
    { key: 'decorative_frame_enabled', label: 'Cadres décoratifs', icon: Frame, disabled: false },
    { key: 'auto_carousel_enabled', label: 'Carrousel automatique', icon: Play, disabled: false },
  ];

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
    <div className="space-y-4 md:space-y-6 pb-4">
      {/* Configuration de l'événement */}
      <div className="bg-white/10 rounded-xl p-4 md:p-6 backdrop-blur-sm border border-white/10 shadow-sm">
        <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-white">Configuration de l'événement</h2>
        <div className="space-y-4">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium mb-2">Titre</label>
            <input
              type="text"
              value={settings.event_title || ''}
              onChange={(e) => updateSettings({ event_title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500/50 transition-all"
              placeholder="Titre de l'événement"
            />
          </div>

          {/* Sous-titre */}
          <div>
            <label className="block text-sm font-medium mb-2">Sous-titre</label>
            <input
              type="text"
              value={settings.event_subtitle || ''}
              onChange={async (e) => {
                await updateSettings({ event_subtitle: e.target.value });
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500/50 transition-all"
              placeholder="Sous-titre"
            />
          </div>

          {/* Vitesse de défilement */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Vitesse de défilement: {settings.scroll_speed || 'normal'}
            </label>
            <select
              value={settings.scroll_speed || 'normal'}
              onChange={async (e) => {
                await updateSettings({ scroll_speed: e.target.value as 'slow' | 'normal' | 'fast' });
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500/50 transition-all"
            >
              <option value="slow">Lente</option>
              <option value="normal">Normale</option>
              <option value="fast">Rapide</option>
            </select>
          </div>
        </div>
      </div>

      {/* Images de fond */}
      <div className="bg-white/10 rounded-xl p-4 md:p-6 backdrop-blur-sm border border-white/10 shadow-sm">
        <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 flex items-center gap-2 text-white">
          <div className="p-1.5 rounded-lg bg-white/10">
            <ImageIcon className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          Images de fond
        </h2>
        <div className="space-y-4">
          {/* Desktop Background */}
          <div className="space-y-2">
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Fond Desktop
            </label>
            {settings.background_desktop_url ? (
              <div className="relative">
                <img
                  src={settings.background_desktop_url}
                  alt="Fond desktop"
                  className="w-full h-32 object-cover rounded-lg border border-white/20"
                />
                <button
                  onClick={() => clearBackground('desktop')}
                  className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg text-white transition-colors"
                  title="Supprimer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
                <p className="text-sm text-white/60 mb-3">Aucune image de fond desktop</p>
                <button
                  onClick={() => desktopInputRef.current?.click()}
                  disabled={uploadingDesktop}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 active:scale-95 transition-all text-sm text-white touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  {uploadingDesktop ? 'Upload en cours...' : 'Uploader une image'}
                </button>
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
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 active:scale-95 transition-all text-sm text-white touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 shadow-sm"
              >
                <Upload className="w-4 h-4" />
                {uploadingDesktop ? 'Remplacement en cours...' : 'Remplacer'}
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
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Fond Mobile
            </label>
            {settings.background_mobile_url ? (
              <div className="relative">
                <img
                  src={settings.background_mobile_url}
                  alt="Fond mobile"
                  className="w-full h-32 object-cover rounded-lg border border-white/20"
                />
                <button
                  onClick={() => clearBackground('mobile')}
                  className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg text-white transition-colors"
                  title="Supprimer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
                <p className="text-sm text-white/60 mb-3">Aucune image de fond mobile</p>
                <button
                  onClick={() => mobileInputRef.current?.click()}
                  disabled={uploadingMobile}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 active:scale-95 transition-all text-sm text-white touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  {uploadingMobile ? 'Upload en cours...' : 'Uploader une image'}
                </button>
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
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 active:scale-95 transition-all text-sm text-white touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 shadow-sm"
              >
                <Upload className="w-4 h-4" />
                {uploadingMobile ? 'Remplacement en cours...' : 'Remplacer'}
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
      <div className="bg-white/10 rounded-xl p-4 md:p-6 backdrop-blur-sm border border-white/10 shadow-sm">
        <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 flex items-center gap-2 text-white">
          <div className="p-1.5 rounded-lg bg-white/10">
            <ImageIcon className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          Logo de l'événement
        </h2>
        <div className="space-y-4">
          {settings.logo_url ? (
            <div className="relative">
              <div className="bg-white/5 rounded-lg p-4 flex items-center justify-center border border-white/20">
                <img
                  src={settings.logo_url}
                  alt="Logo de l'événement"
                  className="max-w-full max-h-32 object-contain"
                />
              </div>
              <button
                onClick={clearLogo}
                className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg text-white transition-colors"
                title="Supprimer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
              <p className="text-sm text-white/60 mb-3">Aucun logo</p>
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 active:scale-95 transition-all text-sm text-white touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 shadow-sm"
              >
                <Upload className="w-4 h-4" />
                {uploadingLogo ? 'Upload en cours...' : 'Uploader un logo'}
              </button>
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
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 active:scale-95 transition-all text-sm text-white touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 shadow-sm"
            >
              <Upload className="w-4 h-4" />
              {uploadingLogo ? 'Remplacement en cours...' : 'Remplacer'}
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
          <p className="text-xs text-white/60">
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

      {/* Configuration du carrousel automatique */}
      {settings.auto_carousel_enabled && (
        <div className="bg-white/10 rounded-xl p-4 md:p-6 backdrop-blur-sm border border-pink-500/20">
          <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 flex items-center gap-2">
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

