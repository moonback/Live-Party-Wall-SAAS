import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLicense } from '../context/LicenseContext';
import { getActiveLicense } from '../services/licenseService';
import { License } from '../types';
import { 
  isProLicense, 
  isPartLicense, 
  isDemoLicense,
  isFeatureEnabled,
  getLicenseSuffix 
} from '../utils/licenseUtils';

/**
 * Hook personnalisé pour gérer les fonctionnalités basées sur la licence
 * Expose l'état de la licence et les vérifications de fonctionnalités
 */
export const useLicenseFeatures = () => {
  const { user } = useAuth();
  const { licenseValidity } = useLicense();
  const [activeLicense, setActiveLicense] = useState<License | null>(null);
  const [loading, setLoading] = useState(true);

  // Charger la licence active
  useEffect(() => {
    const loadLicense = async () => {
      if (!user) {
        setActiveLicense(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const license = await getActiveLicense(user.id);
        setActiveLicense(license);
      } catch (error) {
        console.error('Error loading active license:', error);
        setActiveLicense(null);
      } finally {
        setLoading(false);
      }
    };

    loadLicense();
  }, [user, licenseValidity?.license_id]);

  const licenseKey = activeLicense?.license_key || null;
  const licenseSuffix = getLicenseSuffix(licenseKey);
  const isPro = isProLicense(licenseKey);
  const isPart = isPartLicense(licenseKey);
  const isDemo = isDemoLicense(licenseKey);

  /**
   * Vérifie si une fonctionnalité est disponible
   * @param featureKey - Clé de la fonctionnalité à vérifier
   * @returns true si la fonctionnalité est disponible
   */
  const checkFeature = (featureKey: string): boolean => {
    return isFeatureEnabled(featureKey, licenseKey);
  };

  return {
    activeLicense,
    licenseKey,
    licenseSuffix,
    isProLicense: isPro,
    isPartLicense: isPart,
    isDemoLicense: isDemo,
    isFeatureEnabled: checkFeature,
    loading
  };
};

