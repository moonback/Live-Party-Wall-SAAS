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
    battleModeEnabled: defaultSettings.battle_mode_enabled ?? false,
    backgroundDesktopUrl: defaultSettings.background_desktop_url,
    backgroundMobileUrl: defaultSettings.background_mobile_url
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
        battleModeEnabled: defaultSettings.battle_mode_enabled ?? false,
        backgroundDesktopUrl: defaultSettings.background_desktop_url,
        backgroundMobileUrl: defaultSettings.background_mobile_url
      });
      return;
    }

    getSettings(currentEvent.id).then(settings => {
      setUiConfig(prev => ({
        title: settings.event_title ?? prev.title,
        subtitle: settings.event_subtitle ?? prev.subtitle,
        statsEnabled: settings.stats_enabled ?? prev.statsEnabled,
        findMeEnabled: settings.find_me_enabled ?? prev.findMeEnabled,
        battleModeEnabled: settings.battle_mode_enabled ?? prev.battleModeEnabled,
        backgroundDesktopUrl: settings.background_desktop_url ?? prev.backgroundDesktopUrl,
        backgroundMobileUrl: settings.background_mobile_url ?? prev.backgroundMobileUrl
      }));
    });

    // Realtime Subscription
    const subscription = subscribeToSettings(currentEvent.id, (newSettings) => {
      setUiConfig(prev => ({
        title: newSettings.event_title ?? prev.title,
        subtitle: newSettings.event_subtitle ?? prev.subtitle,
        statsEnabled: newSettings.stats_enabled ?? prev.statsEnabled,
        findMeEnabled: newSettings.find_me_enabled ?? prev.findMeEnabled,
        battleModeEnabled: newSettings.battle_mode_enabled ?? prev.battleModeEnabled,
        backgroundDesktopUrl: newSettings.background_desktop_url ?? prev.backgroundDesktopUrl,
        backgroundMobileUrl: newSettings.background_mobile_url ?? prev.backgroundMobileUrl
      }));
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
        description: 'Partagez vos photos prises sur le fait instantanément',
        icon: Camera,
        gradient: 'from-pink-500 via-rose-500 to-purple-500',
        glowColor: 'rgba(236, 72, 153, 0.4)',
        delay: '200ms',
        isPrimary: true,
      },
      {
        id: 'gallery',
        title: 'Le mur interactif',
        description: 'Découvrez toutes les photos de la soirée',
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
        description: 'Trouvez vos photos avec la recherche IA',
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
      className="min-h-screen w-full flex flex-col items-center justify-center bg-transparent text-white relative overflow-x-hidden overflow-y-auto lg:overflow-y-hidden lg:h-screen"
      style={{ 
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
      aria-label="Landing page Party Wall"
    >
      {/* Background Image - Responsive */}
      <img
        src={
          isMobile
            ? (uiConfig.backgroundMobileUrl || getStaticAssetPath('background-mobile.png'))
            : (uiConfig.backgroundDesktopUrl || getStaticAssetPath('background-desktop.png'))
        }
        alt="Background"
        className="fixed inset-0 w-full h-full object-cover z-0"
        style={{
          minWidth: '100%',
          minHeight: '100%',
        }}
      />

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
      <main className={`relative z-[2] w-full max-w-5xl mx-auto flex flex-col items-center justify-center gap-4 sm:gap-6 md:gap-6 lg:gap-4 px-3 sm:px-4 md:px-6 h-full ${
        currentEvent 
          ? 'py-4 sm:py-6 md:py-6 lg:py-4' 
          : 'pt-16 sm:pt-20 md:pt-20 lg:pt-16 py-4 sm:py-6 md:py-6 lg:py-4'
      }`}>
        
        {/* Hero Section - Header uniquement si pas d'événement sélectionné */}
        {!currentEvent && (
          <div className="flex-shrink-0 w-full">
            <LandingHeader
              isAuthenticated={isAdminAuthenticated}
              onAdminClick={() => {}}
              onScrollToSection={() => {}}
            />
          </div>
        )}

        {/* Logo et titre centrés si événement sélectionné - Style cohérent avec splash screen */}
        {currentEvent && (
          <div className="flex-shrink-0 w-full flex flex-col items-center justify-center gap-3 sm:gap-4 md:gap-4 lg:gap-3 mb-3 sm:mb-4 md:mb-4 lg:mb-2 px-2">
            {/* Logo Container - Style splash screen */}
            <div className="relative mb-4 sm:mb-5 md:mb-5 lg:mb-3 animate-[fadeInScale_0.8s_cubic-bezier(0.34,1.56,0.64,1)_0.2s_both]">
              <div className="relative flex items-center justify-center">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-white/20 rounded-full blur-[20px] scale-75"></div>
                
                {/* Icon Wrapper avec Camera et Sparkles */}
                <div className="relative flex items-center justify-center">
                  {/* Camera Icon - Responsive sizes */}
                  <svg 
                    className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)] z-[2]" 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                    <circle cx="12" cy="13" r="3"/>
                  </svg>
                  
                  {/* Sparkles Icon - Responsive sizes */}
                  <svg 
                    className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#fbcfe8] drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)] z-[3] animate-[sparklePulse_2s_ease-in-out_infinite]" 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                    <path d="M5 3v4"/>
                    <path d="M19 17v4"/>
                    <path d="M3 5h4"/>
                    <path d="M17 19h4"/>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Titre de l'événement - Style splash screen - Responsive */}
            <h1 className="relative font-['Pacifico',cursive] text-[clamp(2rem,6vw,3.5rem)] sm:text-[clamp(2.5rem,7vw,4rem)] md:text-[clamp(3rem,7vw,3.8rem)] lg:text-[clamp(3.2rem,6vw,4rem)] leading-[1.1] sm:leading-[1.2] lg:leading-[1.15] text-center mb-2 sm:mb-2 md:mb-2 lg:mb-1 px-2 drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] animate-[fadeInUp_0.8s_cubic-bezier(0.34,1.56,0.64,1)_0.4s_both]">
              <span 
                className="bg-gradient-to-b from-white via-white/95 via-[#fef2f2] to-[#fbcfe8] bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)] break-words"
              >
                {displayTitle}
              </span>
              <span className="text-[#f472b6] ml-0.5 sm:ml-1 inline-block animate-[sparklePulse_2s_ease-in-out_infinite]">.</span>
            </h1>
            
            {/* Sous-titre/Description de l'événement - Style splash screen - Responsive */}
            {displaySubtitle && (
              <p className="font-['Outfit',sans-serif] text-[clamp(0.75rem,3vw,0.95rem)] sm:text-[clamp(0.875rem,2.5vw,1rem)] md:text-[clamp(0.95rem,2vw,1rem)] lg:text-[clamp(0.95rem,1.5vw,1.05rem)] font-normal text-white/75 text-center text-shadow-[0_2px_10px_rgba(0,0,0,0.4)] max-w-2xl mx-auto leading-relaxed lg:leading-snug px-3 sm:px-4 mb-0 lg:mb-0 animate-[fadeInUp_0.8s_cubic-bezier(0.34,1.56,0.64,1)_0.6s_both]">
                {displaySubtitle}
              </p>
            )}
          </div>
        )}

        {/* Mobile Buttons Row - Below title on mobile */}
        <div className="flex-shrink-0 w-full flex justify-center px-2 sm:px-0 lg:mb-1">
          <MobileButtons
            onSelectMode={onSelectMode}
            isAdminAuthenticated={isAdminAuthenticated}
            hasUserProfile={hasUserProfile}
            statsEnabled={uiConfig.statsEnabled}
            battleModeEnabled={uiConfig.battleModeEnabled}
          />
        </div>

        {/* Navigation Cards - Centered and Enhanced - Responsive */}
        <div className="w-full max-w-3xl mx-auto flex-1 flex items-center justify-center py-2 sm:py-4 md:py-3 lg:py-2 px-2 sm:px-4 min-h-0">
          <NavigationCards
            options={navigationOptions}
            mounted={mounted}
            onSelectMode={onSelectMode}
          />
        </div>

        {/* Footer - Responsive - Compact sur desktop */}
        <div className="flex-shrink-0 mt-auto pb-2 sm:pb-3 md:pb-2 lg:pb-1 px-2 sm:px-4">
          <LandingFooter />
        </div>
      </main>

      {/* Floating Particles Effect - Amélioré avec plus d'animations */}
      <div className="fixed inset-0 pointer-events-none z-[1]">
        {[...Array(isMobile ? 5 : 10)].map((_, i) => (
          <div
            key={i}
            className={`absolute ${isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full bg-white/20 blur-sm`}
            style={{
              left: `${10 + i * (isMobile ? 20 : 9)}%`,
              top: `${15 + i * (isMobile ? 18 : 8)}%`,
              animation: `float-particle ${4 + (i % 3) * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
              boxShadow: `0 0 ${isMobile ? '4px' : '6px'} rgba(255, 255, 255, 0.3)`,
            }}
          />
        ))}
      </div>
      
      {/* Styles d'animation pour particules */}
      <style>{`
        @keyframes float-particle {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          25% {
            transform: translate(10px, -15px) scale(1.2);
            opacity: 0.6;
          }
          50% {
            transform: translate(-8px, -25px) scale(0.9);
            opacity: 0.8;
          }
          75% {
            transform: translate(12px, -10px) scale(1.1);
            opacity: 0.5;
          }
        }
      `}</style>

    </div>
  );
};

export default React.memo(Landing);
