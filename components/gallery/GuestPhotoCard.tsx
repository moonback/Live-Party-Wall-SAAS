import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Photo, ReactionType } from '../../types';
import { REACTIONS, REACTION_TYPES } from '../../constants';
import { Heart, Download, Image, Video, Tag, Share2, MoreVertical, CheckCircle, Circle } from 'lucide-react';
import { hasPhotographerBadge, getPhotoBadge } from '../../services/gamificationService';
import { getImageClasses } from '../../hooks/useImageOrientation';
import type { ImageOrientation } from '../../hooks/useImageOrientation';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useSwipe } from '../../hooks/useSwipe';
import { getUserAvatar } from '../../utils/userAvatar';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { sharePhotoOrVideo, copyToClipboard } from '../../services/socialShareService';
import { motion, AnimatePresence } from 'framer-motion';
import { useSmartLazyImage } from '../../hooks/useSmartLazyImage'; // ⚡ OPTIMISATION : Lazy loading intelligent

interface GuestPhotoCardProps {
  photo: Photo;
  isLiked: boolean;
  onLike: (id: string) => void;
  onDownload: (photo: Photo) => void;
  allPhotos: Photo[];
  index?: number;
  isDownloading?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  userReaction?: ReactionType | null;
  onReaction?: (photoId: string, reactionType: ReactionType | null) => void;
  reactions?: import('../../types').ReactionCounts;
  guestAvatars?: Map<string, string>;
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export const GuestPhotoCard = React.memo(({ 
  photo, 
  isLiked, 
  onLike, 
  onDownload,
  allPhotos,
  index = 0,
  isDownloading = false,
  onSwipeLeft,
  onSwipeRight,
  userReaction = null,
  onReaction,
  reactions = {},
  guestAvatars,
  selectionMode = false,
  isSelected = false,
  onSelect
}: GuestPhotoCardProps) => {
  const { settings } = useSettings();
  const { addToast } = useToast();
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const likeButtonRef = useRef<HTMLButtonElement>(null);
  const reactionsMenuRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressing = useRef<boolean>(false);
  const photoBadge = getPhotoBadge(photo, allPhotos);
  const authorHasPhotographerBadge = hasPhotographerBadge(photo.author, allPhotos);
  
  const authorAvatar = guestAvatars?.get(photo.author) || getUserAvatar(photo.author);
  
  const imageOrientation: ImageOrientation = photo.type === 'photo' 
    ? (photo.orientation || 'unknown')
    : 'unknown';
  const isMobile = useIsMobile();
  
  // ⚡ OPTIMISATION : Lazy loading intelligent avec priorisation
  const { containerRef, shouldLoad, isLoading } = useSmartLazyImage({
    loadDelay: index < 10 ? 0 : 100, // Charger immédiatement les 10 premières
    rootMargin: '200px', // Précharger 200px avant
    priority: index < 10 ? 'high' : 'low',
    threshold: 0.1,
  });
  
  const lastClickTime = useRef<number>(0);
  const lastTapTime = useRef<number>(0);
  const tapTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const cardSwipe = useSwipe(
    {
      onSwipeLeft: onSwipeLeft,
      onSwipeRight: onSwipeRight
    },
    {
      threshold: 50,
      velocity: 0.3,
      preventDefault: false
    }
  );

  const hasMouseDown = useRef<boolean>(false);
  const hasTouchStart = useRef<boolean>(false);

  const handleMouseDown = useCallback(() => {
    hasMouseDown.current = true;
    isLongPressing.current = false;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    const timer = setTimeout(() => {
      if (hasMouseDown.current) {
        isLongPressing.current = true;
        setShowReactionsMenu(true);
      }
    }, 300);
    longPressTimerRef.current = timer;
  }, []);

  const handleMouseUp = useCallback(() => {
    const wasMouseDown = hasMouseDown.current;
    hasMouseDown.current = false;
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    if (wasMouseDown && !isLongPressing.current) {
      onLike(photo.id);
    }
    isLongPressing.current = false;
  }, [onLike, photo.id]);

  const handleMouseLeave = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    hasMouseDown.current = false;
    isLongPressing.current = false;
  }, []);

  const handleReactionTouchStart = useCallback(() => {
    hasTouchStart.current = true;
    isLongPressing.current = false;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    const timer = setTimeout(() => {
      if (hasTouchStart.current) {
        isLongPressing.current = true;
        setShowReactionsMenu(true);
      }
    }, 300);
    longPressTimerRef.current = timer;
  }, []);

  const handleReactionTouchEnd = useCallback(() => {
    const wasTouchStart = hasTouchStart.current;
    hasTouchStart.current = false;
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    if (wasTouchStart && !isLongPressing.current) {
      onLike(photo.id);
    }
    isLongPressing.current = false;
  }, [onLike, photo.id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        reactionsMenuRef.current &&
        likeButtonRef.current &&
        !reactionsMenuRef.current.contains(e.target as Node) &&
        !likeButtonRef.current.contains(e.target as Node)
      ) {
        setShowReactionsMenu(false);
      }
    };

    if (showReactionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showReactionsMenu]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (selectionMode) return;
    
    const now = Date.now();
    
    if (now - lastClickTime.current < 300) {
      onLike(photo.id);
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 1000);
    }
    
    lastClickTime.current = now;
  }, [onLike, photo.id, selectionMode]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (selectionMode) return;
    const now = Date.now();
    
    if (now - lastTapTime.current < 300) {
      e.preventDefault();
      onLike(photo.id);
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 1000);
      
      if (tapTimeout.current) {
        clearTimeout(tapTimeout.current);
        tapTimeout.current = null;
      }
    } else {
      tapTimeout.current = setTimeout(() => {
        lastTapTime.current = 0;
      }, 300);
    }
    
    lastTapTime.current = now;
  }, [onLike, photo.id, selectionMode]);

  const handleCardClick = (e: React.MouseEvent) => {
    if (selectionMode && onSelect) {
      onSelect(photo.id);
    }
  };

  const handleShare = async () => {
    if (selectionMode) return;
    
    setIsSharing(true);
    try {
      const filename = photo.type === 'video' 
        ? `video-${photo.id}.mp4`
        : `photo-${photo.id}.jpg`;
      
      const mimeType = photo.type === 'video' ? 'video/mp4' : 'image/jpeg';
      const title = photo.type === 'video' 
        ? `Vidéo de ${photo.author}`
        : `Photo de ${photo.author}`;
      
      const success = await sharePhotoOrVideo(
        photo.url,
        title,
        photo.caption || `Partagé par ${photo.author}`,
        filename,
        mimeType
      );
      
      if (success) {
        addToast('Partage réussi !', 'success');
      } else {
        // Fallback: copier le lien dans le presse-papier
        const copied = await copyToClipboard(photo.url);
        if (copied) {
          addToast('Lien copié dans le presse-papier !', 'success');
        } else {
          addToast('Impossible de partager ou copier le lien', 'error');
        }
      }
    } catch (error) {
      addToast('Erreur lors du partage', 'error');
    } finally {
      setIsSharing(false);
    }
  };
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      className={`group relative bg-slate-900/40 backdrop-blur-md ${isMobile ? 'rounded-xl' : 'rounded-xl sm:rounded-2xl md:rounded-[2rem]'} overflow-hidden border transition-all duration-500 ${
        isSelected 
          ? 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-2xl shadow-indigo-500/20' 
          : 'border-white/5 hover:border-white/20 shadow-xl'
      } ${selectionMode ? 'cursor-pointer' : ''}`}
      {...(isMobile && (onSwipeLeft || onSwipeRight) ? cardSwipe.handlers : {})}
    >
      {/* Selection Overlay */}
      {selectionMode && (
        <div className={`absolute ${isMobile ? 'top-2 left-2' : 'top-2 sm:top-4 left-2 sm:left-4'} z-40`}>
          <motion.div
            initial={false}
            animate={{ scale: isSelected ? 1.1 : 1 }}
            className={`${isMobile ? 'p-1.5 min-w-[44px] min-h-[44px]' : 'p-1 sm:p-1.5'} rounded-full flex items-center justify-center ${isSelected ? 'bg-indigo-500 text-white shadow-lg' : 'bg-black/20 text-white/50 border border-white/20'}`}
          >
            {isSelected ? <CheckCircle className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5 sm:w-6 sm:h-6'}`} /> : <Circle className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5 sm:w-6 sm:h-6'}`} />}
          </motion.div>
        </div>
      )}

      {/* Header Photo */}
      <div className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 md:p-4 bg-gradient-to-b from-black/20 to-transparent`}>
        <div className="relative flex-shrink-0">
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt={photo.author}
              className={`rounded-full object-cover border-2 border-white/10 shadow-lg ${isMobile ? 'w-10 h-10' : 'w-11 h-11'}`}
            />
          ) : (
            <div className={`rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg ${isMobile ? 'w-10 h-10 text-sm' : 'w-11 h-11 text-base'}`}>
              {photo.author[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-white truncate ${isMobile ? 'text-sm' : 'text-base'}`}>{photo.author}</p>
          <p className="text-slate-400 text-[10px] sm:text-[11px] uppercase tracking-wider font-medium">
            {new Date(photo.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </p>
        </div>
        <button className={`${isMobile ? 'p-2 min-w-[44px] min-h-[44px]' : 'p-1.5 sm:p-2'} text-slate-400 hover:text-white transition-colors touch-manipulation flex items-center justify-center`}>
          <MoreVertical className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4 sm:w-5 sm:h-5'}`} />
        </button>
      </div>

      {/* Media Container */}
      <div 
        ref={containerRef}
        className="relative overflow-hidden bg-black/40"
        onDoubleClick={handleDoubleClick}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence>
          {showHeartAnimation && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
            >
              <Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
            </motion.div>
          )}
        </AnimatePresence>

        {shouldLoad ? (
          photo.type === 'video' ? (
            videoError ? (
              <div className="aspect-[4/5] flex items-center justify-center bg-slate-800/50">
                <Video className="w-12 h-12 text-slate-600" />
              </div>
            ) : (
              <video
                src={photo.url}
                className="w-full h-auto object-contain max-h-[60vh] md:max-h-[500px]"
                controls={!selectionMode}
                playsInline
                preload="metadata"
                controlsList="nodownload"
                loading="lazy"
                onError={() => setVideoError(true)}
              />
            )
          ) : (
            <img 
              src={photo.url} 
              alt={photo.caption} 
              className={`w-full h-auto transition-transform duration-700 ${isHovered && !selectionMode ? 'scale-105' : 'scale-100'} ${getImageClasses(imageOrientation, isMobile)}`}
              loading="lazy"
              decoding="async"
              fetchPriority={index < 10 ? "high" : "low"} // ⚡ OPTIMISATION : Priorité de chargement
              style={{ maxHeight: isMobile ? '60vh' : '500px', objectFit: 'contain' }}
              onError={() => setImageError(true)}
            />
          )
        ) : (
          // ⚡ OPTIMISATION : Placeholder pendant chargement
          <div className={`${imageOrientation === 'portrait' ? 'aspect-[3/4]' : imageOrientation === 'landscape' ? 'aspect-[4/3]' : 'aspect-[4/5]'} bg-slate-800/50 flex items-center justify-center`}>
            {isLoading && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
            )}
          </div>
        )}

        {/* Media Badges */}
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex flex-col gap-1.5 sm:gap-2 z-20">
          {photo.type === 'video' && (
            <div className="bg-black/60 backdrop-blur-md px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full flex items-center gap-1 sm:gap-1.5 border border-white/10 shadow-lg">
              <Video className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
              {photo.duration && (
                <span className="text-white text-[9px] sm:text-[10px] font-bold">{Math.floor(photo.duration)}s</span>
              )}
            </div>
          )}
          {photoBadge && (
            <div className="relative">
              {/* Glow effect animé */}
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-yellow-400/60 via-orange-400/60 to-pink-500/60 blur-lg opacity-75 animate-pulse"></div>
              
              {/* Badge principal */}
              <div className="relative bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 px-2 py-1 rounded-full shadow-lg border border-white/60 shadow-[0_0_15px_rgba(251,191,36,0.6)] flex items-center gap-1">
                <span className="text-sm relative z-10 drop-shadow-[0_0_6px_rgba(255,255,255,0.8)] animate-spin-slow" style={{ animationDuration: '3s' }}>⭐</span>
                <span className="text-[10px] font-black text-white uppercase tracking-tight relative z-10 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">Star</span>
                
                {/* Effet de scintillement */}
                <div className="absolute inset-0 rounded-full overflow-hidden opacity-0 animate-pulse">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-shimmer-enhanced"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Logo Watermark */}
        {settings.logo_url && settings.logo_watermark_enabled && (
          <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 z-20 pointer-events-none">
            <div className="bg-black/30 backdrop-blur-sm rounded-lg sm:rounded-xl p-1.5 sm:p-2 border border-white/10 shadow-lg">
              <img
                src={settings.logo_url}
                alt="Logo événement"
                className={`${isMobile ? 'h-6 w-auto max-w-[80px]' : 'h-8 sm:h-10 w-auto max-w-[120px]'} object-contain opacity-80`}
                loading="lazy"
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions & Caption */}
      <div className={`${isMobile ? 'p-3' : 'p-3 sm:p-4 md:p-5'}`}>
        <div className={`flex items-center justify-between ${isMobile ? 'mb-2.5' : 'mb-3 sm:mb-4'}`}>
          <div className={`flex items-center ${isMobile ? 'gap-2.5' : 'gap-3 sm:gap-4'}`}>
            {/* Like */}
            <div className="relative">
              <button
                ref={likeButtonRef}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleReactionTouchStart}
                onTouchEnd={handleReactionTouchEnd}
                disabled={selectionMode}
                className={`${isMobile ? 'p-2 min-w-[48px] min-h-[48px]' : 'p-1'} transition-all touch-manipulation flex items-center justify-center ${isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'} ${selectionMode ? 'opacity-50' : 'active:scale-90'}`}
              >
                <Heart className={`${isMobile ? 'w-7 h-7' : 'w-6 h-6 sm:w-7 sm:h-7'} ${isLiked ? 'fill-current' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showReactionsMenu && onReaction && (
                  <motion.div
                    ref={reactionsMenuRef}
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className={`absolute bottom-full left-0 ${isMobile ? 'mb-2' : 'mb-2 sm:mb-3'} bg-slate-900/95 backdrop-blur-xl ${isMobile ? 'rounded-xl p-2' : 'rounded-xl sm:rounded-2xl p-1.5 sm:p-2'} shadow-2xl border border-white/10 z-50 flex items-center ${isMobile ? 'gap-1' : 'gap-0.5 sm:gap-1'}`}
                  >
                    {REACTION_TYPES.map((type) => {
                      const reaction = REACTIONS[type];
                      const count = reactions[type] || 0;
                      const isActive = userReaction === type;
                      return (
                        <button
                          key={type}
                          onClick={() => {
                            onReaction(photo.id, isActive ? null : type);
                            setShowReactionsMenu(false);
                          }}
                          className={`flex flex-col items-center ${isMobile ? 'gap-1 px-2.5 py-2 min-w-[44px] min-h-[44px]' : 'gap-0.5 sm:gap-1 px-2 sm:px-2.5 py-1.5 sm:py-2'} ${isMobile ? 'rounded-xl' : 'rounded-lg sm:rounded-xl'} transition-all touch-manipulation ${isActive ? 'bg-pink-500/20 text-pink-400' : 'hover:bg-white/5 text-slate-400'}`}
                        >
                          <span className={`${isMobile ? 'text-xl' : 'text-lg sm:text-xl'}`}>{reaction.emoji}</span>
                          {count > 0 && <span className={`${isMobile ? 'text-[9px]' : 'text-[8px] sm:text-[9px]'} font-black`}>{count}</span>}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Share */}
            <button
              onClick={handleShare}
              disabled={selectionMode || isSharing}
              className={`${isMobile ? 'p-2 min-w-[48px] min-h-[48px]' : 'p-1'} transition-all touch-manipulation flex items-center justify-center ${isSharing ? 'text-indigo-400' : 'text-slate-400 hover:text-indigo-400'} ${selectionMode || isSharing ? 'opacity-50' : 'active:scale-90'}`}
            >
              {isSharing ? (
                <div className={`${isMobile ? 'w-7 h-7' : 'w-6 h-6 sm:w-7 sm:h-7'} border-2 border-indigo-400 border-t-transparent rounded-full animate-spin`} />
              ) : (
                <Share2 className={`${isMobile ? 'w-7 h-7' : 'w-6 h-6 sm:w-7 sm:h-7'}`} />
              )}
            </button>

            {/* Download */}
            <button
              onClick={() => onDownload(photo)}
              disabled={isDownloading || selectionMode}
              className={`${isMobile ? 'p-2 min-w-[48px] min-h-[48px]' : 'p-1'} transition-all touch-manipulation flex items-center justify-center ${isDownloading ? 'text-blue-400' : 'text-slate-400 hover:text-blue-400'} ${selectionMode ? 'opacity-50' : 'active:scale-90'}`}
            >
              {isDownloading ? <div className={`${isMobile ? 'w-7 h-7' : 'w-6 h-6 sm:w-7 sm:h-7'} border-2 border-blue-400 border-t-transparent rounded-full animate-spin`} /> : <Download className={`${isMobile ? 'w-7 h-7' : 'w-6 h-6 sm:w-7 sm:h-7'}`} />}
            </button>
          </div>

          {/* Social Stats */}
          <div className="flex -space-x-2">
            {(photo.likes_count > 0 || Object.keys(reactions).length > 0) && (
              <div className="flex items-center bg-white/5 border border-white/10 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 gap-1 sm:gap-1.5">
                {photo.likes_count > 0 && (
                  <span className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-[11px] font-bold text-white">
                    <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-500 fill-red-500" />
                    {photo.likes_count}
                  </span>
                )}
                <div className="flex gap-0.5">
                  {onReaction && Object.entries(reactions).slice(0, 2).map(([type, count]) => {
                    if (count === 0) return null;
                    return <span key={type} className="text-[10px] sm:text-[11px]">{REACTIONS[type as ReactionType]?.emoji}</span>;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Caption */}
        <div className={`${isMobile ? 'space-y-1.5' : 'space-y-1.5 sm:space-y-2'}`}>
          {/* Caption (légende IA) */}
          <p className={`${isMobile ? 'text-sm leading-relaxed' : 'text-xs sm:text-sm leading-relaxed'} text-slate-200`}>
            <span className="font-black text-white mr-1.5 sm:mr-2">{photo.author}</span>
            {photo.caption}
          </p>
          
          {/* User Description (si présente) - En dessous */}
          {photo.user_description && (
            <p className={`${isMobile ? 'text-sm leading-relaxed' : 'text-xs sm:text-sm leading-relaxed'} text-white/80 font-medium italic`}>
              {photo.user_description}
            </p>
          )}

          {/* Tags */}
          {settings.tags_generation_enabled !== false && photo.tags && photo.tags.length > 0 && (
            <div className={`flex flex-wrap ${isMobile ? 'gap-1.5' : 'gap-1 sm:gap-1.5'} pt-0.5 sm:pt-1`}>
              {photo.tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className={`${isMobile ? 'text-[10px]' : 'text-[9px] sm:text-[10px]'} font-bold text-pink-400/80 uppercase tracking-tight`}>
                  #{tag.replace(/\s+/g, '')}
                </span>
              ))}
              {photo.tags.length > 3 && (
                <span className={`${isMobile ? 'text-[10px]' : 'text-[9px] sm:text-[10px]'} font-bold text-slate-500`}>+{photo.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Time */}
          <p className={`${isMobile ? 'text-[9px]' : 'text-[8px] sm:text-[9px]'} font-bold text-slate-500 uppercase tracking-[0.1em] pt-0.5 sm:pt-1`}>
            {new Date(photo.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} • {new Date(photo.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>
    </motion.div>
  );
});

GuestPhotoCard.displayName = 'GuestPhotoCard';

GuestPhotoCard.displayName = 'GuestPhotoCard';

