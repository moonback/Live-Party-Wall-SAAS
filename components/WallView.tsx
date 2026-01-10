import React, { useEffect, useRef, useState, lazy, Suspense, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Photo } from '../types';
import { AR_DEFAULT_LIKES_THRESHOLD, AR_DEFAULT_TIME_WINDOW } from '../constants';
import { ARSceneManager, type ARSceneManagerRef } from './arEffects/ARSceneManager';
import { playVictorySound, playDefeatOrTieSound } from '../utils/soundService';
import { getBaseUrl } from '../utils/urlUtils';
import { logger } from '../utils/logger';
import { useEvent } from '../context/EventContext';

// Hooks
import { useWallData } from '../hooks/wall/useWallData';
import { useWallBattles } from '../hooks/wall/useWallBattles';
import { useWallSettings } from '../hooks/wall/useWallSettings';
import { useAutoScroll } from '../hooks/wall/useAutoScroll';
import { useReactionFlow } from '../hooks/wall/useReactionFlow';
import { useAutoCarousel } from '../hooks/wall/useAutoCarousel';

// Components
import { WallBackground } from './wall/WallBackground';
import { WallHeader } from './wall/WallHeader';
import { WallFooter } from './wall/WallFooter';
import { WallControls } from './wall/WallControls';
import { WallMasonry } from './wall/WallMasonry';
import { IdleScreen } from './wall/Overlays/IdleScreen';
import { FlyingReactions } from './wall/Overlays/FlyingReactions';
import { WinnerOverlay } from './wall/Overlays/WinnerOverlay';
import { TieOverlay } from './wall/Overlays/TieOverlay';
import { NewPhotoIndicator } from './wall/Overlays/NewPhotoIndicator';
import { FloatingQrCode } from './wall/FloatingQrCode';

// Lazy Components
const Lightbox = lazy(() => import('./Lightbox'));

interface WallViewProps {
  photos: Photo[];
  onBack: () => void;
}

const WallView: React.FC<WallViewProps> = ({ photos: initialPhotos, onBack }) => {
  // --- State & Refs ---
  const scrollRef = useRef<HTMLDivElement>(null);
  const arSceneManagerRef = useRef<ARSceneManagerRef>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [showQrCodes, setShowQrCodes] = useState(true);
  const [hoveredPhoto, setHoveredPhoto] = useState<string | null>(null);
  const [isHoveringControls, setIsHoveringControls] = useState(false);
  const [isIdle, setIsIdle] = useState(false);

  // --- Hooks ---
  const { uiConfig, isKiosqueMode, settings } = useWallSettings();
  
  // --- Event Context ---
  const { currentEvent } = useEvent();
  
  // Debug: Log quand alert_text change
  useEffect(() => {
    logger.info('WallView: alert_text changed', { 
      component: 'WallView', 
      alert_text: settings.alert_text,
      has_alert: !!(settings.alert_text && settings.alert_text.trim())
    });
  }, [settings.alert_text]);
  
  const { 
    photos, 
    photosReactions, 
    isLoadingNew, 
    stats,
    newPhotoIndicator 
  } = useWallData({ initialPhotos, settings });

  const { 
    battles, 
    winnerPhotoDisplay, 
    tieBattleDisplay, 
    handleBattleFinished 
  } = useWallBattles(settings.battle_mode_enabled !== false, currentEvent?.id);

  const { isPaused, setIsPaused } = useAutoScroll({
    enabled: true, // Auto-scroll is always enabled by default, controlled by pause
    speed: uiConfig.scrollSpeed,
    containerRef: scrollRef,
    hasContent: photos.length > 0
  });

  const { flyingReactions } = useReactionFlow();

  // --- Derived State ---
  const showBattles = settings.battle_mode_enabled !== false;
  const displayedPhotos = photos; // useWallData gère déjà l'ordre/filtrage si besoin

  // Détection des nouveaux likes et réactions pour arrêter le carrousel
  const lastLikesCountRef = useRef<Map<string, number>>(new Map());
  const lastReactionsCountRef = useRef<Map<string, number>>(new Map());
  const [hasNewLike, setHasNewLike] = useState(false);
  const [hasNewReaction, setHasNewReaction] = useState(false);

  // Détecter les nouveaux likes
  useEffect(() => {
    const currentLikes = new Map<string, number>();
    photos.forEach(photo => {
      currentLikes.set(photo.id, photo.likes_count || 0);
    });

    // Vérifier s'il y a eu un nouveau like
    let newLikeDetected = false;
    currentLikes.forEach((count, photoId) => {
      const previousCount = lastLikesCountRef.current.get(photoId) || 0;
      if (count > previousCount) {
        newLikeDetected = true;
      }
    });

    if (newLikeDetected) {
      setHasNewLike(true);
      setTimeout(() => setHasNewLike(false), 100); // Reset après un court délai
    }

    lastLikesCountRef.current = currentLikes;
  }, [photos]);

  // Détecter les nouvelles réactions
  useEffect(() => {
    const currentReactions = new Map<string, number>();
    photosReactions.forEach((reactions, photoId) => {
      const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);
      currentReactions.set(photoId, totalReactions);
    });

    // Vérifier s'il y a eu une nouvelle réaction
    let newReactionDetected = false;
    currentReactions.forEach((count, photoId) => {
      const previousCount = lastReactionsCountRef.current.get(photoId) || 0;
      if (count > previousCount) {
        newReactionDetected = true;
      }
    });

    if (newReactionDetected) {
      setHasNewReaction(true);
      setTimeout(() => setHasNewReaction(false), 100); // Reset après un court délai
    }

    lastReactionsCountRef.current = currentReactions;
  }, [photosReactions]);

  // Hook pour le carrousel automatique
  useAutoCarousel({
    photos: displayedPhotos,
    lightboxIndex,
    setLightboxIndex,
    newPhotoIndicator,
    hasNewLike,
    hasNewReaction,
    enabled: true,
    inactivityDelay: 60 * 1000, // 1 minute
    photoDisplayDuration: 3000 // 3 secondes par photo
  });
  
  // Construire l'URL du QR code avec le slug de l'événement
  const uploadUrl = useMemo(() => {
    const baseUrl = getBaseUrl();
    if (currentEvent?.slug) {
      return `${baseUrl}?event=${currentEvent.slug}`;
    }
    // Fallback vers l'ancien système si pas d'événement
    return `${baseUrl}?mode=guest`;
  }, [currentEvent?.slug]);

  // --- Effects ---

  // Idle Detection
  useEffect(() => {
    const resetIdle = () => {
      setIsIdle(false);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = setTimeout(() => {
        if (!lightboxIndex && displayedPhotos.length > 0) {
            setIsIdle(true);
        }
      }, 5 * 60 * 1000); // 5 minutes d'inactivité
    };

    const events = ['mousemove', 'keydown', 'click', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetIdle));
    
    resetIdle();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdle));
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, [lightboxIndex, displayedPhotos.length]);

  // Reset Idle on new photo
  useEffect(() => {
    if (newPhotoIndicator) {
      setIsIdle(false);
      if (idleTimeoutRef.current) {
          clearTimeout(idleTimeoutRef.current);
          // Restart timer
          idleTimeoutRef.current = setTimeout(() => setIsIdle(true), 5 * 60 * 1000);
      }
    }
  }, [newPhotoIndicator]);

  // Auto-hide controls
  useEffect(() => {
    if (isKiosqueMode || !showControls) return;

    const hideControlsAfterDelay = () => {
      if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
      hideControlsTimeoutRef.current = setTimeout(() => {
        if (!isHoveringControls) setShowControls(false);
      }, 3000);
    };

    const handleInteraction = () => {
      if (!showControls) setShowControls(true);
      hideControlsAfterDelay();
    };

    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    hideControlsAfterDelay();

    return () => {
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
    };
  }, [isKiosqueMode, showControls, isHoveringControls]);

  // Trigger AR on new photo
  useEffect(() => {
    if (newPhotoIndicator && settings.ar_scene_enabled !== false && arSceneManagerRef.current) {
      arSceneManagerRef.current.triggerRandomEffect();
    }
  }, [newPhotoIndicator, settings.ar_scene_enabled]);

  // Trigger Sounds on Battle Finish
  useEffect(() => {
    if (winnerPhotoDisplay) {
        playVictorySound();
        arSceneManagerRef.current?.triggerEffect('fireworks', 1);
    } else if (tieBattleDisplay) {
        playDefeatOrTieSound();
        arSceneManagerRef.current?.triggerEffect('fireworks', 0.8);
    }
  }, [winnerPhotoDisplay, tieBattleDisplay]);


  // --- Handlers ---
  const lightboxPhoto = lightboxIndex !== null ? displayedPhotos[lightboxIndex] : null;

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const prevLightbox = useCallback(() => {
    setLightboxIndex((idx) => {
      if (idx === null) return null;
      return (idx - 1 + displayedPhotos.length) % displayedPhotos.length;
    });
  }, [displayedPhotos.length]);
  const nextLightbox = useCallback(() => {
    setLightboxIndex((idx) => {
      if (idx === null) return null;
      return (idx + 1) % displayedPhotos.length;
    });
  }, [displayedPhotos.length]);

  // Clavier pour Lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevLightbox();
      if (e.key === 'ArrowRight') nextLightbox();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIndex, prevLightbox, nextLightbox, closeLightbox]);


  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col overflow-hidden relative font-sans">
      
      {/* Background */}
      <WallBackground />

      {/* Overlays - Z-Index plus élevé */}
      <IdleScreen isActive={isIdle} uploadUrl={uploadUrl} title={uiConfig.title} />
      <div className="z-[100] relative">
          <FlyingReactions reactions={flyingReactions} />
      </div>
      <WinnerOverlay photo={winnerPhotoDisplay} />
      <TieOverlay tieData={tieBattleDisplay} />
      <NewPhotoIndicator show={isLoadingNew} />
      <FloatingQrCode show={showQrCodes} uploadUrl={uploadUrl} isKiosqueMode={isKiosqueMode} />

      {/* Header */}
      {!isKiosqueMode && (
        <WallHeader 
          title={uiConfig.title}
          subtitle={uiConfig.subtitle}
          stats={stats}
          showControls={showControls}
          isHoveringControls={setIsHoveringControls}
        />
      )}

      {/* Controls */}
      <WallControls 
        showControls={showControls}
        setShowControls={setShowControls}
        autoScroll={!isPaused}
        setAutoScroll={(val) => setIsPaused(!val)}
        arEnabled={settings.ar_scene_enabled !== false}
        triggerArEffect={() => arSceneManagerRef.current?.triggerRandomEffect()}
        showQrCodes={showQrCodes}
        setShowQrCodes={setShowQrCodes}
        onBack={onBack}
        isKiosqueMode={isKiosqueMode}
        isHoveringControls={setIsHoveringControls}
      />

      {/* Alerte texte */}
      <AnimatePresence mode="wait">
        {settings.alert_text && settings.alert_text.trim() && (
          <motion.div
            key="alert-banner"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none"
          >
            {/* Fond avec gradient animé */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/90 via-orange-500/90 to-red-500/90 backdrop-blur-md">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            </div>
            
            {/* Contenu centré */}
            <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-8 lg:px-12">
              <div className="flex flex-col items-center justify-center gap-4">
                {/* Icône d'alerte */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                  className="flex-shrink-0"
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/40 animate-bounce-slow shadow-lg">
                    <span className="text-2xl md:text-3xl lg:text-4xl">⚠️</span>
                  </div>
                </motion.div>
                
                {/* Texte */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="text-center"
                >
                  <p className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] break-words leading-relaxed tracking-normal max-w-3xl mx-auto">
                    <span className="relative inline-block">
                      <span className="absolute inset-0 bg-gradient-to-r from-white via-yellow-100 to-white opacity-30 blur-xl animate-pulse"></span>
                      <span className="relative">{settings.alert_text}</span>
                    </span>
                  </p>
                </motion.div>
              </div>
            </div>
            
            {/* Bordure animée autour */}
            <div className="absolute inset-0 border-4 border-yellow-400/60 shadow-[0_0_40px_rgba(255,193,7,0.6)] animate-pulse pointer-events-none"></div>
            
            {/* Effet de brillance qui traverse */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shine"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div 
        ref={scrollRef}
        className={`flex-1 overflow-y-auto p-2 md:p-4 pb-24 z-20 relative scrollbar-hide smooth-scroll ${
          showControls && !isKiosqueMode ? 'pt-32 md:pt-40' : 'pt-4 md:pt-6'
        }`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {displayedPhotos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 px-6">
            <div className="relative mb-8">
               <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-full blur-3xl opacity-20 animate-pulse-slow"></div>
               <div className="relative text-8xl md:text-9xl animate-bounce-slow filter drop-shadow-2xl">📸</div>
            </div>
            <p className="text-3xl md:text-5xl font-handwriting text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-cyan-300 mb-4 text-center">
               Le mur attend sa première star...
            </p>
            <p className="text-sm md:text-base text-slate-400 uppercase tracking-[0.3em] font-bold mb-8">
               Scannez le QR Code pour participer
            </p>
          </div>
        ) : (
          <WallMasonry 
            photos={displayedPhotos}
            battles={battles}
            showBattles={showBattles}
            scrollRef={scrollRef}
            hoveredPhoto={hoveredPhoto}
            setHoveredPhoto={setHoveredPhoto}
            photosReactions={photosReactions}
            onBattleFinished={handleBattleFinished}
          />
        )}
      </div>

      {/* Footer */}
      {!isKiosqueMode && (
        <WallFooter 
          showControls={showControls}
          isKiosqueMode={isKiosqueMode}
          autoScroll={!isPaused}
          isPaused={isPaused}
          isHoveringControls={setIsHoveringControls}
        />
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-pink-500"></div></div>}>
          <Lightbox
            photo={lightboxPhoto}
            onClose={closeLightbox}
            onPrev={prevLightbox}
            onNext={nextLightbox}
            currentIndex={lightboxIndex ?? 0}
            totalPhotos={displayedPhotos.length}
            downloadUrl={lightboxPhoto.url}
          />
        </Suspense>
      )}

      {/* AR Manager */}
      {settings.ar_scene_enabled !== false && (
        <ARSceneManager
          ref={arSceneManagerRef}
          enabled={settings.ar_scene_enabled ?? true}
          likesThreshold={AR_DEFAULT_LIKES_THRESHOLD}
          timeWindow={AR_DEFAULT_TIME_WINDOW}
        />
      )}

    </div>
  );
};

export default React.memo(WallView);
