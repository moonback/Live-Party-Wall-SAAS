import { useQuery } from '@tanstack/react-query';
import { getPhotos } from '../../services/photoService';
import { Photo } from '../../types';

/**
 * Clé de query pour les photos d'un événement
 */
export const photosQueryKey = (eventId: string) => ['photos', eventId] as const;

/**
 * Hook pour charger les photos d'un événement avec TanStack Query
 * @param eventId - ID de l'événement
 * @param options - Options de chargement (all: true pour charger toutes les photos)
 */
export const usePhotosQuery = (eventId: string | null | undefined, options?: { all?: boolean }) => {
  return useQuery<Photo[]>({
    queryKey: eventId ? photosQueryKey(eventId) : ['photos', 'null'],
    queryFn: async () => {
      if (!eventId) {
        return [];
      }
      const result = await getPhotos(eventId, { all: options?.all ?? true });
      // getPhotos peut retourner Photo[] ou PaginatedPhotosResult
      return Array.isArray(result) ? result : result.photos;
    },
    enabled: !!eventId, // Ne pas exécuter si eventId est null/undefined
    staleTime: 30 * 1000, // 30 secondes - les photos restent "fraîches" pendant 30s
    gcTime: 5 * 60 * 1000, // 5 minutes - garder en cache pendant 5 minutes
  });
};



