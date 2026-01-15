import { useState, useEffect } from 'react';
import { useLicenseFeatures } from './useLicenseFeatures';
import { useEvent } from '../context/EventContext';
import { isDemoLicense, getMaxPhotos, MAX_PHOTOS_DEMO } from '../utils/licenseUtils';
import { getEventPhotosCount } from '../services/photoService';

/**
 * Hook pour vérifier si la limite de photos est atteinte en mode démo
 * @returns Objet avec l'état de la limite démo
 */
export const useDemoLimit = () => {
  const { licenseKey } = useLicenseFeatures();
  const { currentEvent } = useEvent();
  const [photosCount, setPhotosCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const isDemo = isDemoLicense(licenseKey);
  const maxPhotos = getMaxPhotos(licenseKey) ?? null;
  const isLimitReached = isDemo && maxPhotos !== null && photosCount >= maxPhotos;

  // Compter les photos de l'événement actuel
  useEffect(() => {
    if (!currentEvent?.id || !isDemo) {
      setPhotosCount(0);
      setLoading(false);
      return;
    }

    const countPhotos = async () => {
      try {
        setLoading(true);
        const count = await getEventPhotosCount(currentEvent.id);
        setPhotosCount(count);
      } catch (error) {
        console.error('Error counting photos for demo limit:', error);
        setPhotosCount(0);
      } finally {
        setLoading(false);
      }
    };

    countPhotos();

    // Rafraîchir le compteur toutes les 5 secondes en mode démo
    const interval = setInterval(countPhotos, 5000);
    return () => clearInterval(interval);
  }, [currentEvent?.id, isDemo]);

  return {
    isDemo,
    isLimitReached,
    photosCount,
    maxPhotos: maxPhotos ?? MAX_PHOTOS_DEMO,
    loading
  };
};

