import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  addPhotoToWall, 
  addVideoToWall, 
  deletePhoto, 
  updatePhotoCaption,
  toggleLike 
} from '../../services/photoService';
import { Photo } from '../../types';
import { photosQueryKey } from './usePhotosQuery';
import { logger } from '../../utils/logger';
import { useRef } from 'react';

/**
 * Hook pour ajouter une photo
 */
export const useAddPhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      base64Image,
      caption,
      author,
      tags,
      userDescription
    }: {
      eventId: string;
      base64Image: string;
      caption: string;
      author: string;
      tags?: string[];
      userDescription?: string;
    }) => {
      return await addPhotoToWall(eventId, base64Image, caption, author, tags, userDescription);
    },
    onSuccess: (newPhoto, variables) => {
      // Optimistic update : ajouter la photo au cache immédiatement
      // La subscription Realtime ajoutera aussi la photo, mais on fait un optimistic update pour l'UX
      queryClient.setQueryData<Photo[]>(photosQueryKey(variables.eventId), (old) => {
        if (!old) return [newPhoto];
        // Éviter les doublons
        if (old.some(p => p.id === newPhoto.id)) {
          return old;
        }
        return [...old, newPhoto];
      });
      // PAS de invalidateQueries - on fait confiance à Realtime
    },
  });
};

/**
 * Hook pour ajouter une vidéo
 */
export const useAddVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      videoBlob,
      caption,
      author,
      duration,
      userDescription
    }: {
      eventId: string;
      videoBlob: Blob;
      caption: string;
      author: string;
      duration: number;
      userDescription?: string;
    }) => {
      return await addVideoToWall(eventId, videoBlob, caption, author, duration, userDescription);
    },
    onSuccess: (newVideo, variables) => {
      // Optimistic update : ajouter la vidéo au cache immédiatement
      // La subscription Realtime ajoutera aussi la vidéo, mais on fait un optimistic update pour l'UX
      queryClient.setQueryData<Photo[]>(photosQueryKey(variables.eventId), (old) => {
        if (!old) return [newVideo];
        // Éviter les doublons
        if (old.some(p => p.id === newVideo.id)) {
          return old;
        }
        return [...old, newVideo];
      });
      // PAS de invalidateQueries - on fait confiance à Realtime
    },
  });
};

/**
 * Hook pour supprimer une photo
 */
export const useDeletePhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photoId, photoUrl }: { photoId: string; photoUrl: string }) => {
      await deletePhoto(photoId, photoUrl);
      return photoId;
    },
    onMutate: async ({ photoId }) => {
      // Optimistic update : retirer la photo du cache immédiatement
      // On doit trouver l'eventId depuis la photo dans le cache
      const queryCache = queryClient.getQueryCache();
      const queries = queryCache.findAll({ queryKey: ['photos'] });
      
      for (const query of queries) {
        const photos = query.state.data as Photo[] | undefined;
        if (photos && photos.some(p => p.id === photoId)) {
          // Trouver l'eventId depuis la query key
          const eventId = query.queryKey[1] as string;
          if (eventId && eventId !== 'null') {
            // Optimistic update
            queryClient.setQueryData<Photo[]>(photosQueryKey(eventId), (old) => {
              return old ? old.filter(p => p.id !== photoId) : [];
            });
          }
        }
      }
    },
    onError: (error, variables) => {
      // En cas d'erreur, restaurer l'état depuis le cache ou invalider uniquement si nécessaire
      // On ne fait PAS de refetch automatique - on fait confiance à Realtime
      // Si Realtime ne fonctionne pas, l'utilisateur peut rafraîchir manuellement
      logger.error("Error deleting photo", error, { component: 'useDeletePhoto', photoId: variables.photoId });
    },
    onSuccess: (photoId) => {
      // La subscription Realtime supprimera la photo automatiquement
      // L'optimistic update dans onMutate a déjà retiré la photo du cache
      // PAS de invalidateQueries - on fait confiance à Realtime
    },
  });
};

/**
 * Hook pour mettre à jour la légende d'une photo
 */
export const useUpdatePhotoCaption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photoId, caption }: { photoId: string; caption: string }) => {
      await updatePhotoCaption(photoId, caption);
      return { photoId, caption };
    },
    onSuccess: (data) => {
      // Mettre à jour le cache optimistiquement
      const queryCache = queryClient.getQueryCache();
      const queries = queryCache.findAll({ queryKey: ['photos'] });
      
      for (const query of queries) {
        const photos = query.state.data as Photo[] | undefined;
        if (photos && photos.some(p => p.id === data.photoId)) {
          const eventId = query.queryKey[1] as string;
          if (eventId && eventId !== 'null') {
            queryClient.setQueryData<Photo[]>(photosQueryKey(eventId), (old) => {
              return old ? old.map(p => 
                p.id === data.photoId ? { ...p, caption: data.caption } : p
              ) : [];
            });
          }
        }
      }
    },
  });
};

/**
 * Hook pour liker/unliker une photo avec optimistic updates
 * ⚡ Optimisé : mise à jour locale immédiate, synchronisation via Realtime
 * Note: Le debounce est géré dans le composant qui appelle ce hook
 */
export const useToggleLike = () => {
  const queryClient = useQueryClient();
  const pendingMutations = useRef<Map<string, number>>(new Map());

  return useMutation({
    mutationFn: async ({ 
      photoId, 
      userIdentifier 
    }: { 
      photoId: string; 
      userIdentifier: string;
    }) => {
      return await toggleLike(photoId, userIdentifier);
    },
    onMutate: async ({ photoId }) => {
      // Optimistic update : mettre à jour le compteur de likes immédiatement
      const queryCache = queryClient.getQueryCache();
      const queries = queryCache.findAll({ queryKey: ['photos'] });
      
      for (const query of queries) {
        const photos = query.state.data as Photo[] | undefined;
        if (photos && photos.some(p => p.id === photoId)) {
          const eventId = query.queryKey[1] as string;
          if (eventId && eventId !== 'null') {
            const photo = photos.find(p => p.id === photoId);
            if (photo) {
              const currentCount = photo.likes_count || 0;
              // On suppose que c'est un like (on incrémente)
              // Si c'est un unlike, onSuccess corrigera avec la valeur réelle
              const optimisticCount = currentCount + 1;
              pendingMutations.current.set(photoId, currentCount);
              
              queryClient.setQueryData<Photo[]>(photosQueryKey(eventId), (old) => {
                return old ? old.map(p => 
                  p.id === photoId ? { ...p, likes_count: optimisticCount } : p
                ) : [];
              });
            }
          }
        }
      }
    },
    onSuccess: (data, variables) => {
      // Mettre à jour le cache avec le count réel depuis le serveur
      // Realtime mettra aussi à jour, mais on fait un update immédiat pour l'UX
      const queryCache = queryClient.getQueryCache();
      const queries = queryCache.findAll({ queryKey: ['photos'] });
      
      for (const query of queries) {
        const photos = query.state.data as Photo[] | undefined;
        if (photos && photos.some(p => p.id === variables.photoId)) {
          const eventId = query.queryKey[1] as string;
          if (eventId && eventId !== 'null') {
            queryClient.setQueryData<Photo[]>(photosQueryKey(eventId), (old) => {
              return old ? old.map(p => 
                p.id === variables.photoId ? { ...p, likes_count: data.newCount } : p
              ) : [];
            });
          }
        }
      }
      
      // Nettoyer la mutation en attente
      pendingMutations.current.delete(variables.photoId);
    },
    onError: (error, variables) => {
      // Rollback en cas d'erreur
      const queryCache = queryClient.getQueryCache();
      const queries = queryCache.findAll({ queryKey: ['photos'] });
      
      for (const query of queries) {
        const photos = query.state.data as Photo[] | undefined;
        if (photos && photos.some(p => p.id === variables.photoId)) {
          const eventId = query.queryKey[1] as string;
          if (eventId && eventId !== 'null') {
            const previousCount = pendingMutations.current.get(variables.photoId);
            if (previousCount !== undefined) {
              // Rollback : revenir au count précédent
              queryClient.setQueryData<Photo[]>(photosQueryKey(eventId), (old) => {
                return old ? old.map(p => 
                  p.id === variables.photoId ? { ...p, likes_count: previousCount } : p
                ) : [];
              });
            }
          }
        }
      }
      
      pendingMutations.current.delete(variables.photoId);
      logger.error("Error toggling like", error, { component: 'useToggleLike', photoId: variables.photoId });
    },
  });
};

