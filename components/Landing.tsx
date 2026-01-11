import React, { useEffect, useState, useMemo } from 'react';
import { ViewMode } from '../types';
import { Images, Camera, User, Lock, HelpCircle, BarChart3, Smartphone, Trophy, LucideIcon, ArrowRight, Zap } from 'lucide-react';
import { getCurrentUserName, getCurrentUserAvatar } from '../utils/userAvatar';
import { getSettings, subscribeToSettings, defaultSettings } from '../services/settingsService';
import { useEvent } from '../context/EventContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { getStaticAssetPath } from '../utils/electronPaths';

interface LandingProps {
  onSelectMode: (mode: ViewMode) => void;
  isAdminAuthenticated?: boolean;
}

// Composant ActionButton intégré
interface ActionButtonProps {
  onClick: () => void;
  icon: LucideIcon;
  title: string;
  ariaLabel: string;
  gradient?: string;
  glowColor?: string;
  className?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  icon: Icon,
  title,
  ariaLabel,
  gradient = 'from-white/8 via-white/5 to-white/8',
  glowColor = 'rgba(99, 102, 241, 0.15)',
  className = '',
}) => {
  const defaultStyle: React.CSSProperties = {
    boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px ${glowColor}, inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
  };

  return (
    <button
      onClick={onClick}
      className={`relative p-2.5 sm:p-3 rounded-xl sm:rounded-2xl backdrop-blur-xl bg-gradient-to-br ${gradient} hover:from-white/15 hover:via-white/10 hover:to-white/15 active:from-white/20 active:via-white/15 active:to-white/20 border border-white/20 hover:border-white/40 active:border-white/50 text-white/80 hover:text-white active:scale-95 transition-all duration-300 group shadow-xl hover:shadow-2xl overflow-hidden ${className}`}
      style={defaultStyle}
      title={title}
      aria-label={ariaLabel}
      onFocus={(e: React.FocusEvent<HTMLButtonElement>) => {
        e.currentTarget.style.boxShadow = `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 30px ${glowColor.replace('0.15', '0.3')}, inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 0 3px ${glowColor.replace('0.15', '0.5')}`;
      }}
      onBlur={(e: React.FocusEvent<HTMLButtonElement>) => {
        e.currentTarget.style.boxShadow = defaultStyle.boxShadow as string;
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-purple-500/0 to-cyan-500/0 group-hover:from-pink-500/20 group-hover:via-purple-500/20 group-hover:to-cyan-500/20 transition-all duration-500 opacity-0 group-hover:opacity-100 blur-sm" />
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="absolute inset-0 bg-pink-500/20 rounded-xl sm:rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <Icon className="relative w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 group-hover:rotate-3 group-active:scale-95 group-active:rotate-0 transition-all duration-300 drop-shadow-lg" />
    </button>
  );
};

// Composant TopRightButtons intégré
interface TopRightButtonsProps {
  onSelectMode: (mode: ViewMode) => void;
  isAdminAuthenticated: boolean;
  hasUserProfile: boolean;
  statsEnabled: boolean;
  battleModeEnabled: boolean;
}

const TopRightButtons: React.FC<TopRightButtonsProps> = ({
  onSelectMode,
  isAdminAuthenticated,
  hasUserProfile,
  statsEnabled,
  battleModeEnabled,
}) => {
  return (
    <div className="hidden sm:flex fixed top-1/2 right-2 sm:right-4 -translate-y-1/2 z-50 flex-col items-center gap-3 sm:gap-4 py-4 px-2 rounded-full backdrop-blur-sm bg-black/10 border border-white/5 transition-all duration-300 hover:bg-black/20">
      {hasUserProfile && (
        <ActionButton
          onClick={() => onSelectMode('guest-profile')}
          icon={User}
          title="Mon profil"
          ariaLabel="Mon profil"
          glowColor="rgba(236, 72, 153, 0.15)"
        />
      )}
      <ActionButton
        onClick={() => onSelectMode('help')}
        icon={HelpCircle}
        title="Aide"
        ariaLabel="Aide"
        gradient="from-indigo-500/0 via-blue-500/0 to-cyan-500/0"
        glowColor="rgba(99, 102, 241, 0.15)"
      />
      {isAdminAuthenticated && (
        <ActionButton
          onClick={() => onSelectMode('projection')}
          icon={Camera}
          title="Projection Murale"
          ariaLabel="Projection Murale"
          glowColor="rgba(236, 72, 153, 0.15)"
        />
      )}
      {isAdminAuthenticated && (
        <ActionButton
          onClick={() => onSelectMode('wall')}
          icon={Images}
          title="Mur Live"
          ariaLabel="Mur Live"
          gradient="from-indigo-500/0 via-blue-500/0 to-cyan-500/0"
          glowColor="rgba(99, 102, 241, 0.15)"
        />
      )}
      {statsEnabled && (
        <ActionButton
          onClick={() => onSelectMode('stats-display')}
          icon={BarChart3}
          title="Statistiques"
          ariaLabel="Statistiques"
          gradient="from-cyan-500/0 via-blue-500/0 to-indigo-500/0"
          glowColor="rgba(34, 211, 238, 0.15)"
        />
      )}
      {isAdminAuthenticated && (
        <button
          onClick={() => onSelectMode('mobile-control')}
          className="relative p-2.5 sm:p-3 rounded-xl sm:rounded-2xl backdrop-blur-xl bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:via-blue-500/30 hover:to-purple-500/30 active:from-cyan-500/40 active:via-blue-500/40 active:to-purple-500/40 border-2 border-cyan-400/30 hover:border-cyan-400/50 text-white active:scale-95 transition-all duration-300 group shadow-lg hover:shadow-2xl overflow-hidden"
          style={{
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(34, 211, 238, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          }}
          title="Contrôle Mobile"
          aria-label="Contrôle Mobile"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-400/30 rounded-full blur-md group-hover:bg-cyan-400/50 transition-all duration-300 animate-pulse" />
            <Smartphone className="relative w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 group-hover:rotate-6 group-active:scale-95 group-active:rotate-0 transition-all duration-300 drop-shadow-lg" />
          </div>
        </button>
      )}
      {battleModeEnabled && (
        <button
          onClick={() => onSelectMode('battle-results')}
          className="relative p-2.5 sm:p-3 rounded-xl sm:rounded-2xl backdrop-blur-xl bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-yellow-500/20 hover:from-yellow-500/30 hover:via-orange-500/30 hover:to-yellow-500/30 active:from-yellow-500/40 active:via-orange-500/40 active:to-yellow-500/40 border-2 border-yellow-500/30 hover:border-yellow-500/50 text-yellow-400 hover:text-yellow-300 active:scale-95 transition-all duration-300 group shadow-xl hover:shadow-2xl overflow-hidden"
          style={{
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(234, 179, 8, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          }}
          title="Résultats des Battles"
          aria-label="Résultats des Battles"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-orange-500/0 to-yellow-500/0 group-hover:from-yellow-500/25 group-hover:via-orange-500/25 group-hover:to-yellow-500/25 transition-all duration-500 opacity-0 group-hover:opacity-100 blur-sm rounded-xl sm:rounded-2xl" />
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <Trophy className="relative w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 group-hover:rotate-3 group-active:scale-95 group-active:rotate-0 transition-all duration-300 drop-shadow-lg" />
        </button>
      )}
      <ActionButton
        onClick={() => onSelectMode('admin')}
        icon={Lock}
        title="Administration"
        ariaLabel="Administration"
        gradient="from-purple-500/0 via-violet-500/0 to-fuchsia-500/0"
        glowColor="rgba(139, 92, 246, 0.15)"
      />
    </div>
  );
};

// Composant MobileButtons intégré
interface MobileButtonsProps {
  onSelectMode: (mode: ViewMode) => void;
  isAdminAuthenticated: boolean;
  hasUserProfile: boolean;
  statsEnabled: boolean;
  battleModeEnabled: boolean;
}

const MobileButtons: React.FC<MobileButtonsProps> = ({
  onSelectMode,
  isAdminAuthenticated,
  hasUserProfile,
  statsEnabled,
  battleModeEnabled,
}) => {
  return (
    <div className="sm:hidden flex items-center gap-1.5 flex-wrap justify-center w-full mt-2 px-2">
      {hasUserProfile && (
        <ActionButton
          onClick={() => onSelectMode('guest-profile')}
          icon={User}
          title="Mon profil"
          ariaLabel="Mon profil"
          glowColor="rgba(236, 72, 153, 0.15)"
          className="p-2.5 rounded-xl"
        />
      )}
      <ActionButton
        onClick={() => onSelectMode('help')}
        icon={HelpCircle}
        title="Aide"
        ariaLabel="Aide"
        gradient="from-indigo-500/0 via-blue-500/0 to-cyan-500/0"
        glowColor="rgba(99, 102, 241, 0.15)"
        className="p-2.5 rounded-xl"
      />
      {isAdminAuthenticated && (
        <button
          onClick={() => onSelectMode('mobile-control')}
          className="relative p-2.5 rounded-xl backdrop-blur-xl bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:via-blue-500/30 hover:to-purple-500/30 active:from-cyan-500/40 active:via-blue-500/40 active:to-purple-500/40 border-2 border-cyan-400/30 hover:border-cyan-400/50 text-white active:scale-95 transition-all duration-300 group shadow-lg hover:shadow-2xl overflow-hidden"
          style={{
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(34, 211, 238, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          }}
          title="Contrôle Mobile"
          aria-label="Contrôle Mobile"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
          <Smartphone className="relative w-4 h-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 drop-shadow-lg" />
        </button>
      )}
      {battleModeEnabled && (
        <button
          onClick={() => onSelectMode('battle-results')}
          className="relative p-2.5 rounded-xl backdrop-blur-xl bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-yellow-500/20 hover:from-yellow-500/30 hover:via-orange-500/30 hover:to-yellow-500/30 active:from-yellow-500/40 active:via-orange-500/40 active:to-yellow-500/40 border-2 border-yellow-500/30 hover:border-yellow-500/50 text-yellow-400 hover:text-yellow-300 active:scale-95 transition-all duration-300 group shadow-xl hover:shadow-2xl overflow-hidden"
          style={{
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(234, 179, 8, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          }}
          title="Résultats des Battles"
          aria-label="Résultats des Battles"
        >
          <Trophy className="relative w-4 h-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 drop-shadow-lg" />
        </button>
      )}
      <ActionButton
        onClick={() => onSelectMode('admin')}
        icon={Lock}
        title="Administration"
        ariaLabel="Administration"
        gradient="from-purple-500/0 via-violet-500/0 to-fuchsia-500/0"
        glowColor="rgba(139, 92, 246, 0.15)"
        className="p-2.5 rounded-xl"
      />
    </div>
  );
};

// Composant NavigationCards intégré
interface NavigationOption {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  glowColor: string;
  delay: string;
  isPrimary: boolean;
}

interface NavigationCardsProps {
  options: NavigationOption[];
  mounted: boolean;
  onSelectMode: (mode: ViewMode) => void;
}

const NavigationCards: React.FC<NavigationCardsProps> = ({
  options,
  mounted,
  onSelectMode,
}) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<string | null>(null);

  return (
    <div className="w-full flex flex-col lg:flex-row items-center gap-2 lg:gap-3 lg:justify-center">
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = hoveredCard === option.id || activeCard === option.id;

        return (
          <button
            key={option.id}
            onClick={() => onSelectMode(option.id as ViewMode)}
            onMouseEnter={() => setHoveredCard(option.id)}
            onMouseLeave={() => setHoveredCard(null)}
            onTouchStart={() => setActiveCard(option.id)}
            onTouchEnd={() => setActiveCard(null)}
            onFocus={() => setHoveredCard(option.id)}
            onBlur={() => setHoveredCard(null)}
            className={`group relative w-full lg:w-auto lg:flex-1 lg:max-w-[140px] h-auto min-h-[80px] sm:min-h-[90px] lg:h-auto lg:aspect-square lg:min-h-[140px] rounded-xl sm:rounded-2xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition-all duration-500 px-3 sm:px-4 lg:px-0 py-3 sm:py-4 lg:py-0 select-none ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
            }`}
            style={{
              animationDelay: option.delay,
              transform: isActive ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
              transition: 'all 0.28s cubic-bezier(.45,.05,.55,.95)'
            }}
            aria-label={option.title}
            tabIndex={0}
            type="button"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${option.gradient} transition-opacity duration-700 pointer-events-none ${
                isActive ? 'opacity-40 blur-[2px]' : 'opacity-0'
              }`}
            />
            <div
              className="relative h-full bg-white/10 border border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-between lg:justify-center px-3 sm:px-4 lg:px-4 gap-3 sm:gap-4 lg:gap-0 shadow-xl transition-shadow duration-500"
              style={{
                boxShadow: isActive
                  ? `0 4px 32px 0 ${option.glowColor}, 0 2px 12px rgba(0,0,0,0.14)`
                  : '0 2px 8px rgba(0,0,0,0.10)',
              }}
            >
              <div className="flex-shrink-0 relative">
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl lg:rounded-2xl flex items-center justify-center bg-gradient-to-br ${option.gradient} shadow-md transition-all duration-300 group-hover:scale-110 group-active:scale-105 ${
                    isActive ? 'scale-110 ring-2 ring-white/30' : ''
                  }`}
                  style={{
                    boxShadow: isActive ? `0 4px 20px ${option.glowColor}` : undefined,
                  }}
                >
                  <Icon className="w-7 h-7 sm:w-8 sm:h-8 lg:w-8 lg:h-8 text-white drop-shadow" />
                </div>
                {option.isPrimary && (
                  <div className="absolute -top-1.5 -right-1.5 lg:-top-2 lg:-right-2 z-20">
                    <span className="inline-flex items-center bg-yellow-600/90 px-1.5 py-0.5 rounded shadow text-yellow-100 text-[10px] lg:text-xs font-black animate-pulse">
                      <Zap className="w-3 h-3 lg:w-4 lg:h-4 mr-0.5 text-yellow-300 drop-shadow" />
                      <span className="hidden sm:inline">HOT</span>
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 text-left lg:hidden ml-3 sm:ml-4">
                <div className="flex items-center gap-2 min-w-0 mb-1">
                  <h3
                    className={`text-base sm:text-lg font-bold transition-all duration-300 ${
                      isActive
                        ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-violet-300 to-sky-300 drop-shadow-sm'
                        : 'text-white'
                    }`}
                  >
                    {option.title}
                  </h3>
                  {option.isPrimary && (
                    <span role="img" aria-label="Recommandé" className="text-sm text-yellow-200 font-black">★</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      isActive
                        ? `bg-gradient-to-r ${option.gradient} scale-150 shadow-lg`
                        : 'bg-slate-400'
                    }`}
                  />
                  <span className={`text-xs sm:text-sm transition-colors duration-300 ${
                    isActive ? 'text-white/90 font-medium' : 'text-slate-300'
                  }`}>
                    {option.description}
                  </span>
                </div>
              </div>
              <div className="hidden lg:flex flex-col items-center justify-center gap-3 w-full">
                <h3
                  className={`text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-violet-300 to-sky-300 drop-shadow-sm'
                      : 'text-white/90'
                  }`}
                >
                  {option.id === 'guest' ? 'Capturer' : option.id === 'gallery' ? 'Explorer' : option.id === 'findme' ? 'Où suis-je' : option.title}
                </h3>
              </div>
              <div className="flex-shrink-0 ml-2 lg:hidden">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center bg-white/10 transition-all duration-300 ${
                    isActive ? 'bg-gradient-to-br from-white/60 to-white/20 scale-110 ring-2 ring-white/40 shadow-lg' : ''
                  }`}
                  style={{
                    boxShadow: isActive ? `0 0 10px ${option.glowColor}` : undefined,
                  }}
                >
                  <ArrowRight
                    className={`w-4 h-4 text-white transition-transform duration-300 ${
                      isActive ? 'translate-x-1 scale-125 drop-shadow-sm' : ''
                    }`}
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

// Composant LandingFooter intégré
const LandingFooter: React.FC = () => {
  return (
    <footer className="py-4 px-4 text-center">
      <p className="text-xs text-white/50">
        © 2026 Partywall - Tous droits réservés
      </p>
    </footer>
  );
};

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
    backgroundMobileUrl: defaultSettings.background_mobile_url,
    logoUrl: defaultSettings.logo_url
  });

  const displayTitle = useMemo(() => {
    if (currentEvent?.name) {
      return currentEvent.name;
    }
    return uiConfig.title;
  }, [currentEvent?.name, uiConfig.title]);

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
    const userName = getCurrentUserName();
    const userAvatar = getCurrentUserAvatar();
    setHasUserProfile(!!(userName && userAvatar));
  }, []);

  useEffect(() => {
    if (!currentEvent?.id) {
      setUiConfig({
        title: defaultSettings.event_title,
        subtitle: defaultSettings.event_subtitle,
        statsEnabled: defaultSettings.stats_enabled,
        findMeEnabled: defaultSettings.find_me_enabled,
        battleModeEnabled: defaultSettings.battle_mode_enabled ?? false,
        backgroundDesktopUrl: defaultSettings.background_desktop_url,
        backgroundMobileUrl: defaultSettings.background_mobile_url,
        logoUrl: defaultSettings.logo_url
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
        backgroundMobileUrl: settings.background_mobile_url ?? prev.backgroundMobileUrl,
        logoUrl: settings.logo_url ?? prev.logoUrl
      }));
    });

    const subscription = subscribeToSettings(currentEvent.id, (newSettings) => {
      setUiConfig(prev => ({
        title: newSettings.event_title ?? prev.title,
        subtitle: newSettings.event_subtitle ?? prev.subtitle,
        statsEnabled: newSettings.stats_enabled ?? prev.statsEnabled,
        findMeEnabled: newSettings.find_me_enabled ?? prev.findMeEnabled,
        battleModeEnabled: newSettings.battle_mode_enabled ?? prev.battleModeEnabled,
        backgroundDesktopUrl: newSettings.background_desktop_url ?? prev.backgroundDesktopUrl,
        backgroundMobileUrl: newSettings.background_mobile_url ?? prev.backgroundMobileUrl,
        logoUrl: newSettings.logo_url ?? prev.logoUrl
      }));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [currentEvent?.id]);

  useEffect(() => {
    const handleStorageChange = () => {
      const userName = getCurrentUserName();
      const userAvatar = getCurrentUserAvatar();
      setHasUserProfile(!!(userName && userAvatar));
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

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
        title: 'Mur Social',
        description: 'Découvrez toutes les photos du mur social',
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
      {/* Background Image */}
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

      {/* Overlay sombre */}
      <div className="fixed inset-0 bg-black/40 z-[1] pointer-events-none" />

      {/* Top Right Buttons - Bouton de contrôle à droite */}
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
        
        {/* Logo et titre centrés si événement sélectionné */}
        {currentEvent && (
          <div className="flex-shrink-0 w-full flex flex-col items-center justify-center gap-3 sm:gap-4 md:gap-4 lg:gap-3 mb-3 sm:mb-4 md:mb-4 lg:mb-2 px-2">
            <div className="relative mb-4 sm:mb-5 md:mb-5 lg:mb-3 animate-[fadeInScale_0.8s_cubic-bezier(0.34,1.56,0.64,1)_0.2s_both]">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-[20px] scale-75"></div>
                <div className="relative flex items-center justify-center">
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
            
            {uiConfig.logoUrl ? (
              <div className="relative mb-2 sm:mb-2 md:mb-2 lg:mb-1 px-2 drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] animate-[fadeInUp_0.8s_cubic-bezier(0.34,1.56,0.64,1)_0.4s_both]">
                <img
                  src={uiConfig.logoUrl}
                  alt={displayTitle}
                  className="max-w-[80vw] sm:max-w-[70vw] md:max-w-[60vw] lg:max-w-[50vw] max-h-24 sm:max-h-32 md:max-h-40 lg:max-h-48 object-contain mx-auto"
                  style={{
                    filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.5))',
                  }}
                />
              </div>
            ) : (
              <h1 className="relative font-['Pacifico',cursive] text-[clamp(2rem,6vw,3.5rem)] sm:text-[clamp(2.5rem,7vw,4rem)] md:text-[clamp(3rem,7vw,3.8rem)] lg:text-[clamp(3.2rem,6vw,4rem)] leading-[1.1] sm:leading-[1.2] lg:leading-[1.15] text-center mb-2 sm:mb-2 md:mb-2 lg:mb-1 px-2 drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] animate-[fadeInUp_0.8s_cubic-bezier(0.34,1.56,0.64,1)_0.4s_both]">
                <span 
                  className="bg-gradient-to-b from-white via-white/95 via-[#fef2f2] to-[#fbcfe8] bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)] break-words"
                >
                  {displayTitle}
                </span>
                <span className="text-[#f472b6] ml-0.5 sm:ml-1 inline-block animate-[sparklePulse_2s_ease-in-out_infinite]">.</span>
              </h1>
            )}
            
            {displaySubtitle && (
              <p className="font-['Outfit',sans-serif] text-[clamp(0.75rem,3vw,0.95rem)] sm:text-[clamp(0.875rem,2.5vw,1rem)] md:text-[clamp(0.95rem,2vw,1rem)] lg:text-[clamp(0.95rem,1.5vw,1.05rem)] font-normal text-white/75 text-center text-shadow-[0_2px_10px_rgba(0,0,0,0.4)] max-w-2xl mx-auto leading-relaxed lg:leading-snug px-3 sm:px-4 mb-0 lg:mb-0 animate-[fadeInUp_0.8s_cubic-bezier(0.34,1.56,0.64,1)_0.6s_both]">
                {displaySubtitle}
              </p>
            )}
          </div>
        )}

        {/* Mobile Buttons Row */}
        <div className="flex-shrink-0 w-full flex justify-center px-2 sm:px-0 lg:mb-1">
          <MobileButtons
            onSelectMode={onSelectMode}
            isAdminAuthenticated={isAdminAuthenticated}
            hasUserProfile={hasUserProfile}
            statsEnabled={uiConfig.statsEnabled}
            battleModeEnabled={uiConfig.battleModeEnabled}
          />
        </div>

        {/* Navigation Cards */}
        <div className="w-full max-w-3xl mx-auto flex-1 flex items-center justify-center py-2 sm:py-4 md:py-3 lg:py-2 px-2 sm:px-4 min-h-0">
          <NavigationCards
            options={navigationOptions}
            mounted={mounted}
            onSelectMode={onSelectMode}
          />
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 mt-auto pb-2 sm:pb-3 md:pb-2 lg:pb-1 px-2 sm:px-4">
          <LandingFooter />
        </div>
      </main>

      {/* Floating Particles Effect */}
      <div className="fixed inset-0 pointer-events-none z-[1]">
        {[...Array(isMobile ? 3 : 6)].map((_, i) => (
          <div
            key={i}
            className={`absolute ${isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'} rounded-full bg-white/10 blur-sm animate-float`}
            style={{
              left: `${15 + i * (isMobile ? 30 : 15)}%`,
              top: `${20 + i * (isMobile ? 25 : 12)}%`,
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
