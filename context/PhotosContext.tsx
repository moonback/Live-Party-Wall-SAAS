import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef, useMemo } from 'react';
import { Photo } from '../types';
import { getPhotos, enrichPhotoWithOrientation } from '../services/photoService';
import { createUnifiedPhotoSubscription } from '../services/unifiedRealtimeService';
import { logger } from '../utils/logger';
import { useEvent } from './EventContext';

interface PhotosContextType {
  photos: Photo[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  addPhoto: (photo: Photo) => void;
  updatePhoto: (id: string, updates: Partial<Photo>) => void;
  removePhoto: (id: string) => void;
  updatePhotoLikes: (photoId: string, newLikesCount: number) => void;
  // ⚡ OPTIMISATION : Pagination
  loadMore: () => Promise<void>;
  hasMore: boolean;
  isLoadingMore: boolean;
}

const PhotosContext = createContext<PhotosContextType | undefined>(undefined);

const PAGE_SIZE = 50; // ⚡ OPTIMISATION : Pagination initiale

export const PhotosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ⚡ OPTIMISATION : Utiliser Map pour O(1) updates au lieu de O(n) avec Array
  const [photosMap, setPhotosMap] = useState<Map<string, Photo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // ⚡ OPTIMISATION : État pour pagination
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { currentEvent } = useEvent();

  // ⚡ OPTIMISATION : Convertir Map en Array trié seulement quand nécessaire
  const photos = useMemo(() => {
    return Array.from(photosMap.values()).sort((a, b) => b.timestamp - a.timestamp);
  }, [photosMap]);

  // ⚡ OPTIMISATION : Load photos avec pagination initiale
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
      // ⚡ OPTIMISATION : Charger seulement la première page (50 photos)
      const result = await getPhotos(currentEvent.id, { 
        page: 1, 
        pageSize: PAGE_SIZE 
      });
      
      if ('photos' in result) {
        // Pagination activée
        const newMap = new Map<string, Photo>();
        result.photos.forEach(photo => newMap.set(photo.id, photo));
        setPhotosMap(newMap);
        setHasMore(result.hasMore);
      } else {
        // Pas de pagination (compatibilité avec ancien code)
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

  // ⚡ OPTIMISATION : Charger plus de photos (infinite scroll)
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

  // ⚡ OPTIMISATION : Add photo avec Map (O(1) au lieu de O(n))
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

  // ⚡ OPTIMISATION : Update photo avec Map (O(1) au lieu de O(n))
  const updatePhoto = useCallback((id: string, updates: Partial<Photo>) => {
    setPhotosMap(prev => {
      const photo = prev.get(id);
      if (!photo) return prev;
      const next = new Map(prev);
      next.set(id, { ...photo, ...updates });
      return next;
    });
  }, []);

  // ⚡ OPTIMISATION : Remove photo avec Map (O(1) au lieu de O(n))
  const removePhoto = useCallback((id: string) => {
    setPhotosMap(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // ⚡ OPTIMISATION : Batching des updates de likes (500ms window)
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

  // ⚡ OPTIMISATION : Update likes avec batching (500ms au lieu de 300ms debounce)
  const updatePhotoLikes = useCallback((photoId: string, newLikesCount: number) => {
    pendingLikesUpdates.current.set(photoId, newLikesCount);
    
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
    
    batchTimeoutRef.current = setTimeout(() => {
      applyBatchedLikesUpdates();
      batchTimeoutRef.current = null;
    }, 500); // ⚡ OPTIMISATION : Batch toutes les 500ms
  }, [applyBatchedLikesUpdates]);

  // ⚡ OPTIMISATION : Initial load and unified subscription
  useEffect(() => {
    if (!currentEvent) {
      setPhotosMap(new Map());
      return;
    }

    refresh();

    // ⚡ OPTIMISATION : Utiliser une seule subscription unifiée au lieu de 3-4
    const unifiedSubscription = createUnifiedPhotoSubscription(currentEvent.id, {
      onNewPhoto: async (newPhoto) => {
        // ⚡ Précalculer l'orientation pour les nouvelles photos
        const enrichedPhoto = await enrichPhotoWithOrientation(newPhoto);
        addPhoto(enrichedPhoto);
      },
      onPhotoDeleted: (deletedPhotoId) => {
        // Vérifier si la photo existe dans notre liste locale avant de la supprimer
        // Cela évite de supprimer des photos d'autres événements (RLS filtre déjà)
        removePhoto(deletedPhotoId);
      },
      onLikesUpdate: (photoId, newLikesCount) => {
        // Le batching est déjà géré dans updatePhotoLikes
        updatePhotoLikes(photoId, newLikesCount);
      },
      onReactionsUpdate: (photoId, reactions) => {
        // ⚡ OPTIMISATION : Les réactions sont gérées par les composants enfants si nécessaire
        // On pourrait ajouter un état pour les réactions ici si besoin
        logger.debug('Reactions update received', { photoId, reactions });
      },
    });

    return () => {
      unifiedSubscription.unsubscribe();
      // ⚡ OPTIMISATION : Nettoyer le batch timeout
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
        batchTimeoutRef.current = null;
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
        // ⚡ OPTIMISATION : Nouvelles méthodes pour pagination
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

