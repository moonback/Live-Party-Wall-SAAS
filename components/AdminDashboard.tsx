import React, { useEffect, useMemo, useRef, useState } from 'react';
import { deletePhoto, deleteAllPhotos, getPhotosReactions } from '../services/photoService';
import { exportPhotosToZip, exportPhotosWithMetadataToZip, ExportProgress } from '../services/exportService';
import { useToast } from '../context/ToastContext';
import { usePhotosQuery } from '../hooks/queries/usePhotosQuery';
import { usePhotosRealtime } from '../hooks/queries/usePhotosRealtime';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useEvent } from '../context/EventContext';
import { isElectron } from '../utils/electronPaths';
import AnalyticsView from './AnalyticsView';
import EventSelector from './EventSelector';
import EventManager from './EventManager';
import { getUserEvents } from '../services/eventService';
import { Event, Photo } from '../types';
import { AdminDashboardHeader } from './admin/AdminDashboardHeader';
import { AdminTabsNavigation } from './admin/AdminTabsNavigation';
import { ModerationTab } from './admin/ModerationTab';
import { GuestsTab } from './admin/GuestsTab';
import { ConfigurationTab } from './admin/ConfigurationTab';
import { AftermovieTab } from './admin/AftermovieTab';
import { BattlesTab } from './admin/BattlesTab';
import { PasswordChangeTab } from './admin/PasswordChangeTab';
import { PrintRequestsTab } from './admin/PrintRequestsTab';
import LicenseTab from './mobileControl/LicenseTab';
import { AdminTab } from './admin/types';
import { getAllGuests, deleteGuest, deleteAllGuests } from '../services/guestService';
import { getPhotosByAuthor } from '../services/photoService';
import { Guest } from '../types';
import { logger } from '../utils/logger';

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const { addToast } = useToast();
  const { settings: config } = useSettings();
  const { signOut, user } = useAuth();
  const { currentEvent, loadEventBySlug } = useEvent();
  const { data: allPhotos = [], isLoading: photosLoading, refetch: refreshPhotos } = usePhotosQuery(currentEvent?.id);
  usePhotosRealtime(currentEvent?.id); // Gérer les subscriptions Realtime
  const [activeTab, setActiveTab] = useState<AdminTab>('events');
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Local state for moderation (reversed photos for newest first)
  // Utiliser useMemo pour éviter les re-renders inutiles et la boucle infinie
  const photos = useMemo(() => {
    return [...allPhotos].reverse();
  }, [allPhotos]);
  
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingWithMetadata, setIsExportingWithMetadata] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ processed: number; total: number; message?: string } | null>(null);
  
  // État pour les invités
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestsLoading, setGuestsLoading] = useState(false);
  const [guestStats, setGuestStats] = useState<Map<string, { photosCount: number; totalLikes: number; totalReactions: number }>>(new Map());

  // Forcer l'onglet actif à être "events", "license" ou "password" si aucun événement n'est sélectionné
  useEffect(() => {
    if (!currentEvent && activeTab !== 'events' && activeTab !== 'license' && activeTab !== 'password') {
      setActiveTab('events');
    }
  }, [currentEvent, activeTab]);

  // Synchroniser selectedEvent avec currentEvent
  const prevCurrentEventId = useRef<string | null>(null);
  useEffect(() => {
    if (currentEvent && currentEvent.id !== prevCurrentEventId.current) {
      if (!selectedEvent || selectedEvent.id !== currentEvent.id) {
        setSelectedEvent(currentEvent);
      }
      prevCurrentEventId.current = currentEvent.id;
    } else if (!currentEvent) {
      prevCurrentEventId.current = null;
    }
  }, [currentEvent, selectedEvent]);

  // Gérer la touche Échap pour fermer le menu mobile
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

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
      await refreshPhotos(); // Recharger les photos depuis la base de données
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
      await deleteAllPhotos(currentEvent.id);
      
      try {
        await deleteAllGuests();
        if (activeTab === 'guests') {
          await loadGuests();
        }
      } catch (guestsError) {
        logger.error('Error deleting all guests', guestsError);
        addToast("Photos supprimées, mais il y a une erreur lors de la suppression des invités", 'error');
      }
      
      await refreshPhotos();
      addToast("Toutes les photos et tous les invités ont été supprimés", 'success');
    } catch (error) {
      logger.error('Error deleting all photos and guests', error, { component: 'AdminDashboard', action: 'deleteAll' });
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
        await exportPhotosToZip(photos, config.event_title, {
          logoUrl: config.logo_url,
          logoWatermarkEnabled: config.logo_watermark_enabled
        });
        addToast("Téléchargement lancé !", 'success');
    } catch (error) {
        logger.error('Error exporting photos to ZIP', error, { component: 'AdminDashboard', action: 'exportToZip' });
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
        const photoIds = photos.map(p => p.id);
        const reactionsMap = await getPhotosReactions(photoIds);
        
        setExportProgress({ processed: 0, total: photos.length, message: 'Génération des images avec métadonnées...' });
        addToast("Génération des images avec métadonnées...", 'info');
        
        const batchSize = photos.length > 50 ? 3 : photos.length > 20 ? 5 : 10;
        
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
          batchSize,
          {
            logoUrl: config.logo_url,
            logoWatermarkEnabled: config.logo_watermark_enabled
          }
        );
        addToast("Téléchargement lancé !", 'success');
    } catch (error) {
        logger.error('Error exporting photos with metadata', error, { component: 'AdminDashboard', action: 'exportWithMetadata' });
        addToast("Erreur lors de l'export PNG avec métadonnées", 'error');
    } finally {
        setIsExportingWithMetadata(false);
        setExportProgress(null);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // Dans Electron, onBack ne fait rien, donc on reste sur le login automatiquement
      // car isAdminAuthenticated sera false et affichera AdminLogin
      if (!isElectron()) {
        onBack();
      }
    } catch (error) {
      addToast("Erreur lors de la déconnexion", 'error');
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
    } catch (error) {
      logger.error('Error deleting guest', error);
      addToast("Erreur lors de la suppression de l'invité", 'error');
    }
  };

  const loadEvents = async () => {
    if (!user || events.length > 0) return;
    try {
      const userEvents = await getUserEvents(user.id);
      setEvents(userEvents);
    } catch (error) {
      logger.error('Error loading events', error, { component: 'AdminDashboard', action: 'loadEvents' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans relative overflow-hidden">
      {/* Arrière-plan sobre */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-slate-900/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-slate-800/20 blur-[120px] rounded-full"></div>
      </div>

      <AdminTabsNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentEvent={!!currentEvent}
        photosCount={photos.length}
        battlesCount={0}
        guestsCount={guests.length}
        eventsCount={events.length}
        battleModeEnabled={config.battle_mode_enabled !== false}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onLoadGuests={loadGuests}
        onLoadEvents={loadEvents}
      />

      <div className="relative z-10 p-4 sm:p-6 md:p-8 lg:pl-[224px] xl:pl-72">
        <AdminDashboardHeader
          onBack={onBack}
          onLogout={handleLogout}
          onDeleteAll={handleDeleteAll}
          onExport={handleExport}
          onExportWithMetadata={handleExportWithMetadata}
          photos={photos}
          isExporting={isExporting}
          isExportingWithMetadata={isExportingWithMetadata}
          exportProgress={exportProgress}
          currentEventName={currentEvent?.name}
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

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
                  setEvents(prev => prev.filter(e => e.id !== deletedEventId));
                  setSelectedEvent(null);
                }}
              />
            ) : (
              <EventSelector
                onEventSelected={async (event) => {
                  try {
                    // Charger l'événement et retourner à la landing
                    await loadEventBySlug(event.slug);
                    addToast(`Événement "${event.name}" ouvert`, 'success');
                    // Retourner à la landing après un court délai pour laisser le toast s'afficher
                    setTimeout(() => {
                      onBack();
                    }, 300);
                  } catch (error) {
                    logger.error('Error loading event', error, { component: 'AdminDashboard', action: 'loadEvent', eventId: event.id });
                    addToast('Erreur lors du chargement de l\'événement', 'error');
                  }
                }}
                onSettingsClick={async (event) => {
                  try {
                    await loadEventBySlug(event.slug);
                    setSelectedEvent(event);
                    addToast(`Paramètres de l'événement "${event.name}" chargés`, 'success');
                  } catch (error) {
                    addToast('Erreur lors du chargement des paramètres', 'error');
                  }
                }}
                onBack={onBack}
              />
            )}
          </>
        )}

        {activeTab === 'moderation' && (
          <ModerationTab
            photos={photos}
            loading={photosLoading}
            onRefresh={loadPhotos}
            onDelete={handleDelete}
          />
        )}

        {activeTab === 'analytics' && (
          <div className="max-w-6xl mx-auto">
            {photosLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
              </div>
            ) : (
              <AnalyticsView photos={photos} />
            )}
          </div>
        )}

        {activeTab === 'configuration' && (
          <ConfigurationTab />
        )}

        {activeTab === 'aftermovie' && (
          <AftermovieTab />
        )}

        {activeTab === 'battles' && config.battle_mode_enabled !== false && (
          <BattlesTab />
        )}

        {activeTab === 'guests' && (
          <GuestsTab
            guests={guests}
            loading={guestsLoading}
            guestStats={guestStats}
            onRefresh={loadGuests}
            onDelete={handleDeleteGuest}
          />
        )}

        {activeTab === 'print-requests' && currentEvent && (
          <PrintRequestsTab
            eventId={currentEvent.id}
            photos={photos}
          />
        )}

        {activeTab === 'license' && (
          <div className="max-w-6xl mx-auto">
            <LicenseTab />
          </div>
        )}

        {activeTab === 'password' && (
          <div className="max-w-4xl mx-auto">
            <PasswordChangeTab />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

