import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Photo } from '../types';
import { getPhotos, subscribeToNewPhotos, subscribeToLikesUpdates } from '../services/photoService';
import { supabase } from '../services/supabaseClient';
import { logger } from '../utils/logger';

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

  // Load photos from Supabase
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPhotos();
      setPhotos(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur de chargement des photos');
      setError(error);
      logger.error('Failed to load photos', err);
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Update likes count for a photo
  const updatePhotoLikes = useCallback((photoId: string, newLikesCount: number) => {
    setPhotos(prev => prev.map(p => 
      p.id === photoId ? { ...p, likes_count: newLikesCount } : p
    ));
  }, []);

  // Initial load and subscriptions
  useEffect(() => {
    refresh();

    // Subscribe to new photos
    const newPhotosSubscription = subscribeToNewPhotos((newPhoto) => {
      addPhoto(newPhoto);
    });

    // Subscribe to likes updates
    const likesSubscription = subscribeToLikesUpdates((photoId, newLikesCount) => {
      updatePhotoLikes(photoId, newLikesCount);
    });

    // Subscribe to photo deletions (via Realtime)
    const deleteSubscription = supabase
      .channel('public:photos:deletes')
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'photos' },
        (payload: { old: { id: string } }) => {
          if (payload.old?.id) {
            removePhoto(payload.old.id);
          }
        }
      )
      .subscribe();

    return () => {
      newPhotosSubscription.unsubscribe();
      likesSubscription.unsubscribe();
      deleteSubscription.unsubscribe();
    };
  }, [refresh, addPhoto, updatePhotoLikes, removePhoto]);

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

