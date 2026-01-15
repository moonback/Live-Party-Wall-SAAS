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
      // Invalider et refetch les photos pour cet événement
      // La subscription Realtime devrait aussi ajouter la photo, mais on invalide pour être sûr
      queryClient.invalidateQueries({ queryKey: photosQueryKey(variables.eventId) });
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
      // Invalider et refetch les photos pour cet événement
      queryClient.invalidateQueries({ queryKey: photosQueryKey(variables.eventId) });
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
      // En cas d'erreur, refetch pour restaurer l'état
      const queryCache = queryClient.getQueryCache();
      const queries = queryCache.findAll({ queryKey: ['photos'] });
      queries.forEach(query => {
        const eventId = query.queryKey[1] as string;
        if (eventId && eventId !== 'null') {
          queryClient.invalidateQueries({ queryKey: photosQueryKey(eventId) });
        }
      });
    },
    onSuccess: (photoId) => {
      // La subscription Realtime devrait aussi supprimer la photo, mais on invalide pour être sûr
      const queryCache = queryClient.getQueryCache();
      const queries = queryCache.findAll({ queryKey: ['photos'] });
      queries.forEach(query => {
        const eventId = query.queryKey[1] as string;
        if (eventId && eventId !== 'null') {
          queryClient.invalidateQueries({ queryKey: photosQueryKey(eventId) });
        }
      });
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
 * Hook pour liker/unliker une photo
 */
export const useToggleLike = () => {
  const queryClient = useQueryClient();

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
      // On ne connaît pas encore le nouveau count, donc on attend le résultat
      // Mais on peut préparer la mise à jour
    },
    onSuccess: (data, variables) => {
      // Mettre à jour le cache avec le nouveau count
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
    },
  });
};

