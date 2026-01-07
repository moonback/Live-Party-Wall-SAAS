import { useState, useEffect, useMemo } from 'react';
import { Photo, ReactionCounts } from '../../types';
import { subscribeToNewPhotos, subscribeToLikesUpdates, subscribeToReactionsUpdates, getPhotoReactions } from '../../services/photoService';

interface UseWallDataProps {
  initialPhotos: Photo[];
  settings: any;
}

export const useWallData = ({ initialPhotos, settings }: UseWallDataProps) => {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [photosReactions, setPhotosReactions] = useState<Map<string, ReactionCounts>>(new Map());
  const [isLoadingNew, setIsLoadingNew] = useState(false);
  const [newPhotoIndicator, setNewPhotoIndicator] = useState<Photo | null>(null);

  // Synchroniser avec les props initiales
  useEffect(() => {
      // On ne remplace pas tout le state si on a déjà des photos chargées via subscription, 
      // mais on peut vouloir initialiser si c'est vide.
      // Ici on suppose que initialPhotos est mis à jour par le parent si nécessaire,
      // mais attention aux boucles.
      // Pour l'instant, on initialise seulement au montage si on veut éviter d'écraser le temps réel.
      // Mais le pattern actuel de WallView mettait à jour localPhotos quand photos changeait.
      
      setPhotos(prev => {
          // Si on a déjà des photos, on merge pour éviter de perdre l'ordre ou le state actuel
          // Mais attention, initialPhotos vient souvent d'un fetch global.
          // Simplification : on met à jour si c'est différent, mais on garde la logique de doublons
           const prevIds = new Set(prev.map(p => p.id));
           const newItems = initialPhotos.filter(p => !prevIds.has(p.id));
           if (newItems.length > 0) {
               return [...prev, ...newItems].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
           }
           if (initialPhotos.length > prev.length) {
               // Cas où initialPhotos a plus de données (revalidation)
               return initialPhotos;
           }
           return prev;
      });
  }, [initialPhotos]);

  // S'abonner aux nouvelles photos
  useEffect(() => {
    const subscription = subscribeToNewPhotos((newPhoto) => {
      setPhotos((prev) => {
        if (prev.some(p => p.id === newPhoto.id)) return prev;
        return [newPhoto, ...prev];
      });
      
      setNewPhotoIndicator(newPhoto);
      setIsLoadingNew(true);
      setTimeout(() => {
          setIsLoadingNew(false);
          setNewPhotoIndicator(null);
      }, 3000);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Charger les réactions initiales
  useEffect(() => {
    const loadReactions = async () => {
      const reactionsMap = new Map<string, ReactionCounts>();
      // On charge par lot pour éviter trop de requêtes simultanées si beaucoup de photos
      // Idéalement il faudrait un endpoint getReactionsForPhotos([ids])
      // Ici on garde la logique existante mais on pourrait optimiser
      const recentPhotos = photos.slice(0, 50); // Optimisation: charger seulement les récentes
      
      await Promise.all(
        recentPhotos.map(async (photo) => {
          const reactions = await getPhotoReactions(photo.id);
          if (Object.keys(reactions).length > 0) {
            reactionsMap.set(photo.id, reactions);
          }
        })
      );
      setPhotosReactions(reactionsMap);
    };
    
    if (photos.length > 0) {
      loadReactions();
    }
  }, [photos.length]); // Déclencheur simplifié

  // S'abonner aux likes
  useEffect(() => {
    const subscription = subscribeToLikesUpdates((photoId, newLikesCount) => {
      setPhotos((prev) => {
        const index = prev.findIndex(p => p.id === photoId);
        if (index === -1) return prev;
        if (prev[index].likes_count === newLikesCount) return prev;
        
        const newPhotos = [...prev];
        newPhotos[index] = { ...prev[index], likes_count: newLikesCount };
        return newPhotos;
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // S'abonner aux réactions
  useEffect(() => {
    const subscription = subscribeToReactionsUpdates((photoId, reactions) => {
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

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const stats = useMemo(() => {
    const totalPhotos = photos.length;
    const uniqueAuthors = new Set(photos.map(p => p.author)).size;
    
    let timeSinceLast = '--';
    if (photos.length > 0) {
      const lastPhotoTime = new Date(photos[0].timestamp).getTime(); // Assurez-vous que timestamp est parsable
      const diffMinutes = Math.floor((Date.now() - lastPhotoTime) / 60000);
      
      if (diffMinutes < 1) timeSinceLast = "À l'instant";
      else if (diffMinutes === 1) timeSinceLast = "Il y a 1 min";
      else if (diffMinutes < 60) timeSinceLast = `Il y a ${diffMinutes} min`;
      else {
        const hours = Math.floor(diffMinutes / 60);
        timeSinceLast = `Il y a ${hours}h`;
      }
    }

    return { totalPhotos, uniqueAuthors, timeSinceLast };
  }, [photos]);

  return {
    photos,
    photosReactions,
    isLoadingNew,
    newPhotoIndicator,
    stats
  };
};

