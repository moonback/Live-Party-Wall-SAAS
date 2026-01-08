import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Photo, ReactionType } from '../../types';
import { REACTIONS, REACTION_TYPES } from '../../constants';
import { Heart, Download, Image, Video, Tag } from 'lucide-react';
import { hasPhotographerBadge, getPhotoBadge } from '../../services/gamificationService';
import { getImageClasses } from '../../hooks/useImageOrientation';
import type { ImageOrientation } from '../../hooks/useImageOrientation';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useSwipe } from '../../hooks/useSwipe';
import { getUserAvatar } from '../../utils/userAvatar';
import { useSettings } from '../../context/SettingsContext';

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
  guestAvatars
}: GuestPhotoCardProps) => {
  const { settings } = useSettings();
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);
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
  
  const animationDelay = Math.min(index * 50, 1000);
  
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
    const now = Date.now();
    
    if (now - lastClickTime.current < 300) {
      onLike(photo.id);
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 1000);
    }
    
    lastClickTime.current = now;
  }, [onLike, photo.id]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
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
  }, [onLike, photo.id]);
  
  return (
    <div 
      className={`group bg-slate-900/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 shadow-xl transition-all duration-300 break-inside-avoid ${
        isMobile 
          ? 'mb-4 active:scale-[0.98] active:shadow-lg' 
          : 'mb-0 hover:shadow-2xl hover:border-pink-500/40 hover:scale-[1.02]'
      }`}
      style={{ 
        animation: 'slideInBottom 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        animationDelay: `${animationDelay}ms`
      }}
      {...(isMobile && (onSwipeLeft || onSwipeRight) ? cardSwipe.handlers : {})}
    >
      {/* Header Photo */}
      <div className={`flex items-center gap-3 bg-gradient-to-r from-slate-900/90 to-slate-800/90 border-b border-white/10 ${isMobile ? 'px-3 py-2.5' : 'px-5 py-4'}`}>
        <div className="relative flex-shrink-0">
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt={photo.author}
              className={`rounded-full object-cover border-2 border-white/30 shadow-xl ring-2 ring-pink-500/30 ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}`}
            />
          ) : (
            <div className={`rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center font-bold text-white shadow-xl ring-2 ring-pink-500/40 ${isMobile ? 'w-10 h-10 text-base' : 'w-12 h-12 text-lg'}`}>
              {photo.author[0]?.toUpperCase()}
            </div>
          )}
          {authorHasPhotographerBadge && (
            <div className={`absolute -bottom-1 -right-1 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center border-2 border-white shadow-xl ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`}>
              <span className={isMobile ? 'text-[9px]' : 'text-xs'}>📸</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-bold text-white truncate ${isMobile ? 'text-sm' : 'text-lg'}`}>{photo.author}</p>
            {authorHasPhotographerBadge && (
              <span className={`bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-lg text-yellow-400 flex items-center gap-1 shadow-sm ${isMobile ? 'px-1 py-0.5 text-[9px]' : 'px-2 py-0.5 text-xs'}`}>
                <span>📸</span>
                <span className="hidden sm:inline">Pro</span>
              </span>
            )}
          </div>
          <p className={`text-slate-400 truncate ${isMobile ? 'text-[11px]' : 'text-sm'}`}>
            {new Date(photo.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </p>
        </div>
      </div>

      {/* Media */}
      <div 
        className={`bg-black relative overflow-hidden ${
          isMobile && photo.type === 'photo' && imageOrientation === 'portrait' 
            ? 'min-h-[200px]' 
            : 'aspect-auto'
        }`}
        onDoubleClick={handleDoubleClick}
        onTouchEnd={handleTouchEnd}
      >
        {showHeartAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
            <div className="animate-heart-pop">
              <Heart className="w-20 h-20 text-red-500 fill-red-500 drop-shadow-lg" />
            </div>
          </div>
        )}
        {photo.type === 'video' ? (
          videoError ? (
            <div className="w-full h-[250px] flex items-center justify-center bg-slate-800/50">
              <div className="text-center text-slate-400">
                <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Erreur de chargement vidéo</p>
              </div>
            </div>
          ) : (
            <video
              src={photo.url}
              className="w-full h-auto object-contain max-h-[50vh] md:max-h-[400px]"
              controls
              playsInline
              preload="metadata"
              controlsList="nodownload"
              style={{ pointerEvents: 'auto' }}
              onError={() => setVideoError(true)}
              onLoadedMetadata={(e) => {
                const video = e.currentTarget;
                if (video) {
                  video.style.opacity = '1';
                }
              }}
            />
          )
        ) : imageError ? (
          <div className="w-full h-[250px] flex items-center justify-center bg-slate-800/50">
            <div className="text-center text-slate-400">
              <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Erreur de chargement image</p>
            </div>
          </div>
        ) : (
          <img 
            src={photo.url} 
            alt={photo.caption} 
            className={getImageClasses(imageOrientation, isMobile)}
            loading="lazy"
            style={{
              maxWidth: '100%',
              maxHeight: isMobile ? '50vh' : '400px',
              height: 'auto',
              objectFit: 'contain'
            }}
            onError={() => setImageError(true)}
          />
        )}
        {photo.type === 'video' && (
          <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-1.5 z-20 pointer-events-none border border-white/20 shadow-xl">
            <Video className="w-3.5 h-3.5 text-white" />
            {photo.duration && (
              <span className="text-white text-xs font-semibold">
                {Math.floor(photo.duration)}s
              </span>
            )}
          </div>
        )}
        {photoBadge && (
          <div className="absolute top-3 right-3 z-20 pointer-events-none">
            <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-1.5 border border-yellow-300/50">
              <span className="text-base">⭐</span>
              <span className="text-xs font-bold text-white hidden sm:inline drop-shadow-lg">Star</span>
            </div>
          </div>
        )}
      </div>

      {/* Actions & Caption */}
      <div className={`bg-gradient-to-r from-slate-900/90 to-slate-800/90 ${isMobile ? 'px-4 py-2' : 'px-4 py-2'}`}>
        <div className={`flex items-center gap-3 mb-2 relative`}>
          {/* Like/reaction */}
          <div className="relative">
            <button
              ref={likeButtonRef}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleReactionTouchStart}
              onTouchEnd={handleReactionTouchEnd}
              className={`group/like transition-all touch-manipulation relative ${isMobile ? 'active:scale-95 p-1' : 'hover:scale-105 p-1'} ${isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
              aria-label={isLiked ? 'Retirer le like' : 'Appuyez longuement pour réagir'}
              aria-pressed={isLiked}
            >
              <div className={`absolute inset-0 rounded-full transition-all ${isLiked ? 'bg-red-500/10' : 'group-hover/like:bg-red-500/5'}`} />
              <Heart className={`transition-all relative z-10 ${isLiked ? 'fill-current drop-shadow-lg' : ''} w-6 h-6`} />
            </button>
            {showReactionsMenu && onReaction && (
              <div
                ref={reactionsMenuRef}
                className="absolute bottom-full left-0 mb-2 bg-slate-900/95 backdrop-blur-xl rounded-2xl p-1.5 shadow-2xl border border-white/20 z-50 flex items-center gap-1 animate-fade-in-up"
                onMouseLeave={() => setShowReactionsMenu(false)}
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
                      className={`group/reaction flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all touch-manipulation ${isMobile ? 'active:scale-95' : 'hover:scale-105'} ${isActive ? 'bg-gradient-to-r from-pink-500/25 to-purple-500/20' : 'hover:bg-slate-800/50'}`}
                      title={reaction.label}
                      aria-label={`${reaction.label} (${count})`}
                    >
                      <span className="text-base group-hover/reaction:scale-125 transition-transform">{reaction.emoji}</span>
                      {count > 0 && (
                        <span className={`text-[10px] font-bold ${isActive ? 'text-white' : 'text-slate-300'}`}>{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {/* Download button */}
          <button
            onClick={() => onDownload(photo)}
            disabled={isDownloading}
            className={`transition-all touch-manipulation relative ${isMobile ? 'active:scale-95 p-1' : 'hover:scale-105 p-1'} ${isDownloading ? 'text-blue-400 cursor-wait' : 'text-slate-400 hover:text-blue-400'}`}
            title={isDownloading ? 'Téléchargement en cours...' : 'Télécharger la photo'}
            aria-label={isDownloading ? 'Téléchargement en cours' : 'Télécharger la photo'}
            aria-busy={isDownloading}
          >
            <div className="absolute inset-0 rounded-full bg-blue-500/5 group-hover:bg-blue-500/10 transition-all" />
            {isDownloading ? (
              <div className="border-2 border-blue-400 border-t-transparent rounded-full animate-spin relative z-10 w-6 h-6" />
            ) : (
              <Download className="relative z-10 w-6 h-6" />
            )}
          </button>
          {/* Like/reaction counts */}
          {(photo.likes_count > 0 || Object.keys(reactions).length > 0) && (
            <div className="flex items-center gap-2 ml-2">
              {photo.likes_count > 0 && (
                <div className="flex items-center gap-0.5">
                  <Heart className={`w-4 h-4 ${isLiked ? 'text-red-500 fill-current' : 'text-slate-400'}`} />
                  <span className={`font-bold ${isMobile ? 'text-xs' : 'text-sm'} ${isLiked ? 'text-red-500' : 'text-white'}`}>{photo.likes_count}</span>
                </div>
              )}
              {onReaction && Object.entries(reactions).map(([type, count]) => {
                const reaction = REACTIONS[type as ReactionType];
                if (!reaction || count === 0) return null;
                return (
                  <span key={type} className="flex items-center gap-0.5 font-bold text-white text-xs">
                    <span>{reaction.emoji}</span>
                    <span>{count}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
        {/* Caption/author */}
        <div className="mb-1">
          <span className={`font-bold text-white text-xs`}>{photo.author}</span>{' '}
          <span className="text-slate-200 text-xs">{photo.caption}</span>
        </div>
        {/* Tags */}
        {settings.tags_generation_enabled !== false && photo.tags && photo.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-2 mt-2">
            <Tag className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <div className="flex flex-wrap gap-1.5">
              {photo.tags.slice(0, 5).map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded-lg bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-300 text-[10px] font-medium shadow-sm hover:from-pink-500/30 hover:to-purple-500/30 transition-all"
                  title={tag}
                >
                  {tag}
                </span>
              ))}
              {photo.tags.length > 5 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-800/50 border border-white/10 text-slate-400 text-[10px] font-medium">
                  +{photo.tags.length - 5}
                </span>
              )}
            </div>
          </div>
        )}
        {/* Timestamp */}
        <span className={`text-slate-500 ${isMobile ? 'text-[10px]' : 'text-xs uppercase tracking-wide'}`}>
          {isMobile 
            ? new Date(photo.timestamp).toLocaleDateString('fr-FR', { 
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
              })
            : new Date(photo.timestamp).toLocaleDateString('fr-FR', { 
                day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
              }).toUpperCase()
          }
        </span>
      </div>
    </div>
  );
});

GuestPhotoCard.displayName = 'GuestPhotoCard';

