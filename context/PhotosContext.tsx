import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
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
}

const PhotosContext = createContext<PhotosContextType | undefined>(undefined);

export const PhotosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { currentEvent } = useEvent();

  // Load photos from Supabase for the current event
  const refresh = useCallback(async () => {
    if (!currentEvent) {
      setPhotos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getPhotos(currentEvent.id);
      setPhotos(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur de chargement des photos');
      setError(error);
      logger.error('Failed to load photos', err);
    } finally {
      setLoading(false);
    }
  }, [currentEvent]);

  // Add a new photo to the list
  const addPhoto = useCallback((photo: Photo) => {
    setPhotos(prev => {
      // Éviter les doublons
      if (prev.some(p => p.id === photo.id)) {
        return prev;
      }
      return [...prev, photo];
    });
  }, []);

  // Update a photo
  const updatePhoto = useCallback((id: string, updates: Partial<Photo>) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  // Remove a photo
  const removePhoto = useCallback((id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  }, []);

  // Update likes count for a photo avec debounce pour éviter trop de re-renders
  const updatePhotoLikesDebounced = useRef(
    debounce((photoId: string, newLikesCount: number) => {
      setPhotos(prev => prev.map(p => 
        p.id === photoId ? { ...p, likes_count: newLikesCount } : p
      ));
    }, 300) // Debounce de 300ms
  ).current;

  const updatePhotoLikes = useCallback((photoId: string, newLikesCount: number) => {
    updatePhotoLikesDebounced(photoId, newLikesCount);
  }, [updatePhotoLikesDebounced]);

  // Initial load and subscriptions
  useEffect(() => {
    if (!currentEvent) {
      setPhotos([]);
      return;
    }

    refresh();

    // Subscribe to new photos for this event
    const newPhotosSubscription = subscribeToNewPhotos(currentEvent.id, (newPhoto) => {
      addPhoto(newPhoto);
    });

    // Subscribe to likes updates avec debounce intégré
    const likesSubscription = subscribeToLikesUpdates((photoId, newLikesCount) => {
      // Le debounce est déjà géré dans updatePhotoLikes
      updatePhotoLikes(photoId, newLikesCount);
    });

    // Subscribe to photo deletions (via Realtime)
    const deleteSubscription = subscribeToPhotoDeletions(currentEvent.id, (deletedPhotoId) => {
      // Vérifier si la photo existe dans notre liste locale avant de la supprimer
      // Cela évite de supprimer des photos d'autres événements (RLS filtre déjà)
      removePhoto(deletedPhotoId);
    });

    return () => {
      newPhotosSubscription.unsubscribe();
      likesSubscription.unsubscribe();
      deleteSubscription.unsubscribe();
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

