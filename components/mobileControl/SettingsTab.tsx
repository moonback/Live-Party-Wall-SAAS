import React from 'react';
import { Bell, LogOut, Grid3x3, Video, Shield, BarChart2, User, Sparkles, Trophy, Type, Frame, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { logger } from '../../utils/logger';

interface SettingsTabProps {
  onBack: () => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ onBack }) => {
  const { signOut } = useAuth();
  const { settings, updateSettings } = useSettings();
  const { addToast } = useToast();

  const featureConfigs = [
    { key: 'collage_mode_enabled', label: 'Mode Collage', icon: Grid3x3, disabled: false },
    { key: 'video_capture_enabled', label: 'Capture Vidéo', icon: Video, disabled: false },
    { key: 'content_moderation_enabled', label: 'Modération IA', icon: Shield, disabled: true },
    { key: 'stats_enabled', label: 'Statistiques', icon: BarChart2, disabled: false },
    { key: 'find_me_enabled', label: 'Retrouve-moi', icon: User, disabled: false },
    { key: 'ar_scene_enabled', label: 'Scène AR', icon: Sparkles, disabled: false },
    { key: 'battle_mode_enabled', label: 'Mode Battle', icon: Trophy, disabled: false },
    { key: 'caption_generation_enabled', label: 'Génération de légendes', icon: Type, disabled: false },
    { key: 'decorative_frame_enabled', label: 'Cadres décoratifs', icon: Frame, disabled: false },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Configuration de l'événement */}
      <div className="bg-white/10 rounded-xl p-4 md:p-6 backdrop-blur-sm">
        <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Configuration de l'événement</h2>
        <div className="space-y-4">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium mb-2">Titre</label>
            <input
              type="text"
              value={settings.event_title || ''}
              onChange={(e) => updateSettings({ event_title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
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
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500"
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
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="slow">Lente</option>
              <option value="normal">Normale</option>
              <option value="fast">Rapide</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerte texte */}
      <div className="bg-white/10 rounded-xl p-4 md:p-6 backdrop-blur-sm border border-yellow-500/20">
        <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
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
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-500 min-h-[100px] resize-y"
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
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 transition-colors text-sm text-red-400 touch-manipulation"
            >
              <X className="w-4 h-4" />
              Supprimer l'alerte
            </button>
          )}
        </div>
      </div>

      {/* Fonctionnalités */}
      <div className="bg-white/10 rounded-xl p-4 md:p-6 backdrop-blur-sm">
        <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Fonctionnalités</h2>
        <div className="space-y-3">
          {featureConfigs.map(({ key, label, icon: Icon, disabled }) => {
            const isModeration = key === 'content_moderation_enabled';
            const checked = isModeration ? true : (settings[key as keyof typeof settings] as boolean || false);
            
            return (
              <label
                key={key}
                className={`flex items-center justify-between p-3 rounded-lg bg-white/5 transition-colors touch-manipulation ${
                  disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-white/10 active:bg-white/15 cursor-pointer'
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

      {/* Déconnexion */}
      <button
        onClick={async () => {
          await signOut();
          onBack();
        }}
        className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 transition-colors touch-manipulation"
      >
        <LogOut className="w-5 h-5" />
        <span>Déconnexion</span>
      </button>
    </div>
  );
};

export default SettingsTab;

