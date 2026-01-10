import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Camera, 
  Power, 
  PowerOff, 
  RefreshCw, 
  Clock, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  QrCode
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useEvent } from '../../context/EventContext';
import { usePhotos } from '../../context/PhotosContext';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { getOrCreateTodaySession, getSessionsByEvent, createNewSession, getSessionStats } from '../../services/sessionService';
import { updateSettings } from '../../services/settingsService';
import { EventSession, Photo } from '../../types';
import { getBaseUrl } from '../../utils/urlUtils';
import { formatSessionDateShort, getTodayDateString } from '../../utils/sessionUtils';
import { logger } from '../../utils/logger';

interface RestaurantDashboardProps {
  onBack: () => void;
}

export const RestaurantDashboard: React.FC<RestaurantDashboardProps> = ({ onBack }) => {
  const { currentEvent } = useEvent();
  const { photos, refresh: refreshPhotos } = usePhotos();
  const { settings, refresh: refreshSettings } = useSettings();
  const { addToast } = useToast();
  
  const [todaySession, setTodaySession] = useState<EventSession | null>(null);
  const [sessions, setSessions] = useState<EventSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [togglingDisplay, setTogglingDisplay] = useState(false);

  // Photos d'aujourd'hui (filtrées par session)
  const todayPhotos = React.useMemo(() => {
    if (!todaySession) return [];
    return photos.filter(p => p.session_id === todaySession.id);
  }, [photos, todaySession]);

  // Photos en attente de modération (pas de likes = probablement nouvelles)
  const pendingPhotos = React.useMemo(() => {
    return todayPhotos.filter(p => p.likes_count === 0);
  }, [todayPhotos]);

  // Charger la session du jour
  useEffect(() => {
    const loadTodaySession = async () => {
      if (!currentEvent) return;
      
      try {
        setLoading(true);
        const session = await getOrCreateTodaySession(currentEvent.id);
        setTodaySession(session);
        
        // Charger les sessions récentes
        const recentSessions = await getSessionsByEvent(currentEvent.id, 10);
        setSessions(recentSessions);
      } catch (error) {
        logger.error('Error loading today session', error, {
          component: 'RestaurantDashboard',
          action: 'loadTodaySession'
        });
        addToast('Erreur lors du chargement de la session', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadTodaySession();
  }, [currentEvent, addToast]);

  // Toggle mode écran ambiant
  const handleToggleAmbientDisplay = async () => {
    if (!currentEvent) return;
    
    try {
      setTogglingDisplay(true);
      const newValue = !settings.ambient_display_enabled;
      await updateSettings(currentEvent.id, {
        ambient_display_enabled: newValue
      });
      await refreshSettings();
      addToast(
        newValue ? 'Écran ambiant activé' : 'Écran ambiant désactivé',
        'success'
      );
    } catch (error) {
      logger.error('Error toggling ambient display', error, {
        component: 'RestaurantDashboard',
        action: 'handleToggleAmbientDisplay'
      });
      addToast('Erreur lors de la modification', 'error');
    } finally {
      setTogglingDisplay(false);
    }
  };

  // Reset soirée (créer nouvelle session)
  const handleResetEvening = async () => {
    if (!currentEvent) return;
    
    if (!confirm('Créer une nouvelle session pour aujourd\'hui ? Les photos actuelles seront archivées.')) {
      return;
    }

    try {
      setResetting(true);
      const newSession = await createNewSession(currentEvent.id);
      setTodaySession(newSession);
      
      // Recharger les sessions
      const recentSessions = await getSessionsByEvent(currentEvent.id, 10);
      setSessions(recentSessions);
      
      // Rafraîchir les photos
      await refreshPhotos();
      
      addToast('Nouvelle session créée', 'success');
    } catch (error) {
      logger.error('Error resetting evening', error, {
        component: 'RestaurantDashboard',
        action: 'handleResetEvening'
      });
      addToast('Erreur lors de la création de la session', 'error');
    } finally {
      setResetting(false);
    }
  };

  // URL de l'événement (QR code permanent)
  const getEventUrl = (): string => {
    if (!currentEvent?.slug) return '';
    const baseUrl = getBaseUrl();
    return `${baseUrl}?event=${currentEvent.slug}`;
  };

  if (!currentEvent) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Aucun événement sélectionné</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-white mb-4 flex items-center gap-2"
        >
          ← Retour
        </button>
        <h1 className="text-3xl font-bold mb-2">Dashboard Restaurateur</h1>
        <p className="text-slate-400">{currentEvent.name}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Carte : Photos aujourd'hui */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Camera className="w-6 h-6 text-indigo-400" />
              </div>
              <h2 className="text-xl font-semibold">Photos aujourd'hui</h2>
            </div>
            <div className="text-4xl font-bold text-indigo-400 mb-2">
              {todayPhotos.length}
            </div>
            <p className="text-sm text-slate-400">
              Session du {todaySession ? formatSessionDateShort(todaySession.date) : getTodayDateString()}
            </p>
          </motion.div>

          {/* Carte : Photos en attente */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-400" />
              </div>
              <h2 className="text-xl font-semibold">En attente</h2>
            </div>
            <div className="text-4xl font-bold text-yellow-400 mb-2">
              {pendingPhotos.length}
            </div>
            <p className="text-sm text-slate-400">Nouvelles photos</p>
          </motion.div>

          {/* Carte : Écran ambiant */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${settings.ambient_display_enabled ? 'bg-green-500/20' : 'bg-slate-500/20'}`}>
                {settings.ambient_display_enabled ? (
                  <Power className="w-6 h-6 text-green-400" />
                ) : (
                  <PowerOff className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <h2 className="text-xl font-semibold">Écran ambiant</h2>
            </div>
            <button
              onClick={handleToggleAmbientDisplay}
              disabled={togglingDisplay}
              className={`w-full py-3 rounded-lg font-semibold transition-all ${
                settings.ambient_display_enabled
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              {togglingDisplay ? (
                <RefreshCw className="w-5 h-5 animate-spin mx-auto" />
              ) : settings.ambient_display_enabled ? (
                'ON'
              ) : (
                'OFF'
              )}
            </button>
          </motion.div>

          {/* QR Code permanent */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700 md:col-span-2 lg:col-span-1"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <QrCode className="w-6 h-6 text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold">QR Code permanent</h2>
            </div>
            <div className="flex justify-center mb-4">
              <div className="bg-white p-4 rounded-xl">
                <QRCodeCanvas
                  value={getEventUrl()}
                  size={150}
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center">
              Toujours valide - Scannez pour participer
            </p>
          </motion.div>

          {/* Bouton Reset soirée */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <RefreshCw className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold">Reset soirée</h2>
            </div>
            <button
              onClick={handleResetEvening}
              disabled={resetting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {resetting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Création...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  <span>Nouvelle session</span>
                </>
              )}
            </button>
            <p className="text-xs text-slate-400 mt-2 text-center">
              Crée une nouvelle session pour aujourd'hui
            </p>
          </motion.div>

          {/* Historique des sessions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700 md:col-span-2 lg:col-span-3"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-indigo-400" />
              </div>
              <h2 className="text-xl font-semibold">Historique des sessions</h2>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sessions.length === 0 ? (
                <p className="text-slate-400 text-center py-4">Aucune session</p>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      session.id === todaySession?.id
                        ? 'bg-indigo-500/20 border border-indigo-500/30'
                        : 'bg-slate-700/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ImageIcon className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="font-medium">
                          {formatSessionDateShort(session.date)}
                          {session.id === todaySession?.id && (
                            <span className="ml-2 text-xs text-indigo-400">(Aujourd'hui)</span>
                          )}
                        </p>
                        <p className="text-sm text-slate-400">
                          {session.photo_count} photo{session.photo_count > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    {session.is_archived && (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

