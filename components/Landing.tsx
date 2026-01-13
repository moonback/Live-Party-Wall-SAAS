import React, { useEffect, useState, useMemo } from 'react';
import { ViewMode } from '../types';
import { Images, Camera, User, Lock, HelpCircle, BarChart3, Smartphone, Trophy, LucideIcon, ArrowRight, Zap, Sparkles } from 'lucide-react';
import { getCurrentUserName, getCurrentUserAvatar } from '../utils/userAvatar';
import { getSettings, subscribeToSettings, defaultSettings } from '../services/settingsService';
import { useEvent } from '../context/EventContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { getStaticAssetPath } from '../utils/electronPaths';
import { motion, AnimatePresence } from 'framer-motion';

interface LandingProps {
  onSelectMode: (mode: ViewMode) => void;
  isAdminAuthenticated?: boolean;
}

// Composant CompactButton pour les boutons spéciaux
interface CompactButtonProps {
  onClick: () => void;
  icon: LucideIcon;
  title: string;
  ariaLabel: string;
  gradient: string;
  glowColor: string;
  textColor?: string;
}

const CompactButton: React.FC<CompactButtonProps> = ({
  onClick,
  icon: Icon,
  title,
  ariaLabel,
  gradient,
  glowColor,
  textColor = 'text-white',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1, y: -3 }}
      whileTap={{ scale: 0.9 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative p-2 rounded-xl backdrop-blur-xl bg-gradient-to-br ${gradient} border border-white/20 hover:border-white/40 ${textColor} transition-all duration-300 group overflow-hidden shadow-lg hover:shadow-2xl`}
      style={{
        boxShadow: isHovered
          ? `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px ${glowColor}, 0 0 40px ${glowColor.replace('0.4', '0.2')}`
          : `0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 0 ${glowColor}`,
      }}
      title={title}
      aria-label={ariaLabel}
    >
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-xl`}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        initial={{ x: '-100%' }}
        animate={isHovered ? { x: '100%' } : { x: '-100%' }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />
      <Icon className="relative w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 z-10" />
    </motion.button>
  );
};

// Composant ActionButton modernisé avec plus d'effets
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
  gradient = 'from-pink-500/20 via-purple-500/20 to-cyan-500/20',
  glowColor = 'rgba(236, 72, 153, 0.3)',
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1, y: -3 }}
      whileTap={{ scale: 0.9 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative p-2 rounded-xl backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 text-white/80 hover:text-white transition-all duration-300 group overflow-hidden shadow-lg hover:shadow-2xl ${className}`}
      style={{
        boxShadow: isHovered
          ? `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px ${glowColor}, 0 0 40px ${glowColor.replace('0.3', '0.2')}`
          : `0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 0 ${glowColor}`,
      }}
      title={title}
      aria-label={ariaLabel}
    >
      {/* Gradient background animé */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'linear',
        }}
      />
      
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        initial={{ x: '-100%' }}
        animate={isHovered ? { x: '100%' } : { x: '-100%' }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />
      
      {/* Pulse effect */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-xl`}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Glow ring */}
      <motion.div
        className="absolute -inset-0.5 rounded-xl border-2 border-white/0 group-hover:border-white/20 transition-all duration-500"
        style={{
          boxShadow: isHovered
            ? `0 0 20px ${glowColor}`
            : `0 0 0 0 ${glowColor}`,
        }}
        animate={{
          boxShadow: [
            `0 0 0 0 ${glowColor}`,
            `0 0 20px ${glowColor}`,
            `0 0 0 0 ${glowColor}`,
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <Icon className="relative w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 z-10" />
    </motion.button>
  );
};

// Composant TopRightButtons modernisé
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
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="hidden sm:flex fixed top-1/2 right-3 -translate-y-1/2 z-50 flex-col items-center gap-1.5 py-2.5 px-1.5 rounded-xl backdrop-blur-2xl bg-black/30 border border-white/10 shadow-2xl"
    >
      {hasUserProfile && (
        <ActionButton
          onClick={() => onSelectMode('guest-profile')}
          icon={User}
          title="Mon profil"
          ariaLabel="Mon profil"
          gradient="from-pink-500/20 via-rose-500/20 to-purple-500/20"
          glowColor="rgba(236, 72, 153, 0.4)"
        />
      )}
      <ActionButton
        onClick={() => onSelectMode('help')}
        icon={HelpCircle}
        title="Aide"
        ariaLabel="Aide"
        gradient="from-indigo-500/20 via-blue-500/20 to-cyan-500/20"
        glowColor="rgba(99, 102, 241, 0.4)"
      />
      {isAdminAuthenticated && (
        <>
          <ActionButton
            onClick={() => onSelectMode('projection')}
            icon={Camera}
            title="Projection Murale"
            ariaLabel="Projection Murale"
            gradient="from-pink-500/20 via-rose-500/20 to-purple-500/20"
            glowColor="rgba(236, 72, 153, 0.4)"
          />
          <ActionButton
            onClick={() => onSelectMode('wall')}
            icon={Images}
            title="Mur Live"
            ariaLabel="Mur Live"
            gradient="from-indigo-500/20 via-blue-500/20 to-cyan-500/20"
            glowColor="rgba(99, 102, 241, 0.4)"
          />
        </>
      )}
      {statsEnabled && (
        <ActionButton
          onClick={() => onSelectMode('stats-display')}
          icon={BarChart3}
          title="Statistiques"
          ariaLabel="Statistiques"
          gradient="from-cyan-500/20 via-blue-500/20 to-indigo-500/20"
          glowColor="rgba(34, 211, 238, 0.4)"
        />
      )}
      {isAdminAuthenticated && (
        <CompactButton
          onClick={() => onSelectMode('mobile-control')}
          icon={Smartphone}
          title="Contrôle Mobile"
          ariaLabel="Contrôle Mobile"
          gradient="from-cyan-500/20 via-blue-500/20 to-purple-500/20"
          glowColor="rgba(34, 211, 238, 0.4)"
        />
      )}
      {battleModeEnabled && (
        <CompactButton
          onClick={() => onSelectMode('battle-results')}
          icon={Trophy}
          title="Résultats des Battles"
          ariaLabel="Résultats des Battles"
          gradient="from-yellow-500/20 via-orange-500/20 to-yellow-500/20"
          glowColor="rgba(234, 179, 8, 0.4)"
          textColor="text-yellow-400 hover:text-yellow-300"
        />
      )}
      <ActionButton
        onClick={() => onSelectMode('admin')}
        icon={Lock}
        title="Administration"
        ariaLabel="Administration"
        gradient="from-purple-500/20 via-violet-500/20 to-fuchsia-500/20"
        glowColor="rgba(139, 92, 246, 0.4)"
      />
    </motion.div>
  );
};

// Composant MobileButtons modernisé
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
          gradient="from-pink-500/20 via-rose-500/20 to-purple-500/20"
          glowColor="rgba(236, 72, 153, 0.4)"
          className="p-2 rounded-xl"
        />
      )}
      <ActionButton
        onClick={() => onSelectMode('help')}
        icon={HelpCircle}
        title="Aide"
        ariaLabel="Aide"
        gradient="from-indigo-500/20 via-blue-500/20 to-cyan-500/20"
        glowColor="rgba(99, 102, 241, 0.4)"
        className="p-2 rounded-xl"
      />
      {isAdminAuthenticated && (
        <CompactButton
          onClick={() => onSelectMode('mobile-control')}
          icon={Smartphone}
          title="Contrôle Mobile"
          ariaLabel="Contrôle Mobile"
          gradient="from-cyan-500/20 via-blue-500/20 to-purple-500/20"
          glowColor="rgba(34, 211, 238, 0.4)"
        />
      )}
      {battleModeEnabled && (
        <CompactButton
          onClick={() => onSelectMode('battle-results')}
          icon={Trophy}
          title="Résultats des Battles"
          ariaLabel="Résultats des Battles"
          gradient="from-yellow-500/20 via-orange-500/20 to-yellow-500/20"
          glowColor="rgba(234, 179, 8, 0.4)"
          textColor="text-yellow-400 hover:text-yellow-300"
        />
      )}
      <ActionButton
        onClick={() => onSelectMode('admin')}
        icon={Lock}
        title="Administration"
        ariaLabel="Administration"
        gradient="from-purple-500/20 via-violet-500/20 to-fuchsia-500/20"
        glowColor="rgba(139, 92, 246, 0.4)"
        className="p-2 rounded-xl"
      />
    </div>
  );
};

// Composant NavigationCards complètement redessiné
interface NavigationOption {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  glowColor: string;
  delay: number;
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

  return (
    <div className="w-full flex flex-col lg:flex-row items-center gap-4 lg:gap-6 lg:justify-center">
      <AnimatePresence>
        {options.map((option) => {
          const Icon = option.icon;
          const isHovered = hoveredCard === option.id;

          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={mounted ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.9 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ 
                duration: 0.5, 
                delay: option.delay,
                type: "spring",
                stiffness: 100,
                damping: 15
              }}
              whileHover={{ y: -6, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectMode(option.id as ViewMode)}
              onMouseEnter={() => setHoveredCard(option.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onFocus={() => setHoveredCard(option.id)}
              onBlur={() => setHoveredCard(null)}
              className={`group relative w-full lg:w-auto lg:flex-1 lg:max-w-[180px] min-h-[70px] lg:min-h-[200px] rounded-lg lg:rounded-2xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black transition-all duration-500 shadow-lg hover:shadow-2xl ${
                mounted ? '' : 'pointer-events-none'
              }`}
              aria-label={option.title}
              type="button"
            >
              {/* Background avec glassmorphism élégant */}
              <div className="absolute inset-0 backdrop-blur-xl bg-gradient-to-br from-white/10 via-white/5 to-white/10 border border-white/20 group-hover:border-white/40 transition-all duration-500" />
              
              {/* Gradient overlay au hover avec pulse */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-0 group-hover:opacity-25 transition-opacity duration-500`}
                animate={isHovered ? { 
                  opacity: [0.15, 0.3, 0.15],
                  scale: [1, 1.05, 1]
                } : { opacity: 0, scale: 1 }}
                transition={{ 
                  duration: 2,
                  repeat: isHovered ? Infinity : 0,
                  ease: 'easeInOut'
                }}
              />
              
              {/* Effet de brillance animé */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                initial={{ x: '-100%' }}
                animate={isHovered ? { x: '100%' } : { x: '-100%' }}
                transition={{ duration: 0.8, repeat: isHovered ? Infinity : 0, ease: 'linear' }}
              />
              
              {/* Glow effect avec animation */}
              <motion.div
                className={`absolute -inset-0.5 bg-gradient-to-br ${option.gradient} rounded-2xl blur-xl`}
                animate={isHovered ? { 
                  opacity: [0.2, 0.5, 0.2],
                  scale: [1, 1.1, 1]
                } : { opacity: 0, scale: 1 }}
                transition={{ 
                  duration: 2,
                  repeat: isHovered ? Infinity : 0,
                  ease: 'easeInOut'
                }}
                style={{
                  boxShadow: isHovered 
                    ? `0 0 30px ${option.glowColor}, 0 0 60px ${option.glowColor.replace('0.4', '0.2')}`
                    : 'none'
                }}
              />
              
              {/* Pulse ring effect */}
              <motion.div
                className={`absolute -inset-1 border-2 border-transparent rounded-2xl`}
                animate={isHovered ? {
                  borderColor: [option.glowColor.replace('0.4', '0'), option.glowColor, option.glowColor.replace('0.4', '0')],
                  scale: [1, 1.05, 1]
                } : {
                  borderColor: 'transparent',
                  scale: 1
                }}
                transition={{
                  duration: 2,
                  repeat: isHovered ? Infinity : 0,
                  ease: 'easeInOut'
                }}
              />

              {/* Contenu */}
              <div className="relative h-full flex flex-col items-center justify-center gap-1.5 lg:gap-4 p-2.5 lg:p-5">
                {/* Badge Primary */}
                {option.isPrimary && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={mounted ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
                    transition={{ delay: option.delay + 0.2, type: "spring", stiffness: 200 }}
                    className="absolute top-1.5 right-1.5 lg:top-2 lg:right-2 z-10"
                  >
                    <motion.div
                      className="flex items-center gap-0.5 lg:gap-1 px-1 lg:px-1.5 py-0.5 rounded-full bg-gradient-to-r from-yellow-500/90 to-orange-500/90 backdrop-blur-sm border border-yellow-400/50 shadow-lg"
                      animate={isHovered ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                      transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0 }}
                    >
                      <Zap className="w-2 h-2 lg:w-2.5 lg:h-2.5 text-yellow-100" />
                      <span className="text-[8px] lg:text-[9px] font-bold text-yellow-100">POPULAIRE</span>
                    </motion.div>
                  </motion.div>
                )}

                {/* Icône */}
                <motion.div
                  className={`relative w-10 h-10 lg:w-16 lg:h-16 rounded-lg lg:rounded-2xl flex items-center justify-center bg-gradient-to-br ${option.gradient} shadow-2xl`}
                  animate={isHovered ? { scale: 1.15, rotate: [0, 5, -5, 0] } : { scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Icon className="w-5 h-5 lg:w-9 lg:h-9 text-white drop-shadow-lg relative z-10" />
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${option.gradient} rounded-lg lg:rounded-2xl blur-md`}
                    animate={isHovered ? { 
                      opacity: [0.5, 0.8, 0.5],
                      scale: [1, 1.2, 1]
                    } : { opacity: 0.5, scale: 1 }}
                    transition={{ 
                      duration: 2,
                      repeat: isHovered ? Infinity : 0,
                      ease: 'easeInOut'
                    }}
                  />
                  {/* Glow autour de l'icône */}
                  <motion.div
                    className={`absolute -inset-1 bg-gradient-to-br ${option.gradient} rounded-lg lg:rounded-2xl blur-sm`}
                    animate={isHovered ? { opacity: [0.3, 0.6, 0.3] } : { opacity: 0 }}
                    transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0 }}
                  />
                </motion.div>

                {/* Texte */}
                <div className="flex flex-col items-center gap-0.5 lg:gap-1.5 text-center">
                  <h3 className="text-xs lg:text-lg font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-pink-300 group-hover:via-violet-300 group-hover:to-sky-300 transition-all duration-500">
                    {option.id === 'guest' ? 'Capturer' : option.id === 'gallery' ? 'Explorer' : option.id === 'findme' ? 'Retrouver' : option.title}
                  </h3>
                  <p className="text-[10px] lg:text-xs text-white/60 group-hover:text-white/80 transition-colors duration-500 hidden lg:block">
                    {option.description}
                  </p>
                </div>

                {/* Indicateur de flèche */}
                <motion.div
                  className="absolute bottom-1.5 lg:bottom-4"
                  animate={isHovered ? { 
                    x: [0, 4, 0],
                    opacity: [0.4, 1, 0.4]
                  } : { x: 0, opacity: 0.4 }}
                  transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0, ease: "easeInOut" }}
                >
                  <ArrowRight className="w-3 h-3 lg:w-5 lg:h-5 text-white/40 group-hover:text-white/90 transition-colors duration-500" />
                </motion.div>
              </div>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// Composant LandingFooter modernisé
const LandingFooter: React.FC = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 0.6 }}
      className="py-4 px-4 text-center"
    >
      <p className="text-xs text-white/40 font-light">
        © 2026 Partywall - Tous droits réservés
      </p>
    </motion.footer>
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
    const options: NavigationOption[] = [
      {
        id: 'guest',
        title: 'Capturez vos meilleurs moments',
        description: 'Partagez vos photos instantanément',
        icon: Camera,
        gradient: 'from-pink-500 via-rose-500 to-purple-500',
        glowColor: 'rgba(236, 72, 153, 0.4)',
        delay: 0.1,
        isPrimary: true,
      },
      {
        id: 'gallery',
        title: 'Mur Social',
        description: 'Découvrez toutes les photos',
        icon: Images,
        gradient: 'from-indigo-500 via-blue-500 to-cyan-500',
        glowColor: 'rgba(99, 102, 241, 0.4)',
        delay: 0.2,
        isPrimary: false,
      }
    ];

    if (uiConfig.findMeEnabled) {
      options.push({
        id: 'findme',
        title: 'Retrouve-moi',
        description: 'Trouvez vos photos avec l\'IA',
        icon: User,
        gradient: 'from-fuchsia-500 via-purple-500 to-indigo-500',
        glowColor: 'rgba(217, 70, 239, 0.4)',
        delay: 0.3,
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
      {/* Background Image avec overlay moderne */}
      <div className="fixed inset-0 z-0">
        <img
          src={
            isMobile
              ? (uiConfig.backgroundMobileUrl || getStaticAssetPath('background-mobile.png'))
              : (uiConfig.backgroundDesktopUrl || getStaticAssetPath('background-desktop.png'))
          }
          alt="Background"
          className="w-full h-full object-cover"
          style={{
            minWidth: '100%',
            minHeight: '100%',
          }}
        />
        {/* Overlay gradient moderne */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
        {/* Grille subtile */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Top Right Buttons */}
      <TopRightButtons
        onSelectMode={onSelectMode}
        isAdminAuthenticated={isAdminAuthenticated}
        hasUserProfile={hasUserProfile}
        statsEnabled={uiConfig.statsEnabled}
        battleModeEnabled={uiConfig.battleModeEnabled}
      />

      {/* Main Content */}
      <main className={`relative z-[2] w-full max-w-6xl mx-auto flex flex-col items-center justify-center gap-6 lg:gap-8 px-4 sm:px-6 md:px-8 h-full ${
        currentEvent 
          ? 'py-6 sm:py-8 md:py-8 lg:py-6' 
          : 'pt-20 sm:pt-24 md:pt-24 lg:pt-20 py-6 sm:py-8 md:py-8 lg:py-6'
      }`}>
        
        {/* Header avec logo et titre */}
        {currentEvent && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex-shrink-0 w-full flex flex-col items-center justify-center gap-4 lg:gap-5 mb-4 lg:mb-6 px-4"
          >
            {/* Logo container */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
              className="relative mb-2"
            >
              <div className="relative flex items-center justify-center">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 via-purple-500/30 to-cyan-500/30 rounded-full blur-2xl scale-150" />
                {/* Icon container */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-3xl bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl">
                  <Camera className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white drop-shadow-lg" />
                  {/* Sparkle effect */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-2 -right-2"
                  >
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400 drop-shadow-lg" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
            
            {/* Logo ou Titre */}
            {uiConfig.logoUrl ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="relative"
              >
                <img
                  src={uiConfig.logoUrl}
                  alt={displayTitle}
                  className="max-w-[85vw] sm:max-w-[75vw] md:max-w-[65vw] lg:max-w-[55vw] max-h-28 sm:max-h-36 md:max-h-44 lg:max-h-52 object-contain mx-auto"
                  style={{
                    filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.6))',
                  }}
                />
              </motion.div>
            ) : (
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-center mb-2"
              >
                <span className="bg-gradient-to-br from-white via-white/95 to-pink-200 bg-clip-text text-transparent drop-shadow-2xl">
                  {displayTitle}
                </span>
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-pink-400 ml-2"
                >
                  .
                </motion.span>
              </motion.h1>
            )}
            
            {/* Subtitle */}
            {displaySubtitle && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="text-sm sm:text-base lg:text-lg font-light text-white/70 text-center max-w-2xl mx-auto leading-relaxed"
              >
                {displaySubtitle}
              </motion.p>
            )}
          </motion.div>
        )}

        {/* Mobile Buttons Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex-shrink-0 w-full flex justify-center px-2 sm:px-0"
        >
          <MobileButtons
            onSelectMode={onSelectMode}
            isAdminAuthenticated={isAdminAuthenticated}
            hasUserProfile={hasUserProfile}
            statsEnabled={uiConfig.statsEnabled}
            battleModeEnabled={uiConfig.battleModeEnabled}
          />
        </motion.div>

        {/* Navigation Cards */}
        <div className="w-full max-w-5xl mx-auto flex-1 flex items-center justify-center py-4 lg:py-6 px-4 min-h-0">
          <NavigationCards
            options={navigationOptions}
            mounted={mounted}
            onSelectMode={onSelectMode}
          />
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 mt-auto pb-4 lg:pb-6 px-4">
          <LandingFooter />
        </div>
      </main>

      {/* Floating Particles Effect modernisé */}
      <div className="fixed inset-0 pointer-events-none z-[1]">
        {[...Array(isMobile ? 4 : 8)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute ${isMobile ? 'w-2 h-2' : 'w-3 h-3'} rounded-full bg-white/10 backdrop-blur-sm`}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.sin(i) * 20, 0],
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
            style={{
              left: `${10 + i * (isMobile ? 25 : 12)}%`,
              top: `${15 + i * (isMobile ? 20 : 10)}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default React.memo(Landing);
