import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Photo } from '../types';
import {
  getPhotosReactions,
} from '../services/photoService';
import { createUnifiedPhotoSubscription } from '../services/unifiedRealtimeService'; // ⚡ OPTIMISATION : Service unifié
import type { ReactionCounts, ReactionType } from '../types';
import { REACTIONS } from '../constants';
import { Settings, Camera, ArrowLeft, Heart } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { getBaseUrl } from '../utils/urlUtils';
import { ARSceneManager, type ARSceneManagerRef } from './arEffects/ARSceneManager';
import { AR_DEFAULT_LIKES_THRESHOLD, AR_DEFAULT_TIME_WINDOW } from '../constants';
import { useSettings } from '../context/SettingsContext';
import { useEvent } from '../context/EventContext';
import { logger } from '../utils/logger';
import { QRCodeCard } from './projection/QRCodeCard';
import { PhotoInfoOverlay } from './projection/PhotoInfoOverlay';
import { ProjectionControls } from './projection/ProjectionControls';
import { ProjectionSettings } from './projection/ProjectionSettings';
import { ProjectionStats } from './projection/ProjectionStats';
import { MediaDisplay } from './projection/MediaDisplay';
import { useReactionFlow } from '../hooks/wall/useReactionFlow';
import { FlyingReactions } from './wall/Overlays/FlyingReactions';

interface ProjectionWallProps {
  photos: Photo[];
  onBack?: () => void;
  displayDuration?: number; // Durée d'affichage de chaque image en ms (défaut: 5000)
  transitionDuration?: number; // Durée de transition en ms (défaut: 1000)
  transitionType?: 'fade' | 'zoom' | 'slide' | 'blur'; // Type de transition
}

/**
 * Composant de projection murale qui affiche les images une par une
 * avec des transitions fluides pour projection sur grand écran.
 */
export const ProjectionWall: React.FC<ProjectionWallProps> = ({
  photos,
  onBack,
  displayDuration = 5000,
  transitionDuration = 1000,
  transitionType = 'fade',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedPhotos, setDisplayedPhotos] = useState<Photo[]>(photos);
  const [progress, setProgress] = useState(0);
  const [showQrCodes, setShowQrCodes] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isRandom, setIsRandom] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1); // 0.5x, 1x, 2x
  const [isKiosqueMode, setIsKiosqueMode] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const usedIndicesRef = useRef<Set<number>>(new Set());
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isHoveringControls, setIsHoveringControls] = useState(false);
  const isInitializedRef = useRef(false);
  const arSceneManagerRef = useRef<ARSceneManagerRef>(null);
  const [photosReactions, setPhotosReactions] = useState<Map<string, ReactionCounts>>(new Map());
  const { settings } = useSettings();
  const { currentEvent } = useEvent();
  
  // Hook pour gérer les animations de réactions volantes
  const { flyingReactions } = useReactionFlow();
  
  // Debug: Log quand alert_text change
  useEffect(() => {
    logger.info('ProjectionWall: alert_text changed', { 
      component: 'ProjectionWall', 
      alert_text: settings.alert_text,
      has_alert: !!(settings.alert_text && settings.alert_text.trim())
    });
  }, [settings.alert_text]);

  // Notifications des derniers likes et réactions
  interface RecentActivity {
    id: string;
    type: 'like' | 'reaction';
    reactionType?: ReactionType;
    photoId: string;
    timestamp: number;
  }
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  // Nettoyer les notifications anciennes (plus de 10 secondes)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setRecentActivities((prev) =>
        prev.filter((activity) => now - activity.timestamp < 10000)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // QR Code URLs
  const uploadUrl = useMemo(() => {
    const baseUrl = getBaseUrl();
    if (currentEvent?.slug) {
      return `${baseUrl}?event=${currentEvent.slug}`;
    }
    // Fallback vers l'ancien système si pas d'événement
    return `${baseUrl}?mode=guest`;
  }, [currentEvent?.slug]);

  const downloadUrl = useMemo(() => {
    if (displayedPhotos.length === 0 || !displayedPhotos[currentIndex]) {
      const baseUrl = getBaseUrl();
      if (currentEvent?.slug) {
        return `${baseUrl}?event=${currentEvent.slug}&mode=gallery`;
      }
      return `${baseUrl}?mode=gallery`;
    }
    return displayedPhotos[currentIndex].url;
  }, [displayedPhotos, currentIndex, currentEvent?.slug]);

  // Photo actuelle
  const currentPhoto = useMemo(() => {
    return displayedPhotos[currentIndex];
  }, [displayedPhotos, currentIndex]);

  // Réactions de la photo actuelle
  const currentPhotoReactions = useMemo(() => {
    return currentPhoto ? photosReactions.get(currentPhoto.id) : undefined;
  }, [currentPhoto, photosReactions]);

  // Statistiques en temps réel
  const stats = useMemo(() => {
    const totalPhotos = displayedPhotos.length;
    const uniqueAuthors = new Set(displayedPhotos.map((p) => p.author)).size;
    const totalLikes = displayedPhotos.reduce((sum, p) => sum + (p.likes_count || 0), 0);
    return { totalPhotos, uniqueAuthors, totalLikes };
  }, [displayedPhotos]);

  // Mode kiosque (détection via URL)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const kiosqueParam =
      params.get('kiosque') === 'true' || localStorage.getItem('kiosqueMode') === 'true';
    setIsKiosqueMode(kiosqueParam);
    if (kiosqueParam) {
      setShowControls(false);
      setShowQrCodes(true);
    }
  }, []);

  // Fonction pour passer à la photo suivante en cas d'erreur
  const handleMediaError = useCallback(() => {
    if (displayedPhotos.length <= 1) return;

    setIsTransitioning(true);
    setProgress(100);

    setTimeout(() => {
      setCurrentIndex((prev) => {
        const nextIndex = (prev + 1) % displayedPhotos.length;
        return nextIndex;
      });
      setProgress(0);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, transitionDuration);
  }, [displayedPhotos.length, transitionDuration]);

  // Auto-hide des contrôles après inactivité
  useEffect(() => {
    if (isKiosqueMode || !showControls) return;

    const hideControlsAfterDelay = () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }

      hideControlsTimeoutRef.current = setTimeout(() => {
        if (!isHoveringControls && !showSettings) {
          setShowControls(false);
        }
      }, 3000);
    };

    const handleMouseMove = () => {
      if (!showControls) {
        setShowControls(true);
      }
      hideControlsAfterDelay();
    };

    const handleKeyPress = () => {
      if (!showControls) {
        setShowControls(true);
      }
      hideControlsAfterDelay();
    };

    hideControlsAfterDelay();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyPress);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, [isKiosqueMode, showControls, isHoveringControls, showSettings]);

  // Initialiser les photos affichées depuis les props (une seule fois)
  useEffect(() => {
    if (photos.length > 0 && !isInitializedRef.current) {
      setDisplayedPhotos(photos);
      isInitializedRef.current = true;
    }
  }, [photos]);

  // Fonction pour changer vers une photo spécifique (utilisée pour les likes/réactions)
  const switchToPhoto = useCallback(
    (photoId: string) => {
      const photoIndex = displayedPhotos.findIndex((p) => p.id === photoId);
      if (photoIndex === -1 || photoIndex === currentIndex) {
        return; // Photo non trouvée ou déjà affichée
      }

      setIsTransitioning(true);
      setProgress(100);

      setTimeout(() => {
        setCurrentIndex(photoIndex);
        setProgress(0);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, transitionDuration);
    },
    [displayedPhotos, currentIndex, transitionDuration]
  );

  // ⚡ OPTIMISATION : Subscription unifiée pour toutes les mises à jour temps réel
  useEffect(() => {
    if (!currentEvent?.id) return;

    const unifiedSubscription = createUnifiedPhotoSubscription(currentEvent.id, {
      onNewPhoto: async (newPhoto) => {
        try {
          setDisplayedPhotos((prev) => {
            const exists = prev.some((p) => p.id === newPhoto.id);
            if (exists) {
              return prev;
            }

            if (settings.ar_scene_enabled !== false && arSceneManagerRef.current) {
              arSceneManagerRef.current.triggerRandomEffect();
            }

            const updated = [...prev, newPhoto].sort((a, b) => a.timestamp - b.timestamp);
            const newIndex = updated.findIndex((p) => p.id === newPhoto.id);

            // Charger les réactions pour la nouvelle photo immédiatement
            getPhotosReactions([newPhoto.id]).then((reactionsMap) => {
              setPhotosReactions((prev) => {
                const next = new Map(prev);
                reactionsMap.forEach((reactions, photoId) => {
                  if (Object.keys(reactions).length > 0) {
                    next.set(photoId, reactions);
                  }
                });
                return next;
              });
            }).catch((error) => {
              logger.error(`Error loading reactions for new photo ${newPhoto.id}`, error);
            });

            setIsTransitioning(true);
            setProgress(100);

            setTimeout(() => {
              setCurrentIndex(newIndex);
              setProgress(0);
              setIsTransitioning(false);
            }, transitionDuration);

            return updated;
          });
        } catch (error) {
          logger.error('Error handling new photo', error);
        }
      },
      onPhotoDeleted: (deletedPhotoId) => {
        setDisplayedPhotos((prev) => prev.filter(p => p.id !== deletedPhotoId));
        setPhotosReactions(prev => {
          const next = new Map(prev);
          next.delete(deletedPhotoId);
          return next;
        });
      },
      onLikesUpdate: (photoId, newLikesCount) => {
        try {
          setDisplayedPhotos((prev) =>
            prev.map((photo) =>
              photo.id === photoId ? { ...photo, likes_count: newLikesCount } : photo
            )
          );
          
          // ⚡ OPTIMISATION : Afficher automatiquement la photo concernée si like
          const activity: RecentActivity = {
            id: `${Date.now()}-like-${photoId}`,
            type: 'like',
            photoId,
            timestamp: Date.now(),
          };
          setRecentActivities((prev) => {
            const updated = [activity, ...prev].slice(0, 5);
            return updated;
          });
          
          switchToPhoto(photoId);
        } catch (error) {
          logger.error('Error updating likes', error);
        }
      },
      onReactionsUpdate: (photoId, reactions) => {
        try {
          setPhotosReactions((prev) => {
            const next = new Map(prev);
            if (Object.keys(reactions).length > 0) {
              next.set(photoId, reactions);
            } else {
              next.delete(photoId);
            }
            return next;
          });
          
          // ⚡ OPTIMISATION : Afficher automatiquement la photo concernée si réaction
          const activity: RecentActivity = {
            id: `${Date.now()}-reaction-${photoId}`,
            type: 'reaction',
            photoId,
            timestamp: Date.now(),
          };
          setRecentActivities((prev) => {
            const updated = [activity, ...prev].slice(0, 5);
            return updated;
          });
          
          switchToPhoto(photoId);
        } catch (error) {
          logger.error('Error updating reactions', error);
        }
      },
    });

    return () => {
      unifiedSubscription.unsubscribe();
    };
  }, [transitionDuration, settings.ar_scene_enabled, currentEvent?.id, switchToPhoto]);

  // Charger les réactions pour toutes les photos (optimisé avec une seule requête)
  useEffect(() => {
    const loadReactions = async () => {
      try {
        const photoIds = displayedPhotos.map(photo => photo.id);
        if (photoIds.length === 0) return;
        
        const reactionsMap = await getPhotosReactions(photoIds);
        setPhotosReactions(reactionsMap);
      } catch (error) {
        console.error('Error loading reactions:', error);
      }
    };

    if (displayedPhotos.length > 0) {
      loadReactions();
    }
  }, [displayedPhotos.length]);

  // ⚡ OPTIMISATION : Les subscriptions likes et réactions sont maintenant dans le useEffect unifié ci-dessus
  // Plus besoin de subscriptions séparées - tout est géré par createUnifiedPhotoSubscription

  // Synchroniser avec les photos reçues en props
  useEffect(() => {
    if (photos.length > 0 && isInitializedRef.current) {
      setDisplayedPhotos((prev) => {
        const existingMap = new Map(prev.map((p) => [p.id, p]));

        const photosFromProps = photos.filter((p) => !existingMap.has(p.id));
        if (photosFromProps.length > 0) {
          const merged = [...prev, ...photosFromProps].sort((a, b) => a.timestamp - b.timestamp);
          return merged;
        }

        const updated = prev.map((photo) => {
          const fromProps = photos.find((p) => p.id === photo.id);
          if (fromProps) {
            return { ...fromProps, likes_count: photo.likes_count };
          }
          return photo;
        });

        return updated;
      });
    }
    if (!isRandom) {
      usedIndicesRef.current.clear();
    }
  }, [photos, isRandom]);

  // Fonction pour obtenir l'index suivant
  const getNextIndex = useCallback(
    (current: number): number => {
      if (!isRandom || displayedPhotos.length <= 1) {
        return (current + 1) % displayedPhotos.length;
      }

      if (usedIndicesRef.current.size >= displayedPhotos.length) {
        usedIndicesRef.current.clear();
      }

      let nextIndex: number;
      do {
        nextIndex = Math.floor(Math.random() * displayedPhotos.length);
      } while (
        nextIndex === current ||
        (usedIndicesRef.current.size < displayedPhotos.length - 1 &&
          usedIndicesRef.current.has(nextIndex))
      );

      usedIndicesRef.current.add(nextIndex);
      return nextIndex;
    },
    [isRandom, displayedPhotos.length]
  );

  // Fonction pour passer à l'image suivante
  const nextImage = useCallback(() => {
    if (displayedPhotos.length === 0 || !isPlaying) return;

    setIsTransitioning(true);
    setProgress(100);

    setTimeout(() => {
      setCurrentIndex((prev) => getNextIndex(prev));
      setProgress(0);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, transitionDuration);
  }, [displayedPhotos.length, isPlaying, getNextIndex, transitionDuration]);

  // Gérer le changement automatique d'image et la barre de progression
  useEffect(() => {
    if (displayedPhotos.length === 0) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    setProgress(0);
    setIsTransitioning(false);

    const actualDisplayDuration = displayDuration / speedMultiplier;
    const progressStep = 100 / (actualDisplayDuration / 100);

    progressIntervalRef.current = setInterval(() => {
      if (isPlaying) {
        setProgress((prev) => {
          if (prev >= 100) return 100;
          return prev + progressStep;
        });
      }
    }, 100);

    intervalRef.current = setInterval(nextImage, actualDisplayDuration + transitionDuration);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [displayedPhotos.length, displayDuration, transitionDuration, isPlaying, speedMultiplier, nextImage]);

  // Réinitialiser la progression quand l'image change
  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  // S'assurer que l'index reste valide
  useEffect(() => {
    if (displayedPhotos.length > 0 && currentIndex >= displayedPhotos.length) {
      setCurrentIndex(Math.max(0, displayedPhotos.length - 1));
    }
  }, [displayedPhotos.length, currentIndex]);

  // Handlers optimisés avec useCallback
  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleToggleRandom = useCallback(() => {
    setIsRandom((prev) => {
      if (!prev) {
        usedIndicesRef.current.clear();
      }
      return !prev;
    });
  }, []);

  const handleSpeedChange = useCallback(() => {
    const speeds = [0.5, 1, 2];
    const currentSpeedIndex = speeds.indexOf(speedMultiplier);
    setSpeedMultiplier(speeds[(currentSpeedIndex + 1) % speeds.length]);
  }, [speedMultiplier]);

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const handleToggleSettings = useCallback(() => {
    setShowSettings((prev) => {
      if (!prev) {
        if (hideControlsTimeoutRef.current) {
          clearTimeout(hideControlsTimeoutRef.current);
        }
      }
      return !prev;
    });
  }, []);

  const handleToggleQrCodes = useCallback(() => {
    setShowQrCodes((prev) => !prev);
  }, []);

  const handleTriggerAR = useCallback(() => {
    arSceneManagerRef.current?.triggerRandomEffect();
  }, []);

  const handleControlsMouseEnter = useCallback(() => {
    setIsHoveringControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
  }, []);

  const handleControlsMouseLeave = useCallback(() => {
    setIsHoveringControls(false);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    hideControlsTimeoutRef.current = setTimeout(() => {
      if (!showSettings) {
        setShowControls(false);
      }
    }, 3000);
  }, [showSettings]);

  const handleShowControls = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
  }, []);

  const handleNavigateNext = useCallback(() => {
    if (displayedPhotos.length > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % displayedPhotos.length);
        setIsTransitioning(false);
      }, transitionDuration);
    }
  }, [displayedPhotos.length, transitionDuration]);

  const handleNavigatePrev = useCallback(() => {
    if (displayedPhotos.length > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev - 1 + displayedPhotos.length) % displayedPhotos.length);
        setIsTransitioning(false);
      }, transitionDuration);
    }
  }, [displayedPhotos.length, transitionDuration]);

  // Gérer les touches clavier
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNavigateNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleNavigatePrev();
      } else if (e.key === 'Escape' && onBack) {
        onBack();
      } else if (e.key === ' ') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleNavigateNext, handleNavigatePrev, handleTogglePlay, handleFullscreen, onBack]);

  // Si aucune photo, afficher un message
  if (displayedPhotos.length === 0) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-purple-950/20 to-pink-950/20 flex items-center justify-center p-4">
        {/* Background Decor */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-900/30 rounded-full blur-[180px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-pink-900/30 rounded-full blur-[180px]"></div>
        </div>

        <div className="relative z-10 max-w-2xl w-full">
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8 md:p-12 text-center">
            {/* Icône principale */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-pink-500/20 to-purple-500/20 p-6 rounded-full border border-pink-500/30">
                  <Camera className="w-16 h-16 md:w-20 md:h-20 text-pink-400" />
                </div>
              </div>
            </div>

            {/* Titre */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 mb-4">
              Aucune photo à afficher
            </h1>

            {/* Message descriptif */}
            <p className="text-slate-300 text-lg md:text-xl mb-8 max-w-md mx-auto leading-relaxed">
              Le mur est vide pour le moment. Scannez le QR code ci-dessous pour partager vos photos et commencer à remplir le mur !
            </p>

            {/* QR Code pour envoyer des photos */}
            <div className="mb-8 flex justify-center">
              <div className="relative group">
                {/* Glow effect */}
                <div className="absolute -inset-2 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
                
                {/* QR Code Container */}
                <div className="relative bg-gradient-to-br from-white via-white to-gray-50 p-4 rounded-2xl shadow-2xl border-2 border-white/50 transform hover:scale-105 transition-all duration-300">
                  <div className="bg-white p-3 rounded-xl shadow-inner">
                    <QRCodeCanvas
                      value={uploadUrl}
                      size={150}
                      level="H"
                      bgColor="#ffffff"
                      fgColor="#000000"
                      includeMargin={false}
                    />
                    {/* Logo overlay center */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-white rounded-full p-2 shadow-lg">
                        <span className="text-2xl drop-shadow-md">📸</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Text */}
                  <div className="text-center mt-3">
                    <p className="text-slate-900 font-extrabold text-xs uppercase tracking-wider mb-1 group-hover:text-pink-600 transition-colors">
                      Envoyer
                    </p>
                    <p className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 font-extrabold text-sm">
                      une photo !
                    </p>
                  </div>
                  
                  {/* Decorative corner marks */}
                  <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-pink-400/40 rounded-tl-lg" />
                  <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-pink-400/40 rounded-tr-lg" />
                  <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-pink-400/40 rounded-bl-lg" />
                  <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-pink-400/40 rounded-br-lg" />
                </div>
              </div>
            </div>

            {/* Bouton retour */}
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 rounded-xl transition-all duration-300 text-white font-medium shadow-lg shadow-pink-900/30 hover:scale-105 active:scale-95"
              >
                <ArrowLeft className="w-5 h-5" />
                Retour
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!currentPhoto) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Alerte texte */}
      <AnimatePresence mode="wait">
        {settings.alert_text && settings.alert_text.trim() && (
          <motion.div
            key="alert-banner"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute inset-0 z-[200] flex items-center justify-center pointer-events-none"
          >
            {/* Fond avec gradient animé */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/90 via-orange-500/90 to-red-500/90 backdrop-blur-md">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            </div>
            
            {/* Contenu centré */}
            <div className="relative z-10 max-w-5xl mx-auto px-8 md:px-12 lg:px-16">
              <div className="flex flex-col items-center justify-center gap-5 md:gap-6">
                {/* Icône d'alerte */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                  className="flex-shrink-0"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/40 animate-bounce-slow shadow-lg">
                    <span className="text-3xl md:text-4xl lg:text-5xl">⚠️</span>
                  </div>
                </motion.div>
                
                {/* Texte */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="text-center"
                >
                  <p className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] break-words leading-relaxed tracking-normal max-w-4xl mx-auto">
                    <span className="relative inline-block">
                      <span className="absolute inset-0 bg-gradient-to-r from-white via-yellow-100 to-white opacity-40 blur-2xl animate-pulse"></span>
                      <span className="relative">{settings.alert_text}</span>
                    </span>
                  </p>
                </motion.div>
              </div>
            </div>
            
            {/* Bordure animée autour */}
            <div className="absolute inset-0 border-4 border-yellow-400/60 shadow-[0_0_60px_rgba(255,193,7,0.8)] animate-pulse pointer-events-none"></div>
            
            {/* Effet de brillance qui traverse */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shine"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media principal avec transition et gestion d'erreur */}
      <MediaDisplay
        photo={currentPhoto}
        transitionDuration={transitionDuration}
        transitionType={transitionType}
        isTransitioning={isTransitioning}
        onError={handleMediaError}
      />

      {/* Overlay gradient pour améliorer la lisibilité du texte */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

      {/* Légende et auteur en bas */}
      <PhotoInfoOverlay
        photo={currentPhoto}
        reactions={currentPhotoReactions}
        isTransitioning={isTransitioning}
      />

      {/* Indicateur de progression */}
      <div
        className={`absolute ${showControls && !isKiosqueMode ? 'top-20' : 'top-4'} right-4 z-[210]`}
      >
        <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
          <p className="text-white text-sm">
            {currentIndex + 1} / {displayedPhotos.length}
          </p>
        </div>
      </div>

      {/* Bouton retour */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg text-white transition-colors"
          aria-label="Retour"
        >
          ← Retour
        </button>
      )}

      {/* Bouton pour réafficher les contrôles */}
      {!showControls && !isKiosqueMode && (
        <button
          onClick={handleShowControls}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-20 p-3 bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-110"
          aria-label="Afficher les contrôles"
          title="Afficher les contrôles"
        >
          <Settings className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Barre de contrôles */}
      {showControls && !isKiosqueMode && (
        <ProjectionControls
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          isRandom={isRandom}
          onToggleRandom={handleToggleRandom}
          speedMultiplier={speedMultiplier}
          onSpeedChange={handleSpeedChange}
          onFullscreen={handleFullscreen}
          showSettings={showSettings}
          onToggleSettings={handleToggleSettings}
          showQrCodes={showQrCodes}
          onToggleQrCodes={handleToggleQrCodes}
          arEnabled={settings.ar_scene_enabled !== false}
          onTriggerAR={handleTriggerAR}
          onMouseEnter={handleControlsMouseEnter}
          onMouseLeave={handleControlsMouseLeave}
        />
      )}

      {/* Panneau de paramètres */}
      {showSettings && showControls && !isKiosqueMode && (
        <ProjectionSettings
          displayDuration={displayDuration}
          transitionType={transitionType}
          speedMultiplier={speedMultiplier}
          isRandom={isRandom}
          onClose={() => setShowSettings(false)}
          onMouseEnter={handleControlsMouseEnter}
          onMouseLeave={handleControlsMouseLeave}
        />
      )}

      {/* Statistiques en temps réel */}
      <ProjectionStats
        totalPhotos={stats.totalPhotos}
        uniqueAuthors={stats.uniqueAuthors}
        totalLikes={stats.totalLikes}
        show={showControls && !isKiosqueMode}
      />

      {/* QR Codes */}
      <QRCodeCard
        value={uploadUrl}
        title="Envoyer"
        subtitle="une photo !"
        emoji="📸"
        position="left"
        show={showQrCodes}
        gradientColors={{
          hover: 'rgba(236,72,153,0.4)',
          glow: 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500',
          text: 'bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600',
        }}
        borderColor="border-pink-400/40"
      />

      <QRCodeCard
        value={downloadUrl}
        title="Télécharger"
        subtitle="cette photo !"
        emoji="⬇️"
        position="right"
        show={showQrCodes}
        gradientColors={{
          hover: 'rgba(34,211,238,0.4)',
          glow: 'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500',
          text: 'bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600',
        }}
        borderColor="border-cyan-400/40"
        qrKey={currentPhoto.id}
      />

      {/* Barre de progression temporelle */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div
          className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all ease-linear"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      {/* Notifications des derniers likes et réactions - Bas gauche */}
      {recentActivities.length > 0 && (
        <div className="absolute bottom-24 left-4 z-30 flex flex-col gap-2 max-w-xs pointer-events-none">
          {recentActivities.map((activity, index) => {
            const photo = displayedPhotos.find((p) => p.id === activity.photoId);
            const isCurrentPhoto = currentPhoto?.id === activity.photoId;
            const age = Date.now() - activity.timestamp;
            const opacity = age > 8000 ? Math.max(0, 1 - (age - 8000) / 2000) : 1;
            
            return (
              <div
                key={activity.id}
                className="bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-xl border border-white/30 shadow-2xl p-3 animate-fade-in-up transition-opacity duration-300"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: 'both',
                  opacity,
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Icône/Emoji */}
                  <div className="flex-shrink-0">
                    {activity.type === 'like' ? (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 border-2 border-pink-400/50 flex items-center justify-center shadow-lg shadow-pink-900/30">
                        <Heart className="w-6 h-6 text-pink-300 fill-pink-400 animate-pulse" />
                      </div>
                    ) : activity.reactionType ? (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border-2 border-cyan-400/50 flex items-center justify-center shadow-lg shadow-cyan-900/30">
                        <span className="text-3xl animate-bounce">
                          {REACTIONS[activity.reactionType]?.emoji || '👍'}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {/* Texte */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold truncate drop-shadow-lg">
                      {activity.type === 'like' ? (
                        <>
                          <span className="text-pink-300">Nouveau like</span>
                          {isCurrentPhoto && (
                            <span className="text-white/70 ml-1 text-xs">• Cette photo</span>
                          )}
                        </>
                      ) : activity.reactionType ? (
                        <>
                          <span className="text-cyan-300">
                            {REACTIONS[activity.reactionType]?.label || 'Réaction'}
                          </span>
                          {isCurrentPhoto && (
                            <span className="text-white/70 ml-1 text-xs">• Cette photo</span>
                          )}
                        </>
                      ) : null}
                    </p>
                    {photo && (
                      <p className="text-white/80 text-xs font-medium truncate mt-0.5">
                        par {photo.author}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mode Scène Augmentée (AR) */}
      {settings.ar_scene_enabled !== false && (
        <ARSceneManager
          ref={arSceneManagerRef}
          enabled={settings.ar_scene_enabled ?? true}
          likesThreshold={AR_DEFAULT_LIKES_THRESHOLD}
          timeWindow={AR_DEFAULT_TIME_WINDOW}
        />
      )}

      {/* Animations de réactions volantes (emojis) */}
      <FlyingReactions reactions={flyingReactions} />
    </div>
  );
};

export default ProjectionWall;
