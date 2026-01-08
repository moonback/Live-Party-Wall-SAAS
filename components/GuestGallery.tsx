import React, { useEffect, useState, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { Photo, SortOption, MediaFilter } from '../types';
import { getPhotos, subscribeToNewPhotos, toggleLike, getUserLikes, toggleReaction, getUserReactions, subscribeToReactionsUpdates } from '../services/photoService';
import type { ReactionType, PhotoBattle } from '../types';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { useEvent } from '../context/EventContext';
import { getActiveBattles, subscribeToNewBattles } from '../services/battleService';
import { useDebounce } from '../hooks/useDebounce';
import { filterAndSortPhotos } from '../utils/photoFilters';
import { getAllGuests } from '../services/guestService';
import { combineCleanups } from '../utils/subscriptionHelper';
import { GalleryHeader } from './gallery/GalleryHeader';
import { GalleryFilters } from './gallery/GalleryFilters';
import { GalleryContent } from './gallery/GalleryContent';
import { GalleryFAB } from './gallery/GalleryFAB';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Lazy load Lightbox
const Lightbox = lazy(() => import('./Lightbox'));

interface GuestGalleryProps {
  onBack: () => void;
  onUploadClick: () => void;
  onFindMeClick?: () => void;
}

const GuestGallery: React.FC<GuestGalleryProps> = ({ onBack, onUploadClick, onFindMeClick }) => {
  const { addToast } = useToast();
  const { settings } = useSettings();
  const { currentEvent } = useEvent();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPhotoIds, setLikedPhotoIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [userReactions, setUserReactions] = useState<Map<string, ReactionType>>(new Map());
  const [photosReactions, setPhotosReactions] = useState<Map<string, import('../types').ReactionCounts>>(new Map());
  const [battles, setBattles] = useState<PhotoBattle[]>([]);
  const [showBattles, setShowBattles] = useState(true);
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [guestAvatars, setGuestAvatars] = useState<Map<string, string>>(new Map());
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  
  // Selection mode states
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  const parentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialisation User ID
  useEffect(() => {
    let storedId = localStorage.getItem('party_user_id');
    if (!storedId) {
      storedId = crypto.randomUUID();
      localStorage.setItem('party_user_id', storedId);
    }
    setUserId(storedId);
  }, []);

  // Chargement des données
  useEffect(() => {
    if (!userId || !currentEvent?.id) {
      setPhotos([]);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const [allPhotos, userLikes, userReactionsData, allGuests] = await Promise.all([
          getPhotos(currentEvent.id),
          getUserLikes(userId),
          getUserReactions(userId),
          getAllGuests(currentEvent.id)
        ]);
        
        setPhotos(allPhotos);
        setLikedPhotoIds(new Set(userLikes));
        setUserReactions(userReactionsData);
        
        const avatarsMap = new Map<string, string>();
        const sortedGuests = [...allGuests].sort((a, b) => b.updatedAt - a.updatedAt);
        sortedGuests.forEach(guest => {
          if (!avatarsMap.has(guest.name)) {
            avatarsMap.set(guest.name, guest.avatarUrl);
          }
        });
        setGuestAvatars(avatarsMap);
        
        const { getPhotosReactions } = await import('../services/photoService');
        const photoIds = allPhotos.map(p => p.id);
        const reactionsMap = await getPhotosReactions(photoIds);
        setPhotosReactions(reactionsMap);
      } catch (error) {
        console.error(error);
        addToast("Erreur de chargement", 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const sub = subscribeToNewPhotos(currentEvent.id, (newPhoto) => {
      setPhotos(prev => [...prev, newPhoto]);
      addToast("Nouvelle photo publiée !", 'info');
    });

    const reactionsSub = subscribeToReactionsUpdates((photoId, reactions) => {
      setPhotosReactions(prev => {
        const next = new Map(prev);
        if (Object.keys(reactions).length > 0) {
          next.set(photoId, reactions);
        } else {
          next.delete(photoId);
        }
        return next;
      });
    });

    const loadBattles = async () => {
      if (settings.battle_mode_enabled === false || !currentEvent?.id) {
        setBattles([]);
        return;
      }
      try {
        const activeBattles = await getActiveBattles(currentEvent.id, userId);
        setBattles(activeBattles);
      } catch (error) {
        console.error('Error loading battles:', error);
      }
    };

    loadBattles();

    let checkExpiredInterval: NodeJS.Timeout | null = null;
    if (settings.battle_mode_enabled !== false) {
      checkExpiredInterval = setInterval(() => {
        loadBattles();
      }, 30000);
    }

    let battlesSub: { unsubscribe: () => void } | null = null;
    if (settings.battle_mode_enabled !== false && currentEvent?.id) {
      battlesSub = subscribeToNewBattles(currentEvent.id, async (newBattle) => {
        setBattles(prev => {
          if (prev.some(b => b.id === newBattle.id)) {
            return prev;
          }
          return [newBattle, ...prev];
        });
      });
    }

    // Nettoyer tous les abonnements et intervals de manière sécurisée
    return combineCleanups([
      () => sub.unsubscribe(),
      () => reactionsSub.unsubscribe(),
      battlesSub ? () => battlesSub.unsubscribe() : null,
      checkExpiredInterval ? () => clearInterval(checkExpiredInterval) : null,
    ]);
  }, [userId, addToast, settings.battle_mode_enabled, currentEvent?.id]);

  // Scroll handler pour le bouton "Top"
  useEffect(() => {
    const div = parentRef.current;
    if (!div) return;

    const handleScroll = () => {
      setShowScrollTop(div.scrollTop > 500);
    };

    div.addEventListener('scroll', handleScroll);
    return () => div.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    parentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLike = useCallback(async (photoId: string) => {
    if (selectionMode) return;
    const isLiked = likedPhotoIds.has(photoId);
    
    setLikedPhotoIds(prev => {
      const next = new Set(prev);
      if (isLiked) next.delete(photoId);
      else next.add(photoId);
      return next;
    });

    setPhotos(prev => prev.map(p => {
      if (p.id === photoId) {
        return { ...p, likes_count: Math.max(0, p.likes_count + (isLiked ? -1 : 1)) };
      }
      return p;
    }));

    try {
      await toggleLike(photoId, userId);
    } catch (error) {
      console.error(error);
      addToast("Erreur lors du like", 'error');
      setLikedPhotoIds(prev => {
        const next = new Set(prev);
        if (isLiked) next.add(photoId);
        else next.delete(photoId);
        return next;
      });
    }
  }, [likedPhotoIds, userId, addToast, selectionMode]);

  const handleReaction = useCallback(async (photoId: string, reactionType: ReactionType | null) => {
    if (selectionMode) return;
    try {
      const { reactions, userReaction } = await toggleReaction(photoId, userId, reactionType);
      
      setUserReactions(prev => {
        const next = new Map(prev);
        if (userReaction) {
          next.set(photoId, userReaction);
        } else {
          next.delete(photoId);
        }
        return next;
      });
      
      setPhotosReactions(prev => {
        const next = new Map(prev);
        if (Object.keys(reactions).length > 0) {
          next.set(photoId, reactions);
        } else {
          next.delete(photoId);
        }
        return next;
      });
    } catch (error) {
      console.error("Erreur lors de la réaction:", error);
      addToast("Erreur lors de la réaction", 'error');
    }
  }, [userId, addToast, selectionMode]);

  const handleDownload = useCallback(async (photo: Photo) => {
    setDownloadingIds(prev => new Set(prev).add(photo.id));
    
    try {
      addToast("Téléchargement en cours...", 'info');
      
      const response = await fetch(photo.url);
      if (!response.ok) throw new Error('Erreur de téléchargement');
      
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const extension = photo.type === 'video' ? (photo.url.includes('.webm') ? 'webm' : 'mp4') : 'jpg';
      link.download = `party-wall-${photo.author}-${photo.id.substring(0, 8)}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      addToast("Média téléchargé !", 'success');
    } catch (error) {
      console.error("Erreur de téléchargement:", error);
      addToast("Erreur lors du téléchargement", 'error');
    } finally {
      setTimeout(() => {
        setDownloadingIds(prev => {
          const next = new Set(prev);
          next.delete(photo.id);
          return next;
        });
      }, 500);
    }
  }, [addToast]);

  const handleBatchDownload = async () => {
    if (selectedIds.size === 0) return;
    
    const zip = new JSZip();
    addToast(`Préparation de ${selectedIds.size} fichiers...`, 'info');
    
    try {
      const selectedPhotos = photos.filter(p => selectedIds.has(p.id));
      
      for (const photo of selectedPhotos) {
        const response = await fetch(photo.url);
        const blob = await response.blob();
        const extension = photo.type === 'video' ? (photo.url.includes('.webm') ? 'webm' : 'mp4') : 'jpg';
        const fileName = `${photo.author}-${photo.id.substring(0, 8)}.${extension}`;
        zip.file(fileName, blob);
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `party-wall-selection.zip`);
      addToast("Téléchargement de l'archive lancé !", 'success');
      setSelectionMode(false);
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Erreur batch download:", error);
      addToast("Erreur lors de la création de l'archive", 'error');
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedIds(new Set());
    }
  };

  // Filtrage et Tri avec debounce
  const filteredAndSortedPhotos = useMemo(() => {
    const videoEnabled = settings.video_capture_enabled !== false;
    let basePhotos = photos;
    
    // Si la vidéo est désactivée, on filtre toutes les vidéos de la base
    if (!videoEnabled) {
      basePhotos = photos.filter(p => p.type !== 'video');
    }

    return filterAndSortPhotos(basePhotos, {
      sortBy,
      searchQuery: debouncedSearchQuery,
      mediaFilter,
      selectedAuthors,
    });
  }, [photos, sortBy, debouncedSearchQuery, mediaFilter, selectedAuthors, settings.video_capture_enabled]);

  // Navigation avec swipe
  const navigateToPhoto = useCallback((direction: 'next' | 'prev', currentIndex: number) => {
    if (filteredAndSortedPhotos.length === 0 || selectionMode) return;

    if (direction === 'next' && currentIndex < filteredAndSortedPhotos.length - 1) {
      const nextIndex = currentIndex + 1;
      setTimeout(() => {
        const nextPhotoElement = document.querySelector(`[data-photo-index="${nextIndex}"]`);
        if (nextPhotoElement) {
          nextPhotoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
    } else if (direction === 'prev' && currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setTimeout(() => {
        const prevPhotoElement = document.querySelector(`[data-photo-index="${prevIndex}"]`);
        if (prevPhotoElement) {
          prevPhotoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
    }
  }, [filteredAndSortedPhotos.length, selectionMode]);

  // Focus sur la recherche avec Ctrl/Cmd + K et fermeture leaderboard avec Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (showLeaderboard) setShowLeaderboard(false);
        if (selectionMode) {
          setSelectionMode(false);
          setSelectedIds(new Set());
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLeaderboard, selectionMode]);

  const handleBattleFinished = useCallback((battleId: string, _winnerId: string | null, winnerPhoto?: Photo) => {
    setBattles(prev => prev.filter(b => b.id !== battleId));
    
    if (winnerPhoto) {
      addToast('🏆 Battle terminée !', 'success');
    } else {
      addToast('Battle terminée ! (Égalité)', 'info');
    }
  }, [addToast]);

  const handlePhotoClick = useCallback((photo: Photo, index: number) => {
    if (selectionMode) {
      handleSelect(photo.id);
      return;
    }
    setLightboxIndex(index);
    setLightboxPhoto(photo);
  }, [selectionMode]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-900/30 rounded-full blur-[180px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-pink-900/30 rounded-full blur-[180px]" style={{ animationName: 'pulseSlow', animationDuration: '8s', animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite', animationDelay: '2s' }}></div>
      </div>
      {/* Grain Texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

      {/* Floating Particles Effect */}
      <div className="fixed inset-0 pointer-events-none z-0">
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

      {/* Header */}
      <GalleryHeader
        onBack={onBack}
        onUploadClick={onUploadClick}
        onFiltersClick={() => setIsFiltersModalOpen(prev => !prev)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchInputRef={searchInputRef}
        isFiltersModalOpen={isFiltersModalOpen}
        selectionMode={selectionMode}
        onToggleSelectionMode={toggleSelectionMode}
        selectedCount={selectedIds.size}
        onBatchDownload={handleBatchDownload}
      />

      {/* Filters */}
      <div className="sticky top-[81px] z-40 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 md:px-6 lg:px-8 py-1">
          <GalleryFilters
            sortBy={sortBy}
            onSortChange={setSortBy}
            mediaFilter={mediaFilter}
            onMediaFilterChange={setMediaFilter}
            showLeaderboard={showLeaderboard}
            onToggleLeaderboard={() => setShowLeaderboard(!showLeaderboard)}
            showBattles={showBattles}
            onToggleBattles={() => setShowBattles(!showBattles)}
            battlesCount={battles.length}
            battleModeEnabled={settings.battle_mode_enabled !== false}
            findMeEnabled={settings.find_me_enabled}
            onFindMeClick={onFindMeClick}
            isModalOpen={isFiltersModalOpen}
            onModalOpenChange={setIsFiltersModalOpen}
            photos={photos}
            selectedAuthors={selectedAuthors}
            onSelectedAuthorsChange={setSelectedAuthors}
            videoEnabled={settings.video_capture_enabled !== false}
          />
              </div>
            </div>

      {/* Content */}
      <div 
        ref={parentRef} 
        className="flex-1 overflow-y-auto pb-24 md:pb-28 scroll-smooth relative z-10"
      >
        <div className="max-w-7xl mx-auto px-3 md:px-6 lg:px-8 py-4 md:py-6">
          <GalleryContent
            loading={loading}
            photos={filteredAndSortedPhotos}
            battles={battles}
            showBattles={showBattles}
            battleModeEnabled={settings.battle_mode_enabled !== false}
            showLeaderboard={showLeaderboard}
            likedPhotoIds={likedPhotoIds}
            downloadingIds={downloadingIds}
            userReactions={userReactions}
            photosReactions={photosReactions}
            guestAvatars={guestAvatars}
            searchQuery={searchQuery}
            mediaFilter={mediaFilter}
            onLike={handleLike}
            onDownload={handleDownload}
            onReaction={handleReaction}
            onBattleFinished={handleBattleFinished}
            onPhotoClick={handlePhotoClick}
            onNavigatePhoto={navigateToPhoto}
            userId={userId}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onSelect={handleSelect}
          />
        </div>
      </div>

      {/* FAB */}
      <GalleryFAB
        showScrollTop={showScrollTop}
        onScrollTop={scrollToTop}
        onUploadClick={onUploadClick}
      />

      {/* Lightbox */}
      {lightboxPhoto && (
        <Suspense
          fallback={
            <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center animate-fade-in">
              <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-pink-500"></div>
            </div>
          }
        >
          <Lightbox
            photo={lightboxPhoto}
            onClose={() => {
              setLightboxPhoto(null);
              setLightboxIndex(null);
            }}
            onPrev={() => {
              if (lightboxIndex !== null && lightboxIndex > 0) {
                const prevIndex = lightboxIndex - 1;
                setLightboxIndex(prevIndex);
                setLightboxPhoto(filteredAndSortedPhotos[prevIndex]);
              }
            }}
            onNext={() => {
              if (lightboxIndex !== null && lightboxIndex < filteredAndSortedPhotos.length - 1) {
                const nextIndex = lightboxIndex + 1;
                setLightboxIndex(nextIndex);
                setLightboxPhoto(filteredAndSortedPhotos[nextIndex]);
              }
            }}
            currentIndex={lightboxIndex ?? 0}
            totalPhotos={filteredAndSortedPhotos.length}
            downloadUrl={lightboxPhoto.url}
          />
        </Suspense>
      )}
    </div>
  );
};

export default GuestGallery;
