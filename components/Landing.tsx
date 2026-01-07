import React, { useEffect, useState, useMemo } from 'react';
import { ViewMode } from '../types';
import { Images, Camera, User } from 'lucide-react';
import { getCurrentUserName, getCurrentUserAvatar } from '../utils/userAvatar';
import { getSettings, subscribeToSettings, defaultSettings } from '../services/settingsService';
import { useEvent } from '../context/EventContext';
import { LandingHeader } from './landing/LandingHeader';
import { LandingFooter } from './landing/LandingFooter';
import { TopRightButtons } from './landing/TopRightButtons';
import { MobileButtons } from './landing/MobileButtons';
import { NavigationCards } from './landing/NavigationCards';
import { useIsMobile } from '../hooks/useIsMobile';
import { getStaticAssetPath } from '../utils/electronPaths';

interface LandingProps {
  onSelectMode: (mode: ViewMode) => void;
  isAdminAuthenticated?: boolean;
}

const Landing: React.FC<LandingProps> = ({ onSelectMode, isAdminAuthenticated = false }) => {
  const isMobile = useIsMobile();
  const { currentEvent } = useEvent();
  const [uiConfig, setUiConfig] = useState({
    title: defaultSettings.event_title,
    subtitle: defaultSettings.event_subtitle,
    statsEnabled: defaultSettings.stats_enabled,
    findMeEnabled: defaultSettings.find_me_enabled,
    battleModeEnabled: defaultSettings.battle_mode_enabled ?? false
  });

  // Déterminer le titre à afficher : nom de l'événement en priorité, sinon event_title
  const displayTitle = useMemo(() => {
    if (currentEvent?.name) {
      return currentEvent.name;
    }
    return uiConfig.title;
  }, [currentEvent?.name, uiConfig.title]);

  // Déterminer le sous-titre à afficher : description de l'événement en priorité, sinon event_subtitle
  // Limité à 100 caractères
  const displaySubtitle = useMemo(() => {
    if (currentEvent?.description) {
      const description = currentEvent.description;
      return description.length > 100 ? description.substring(0, 100) + '...' : description;
    }
    return uiConfig.subtitle;
  }, [currentEvent?.description, uiConfig.subtitle]);

  const [mounted, setMounted] = useState(false);
  const [hasUserProfile, setHasUserProfile] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Vérifier si l'utilisateur a un profil
    const userName = getCurrentUserName();
    const userAvatar = getCurrentUserAvatar();
    setHasUserProfile(!!(userName && userAvatar));
  }, []);

  useEffect(() => {
    // Initial Load - seulement si un événement est sélectionné
    if (!currentEvent?.id) {
      // Réinitialiser aux valeurs par défaut si pas d'événement
      setUiConfig({
        title: defaultSettings.event_title,
        subtitle: defaultSettings.event_subtitle,
        statsEnabled: defaultSettings.stats_enabled,
        findMeEnabled: defaultSettings.find_me_enabled,
        battleModeEnabled: defaultSettings.battle_mode_enabled ?? false
      });
      return;
    }

    getSettings(currentEvent.id).then(settings => {
      setUiConfig({
        title: settings.event_title,
        subtitle: settings.event_subtitle,
        statsEnabled: settings.stats_enabled ?? true,
        findMeEnabled: settings.find_me_enabled ?? true,
        battleModeEnabled: settings.battle_mode_enabled ?? false
      });
    });

    // Realtime Subscription
    const subscription = subscribeToSettings(currentEvent.id, (newSettings) => {
      setUiConfig({
        title: newSettings.event_title,
        subtitle: newSettings.event_subtitle,
        statsEnabled: newSettings.stats_enabled ?? true,
        findMeEnabled: newSettings.find_me_enabled ?? true,
        battleModeEnabled: newSettings.battle_mode_enabled ?? false
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [currentEvent?.id]);

  useEffect(() => {
    // Écouter les changements de localStorage pour mettre à jour le profil
    const handleStorageChange = () => {
      const userName = getCurrentUserName();
      const userAvatar = getCurrentUserAvatar();
      setHasUserProfile(!!(userName && userAvatar));
    };

    window.addEventListener('storage', handleStorageChange);
    // Vérifier périodiquement (pour les changements dans le même onglet)
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Options de navigation optimisées pour mobile/kiosk
  const navigationOptions = useMemo(() => {
    const options = [
      {
        id: 'guest',
        title: 'Capturez vos meilleurs moments',
        description: 'Capturez vos meilleurs moments',
        icon: Camera,
        gradient: 'from-pink-500 via-rose-500 to-purple-500',
        glowColor: 'rgba(236, 72, 153, 0.4)',
        delay: '200ms',
        isPrimary: true,
      },
      {
        id: 'gallery',
        title: 'Le mur',
        description: 'Explorer Le mur',
        icon: Images,
        gradient: 'from-indigo-500 via-blue-500 to-cyan-500',
        glowColor: 'rgba(99, 102, 241, 0.4)',
        delay: '300ms',
        isPrimary: false,
      }
    ];

    if (uiConfig.findMeEnabled) {
      options.push({
        id: 'findme',
        title: 'Retrouve-moi',
        description: 'Retrouvez vos photos avec l\'IA',
        icon: User,
        gradient: 'from-fuchsia-500 via-purple-500 to-indigo-500',
        glowColor: 'rgba(217, 70, 239, 0.4)',
        delay: '400ms',
        isPrimary: false,
      });
    }

    return options;
  }, [uiConfig.findMeEnabled]);

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center bg-transparent text-white relative overflow-x-hidden overflow-y-auto"
      style={{ 
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
      aria-label="Landing page Party Wall"
    >
      {/* Background Image - Desktop */}
      {!isMobile && (
        <img
          src={getStaticAssetPath('background-desktop.png')}
          alt="Background desktop"
          className="fixed inset-0 w-full h-full object-cover z-0"
          style={{
            minWidth: '100%',
            minHeight: '100%',
          }}
        />
      )}

      {/* Background Image - Mobile */}
      {isMobile && (
        <img
          src={getStaticAssetPath('background-mobile.png')}
          alt="Background mobile"
          className="fixed inset-0 w-full h-full object-cover z-0"
          style={{
            minWidth: '100%',
            minHeight: '100%',
          }}
        />
      )}

      {/* Overlay sombre pour améliorer la lisibilité */}
      <div className="fixed inset-0 bg-black/40 z-[1] pointer-events-none" />

      {/* Top Right Buttons - Desktop only */}
      <TopRightButtons
        onSelectMode={onSelectMode}
        isAdminAuthenticated={isAdminAuthenticated}
        hasUserProfile={hasUserProfile}
        statsEnabled={uiConfig.statsEnabled}
        battleModeEnabled={uiConfig.battleModeEnabled}
      />

      {/* Main Content */}
      <main className="relative z-[2] w-full max-w-5xl mx-auto flex flex-col items-center justify-center gap-6 sm:gap-8 lg:gap-10 px-4 sm:px-6 h-full py-6 sm:py-8 lg:py-12">
        
        {/* Hero Section */}
        <div className="flex-shrink-0 w-full">
          <LandingHeader
            isAuthenticated={isAdminAuthenticated}
            onAdminClick={() => {}}
            onScrollToSection={() => {}}
          />
        </div>

        {/* Mobile Buttons Row - Below title on mobile */}
        <div className="flex-shrink-0 w-full flex justify-center">
          <MobileButtons
            onSelectMode={onSelectMode}
            isAdminAuthenticated={isAdminAuthenticated}
            hasUserProfile={hasUserProfile}
            statsEnabled={uiConfig.statsEnabled}
            battleModeEnabled={uiConfig.battleModeEnabled}
          />
        </div>

        {/* Navigation Cards - Centered and Enhanced */}
        <div className="w-full max-w-3xl mx-auto flex-1 flex items-center justify-center py-4 sm:py-6">
          <NavigationCards
            options={navigationOptions}
            mounted={mounted}
            onSelectMode={onSelectMode}
          />
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 mt-auto pb-4">
          <LandingFooter />
        </div>
      </main>

      {/* Floating Particles Effect */}
      <div className="fixed inset-0 pointer-events-none z-[1]">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white/10 blur-sm animate-float"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + i * 12}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

    </div>
  );
};

export default React.memo(Landing);
