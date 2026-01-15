import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Photo, ReactionType } from '../../types';
import { REACTIONS, REACTION_TYPES } from '../../constants';
import { Heart, Download, Video, Share2, MoreVertical, CheckCircle, Circle, Edit2, Trash2, X } from 'lucide-react';
import { getPhotoBadge } from '../../services/gamificationService';
import { getImageClasses } from '../../hooks/useImageOrientation';
import type { ImageOrientation } from '../../hooks/useImageOrientation';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useSwipe } from '../../hooks/useSwipe';
import { getUserAvatar, getCurrentUserName } from '../../utils/userAvatar';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { sharePhotoOrVideo, copyToClipboard } from '../../services/socialShareService';
import { motion, AnimatePresence } from 'framer-motion';

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
  onUpdateCaption?: (photoId: string, caption: string) => Promise<void>;
  onClearCaption?: (photoId: string) => Promise<void>;
  onDeletePhoto?: (photoId: string, photoUrl: string) => Promise<void>;
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
  onSelect,
  onUpdateCaption,
  onClearCaption,
  onDeletePhoto
}: GuestPhotoCardProps) => {
  const { settings } = useSettings();
  const { addToast } = useToast();
  const [videoError, setVideoError] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showEditCaptionModal, setShowEditCaptionModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingCaption, setEditingCaption] = useState('');
  const [isUpdatingCaption, setIsUpdatingCaption] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const likeButtonRef = useRef<HTMLButtonElement>(null);
  const reactionsMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const currentUserName = getCurrentUserName();
  const isOwner = currentUserName === photo.author;
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressing = useRef<boolean>(false);
  const photoBadge = useMemo(() => getPhotoBadge(photo, allPhotos), [photo, allPhotos]);
  
  const authorAvatar = useMemo(() => 
    guestAvatars?.get(photo.author) || getUserAvatar(photo.author),
    [guestAvatars, photo.author]
  );
  
  const imageOrientation: ImageOrientation = useMemo(() => 
    photo.type === 'photo' ? (photo.orientation || 'unknown') : 'unknown',
    [photo.type, photo.orientation]
  );
  const isMobile = useIsMobile();
  
  // Lazy loading avec IntersectionObserver
  const [isInView, setIsInView] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!imageContainerRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '200px', // Charger 200px avant d'entrer dans le viewport
        threshold: 0.01
      }
    );
    
    observer.observe(imageContainerRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
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
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(e.target as Node)
      ) {
        setShowMoreMenu(false);
      }
    };

    if (showReactionsMenu || showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showReactionsMenu, showMoreMenu]);

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

  const handleCardClick = () => {
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

  const handleEditCaption = () => {
    setEditingCaption(photo.caption || '');
    setShowEditCaptionModal(true);
    setShowMoreMenu(false);
  };

  const handleSaveCaption = async () => {
    if (!onUpdateCaption) return;
    
    setIsUpdatingCaption(true);
    try {
      await onUpdateCaption(photo.id, editingCaption.trim());
      setShowEditCaptionModal(false);
      addToast('Légende mise à jour', 'success');
    } catch (error) {
      addToast('Erreur lors de la mise à jour', 'error');
    } finally {
      setIsUpdatingCaption(false);
    }
  };

  const handleClearCaption = async () => {
    if (!onClearCaption) return;
    
    setIsUpdatingCaption(true);
    try {
      await onClearCaption(photo.id);
      setShowMoreMenu(false);
      addToast('Légende supprimée', 'success');
    } catch (error) {
      addToast('Erreur lors de la suppression', 'error');
    } finally {
      setIsUpdatingCaption(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!onDeletePhoto) return;
    
    setIsDeleting(true);
    try {
      await onDeletePhoto(photo.id, photo.url);
      setShowDeleteConfirm(false);
      setShowMoreMenu(false);
      addToast('Photo supprimée', 'success');
    } catch (error) {
      addToast('Erreur lors de la suppression', 'error');
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <motion.div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={!selectionMode ? { y: -4, scale: 1.01 } : {}}
      className={`group relative bg-slate-900/40 backdrop-blur-md ${isMobile ? 'rounded-xl' : 'rounded-xl sm:rounded-2xl md:rounded-2xl lg:rounded-3xl'} overflow-hidden border transition-all duration-300 ${
        isSelected 
          ? 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-2xl shadow-indigo-500/20' 
          : 'border-white/5 hover:border-white/20 shadow-xl'
      } ${selectionMode ? 'cursor-pointer' : ''}`}
      style={{ willChange: 'transform' }}
      {...(isMobile && (onSwipeLeft || onSwipeRight) ? cardSwipe.handlers : {})}
    >
      {/* Selection Overlay */}
      {selectionMode && (
        <motion.div 
          className={`absolute ${isMobile ? 'top-2 left-2' : 'top-2 sm:top-3 md:top-4 left-2 sm:left-3 md:left-4'} z-40`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            initial={false}
            animate={{ scale: isSelected ? 1.1 : 1 }}
            transition={{ duration: 0.2, type: 'spring', stiffness: 400 }}
            className={`${isMobile ? 'p-1.5 min-w-[44px] min-h-[44px]' : 'p-1 sm:p-1.5'} rounded-full flex items-center justify-center ${isSelected ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/50' : 'bg-black/20 text-white/50 border border-white/20'}`}
          >
            {isSelected ? <CheckCircle className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5 sm:w-6 sm:h-6'}`} /> : <Circle className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5 sm:w-6 sm:h-6'}`} />}
          </motion.div>
        </motion.div>
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
        <div className="relative">
                <button
                  onClick={() => {
                    if (isOwner) {
                      setShowMoreMenu(!showMoreMenu);
                    }
                  }}
            className={`${isMobile ? 'p-2 min-w-[44px] min-h-[44px]' : 'p-1.5 sm:p-2'} text-slate-400 hover:text-white transition-colors touch-manipulation flex items-center justify-center ${isOwner ? 'cursor-pointer' : ''}`}
          >
            <MoreVertical className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4 sm:w-5 sm:h-5'}`} />
          </button>
          
          {/* Menu déroulant pour le propriétaire */}
          <AnimatePresence>
            {showMoreMenu && isOwner && (
              <motion.div
                ref={moreMenuRef}
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className={`absolute ${isMobile ? 'top-full right-0 mt-2' : 'top-full right-0 mt-2'} bg-slate-900/95 backdrop-blur-xl ${isMobile ? 'rounded-xl p-2' : 'rounded-xl sm:rounded-2xl p-1.5 sm:p-2'} shadow-2xl border border-white/10 z-50 ${isMobile ? 'min-w-[160px]' : 'min-w-[180px]'}`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditCaption();
                  }}
                  className="w-full flex items-center gap-2 sm:gap-2.5 px-3 py-2.5 min-h-[44px] rounded-lg sm:rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-all touch-manipulation text-left"
                >
                  <Edit2 className={`${isMobile ? 'w-4 h-4' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} flex-shrink-0`} />
                  <span className={`${isMobile ? 'text-sm' : 'text-xs sm:text-sm'} font-medium`}>Modifier la légende</span>
                </button>
                {photo.caption && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearCaption();
                    }}
                    disabled={isUpdatingCaption}
                    className="w-full flex items-center gap-2 sm:gap-2.5 px-3 py-2.5 min-h-[44px] rounded-lg sm:rounded-xl hover:bg-orange-500/10 text-slate-300 hover:text-orange-400 transition-all touch-manipulation text-left disabled:opacity-50"
                  >
                    <Trash2 className={`${isMobile ? 'w-4 h-4' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} flex-shrink-0`} />
                    <span className={`${isMobile ? 'text-sm' : 'text-xs sm:text-sm'} font-medium`}>Effacer la légende</span>
                  </button>
                )}
                <div className="h-px bg-white/5 my-1" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(true);
                    setShowMoreMenu(false);
                  }}
                  disabled={isDeleting}
                  className="w-full flex items-center gap-2 sm:gap-2.5 px-3 py-2.5 min-h-[44px] rounded-lg sm:rounded-xl hover:bg-red-500/10 text-slate-300 hover:text-red-400 transition-all touch-manipulation text-left disabled:opacity-50"
                >
                  <Trash2 className={`${isMobile ? 'w-4 h-4' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} flex-shrink-0`} />
                  <span className={`${isMobile ? 'text-sm' : 'text-xs sm:text-sm'} font-medium`}>Supprimer la photo</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Media Container */}
      <div 
        ref={imageContainerRef}
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

        {photo.type === 'video' ? (
          videoError ? (
            <div className="aspect-[4/5] flex items-center justify-center bg-slate-800/50">
              <Video className="w-12 h-12 text-slate-600" />
            </div>
          ) : (
            <video
              src={isInView ? photo.url : undefined}
              className="w-full h-auto object-contain max-h-[60vh] md:max-h-[500px]"
              controls={!selectionMode}
              playsInline
              preload={isInView ? "metadata" : "none"}
              controlsList="nodownload"
              onError={() => setVideoError(true)}
            />
          )
        ) : (
          <>
            {!isInView && (
              <div className="w-full aspect-[4/5] bg-slate-800/30 animate-pulse flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {isInView && (
              <motion.img 
                src={photo.url}
                alt={photo.caption} 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={`w-full h-auto transition-transform duration-300 ${isHovered && !selectionMode ? 'scale-[1.02]' : 'scale-100'} ${getImageClasses(imageOrientation, isMobile)}`}
                loading="lazy"
                style={{ maxHeight: isMobile ? '60vh' : '500px', objectFit: 'contain' }}
              />
            )}
          </>
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

      {/* Modal de modification de légende */}
      <AnimatePresence>
        {showEditCaptionModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[200]"
              onClick={() => setShowEditCaptionModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`fixed ${isMobile ? 'inset-x-4 top-1/2 -translate-y-1/2' : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md'} bg-slate-900 border border-white/10 shadow-2xl ${isMobile ? 'rounded-2xl p-4' : 'rounded-2xl sm:rounded-3xl p-4 sm:p-6'} z-[201]`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`${isMobile ? 'text-lg' : 'text-xl sm:text-2xl'} font-black text-white`}>Modifier la légende</h3>
                <button
                  onClick={() => setShowEditCaptionModal(false)}
                  className={`${isMobile ? 'p-2 min-w-[44px] min-h-[44px]' : 'p-1.5 sm:p-2'} text-slate-400 hover:text-white transition-colors touch-manipulation flex items-center justify-center rounded-lg hover:bg-white/5`}
                >
                  <X className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4 sm:w-5 sm:h-5'}`} />
                </button>
              </div>
              
              <textarea
                value={editingCaption}
                onChange={(e) => setEditingCaption(e.target.value)}
                placeholder="Entrez votre légende..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 resize-none min-h-[100px] text-sm sm:text-base"
                autoFocus
              />
              
              <div className="flex items-center gap-2 sm:gap-3 mt-4">
                <button
                  onClick={() => setShowEditCaptionModal(false)}
                  disabled={isUpdatingCaption}
                  className={`flex-1 px-4 py-2.5 min-h-[44px] rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all touch-manipulation font-medium text-sm sm:text-base disabled:opacity-50`}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveCaption}
                  disabled={isUpdatingCaption}
                  className={`flex-1 px-4 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white transition-all touch-manipulation font-bold text-sm sm:text-base disabled:opacity-50 flex items-center justify-center gap-2`}
                >
                  {isUpdatingCaption ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    'Enregistrer'
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal de confirmation de suppression */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[200]"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`fixed ${isMobile ? 'inset-x-4 top-1/2 -translate-y-1/2' : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md'} bg-slate-900 border border-red-500/20 shadow-2xl ${isMobile ? 'rounded-2xl p-4' : 'rounded-2xl sm:rounded-3xl p-4 sm:p-6'} z-[201]`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`${isMobile ? 'text-lg' : 'text-xl sm:text-2xl'} font-black text-white`}>Supprimer la photo</h3>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className={`${isMobile ? 'p-2 min-w-[44px] min-h-[44px]' : 'p-1.5 sm:p-2'} text-slate-400 hover:text-white transition-colors touch-manipulation flex items-center justify-center rounded-lg hover:bg-white/5 disabled:opacity-50`}
                >
                  <X className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4 sm:w-5 sm:h-5'}`} />
                </button>
              </div>
              
              <p className={`${isMobile ? 'text-sm' : 'text-base'} text-slate-300 mb-6`}>
                Êtes-vous sûr de vouloir supprimer cette photo ? Cette action est irréversible.
              </p>
              
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className={`flex-1 px-4 py-2.5 min-h-[44px] rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all touch-manipulation font-medium text-sm sm:text-base disabled:opacity-50`}
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeletePhoto}
                  disabled={isDeleting}
                  className={`flex-1 px-4 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white transition-all touch-manipulation font-bold text-sm sm:text-base disabled:opacity-50 flex items-center justify-center gap-2`}
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Suppression...</span>
                    </>
                  ) : (
                    'Supprimer'
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

GuestPhotoCard.displayName = 'GuestPhotoCard';

