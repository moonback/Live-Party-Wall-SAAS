# 🚀 Implémentations Concrètes - Optimisations Performance

Ce document contient les implémentations concrètes des optimisations identifiées dans l'audit.

---

## 1. PhotosContext Optimisé avec Map

### Fichier : `context/PhotosContext.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef, useMemo } from 'react';
import { Photo } from '../types';
import { getPhotos, subscribeToNewPhotos, subscribeToLikesUpdates, subscribeToPhotoDeletions } from '../services/photoService';
import { logger } from '../utils/logger';
import { useEvent } from './EventContext';
import { debounce } from '../utils/debounce';

interface PhotosContextType {
  photos: Photo[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  addPhoto: (photo: Photo) => void;
  updatePhoto: (id: string, updates: Partial<Photo>) => void;
  removePhoto: (id: string) => void;
  updatePhotoLikes: (photoId: string, newLikesCount: number) => void;
  // Nouvelles méthodes pour pagination
  loadMore: () => Promise<void>;
  hasMore: boolean;
  isLoadingMore: boolean;
}

const PhotosContext = createContext<PhotosContextType | undefined>(undefined);

export const PhotosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ⚡ OPTIMISATION : Utiliser Map pour O(1) updates
  const [photosMap, setPhotosMap] = useState<Map<string, Photo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;
  
  const { currentEvent } = useEvent();

  // ⚡ OPTIMISATION : Convertir Map en Array seulement quand nécessaire
  const photos = useMemo(() => {
    return Array.from(photosMap.values()).sort((a, b) => b.timestamp - a.timestamp);
  }, [photosMap]);

  // ⚡ OPTIMISATION : Batching des updates de likes
  const pendingLikesUpdates = useRef<Map<string, number>>(new Map());
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const applyBatchedLikesUpdates = useCallback(() => {
    if (pendingLikesUpdates.current.size === 0) return;

    const updates = new Map(pendingLikesUpdates.current);
    pendingLikesUpdates.current.clear();

    setPhotosMap(prev => {
      const next = new Map(prev);
      updates.forEach((count, photoId) => {
        const photo = next.get(photoId);
        if (photo && photo.likes_count !== count) {
          next.set(photoId, { ...photo, likes_count: count });
        }
      });
      return next;
    });
  }, []);

  // Load photos from Supabase for the current event (pagination)
  const refresh = useCallback(async () => {
    if (!currentEvent) {
      setPhotosMap(new Map());
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentPage(1);
    
    try {
      const result = await getPhotos(currentEvent.id, { 
        page: 1, 
        pageSize: PAGE_SIZE 
      });
      
      if ('photos' in result) {
        // Pagination
        const newMap = new Map<string, Photo>();
        result.photos.forEach(photo => newMap.set(photo.id, photo));
        setPhotosMap(newMap);
        setHasMore(result.hasMore);
      } else {
        // Pas de pagination (compatibilité)
        const newMap = new Map<string, Photo>();
        result.forEach(photo => newMap.set(photo.id, photo));
        setPhotosMap(newMap);
        setHasMore(false);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur de chargement des photos');
      setError(error);
      logger.error('Failed to load photos', err);
    } finally {
      setLoading(false);
    }
  }, [currentEvent]);

  // ⚡ NOUVELLE FONCTION : Charger plus de photos
  const loadMore = useCallback(async () => {
    if (!currentEvent || !hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const result = await getPhotos(currentEvent.id, { 
        page: currentPage + 1, 
        pageSize: PAGE_SIZE 
      });
      
      if ('photos' in result && result.photos.length > 0) {
        setPhotosMap(prev => {
          const next = new Map(prev);
          result.photos.forEach(photo => next.set(photo.id, photo));
          return next;
        });
        setHasMore(result.hasMore);
        setCurrentPage(prev => prev + 1);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      logger.error('Failed to load more photos', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentEvent, hasMore, isLoadingMore, currentPage]);

  // Add a new photo to the list
  const addPhoto = useCallback((photo: Photo) => {
    setPhotosMap(prev => {
      // Éviter les doublons
      if (prev.has(photo.id)) {
        return prev;
      }
      const next = new Map(prev);
      next.set(photo.id, photo);
      return next;
    });
  }, []);

  // Update a photo
  const updatePhoto = useCallback((id: string, updates: Partial<Photo>) => {
    setPhotosMap(prev => {
      const photo = prev.get(id);
      if (!photo) return prev;
      const next = new Map(prev);
      next.set(id, { ...photo, ...updates });
      return next;
    });
  }, []);

  // Remove a photo
  const removePhoto = useCallback((id: string) => {
    setPhotosMap(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // ⚡ OPTIMISATION : Update likes avec batching
  const updatePhotoLikes = useCallback((photoId: string, newLikesCount: number) => {
    pendingLikesUpdates.current.set(photoId, newLikesCount);
    
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
    
    batchTimeoutRef.current = setTimeout(() => {
      applyBatchedLikesUpdates();
      batchTimeoutRef.current = null;
    }, 500); // Batch toutes les 500ms
  }, [applyBatchedLikesUpdates]);

  // Initial load and subscriptions
  useEffect(() => {
    if (!currentEvent) {
      setPhotosMap(new Map());
      return;
    }

    refresh();

    // Subscribe to new photos for this event
    const newPhotosSubscription = subscribeToNewPhotos(currentEvent.id, (newPhoto) => {
      addPhoto(newPhoto);
    });

    // Subscribe to likes updates avec batching intégré
    const likesSubscription = subscribeToLikesUpdates((photoId, newLikesCount) => {
      updatePhotoLikes(photoId, newLikesCount);
    });

    // Subscribe to photo deletions
    const deleteSubscription = subscribeToPhotoDeletions(currentEvent.id, (deletedPhotoId) => {
      removePhoto(deletedPhotoId);
    });

    return () => {
      newPhotosSubscription.unsubscribe();
      likesSubscription.unsubscribe();
      deleteSubscription.unsubscribe();
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, [currentEvent, refresh, addPhoto, updatePhotoLikes, removePhoto]);

  return (
    <PhotosContext.Provider
      value={{
        photos,
        loading,
        error,
        refresh,
        addPhoto,
        updatePhoto,
        removePhoto,
        updatePhotoLikes,
        loadMore,
        hasMore,
        isLoadingMore,
      }}
    >
      {children}
    </PhotosContext.Provider>
  );
};

export const usePhotos = () => {
  const context = useContext(PhotosContext);
  if (!context) {
    throw new Error('usePhotos must be used within PhotosProvider');
  }
  return context;
};
```

---

## 2. Service de Subscription Unifié

### Fichier : `services/unifiedRealtimeService.ts` (NOUVEAU)

```typescript
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Photo, ReactionType, ReactionCounts } from '../types';
import { logger } from '../utils/logger';
import { getPhotoReactions } from './photoService';

interface UnifiedSubscriptionCallbacks {
  onNewPhoto?: (photo: Photo) => void;
  onPhotoDeleted?: (photoId: string) => void;
  onLikesUpdate?: (photoId: string, newLikesCount: number) => void;
  onReactionsUpdate?: (photoId: string, reactions: ReactionCounts) => void;
}

/**
 * ⚡ OPTIMISATION : Subscription unifiée pour un événement
 * Un seul canal WebSocket au lieu de 3-4
 */
export const createUnifiedPhotoSubscription = (
  eventId: string,
  callbacks: UnifiedSubscriptionCallbacks
): { unsubscribe: () => void } => {
  if (!isSupabaseConfigured()) {
    return { unsubscribe: () => {} };
  }

  const channelId = `photos:unified:${eventId}`;
  const channel = supabase.channel(channelId);

  // Photos : INSERT
  if (callbacks.onNewPhoto) {
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'photos',
        filter: `event_id=eq.${eventId}`,
      },
      async (payload) => {
        try {
          const p = payload.new as any;
          const newPhoto: Photo = {
            id: p.id,
            url: p.url,
            caption: p.caption || '',
            author: p.author || '',
            timestamp: new Date(p.created_at).getTime(),
            likes_count: 0,
            type: (p.type || 'photo') as 'photo' | 'video',
            duration: p.duration ? Number(p.duration) : undefined,
          };
          callbacks.onNewPhoto(newPhoto);
        } catch (error) {
          logger.error('Error processing new photo', error);
        }
      }
    );
  }

  // Photos : DELETE
  if (callbacks.onPhotoDeleted) {
    channel.on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'photos',
      },
      (payload) => {
        try {
          const deletedId = (payload.old as { id?: string })?.id;
          if (deletedId) {
            callbacks.onPhotoDeleted(deletedId);
          }
        } catch (error) {
          logger.error('Error processing photo deletion', error);
        }
      }
    );
  }

  // Likes : INSERT/DELETE avec debounce
  if (callbacks.onLikesUpdate) {
    const likesCountCache = new Map<string, number>();
    const likesDebounceTimers = new Map<string, NodeJS.Timeout>();

    const updateLikesCount = async (photoId: string) => {
      try {
        const { count } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('photo_id', photoId);

        if (count !== null && count !== likesCountCache.get(photoId)) {
          likesCountCache.set(photoId, count);
          callbacks.onLikesUpdate?.(photoId, count);
        }
      } catch (error) {
        logger.error('Error fetching likes count', error);
      }
    };

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'likes',
      },
      (payload) => {
        const photoId = (payload.new as { photo_id?: string })?.photo_id ||
                       (payload.old as { photo_id?: string })?.photo_id;
        
        if (photoId) {
          // Debounce : annuler le timer précédent
          const existingTimer = likesDebounceTimers.get(photoId);
          if (existingTimer) {
            clearTimeout(existingTimer);
          }

          // Nouveau timer
          const timer = setTimeout(() => {
            updateLikesCount(photoId);
            likesDebounceTimers.delete(photoId);
          }, 300);

          likesDebounceTimers.set(photoId, timer);
        }
      }
    );
  }

  // Reactions : INSERT/UPDATE/DELETE
  if (callbacks.onReactionsUpdate) {
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reactions',
      },
      async (payload) => {
        try {
          const photoId = (payload.new as { photo_id?: string })?.photo_id ||
                         (payload.old as { photo_id?: string })?.photo_id;
          
          if (photoId) {
            const reactions = await getPhotoReactions(photoId);
            callbacks.onReactionsUpdate?.(photoId, reactions);
          }
        } catch (error) {
          logger.error('Error processing reactions update', error);
        }
      }
    );
  }

  // Subscribe
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      logger.info(`Unified subscription active for event ${eventId}`);
    } else if (status === 'CHANNEL_ERROR') {
      logger.error(`Unified subscription error for event ${eventId}`);
    }
  });

  return {
    unsubscribe: () => {
      channel.unsubscribe();
      logger.info(`Unified subscription closed for event ${eventId}`);
    },
  };
};
```

---

## 3. Hook de Lazy Loading Intelligent

### Fichier : `hooks/useSmartLazyImage.ts` (NOUVEAU)

```typescript
import { useState, useEffect, useRef, RefObject } from 'react';

interface UseSmartLazyImageOptions {
  /**
   * Délai avant de charger l'image (ms)
   */
  loadDelay?: number;
  /**
   * Marge avant le viewport pour précharger (px)
   */
  rootMargin?: string;
  /**
   * Seuil de visibilité (0-1)
   */
  threshold?: number;
  /**
   * Priorité de chargement ('high' | 'low' | 'auto')
   */
  priority?: 'high' | 'low' | 'auto';
}

interface UseSmartLazyImageReturn {
  /**
   * Ref à attacher à l'élément conteneur
   */
  containerRef: RefObject<HTMLDivElement>;
  /**
   * Si l'image doit être chargée
   */
  shouldLoad: boolean;
  /**
   * Si l'image est en cours de chargement
   */
  isLoading: boolean;
  /**
   * Si l'image est chargée
   */
  isLoaded: boolean;
  /**
   * Forcer le chargement immédiat
   */
  forceLoad: () => void;
}

/**
 * ⚡ OPTIMISATION : Lazy loading intelligent avec Intersection Observer
 * Précharge les images avant qu'elles entrent dans le viewport
 */
export const useSmartLazyImage = (
  options: UseSmartLazyImageOptions = {}
): UseSmartLazyImageReturn => {
  const {
    loadDelay = 100,
    rootMargin = '100px',
    threshold = 0.01,
    priority = 'auto',
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(priority === 'high');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const forceLoad = () => {
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
    }
    setShouldLoad(true);
  };

  useEffect(() => {
    if (shouldLoad || !containerRef.current) return;

    // Créer l'Intersection Observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Délai avant de charger (pour éviter de charger trop tôt)
            delayTimeoutRef.current = setTimeout(() => {
              setShouldLoad(true);
              if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
              }
            }, loadDelay);
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    observerRef.current.observe(containerRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
      }
    };
  }, [shouldLoad, loadDelay, rootMargin, threshold]);

  // Détecter le chargement de l'image
  useEffect(() => {
    if (!shouldLoad) return;

    const img = containerRef.current?.querySelector('img');
    if (!img) return;

    setIsLoading(true);

    const handleLoad = () => {
      setIsLoading(false);
      setIsLoaded(true);
    };

    const handleError = () => {
      setIsLoading(false);
    };

    if (img.complete) {
      handleLoad();
    } else {
      img.addEventListener('load', handleLoad);
      img.addEventListener('error', handleError);
    }

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [shouldLoad]);

  return {
    containerRef,
    shouldLoad,
    isLoading,
    isLoaded,
    forceLoad,
  };
};
```

---

## 4. Utilisation dans GuestPhotoCard

### Fichier : `components/gallery/GuestPhotoCard.tsx` (MODIFICATION)

```typescript
// ... imports existants ...
import { useSmartLazyImage } from '../../hooks/useSmartLazyImage';

export const GuestPhotoCard = React.memo(({ 
  photo, 
  isLiked, 
  onLike, 
  onDownload,
  allPhotos,
  index = 0,
  // ... autres props
}: GuestPhotoCardProps) => {
  // ... code existant ...

  // ⚡ OPTIMISATION : Lazy loading intelligent
  const { containerRef, shouldLoad, isLoading } = useSmartLazyImage({
    loadDelay: index < 10 ? 0 : 100, // Charger immédiatement les 10 premières
    rootMargin: '200px', // Précharger 200px avant
    priority: index < 10 ? 'high' : 'low',
  });

  // ... code existant ...

  return (
    <motion.div 
      ref={containerRef}
      layout
      initial={false} // ⚡ OPTIMISATION : Pas d'animation initiale
      animate={shouldLoad ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      // ... autres props
    >
      {/* ... header ... */}

      {/* Media Container */}
      <div className="relative overflow-hidden bg-black/40">
        {shouldLoad ? (
          photo.type === 'video' ? (
            <video
              src={photo.url}
              className="w-full h-auto object-contain max-h-[60vh] md:max-h-[500px]"
              controls={!selectionMode}
              playsInline
              preload="metadata"
              loading="lazy"
            />
          ) : (
            <img 
              src={photo.url} 
              alt={photo.caption} 
              className={`w-full h-auto transition-transform duration-700 ${getImageClasses(imageOrientation, isMobile)}`}
              loading="lazy"
              decoding="async"
              fetchPriority={index < 10 ? "high" : "low"} // ⚡ OPTIMISATION : Priorité
              style={{ maxHeight: isMobile ? '60vh' : '500px', objectFit: 'contain' }}
              onError={() => setImageError(true)}
            />
          )
        ) : (
          // ⚡ OPTIMISATION : Placeholder pendant chargement
          <div className="aspect-[4/5] bg-slate-800/50 flex items-center justify-center">
            {isLoading && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
            )}
          </div>
        )}
      </div>

      {/* ... reste du code ... */}
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // ⚡ OPTIMISATION : Comparaison personnalisée pour React.memo
  return (
    prevProps.photo.id === nextProps.photo.id &&
    prevProps.isLiked === nextProps.isLiked &&
    prevProps.isDownloading === nextProps.isDownloading &&
    prevProps.userReaction === nextProps.userReaction &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.selectionMode === nextProps.selectionMode &&
    JSON.stringify(prevProps.reactions) === JSON.stringify(nextProps.reactions)
  );
});
```

---

## 5. Infinite Scroll pour GuestGallery

### Fichier : `components/GuestGallery.tsx` (MODIFICATION)

```typescript
// ... imports existants ...

const GuestGallery: React.FC<GuestGalleryProps> = ({ onBack, onUploadClick, onFindMeClick }) => {
  // ... état existant ...
  
  const { photos, loadMore, hasMore, isLoadingMore } = usePhotos(); // ⚡ Utiliser nouvelles méthodes
  const [localPhotos, setLocalPhotos] = useState<Photo[]>([]);

  // ⚡ OPTIMISATION : Infinite scroll
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, isLoadingMore, loadMore]);

  // ... reste du code ...

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
      {/* ... contenu existant ... */}

      {/* Content */}
      <div 
        ref={parentRef} 
        className="flex-1 overflow-y-auto pb-20 sm:pb-24 md:pb-28 scroll-smooth relative z-10"
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6">
          {/* ... contenu existant ... */}

          <GalleryContent
            loading={loading}
            photos={filteredAndSortedPhotos}
            // ... autres props
          />

          {/* ⚡ OPTIMISATION : Trigger infinite scroll */}
          {hasMore && (
            <div ref={observerTarget} className="h-20 flex items-center justify-center">
              {isLoadingMore && (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ... reste du code ... */}
    </div>
  );
};
```

---

## 6. Cache pour Permissions

### Fichier : `services/permissionsCache.ts` (NOUVEAU)

```typescript
interface CachedPermissions {
  isEventOwner: boolean;
  canEdit: boolean;
  timestamp: number;
}

const CACHE_TTL = 60000; // 1 minute
const permissionsCache = new Map<string, CachedPermissions>();

/**
 * ⚡ OPTIMISATION : Cache des permissions avec TTL
 */
export const getCachedPermissions = async (
  eventId: string,
  userId: string,
  fetchPermissions: () => Promise<{ isEventOwner: boolean; canEdit: boolean }>
): Promise<{ isEventOwner: boolean; canEdit: boolean }> => {
  const cacheKey = `${eventId}:${userId}`;
  const cached = permissionsCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return {
      isEventOwner: cached.isEventOwner,
      canEdit: cached.canEdit,
    };
  }

  const permissions = await fetchPermissions();
  permissionsCache.set(cacheKey, {
    ...permissions,
    timestamp: Date.now(),
  });

  return permissions;
};

/**
 * Invalider le cache pour un événement/utilisateur
 */
export const invalidatePermissionsCache = (eventId: string, userId: string) => {
  const cacheKey = `${eventId}:${userId}`;
  permissionsCache.delete(cacheKey);
};

/**
 * Nettoyer le cache expiré
 */
export const cleanupExpiredPermissionsCache = () => {
  const now = Date.now();
  for (const [key, value] of permissionsCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      permissionsCache.delete(key);
    }
  }
};

// Nettoyer le cache toutes les 5 minutes
setInterval(cleanupExpiredPermissionsCache, 5 * 60000);
```

---

## 📝 Notes d'Implémentation

### Ordre Recommandé
1. **PhotosContext avec Map** (Impact critique)
2. **Subscription unifiée** (Réduction connexions)
3. **Lazy loading intelligent** (Réduction bande passante)
4. **Infinite scroll** (Amélioration UX)
5. **Cache permissions** (Optimisation secondaire)

### Tests à Effectuer
- ✅ Vérifier que toutes les photos s'affichent correctement
- ✅ Tester le scroll infini
- ✅ Vérifier les subscriptions temps réel
- ✅ Tester avec 500+ photos
- ✅ Mesurer les performances avant/après

### Rollback
Si problème, revenir à l'ancienne version en :
1. Restaurant `PhotosContext.tsx` original
2. Gardant les subscriptions séparées
3. Désactivant le lazy loading intelligent

---

**Document créé le** : 2026-01-15  
**Dernière mise à jour** : 2026-01-15

