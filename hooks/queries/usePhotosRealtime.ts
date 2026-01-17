import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  subscribeToNewPhotos, 
  subscribeToLikesUpdates, 
  subscribeToPhotoDeletions 
} from '../../services/photoService';
import { Photo } from '../../types';
import { photosQueryKey } from './usePhotosQuery';
import { debounce } from '../../utils/debounce';

/**
 * Hook pour gérer les subscriptions Realtime Supabase et mettre à jour le cache TanStack Query
 * @param eventId - ID de l'événement
 */
export const usePhotosRealtime = (eventId: string | null | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!eventId) {
      return;
    }

    const queryKey = photosQueryKey(eventId);

    // Fonction pour ajouter une nouvelle photo au cache
    const handleNewPhoto = (newPhoto: Photo) => {
      queryClient.setQueryData<Photo[]>(queryKey, (old) => {
        if (!old) return [newPhoto];
        // Éviter les doublons
        if (old.some(p => p.id === newPhoto.id)) {
          return old;
        }
        return [...old, newPhoto];
      });
    };

    // Fonction pour supprimer une photo du cache
    const handlePhotoDeleted = (deletedPhotoId: string) => {
      queryClient.setQueryData<Photo[]>(queryKey, (old) => {
        if (!old) return [];
        // Vérifier si la photo existe dans notre liste locale avant de la supprimer
        const photoExists = old.some(p => p.id === deletedPhotoId);
        if (photoExists) {
          return old.filter(p => p.id !== deletedPhotoId);
        }
        return old;
      });
    };

    // Fonction pour mettre à jour le compteur de likes avec debounce
    const updateLikesCount = (photoId: string, newLikesCount: number) => {
      queryClient.setQueryData<Photo[]>(queryKey, (old) => {
        if (!old) return [];
        return old.map(p => 
          p.id === photoId ? { ...p, likes_count: newLikesCount } : p
        );
      });
    };

    // Créer une version debounced de updateLikesCount (300ms comme dans PhotosContext)
    const updateLikesCountDebounced = debounce(updateLikesCount, 300);

    // S'abonner aux nouvelles photos
    const newPhotosSubscription = subscribeToNewPhotos(eventId, handleNewPhoto);

    // S'abonner aux suppressions de photos
    const deleteSubscription = subscribeToPhotoDeletions(eventId, handlePhotoDeleted);

    // S'abonner aux mises à jour de likes
    const likesSubscription = subscribeToLikesUpdates((photoId, newLikesCount) => {
      updateLikesCountDebounced(photoId, newLikesCount);
    });

    // Nettoyer les subscriptions au démontage
    return () => {
      newPhotosSubscription.unsubscribe();
      deleteSubscription.unsubscribe();
      likesSubscription.unsubscribe();
    };
  }, [eventId, queryClient]);
};








