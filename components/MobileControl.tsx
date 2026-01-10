import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../context/ToastContext';
import { usePhotos } from '../context/PhotosContext';
import { useSettings } from '../context/SettingsContext';
import { useEvent } from '../context/EventContext';
import { deletePhoto, deleteAllPhotos, getPhotoReactions, getPhotosByAuthor, getPhotosReactions } from '../services/photoService';
import { getAllGuests, deleteGuest, deleteAllGuests } from '../services/guestService';
import { exportPhotosToZip } from '../services/exportService';
import { Photo, ReactionCounts, PhotoBattle, Guest } from '../types';
import AnalyticsView from './AnalyticsView';
import { logger } from '../utils/logger';
import { getActiveBattles, subscribeToNewBattles } from '../services/battleService';

// Composants refactorisés
import MobileControlHeader from './mobileControl/MobileControlHeader';
import TabNavigation, { ControlTab } from './mobileControl/TabNavigation';
import PhotoPreviewModal from './mobileControl/PhotoPreviewModal';
import OverviewTab from './mobileControl/OverviewTab';
import ModerationTab from './mobileControl/ModerationTab';
import BattlesTab from './mobileControl/BattlesTab';
import GuestsTab from './mobileControl/GuestsTab';
import AftermoviesTab from './mobileControl/AftermoviesTab';
import SettingsTab from './mobileControl/SettingsTab';

interface MobileControlProps {
  onBack: () => void;
}

const MobileControl: React.FC<MobileControlProps> = ({ onBack }) => {
  const { addToast } = useToast();
  const { photos, loading: photosLoading, refresh: refreshPhotos } = usePhotos();
  const { settings } = useSettings();
  const { currentEvent } = useEvent();
  const [activeTab, setActiveTab] = useState<ControlTab>('overview');

  // Rediriger vers 'overview' si l'onglet battles est actif mais battle_mode est désactivé
  useEffect(() => {
    if (activeTab === 'battles' && settings.battle_mode_enabled === false) {
      setActiveTab('overview');
    }
    if (activeTab === 'aftermovies' && settings.aftermovies_enabled === false) {
      setActiveTab('overview');
    }
  }, [activeTab, settings.battle_mode_enabled, settings.aftermovies_enabled]);
  const [isExporting, setIsExporting] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [photosReactions, setPhotosReactions] = useState<Map<string, ReactionCounts>>(new Map());
  
  // Battles state
  const [battles, setBattles] = useState<PhotoBattle[]>([]);
  const [battlesLoading, setBattlesLoading] = useState(false);
  
  // Guests state
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestsLoading, setGuestsLoading] = useState(false);
  const [guestStats, setGuestStats] = useState<Map<string, { photosCount: number; totalLikes: number; totalReactions: number }>>(new Map());

  // Photos triées par date (plus récentes en premier)
  const sortedPhotos = useMemo(() => {
    return [...photos].sort((a, b) => b.timestamp - a.timestamp);
  }, [photos]);

  // Charger les réactions pour toutes les photos
  useEffect(() => {
    const loadReactions = async () => {
      const reactionsMap = new Map<string, ReactionCounts>();
      await Promise.all(
        photos.map(async (photo) => {
          const reactions = await getPhotoReactions(photo.id);
          if (Object.keys(reactions).length > 0) {
            reactionsMap.set(photo.id, reactions);
          }
        })
      );
      setPhotosReactions(reactionsMap);
    };
    
    if (photos.length > 0) {
      loadReactions();
    }
  }, [photos]);

  // Charger les battles actives
  useEffect(() => {
    if (!currentEvent?.id) {
      setBattles([]);
      return;
    }

    const loadBattles = async () => {
      setBattlesLoading(true);
      try {
        const activeBattles = await getActiveBattles(currentEvent.id);
        setBattles(activeBattles);
      } catch (error) {
        logger.error('Error loading battles', error, { component: 'MobileControl', action: 'loadBattles' });
        if (activeTab === 'battles') {
          addToast('Erreur lors du chargement des battles', 'error');
        }
      } finally {
        setBattlesLoading(false);
      }
    };

    // Charger immédiatement
    loadBattles();

    // S'abonner aux nouvelles battles (toujours actif pour recevoir les mises à jour)
    const subscription = subscribeToNewBattles(currentEvent.id, (newBattle) => {
      setBattles(prev => {
        // Vérifier si la battle existe déjà
        const exists = prev.some(b => b.id === newBattle.id);
        if (exists) return prev;
        return [newBattle, ...prev];
      });
    });

    // Rafraîchir toutes les 10 secondes
    const interval = setInterval(loadBattles, 10000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [currentEvent?.id, activeTab, addToast]);

  // Charger les invités
  useEffect(() => {
    const loadGuests = async () => {
      if (activeTab !== 'guests' || !currentEvent?.id) return;
      setGuestsLoading(true);
      try {
        const allGuests = await getAllGuests(currentEvent.id);
        setGuests(allGuests);
        
        // Charger les statistiques pour chaque invité
        const statsMap = new Map<string, { photosCount: number; totalLikes: number; totalReactions: number }>();
        
        for (const guest of allGuests) {
          try {
            const guestPhotos = await getPhotosByAuthor(guest.name);
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
        logger.error('Error loading guests', error, { component: 'MobileControl', action: 'loadGuests' });
        addToast('Erreur lors du chargement des invités', 'error');
      } finally {
        setGuestsLoading(false);
      }
    };

    loadGuests();

    // Rafraîchir toutes les 15 secondes
    const interval = setInterval(loadGuests, 15000);

    return () => clearInterval(interval);
  }, [activeTab, addToast]);

  // Statistiques en temps réel
  const stats = useMemo(() => {
    const totalPhotos = photos.length;
    const totalLikes = photos.reduce((acc, p) => acc + (p.likes_count || 0), 0);
    
    // Calculer le total des réactions
    let totalReactions = 0;
    photosReactions.forEach((reactions) => {
      Object.values(reactions).forEach((count) => {
        totalReactions += count || 0;
      });
    });
    
    const uniqueAuthors = new Set(photos.map(p => p.author)).size;
    const photosCount = photos.filter(p => p.type === 'photo').length;
    const videosCount = photos.filter(p => p.type === 'video').length;
    
    // Dernières 5 photos
    const recentPhotos = sortedPhotos.slice(0, 5);
    
    // Activité dernière heure
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentActivity = photos.filter(p => p.timestamp >= oneHourAgo).length;

    return {
      totalPhotos,
      totalLikes,
      totalReactions,
      uniqueAuthors,
      photosCount,
      videosCount,
      recentPhotos,
      recentActivity,
    };
  }, [photos, sortedPhotos, photosReactions]);

  // Supprimer une photo
  const handleDeletePhoto = async (photoId: string) => {
    try {
      const photo = photos.find(p => p.id === photoId);
      if (!photo) {
        throw new Error('Photo introuvable');
      }
      await deletePhoto(photoId, photo.url);
      addToast('Photo supprimée', 'success');
      if (previewPhoto?.id === photoId) {
        setPreviewPhoto(null);
      }
    } catch (error) {
      addToast('Erreur lors de la suppression', 'error');
      logger.error('Error deleting photo', error, { component: 'MobileControl', action: 'handleDeletePhoto', photoId });
      throw error;
    }
  };

  // Supprimer toutes les photos
  const handleDeleteAll = async () => {
    try {
      await deleteAllPhotos();
      // Supprimer tous les invités (sans les bloquer)
      try {
        await deleteAllGuests();
      } catch (guestsError) {
        logger.error('Error deleting all guests', guestsError);
        addToast('Photos supprimées, mais erreur lors de la suppression des invités', 'error');
      }
      addToast('Toutes les photos et tous les invités ont été supprimés', 'success');
      setPreviewPhoto(null);
    } catch (error) {
      addToast('Erreur lors de la suppression', 'error');
      logger.error('Error deleting all photos', error, { component: 'MobileControl', action: 'deleteAllPhotos' });
      throw error;
    }
  };

  // Exporter toutes les photos
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const eventTitle = settings.event_title || 'Party Wall';
      await exportPhotosToZip(photos, eventTitle);
      addToast('Export réussi !', 'success');
    } catch (error) {
      addToast('Erreur lors de l\'export', 'error');
      logger.error('Error exporting photos', error, { component: 'MobileControl', action: 'handleExport' });
    } finally {
      setIsExporting(false);
    }
  };

  // Rafraîchir les données
  const handleRefresh = async () => {
    setIsAutoRefreshing(true);
    try {
      await refreshPhotos();
      addToast('Données actualisées', 'success');
    } catch (error) {
      addToast('Erreur lors de l\'actualisation', 'error');
    } finally {
      setIsAutoRefreshing(false);
    }
  };

  // Rafraîchir les battles
  const handleRefreshBattles = async () => {
    if (!currentEvent?.id) {
      addToast('Aucun événement sélectionné', 'error');
      return;
    }
    setBattlesLoading(true);
    try {
      const activeBattles = await getActiveBattles(currentEvent.id);
      setBattles(activeBattles);
      addToast('Battles actualisées', 'success');
    } catch (error) {
      addToast('Erreur lors de l\'actualisation', 'error');
    } finally {
      setBattlesLoading(false);
    }
  };

  // Rafraîchir les invités
  const handleRefreshGuests = async () => {
    if (!currentEvent?.id) {
      addToast('Aucun événement sélectionné', 'error');
      return;
    }
    
    setGuestsLoading(true);
    try {
      const allGuests = await getAllGuests(currentEvent.id);
      setGuests(allGuests);
      
                    const statsMap = new Map<string, { photosCount: number; totalLikes: number; totalReactions: number }>();
                    for (const guest of allGuests) {
                      try {
                        const guestPhotos = await getPhotosByAuthor(guest.name);
                        const photosCount = guestPhotos.length;
                        const totalLikes = guestPhotos.reduce((sum, photo) => sum + (photo.likes_count || 0), 0);
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
                        statsMap.set(guest.id, { photosCount: 0, totalLikes: 0, totalReactions: 0 });
                      }
                    }
                    setGuestStats(statsMap);
                    addToast('Invités actualisés', 'success');
                  } catch (error) {
                    addToast('Erreur lors de l\'actualisation', 'error');
                  } finally {
                    setGuestsLoading(false);
                  }
  };

  // Supprimer un invité
  const handleDeleteGuest = async (guestId: string, guestName: string) => {
    try {
      await deleteGuest(guestId, guestName);
      addToast('Invité supprimé', 'success');
      await handleRefreshGuests();
    } catch (error) {
      addToast('Erreur lors de la suppression', 'error');
      logger.error('Error deleting guest', error, { component: 'MobileControl', action: 'handleDeleteGuest', guestId });
      throw error;
    }
  };

  // Formatage de la date relative
  const getTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}j`;
  };
                  
                  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 text-white pb-20">
      {/* Header */}
      <MobileControlHeader
        onBack={onBack}
        onRefresh={handleRefresh}
        isLoading={photosLoading}
        isRefreshing={isAutoRefreshing}
      />

      {/* Tabs Navigation */}
      <TabNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        battleModeEnabled={settings.battle_mode_enabled !== false}
        aftermoviesEnabled={settings.aftermovies_enabled !== false}
      />

      {/* Content */}
      <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto">
        {/* Vue d'ensemble */}
        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats}
            photosReactions={photosReactions}
            onPhotoClick={setPreviewPhoto}
            onExport={handleExport}
            onNavigateToModeration={() => setActiveTab('moderation')}
            isExporting={isExporting}
            getTimeAgo={getTimeAgo}
          />
        )}

        {/* Modération */}
        {activeTab === 'moderation' && (
          <ModerationTab
            photos={sortedPhotos}
            photosReactions={photosReactions}
            isLoading={photosLoading}
            onPhotoClick={setPreviewPhoto}
            onDeletePhoto={handleDeletePhoto}
            onDeleteAll={handleDeleteAll}
            getTimeAgo={getTimeAgo}
          />
        )}

        {/* Analytics */}
        {activeTab === 'analytics' && (
                <div>
            <AnalyticsView photos={photos} />
                </div>
        )}

        {/* Battles */}
        {activeTab === 'battles' && currentEvent && (
          <BattlesTab
            photos={photos}
            battles={battles}
            isLoading={battlesLoading}
            eventId={currentEvent.id}
            onRefresh={handleRefreshBattles}
            onBattleFinished={handleRefreshBattles}
          />
        )}

        {/* Invités */}
        {activeTab === 'guests' && (
          <GuestsTab
            guests={guests}
            guestStats={guestStats}
            isLoading={guestsLoading}
            onRefresh={handleRefreshGuests}
            onDeleteGuest={handleDeleteGuest}
          />
        )}

        {/* Aftermovies */}
        {activeTab === 'aftermovies' && (
          <AftermoviesTab onRefresh={handleRefresh} />
        )}

        {/* Paramètres */}
        {activeTab === 'settings' && (
          <SettingsTab onBack={onBack} />
        )}
      </div>

      {/* Modal d'aperçu photo */}
      {previewPhoto && (
        <PhotoPreviewModal
          photo={previewPhoto}
          reactions={photosReactions.get(previewPhoto.id)}
          onClose={() => setPreviewPhoto(null)}
        />
      )}
    </div>
  );
};

export default MobileControl;
