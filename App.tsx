import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { ViewMode } from './types';
import Toast from './components/Toast';
import { ToastProvider, useToast } from './context/ToastContext';
import { EventProvider, useEvent } from './context/EventContext';
import { usePhotosQuery } from './hooks/queries/usePhotosQuery';
import { usePhotosRealtime } from './hooks/queries/usePhotosRealtime';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LicenseProvider, useLicense } from './context/LicenseContext';
import { useDemoLimit } from './hooks/useDemoLimit';
import TransitionWrapper from './components/TransitionWrapper';
import { getGuestByName } from './services/guestService';
import { isElectron } from './utils/electronPaths';
import { logger } from './utils/logger';

// Lazy loading components
const Landing = lazy(() => import('./components/Landing'));
const GuestUpload = lazy(() => import('./components/GuestUpload'));
const WallView = lazy(() => import('./components/WallView'));
const GuestGallery = lazy(() => import('./components/GuestGallery')); // Nouvelle vue
const ProjectionWall = lazy(() => import('./components/ProjectionWall')); // Mode projection murale
const AdminLogin = lazy(() => import('./components/AdminLogin'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const CollageMode = lazy(() => import('./components/CollageMode')); // Mode collage
const HelpPage = lazy(() => import('./components/HelpPage')); // Page d'aide
const UserOnboarding = lazy(() => import('./components/UserOnboarding')); // Onboarding utilisateur
const StatsPage = lazy(() => import('./components/StatsPage')); // Page de statistiques
const MobileControl = lazy(() => import('./components/MobileControl')); // Contrôle mobile
const FindMe = lazy(() => import('./components/FindMe')); // Reconnaissance faciale
const BattleResultsProjection = lazy(() => import('./components/BattleResultsProjection')); // Projection des résultats de battles
const GuestProfile = lazy(() => import('./components/GuestProfile')); // Profil de l'invité
const EventSelector = lazy(() => import('./components/EventSelector')); // Sélection d'événements
const Accueil = lazy(() => import('./components/Accueil')); // Page d'accueil
const PrivacyPolicy = lazy(() => import('./components/rgpd/PrivacyPolicy')); // Politique de confidentialité
const DataManagement = lazy(() => import('./components/rgpd/DataManagement')); // Gestion des données
const ConsentBanner = lazy(() => import('./components/rgpd/ConsentBanner')); // Banner de consentement
const CookiePreferencesModal = lazy(() => import('./components/rgpd/CookiePreferences')); // Préférences cookies
const LicenseBlock = lazy(() => import('./components/LicenseBlock')); // Blocage de licence

const AppContent: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const [showCookiePreferences, setShowCookiePreferences] = useState(false);
  
  // Contexts - L'ordre est important : useEvent doit être appelé avant usePhotosQuery
  const { currentEvent, loading: eventLoading, error: eventError } = useEvent();
  const { settings: eventSettings } = useSettings();
  const { data: photos = [], isLoading: photosLoading } = usePhotosQuery(currentEvent?.id);
  usePhotosRealtime(currentEvent?.id); // Gérer les subscriptions Realtime
  const { isAuthenticated: isAdminAuthenticated } = useAuth();
  const { addToast: addToastContext, toasts, removeToast } = useToast();
  const addToastRef = useRef(addToastContext);
  const { isValid: isLicenseValid, loading: licenseLoading } = useLicense();
  const { isLimitReached, photosCount, maxPhotos } = useDemoLimit();
  
  // Mettre à jour la référence à chaque changement
  useEffect(() => {
    addToastRef.current = addToastContext;
  }, [addToastContext]);
  
  // Wrapper pour addToast qui utilise la référence
  const addToast = (message: string, type?: 'success' | 'error' | 'info') => {
    addToastRef.current(message, type);
  };

  // Fonction helper pour vérifier si l'utilisateur est inscrit pour l'événement actuel
  const isUserRegistered = (): boolean => {
    const userName = localStorage.getItem('party_user_name');
    const userAvatar = localStorage.getItem('party_user_avatar');
    const storedEventId = localStorage.getItem('party_user_event_id');
    
    // Vérifier que l'utilisateur a un nom, un avatar ET qu'il est inscrit pour l'événement actuel
    if (!userName || !userAvatar) return false;
    if (!currentEvent) return false;
    if (storedEventId !== currentEvent.id) return false;
    
    return true;
  };

  // Écouter les événements de navigation depuis HelpPage
  useEffect(() => {
    const handleNavigate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const target = customEvent.detail as ViewMode;
      if (['privacy', 'data-management'].includes(target)) {
        setViewMode(target);
      }
    };

    window.addEventListener('navigate', handleNavigate);
    return () => {
      window.removeEventListener('navigate', handleNavigate);
    };
  }, []);

  // Vérifier et restaurer la session invité depuis la BDD si nécessaire
  useEffect(() => {
    const checkAndRestoreGuestSession = async () => {
      if (!currentEvent) return;

      const userName = localStorage.getItem('party_user_name');
      const storedEventId = localStorage.getItem('party_user_event_id');

      try {
        // Si on a un nom mais pas d'avatar ou un mauvais event_id, essayer de récupérer depuis la BDD
        if (userName) {
          const guest = await getGuestByName(currentEvent.id, userName);
          
          if (guest) {
            // L'invité existe en BDD pour cet événement
            // Restaurer les données dans localStorage depuis la BDD
            localStorage.setItem('party_user_name', guest.name);
            localStorage.setItem('party_user_avatar', guest.avatarUrl); // URL publique depuis Supabase Storage
            localStorage.setItem('party_user_event_id', currentEvent.id);
          } else {
            // L'invité n'existe pas pour cet événement
            if (storedEventId === currentEvent.id) {
              // L'invité était inscrit pour cet événement mais a été supprimé
              localStorage.removeItem('party_user_name');
              localStorage.removeItem('party_user_avatar');
              localStorage.removeItem('party_user_event_id');
              // Rediriger vers landing si on est sur un mode qui nécessite un profil
              if (['guest', 'gallery', 'collage', 'findme'].includes(viewMode)) {
                setViewMode('landing');
                addToastRef.current('Votre compte a été supprimé. Veuillez vous réinscrire.', 'info');
              }
            } else if (storedEventId && storedEventId !== currentEvent.id) {
              // L'invité est inscrit pour un autre événement
              // On garde ses données mais on demande une nouvelle inscription pour cet événement
              if (['guest', 'gallery', 'collage', 'findme'].includes(viewMode)) {
                setViewMode('onboarding');
                addToastRef.current('Vous devez vous inscrire pour cet événement', 'info');
              }
            } else {
              // Pas d'événement stocké, l'invité doit s'inscrire
              if (['guest', 'gallery', 'collage', 'findme'].includes(viewMode)) {
                setViewMode('onboarding');
              }
            }
          }
        } else {
          // Pas de nom en localStorage, vérifier si on peut récupérer depuis la BDD
          // (Cette partie pourrait être étendue si on stocke un identifiant unique)
        }
      } catch (error) {
        // En cas d'erreur, on ne fait rien pour ne pas perturber l'utilisateur
        logger.error('Error checking/restoring guest session', error, { component: 'App', action: 'checkGuestSession' });
      }
    };

    // Vérifier périodiquement (toutes les 30 secondes)
    const interval = setInterval(checkAndRestoreGuestSession, 30000);
    // Vérifier immédiatement au montage
    checkAndRestoreGuestSession();

    return () => clearInterval(interval);
  }, [viewMode, addToast, currentEvent]);

  // Fonction wrapper pour changer le viewMode avec vérification du profil et de la limite démo
  const handleViewModeChange = (newMode: ViewMode) => {
    // Les modes qui nécessitent un profil utilisateur
    const modesRequiringProfile: ViewMode[] = ['guest', 'gallery', 'collage', 'findme'];
    
    // Vérifier la limite démo pour les modes d'upload
    const uploadModes: ViewMode[] = ['guest', 'collage'];
    if (uploadModes.includes(newMode) && isLimitReached) {
      addToast(`Limite de photos atteinte. La licence DEMO permet un maximum de ${maxPhotos} photos par événement. (${photosCount}/${maxPhotos})`, 'error');
      setViewMode('landing');
      return;
    }
    
    if (modesRequiringProfile.includes(newMode) && !isUserRegistered()) {
      // Rediriger vers onboarding si l'utilisateur n'a pas de profil
      setViewMode('onboarding');
    } else {
      setViewMode(newMode);
    }
  };

  // Check URL params and routing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    
    // Vérifier si l'utilisateur est inscrit
    const isRegistered = isUserRegistered();
    
    if (modeParam === 'guest') {
      if (isLimitReached) {
        setViewMode('landing');
        addToastRef.current(`Limite de photos atteinte. La licence DEMO permet un maximum de ${maxPhotos} photos par événement. (${photosCount}/${maxPhotos})`, 'error');
      } else if (!isRegistered) {
        setViewMode('onboarding');
      } else {
        setViewMode('guest');
      }
    } else if (modeParam === 'wall') {
      setViewMode('wall');
    } else if (modeParam === 'admin') {
      setViewMode('admin');
    } else if (modeParam === 'gallery') {
      if (eventSettings.gallery_enabled === false) {
        setViewMode('landing');
        addToastRef.current('La galerie est désactivée', 'info');
      } else if (!isRegistered) {
        setViewMode('onboarding');
      } else {
        setViewMode('gallery');
      }
    } else if (modeParam === 'projection') {
      setViewMode('projection');
    } else if (modeParam === 'help') {
      setViewMode('help');
    } else if (modeParam === 'stats-display') {
      setViewMode('stats-display');
    } else if (modeParam === 'mobile-control') {
      setViewMode('mobile-control');
    } else if (modeParam === 'findme') {
      if (eventSettings.find_me_enabled) {
        if (!isRegistered) {
          setViewMode('onboarding');
        } else {
          setViewMode('findme');
        }
      } else {
        if (!isRegistered) {
          setViewMode('onboarding');
        } else {
          setViewMode('gallery');
        }
        addToastRef.current('La fonctionnalité Retrouve-moi est désactivée', 'info');
      }
    } else if (modeParam === 'battle-results') {
      setViewMode('battle-results');
    } else if (modeParam === 'collage' && eventSettings.collage_mode_enabled) {
      if (isLimitReached) {
        setViewMode('landing');
        addToastRef.current(`Limite de photos atteinte. La licence DEMO permet un maximum de ${maxPhotos} photos par événement. (${photosCount}/${maxPhotos})`, 'error');
      } else if (!isRegistered) {
        setViewMode('onboarding');
      } else {
        setViewMode('collage');
      }
    } else if (modeParam === 'collage' && !eventSettings.collage_mode_enabled) {
      if (!isRegistered) {
        setViewMode('onboarding');
      } else {
        setViewMode('guest');
      }
      addToastRef.current('Le mode collage est désactivé', 'info');
    }
    // Si pas de paramètre mode, on reste sur landing (accessible sans profil)
  }, [eventSettings.collage_mode_enabled, eventSettings.find_me_enabled, eventSettings.gallery_enabled]);

  // Déterminer le type de transition selon la vue
  const getTransitionType = (mode: ViewMode): 'fade' | 'slide-left' | 'slide-right' | 'slide-bottom' | 'scale' | 'zoom-bounce' => {
    switch (mode) {
      case 'landing': return 'zoom-bounce';
      case 'guest': return 'slide-right';
      case 'gallery': return 'slide-bottom';
      case 'wall': return 'fade';
      case 'projection': return 'fade';
      case 'admin': return 'scale';
      case 'mobile-control': return 'slide-bottom';
      case 'collage': return 'slide-right';
      case 'help': return 'slide-left';
      case 'findme': return 'slide-right';
      case 'battle-results': return 'fade';
      default: return 'fade';
    }
  };

  return (
    <div className="font-sans min-h-screen text-white relative overflow-hidden">
      {/* Ambient overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.08] mix-blend-overlay z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.28),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.18),transparent_45%)]"></div>
      </div>
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col items-end space-y-3 pointer-events-none">
        <div className="pointer-events-auto">
           {toasts.map(toast => (
             <Toast 
               key={toast.id}
               id={toast.id}
               message={toast.message}
               type={toast.type}
               onClose={removeToast}
             />
           ))}
        </div>
      </div>

      {/* Main Content with Advanced Transitions */}
      <div className="w-full h-full relative z-10">
        {/* Vérification de la licence - Bloque l'application si expirée */}
        {!licenseLoading && !isLicenseValid && (
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
          }>
            <LicenseBlock />
          </Suspense>
        )}

        {/* Afficher un message d'erreur si l'événement n'est pas chargé ou s'il y a une erreur */}
        {eventLoading && (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
        )}
        
        {eventError && (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center p-8">
              <h2 className="text-2xl font-bold mb-4">Erreur de chargement de l'événement</h2>
              <p className="text-gray-300 mb-4">{eventError.message}</p>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-pink-500 rounded-lg hover:bg-pink-600 transition"
              >
                Retour à l'accueil
              </button>
            </div>
          </div>
        )}

        {!eventLoading && !eventError && isLicenseValid && (
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
        }>
          <>
            {/* Mode admin accessible même sans événement */}
            {viewMode === 'admin' && (
              <TransitionWrapper type="scale" duration={600}>
                {isAdminAuthenticated ? (
                  <AdminDashboard 
                    onBack={() => {
                      // Dans Electron, ne pas permettre de retourner à l'accueil
                      // Rester sur le dashboard ou rediriger vers login si déconnecté
                      if (isElectron()) {
                        // Dans Electron, on ne peut pas quitter le dashboard
                        // Le handleLogout dans AdminDashboard gérera la déconnexion
                        return;
                      }
                      // En web, comportement normal
                      if (currentEvent) {
                        setViewMode('landing');
                      } else {
                        // Si pas d'événement, afficher EventSelector
                        setViewMode('landing');
                      }
                    }}
                  />
                ) : (
                  <AdminLogin 
                    onLoginSuccess={() => {}}
                    onBack={() => {
                      // Dans Electron, ne rien faire (rester sur le login)
                      if (isElectron()) {
                        // Ne pas permettre de quitter le login dans Electron
                        return;
                      }
                      // Retourner à l'accueil : si pas d'événement, afficher Accueil, sinon Landing
                      if (!currentEvent) {
                        // Mettre un mode qui n'est pas 'admin' pour déclencher l'affichage de Accueil
                        setViewMode('landing');
                      } else {
                        setViewMode('landing');
                      }
                    }}
                  />
                )}
              </TransitionWrapper>
            )}

            {/* Si pas d'événement et pas en mode admin, afficher l'écran sans événement */}
            {viewMode !== 'admin' && !currentEvent && (
              <TransitionWrapper type="fade" duration={500}>
                <Accueil
                  onAdminClick={() => setViewMode('admin')}
                />
              </TransitionWrapper>
            )}

            {/* Modes nécessitant un événement */}
            {currentEvent && (
              <>
            {viewMode === 'landing' && (
            <TransitionWrapper type="zoom-bounce" duration={800}>
              <Landing onSelectMode={handleViewModeChange} isAdminAuthenticated={isAdminAuthenticated} />
            </TransitionWrapper>
          )}

          {viewMode === 'guest' && (
            <TransitionWrapper type="slide-right" duration={600}>
              {isLimitReached ? (
                <div className="min-h-screen flex items-center justify-center p-4">
                  <div className="text-center">
                    <p className="text-red-400 text-lg font-bold mb-2">Limite de photos atteinte</p>
                    <p className="text-white/80 mb-4">La licence DEMO permet un maximum de {maxPhotos} photos par événement.</p>
                    <p className="text-white/60 text-sm mb-6">{photosCount}/{maxPhotos} photos</p>
                    <button
                      onClick={() => setViewMode('landing')}
                      className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-semibold hover:from-pink-500 hover:to-purple-500 transition-all"
                    >
                      Retour à l'accueil
                    </button>
                  </div>
                </div>
              ) : (
                <GuestUpload 
                  onPhotoUploaded={(p) => {
                    // Photo uploadée avec succès, pas de redirection automatique
                  }} 
                  onBack={() => setViewMode('landing')}
                  onCollageMode={() => {
                    if (isLimitReached) {
                      addToast(`Limite de photos atteinte. La licence DEMO permet un maximum de ${maxPhotos} photos par événement. (${photosCount}/${maxPhotos})`, 'error');
                    } else {
                      setViewMode('collage');
                    }
                  }}
                />
              )}
            </TransitionWrapper>
          )}

          {viewMode === 'collage' && eventSettings.collage_mode_enabled && (
            <TransitionWrapper type="slide-right" duration={600}>
              {isLimitReached ? (
                <div className="min-h-screen flex items-center justify-center p-4">
                  <div className="text-center">
                    <p className="text-red-400 text-lg font-bold mb-2">Limite de photos atteinte</p>
                    <p className="text-white/80 mb-4">La licence DEMO permet un maximum de {maxPhotos} photos par événement.</p>
                    <p className="text-white/60 text-sm mb-6">{photosCount}/{maxPhotos} photos</p>
                    <button
                      onClick={() => setViewMode('landing')}
                      className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-semibold hover:from-pink-500 hover:to-purple-500 transition-all"
                    >
                      Retour à l'accueil
                    </button>
                  </div>
                </div>
              ) : (
                <CollageMode 
                  onCollageUploaded={(p) => {
                    setViewMode(eventSettings.gallery_enabled !== false ? 'gallery' : 'landing');
                  }} 
                  onBack={() => setViewMode('guest')}
                />
              )}
            </TransitionWrapper>
          )}

          {/* Galerie Interactive - Vue interactive mobile (likes, réactions, filtres) */}
          {viewMode === 'gallery' && eventSettings.gallery_enabled !== false && (
            <TransitionWrapper type="slide-bottom" duration={600}>
               <GuestGallery 
                  onBack={() => setViewMode('landing')}
                  onUploadClick={() => handleViewModeChange('guest')}
                  onFindMeClick={() => handleViewModeChange('findme')}
               />
            </TransitionWrapper>
          )}

          {/* Mur Live - Vue projection grand écran (lecture seule, optimisée TV) */}
          {viewMode === 'wall' && (
            <TransitionWrapper type="fade" duration={500}>
              {isAdminAuthenticated ? (
                <WallView 
                  photos={photos} 
                  onBack={() => setViewMode('landing')} 
                />
              ) : (
                <AdminLogin 
                  onLoginSuccess={() => {
                    // Après connexion réussie, rediriger vers wall
                    setViewMode('wall');
                  }}
                  onBack={() => setViewMode('landing')}
                />
              )}
            </TransitionWrapper>
          )}

          {viewMode === 'projection' && (
            <TransitionWrapper type="fade" duration={500}>
              {isAdminAuthenticated ? (
                <ProjectionWall 
                  photos={photos} 
                  onBack={() => setViewMode('landing')}
                  displayDuration={5000}
                  transitionDuration={1000}
                  transitionType="fade"
                />
              ) : (
                <AdminLogin 
                  onLoginSuccess={() => {
                    // Après connexion réussie, rediriger vers projection
                    setViewMode('projection');
                  }}
                  onBack={() => setViewMode('landing')}
                />
              )}
            </TransitionWrapper>
          )}


          {viewMode === 'help' && (
            <TransitionWrapper type="slide-left" duration={600}>
              <HelpPage onBack={() => setViewMode('landing')} />
            </TransitionWrapper>
          )}

          {viewMode === 'onboarding' && (
            <TransitionWrapper type="scale" duration={600}>
              <UserOnboarding 
                onComplete={(userName, avatarUrl) => {
                  // Rediriger vers landing après l'onboarding
                  setViewMode('landing');
                }}
                onBack={() => setViewMode('landing')}
              />
            </TransitionWrapper>
          )}

          {viewMode === 'stats' && (
            <TransitionWrapper type="fade" duration={500}>
              <StatsPage photos={photos} onBack={() => setViewMode('landing')} />
            </TransitionWrapper>
          )}

          {viewMode === 'stats-display' && (
            <TransitionWrapper type="fade" duration={500}>
              <StatsPage 
                photos={photos} 
                isDisplayMode={true} 
                onBack={() => {
                  setViewMode('landing');
                  window.history.pushState({}, '', window.location.pathname);
                }} 
              />
            </TransitionWrapper>
          )}

          {viewMode === 'mobile-control' && (
            <TransitionWrapper type="slide-bottom" duration={600}>
              {isAdminAuthenticated ? (
                <MobileControl 
                  onBack={() => setViewMode('landing')}
                />
              ) : (
                <AdminLogin 
                  onLoginSuccess={() => {}}
                  onBack={() => setViewMode('landing')}
                />
              )}
            </TransitionWrapper>
          )}

          {viewMode === 'findme' && (
            <TransitionWrapper type="slide-right" duration={600}>
              <FindMe 
                onBack={() => setViewMode(eventSettings.gallery_enabled !== false ? 'gallery' : 'landing')}
                onPhotoClick={(photo) => {
                  // Optionnel: naviguer vers la galerie avec la photo sélectionnée (ou landing si désactivée)
                  setViewMode(eventSettings.gallery_enabled !== false ? 'gallery' : 'landing');
                }}
              />
            </TransitionWrapper>
          )}

          {viewMode === 'battle-results' && (
            <TransitionWrapper type="fade" duration={500}>
              <BattleResultsProjection 
                onBack={() => setViewMode('landing')}
              />
            </TransitionWrapper>
          )}

            {viewMode === 'guest-profile' && (
              <TransitionWrapper type="scale" duration={600}>
                <GuestProfile 
                  onBack={() => setViewMode('landing')}
                />
              </TransitionWrapper>
            )}

            {viewMode === 'privacy' && (
              <TransitionWrapper type="slide-left" duration={600}>
                <PrivacyPolicy 
                  onBack={() => setViewMode('landing')}
                />
              </TransitionWrapper>
            )}

            {viewMode === 'data-management' && (
              <TransitionWrapper type="slide-left" duration={600}>
                <DataManagement 
                  onBack={() => setViewMode('landing')}
                />
              </TransitionWrapper>
            )}
              </>
            )}
          </>
        </Suspense>
        )}

        {/* RGPD Consent Banner */}
        <Suspense fallback={null}>
          <ConsentBanner
            onPreferencesClick={() => setShowCookiePreferences(true)}
            onPrivacyClick={() => setViewMode('privacy')}
          />
        </Suspense>

        {/* Cookie Preferences Modal */}
        {showCookiePreferences && (
          <Suspense fallback={null}>
            <CookiePreferencesModal
              onClose={() => setShowCookiePreferences(false)}
              onPrivacyClick={() => {
                setShowCookiePreferences(false);
                setViewMode('privacy');
              }}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <LicenseProvider>
          <EventProvider>
            <SettingsProvider>
              <AppContent />
            </SettingsProvider>
          </EventProvider>
        </LicenseProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;



